// 案例情景题冒烟测试：填要点 → 提交 → 判分 → localStorage 收录 → 刷新保留
import { spawn } from 'node:child_process';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9335;
const profile = `C:/Users/1/WorkBuddy/2026-11-19-01-41-38/.chrome-smoke-case-${Date.now()}`;
const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let id = 0;
function send(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const msgId = ++id;
    const onMsg = (ev) => {
      const d = JSON.parse(ev.data);
      if (d.id === msgId) {
        ws.removeEventListener('message', onMsg);
        d.error ? reject(new Error(method + ' ' + JSON.stringify(d.error))) : resolve(d.result);
      }
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}

async function waitPort() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return;
    } catch {}
    await sleep(200);
  }
  throw new Error('chrome not ready');
}

const evaluate = async (ws, expression) => {
  const r = await send(ws, 'Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
};

try {
  await waitPort();
  const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  await send(ws, 'Page.enable');
  await send(ws, 'Runtime.enable');

  const errors = [];
  ws.addEventListener('message', (ev) => {
    const d = JSON.parse(ev.data);
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push(d.params.args.map((a) => a.value ?? a.description).join(' '));
    if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.text + ' ' + (d.params.exceptionDetails.exception?.description ?? ''));
  });

  await send(ws, 'Page.navigate', { url: 'http://127.0.0.1:5199/#/cases/c-invest' });
  await sleep(2500);

  const hasQuiz = await evaluate(ws, `document.body.innerText.includes('案例检验') ? '有检验区' : '无检验区'`);
  console.log('案例页检验区：', hasQuiz);

  // 填一个「命中多数要点」的答案：竞价 + 占优 + 租金归零
  await evaluate(
    ws,
    `(() => {
      const ta = document.querySelector('textarea');
      if (!ta) return 'no-textarea';
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(ta, '我觉得这就是地方政府比较有钱，都想抢大项目，没什么特别的原因。');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      return 'filled';
    })()`
  );
  await sleep(300);

  await evaluate(ws, `[...document.querySelectorAll('button')].find(b => b.innerText.trim() === '提交答案')?.click();`);
  await sleep(600);

  const feedback = await evaluate(
    ws,
    `(() => {
      const t = document.body.innerText;
      if (t.includes('答对了')) return '答对了';
      if (t.includes('答错了')) return '答错了';
      return '无反馈';
    })()`
  );
  console.log('判分结果（应答错）：', feedback);

  const ratio = await evaluate(ws, `(() => { const m = document.body.innerText.match(/要点覆盖 (\\d+)%/); return m ? m[1] : '无'; })()`);
  console.log('要点覆盖：', ratio + '%');

  // 存储收录
  const stored = await evaluate(ws, `(() => { const raw = localStorage.getItem('gtl.state.v1'); if(!raw) return 'EMPTY'; const s = JSON.parse(raw); const keys = Object.keys(s.quiz); return JSON.stringify({ 题数: keys.length, 含案例题: keys.some(k => k.startsWith('c-')), 案例题记录: s.quiz['c-invest-q1'] }); })()`);
  console.log('localStorage：', stored);

  // 刷新保留
  await send(ws, 'Page.reload');
  await sleep(2000);
  const persisted = await evaluate(ws, `document.body.innerText.includes('已答对') ? '已保留(持久标记)' : (document.body.innerText.includes('错 0 次') ? '有记录但标记缺失' : '丢失')`);
  console.log('刷新后状态：', persisted);

  // 错题本是否正确显示案例题（先制造一道错题：提交一个空要点答案，然后看错题本）
  // 直接检查：错题本路由里能否识别案例题 id
  await send(ws, 'Page.navigate', { url: 'http://127.0.0.1:5199/#/mistakes' });
  await sleep(2000);
  const mistakes = await evaluate(ws, `(() => { const t=document.body.innerText; if (t.includes('案例 ·')) return '错题本含案例入口('+ (t.match(/案例 · [^\\n]+/)?.[0]||'') +')'; return t.includes('待复习') ? '错题本已渲染(无案例入口)' : '错题本未渲染'; })()`);
  console.log('错题本：', mistakes);

  console.log('控制台错误：', errors.length ? errors.slice(0, 5) : '无');
} finally {
  proc.kill();
}
