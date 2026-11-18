// 交互冒烟测试：点击答题 → 判分 → 写入 localStorage
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9334;
const profile = `C:/Users/1/WorkBuddy/2026-11-19-01-41-38/.chrome-smoke-${Date.now()}`;
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

  await send(ws, 'Page.navigate', { url: 'http://127.0.0.1:5199/#/lesson/L01' });
  await sleep(2500);

  // 1. 页面渲染
  const title = await evaluate(ws, `document.querySelector('h1')?.innerText`);
  console.log('标题：', title);

  // 2. 点击第一题的选项 B（"博弈论中一方的收益取决于..."）
  const clicked = await evaluate(
    ws,
    `(() => {
      const btns = [...document.querySelectorAll('button')];
      const target = btns.find(b => b.innerText.includes('博弈论中一方的收益取决于'));
      if (!target) return 'not-found';
      target.click();
      return 'clicked';
    })()`
  );
  console.log('选项点击：', clicked);

  // 3. 提交
  await evaluate(ws, `[...document.querySelectorAll('button')].find(b => b.innerText.trim() === '提交答案')?.click();`);
  await sleep(600);
  const feedback = await evaluate(ws, `document.body.innerText.includes('答对了') ? '答对了' : (document.body.innerText.includes('答错了') ? '答错了' : '无反馈')`);
  console.log('判分结果（正确答案应为 B）：', feedback);

  // 4. 存储
  await sleep(600);
  const stored = await evaluate(ws, `(() => { const raw = localStorage.getItem('gtl.state.v1'); if(!raw) return 'EMPTY'; const s = JSON.parse(raw); return JSON.stringify({ quiz: Object.keys(s.quiz).length, days: s.days }); })()`);
  console.log('localStorage：', stored);

  // 5. 刷新后是否保留
  await send(ws, 'Page.reload');
  await sleep(2000);
  const persisted = await evaluate(ws, `document.body.innerText.includes('已答对') || document.body.innerText.includes('查看解析') ? '已保留' : '丢失'`);
  console.log('刷新后状态：', persisted);

  // 6. 实验页交互（价格战滑块）
  await send(ws, 'Page.navigate', { url: 'http://127.0.0.1:5199/#/lab/repeat' });
  await sleep(1800);
  const before = await evaluate(ws, `[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='合作')?.disabled`);
  await evaluate(ws, `[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='合作')?.click();`);
  await sleep(300);
  const after = await evaluate(ws, `document.body.innerText.includes('第 2 / ') ? '回合推进' : '未推进'`);
  console.log('重复博弈实验：按钮初始 disabled =', before, '｜点击后：', after);

  console.log('控制台错误：', errors.length ? errors.slice(0, 5) : '无');
} finally {
  proc.kill();
}
