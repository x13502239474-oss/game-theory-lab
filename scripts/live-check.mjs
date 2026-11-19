// 线上验收：逐个路由检查渲染、控制台报错、以及是否有未解析的 $ 公式
import { spawn } from 'node:child_process';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9337;
const BASE = process.argv[2] || 'https://x13502239474-oss.github.io/game-theory-lab/';
const profile = `C:/Users/1/WorkBuddy/2026-11-19-01-41-38/.chrome-live-${Date.now()}`;
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
  for (let i = 0; i < 80; i++) {
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

const ALL = process.env.ALL === '1';
const ROUTES = ALL
  ? Array.from({ length: 56 }, (_, i) => {
      const id = 'L' + String(i + 1).padStart(2, '0');
      return [id, `#/lesson/${id}`];
    })
  : [
  ['首页', '#/'],
  ['课程', '#/courses'],
  ['第56课', '#/lesson/L56'],
  ['第50课', '#/lesson/L50'],
  ['知识图谱', '#/graph'],
  ['案例库', '#/cases'],
  ['实验-价格战', '#/lab/price'],
  ['案例-招商', '#/cases/c-invest'],
  ['案例-产能', '#/cases/c-solar'],
  ['案例-二选一', '#/cases/c-exclusive'],
  ['案例-小岗村', '#/cases/c-xiaogang'],
  ['案例-相亲', '#/cases/c-dating'],
  ['案例-家长群', '#/cases/c-parenting'],
  ['案例-二手车', '#/cases/c-lemon'],
  ['案例-古巴', '#/cases/c-cuba'],
  ['案例-WTO', '#/cases/c-wto'],
  ['案例-频谱', '#/cases/c-fcc'],
  ['案例-脱欧', '#/cases/c-brexit'],
  ['案例-瑞士', '#/cases/c-swiss'],
];

try {
  await waitPort();
  const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  await send(ws, 'Page.enable');
  await send(ws, 'Runtime.enable');

  let errors = [];
  ws.addEventListener('message', (ev) => {
    const d = JSON.parse(ev.data);
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push(d.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 120));
    if (d.method === 'Runtime.exceptionThrown') errors.push((d.params.exceptionDetails.text + ' ' + (d.params.exceptionDetails.exception?.description ?? '')).slice(0, 120));
  });

  for (const [name, route] of ROUTES) {
    errors = [];
    await send(ws, 'Page.navigate', { url: BASE + route });
    await sleep(2600);
    const info = await evaluate(
      ws,
      `(() => {
        const txt = document.body.innerText || '';
        const dollars = (txt.match(/\\$/g) || []).length;
        const h1 = document.querySelector('h1')?.innerText?.trim() ?? '(无标题)';
        const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        return { len: txt.length, h1, dollars, overflow };
      })()`
    );
    console.log(`${name.padEnd(10)} 标题=${info.h1} ｜ 文本${info.len}字 ｜ 残留$=${info.dollars} ｜ 横向溢出=${info.overflow}px ｜ 报错=${errors.length}`);
    if (info.dollars) {
      const ctx = await evaluate(ws, `(() => { const t = document.body.innerText; const out = []; let i = -1; while ((i = t.indexOf('$', i + 1)) >= 0) { out.push(t.slice(Math.max(0, i - 30), i + 40).replace(/\\n/g, ' ')); if (out.length >= 3) break; } return out; })()`);
      ctx.forEach((c) => console.log('    ·', c));
    }
    if (errors.length) console.log('   ', errors.slice(0, 2));
  }
} finally {
  proc.kill();
}
