// 用 CDP 精确模拟移动端视口截图：node scripts/shot.mjs <url> <out.png> [width] [height] [fullPage]
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const [, , url, out, wArg, hArg, fullArg] = process.argv;
const W = Number(wArg || 390);
const H = Number(hArg || 844);
const full = fullArg === 'full';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333;
const profile = `C:/Users/1/WorkBuddy/2026-11-19-01-41-38/.chrome-shot-${Date.now()}`;

const proc = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  'about:blank',
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitPort() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return await r.json();
    } catch {
      /* retry */
    }
    await sleep(200);
  }
  throw new Error('chrome not ready');
}

let id = 0;
function send(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const msgId = ++id;
    const onMsg = (ev) => {
      const data = JSON.parse(ev.data);
      if (data.id === msgId) {
        ws.removeEventListener('message', onMsg);
        if (data.error) reject(new Error(method + ': ' + JSON.stringify(data.error)));
        else resolve(data.result);
      }
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}

try {
  await waitPort();
  const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  await send(ws, 'Page.enable');
  await send(ws, 'Emulation.setDeviceMetricsOverride', {
    width: W,
    height: H,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await send(ws, 'Page.navigate', { url });
  await sleep(2200);

  if (full) {
    const m = await send(ws, 'Page.getLayoutMetrics');
    const h = Math.ceil(m.cssContentSize.height);
    await send(ws, 'Emulation.setDeviceMetricsOverride', { width: W, height: h, deviceScaleFactor: 2, mobile: true });
    await sleep(500);
  }

  const shot = await send(ws, 'Page.captureScreenshot', { format: 'png', captureBeyondViewport: full });
  fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
  console.log('saved', out);
  ws.close();
} finally {
  proc.kill();
}
