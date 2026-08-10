#!/usr/bin/env node
/**
 * Zero-dependency headless-Chrome probe (raw CDP over Node's built-in WebSocket).
 *
 *   node scripts/probe.mjs <url> [--shot out.png] [--wait 6000] [--width 1728]
 *        [--height 1080] [--scroll 0.5] [--eval "expr"] [--mobile]
 *
 * Prints console messages, page errors and failed/non-2xx requests, then exits
 * 0 if the page loaded with no console errors and no failed same-run requests.
 */
import { spawn } from 'node:child_process';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith('--'));
const flag = (name, dflt) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : dflt;
};
const has = (name) => args.includes('--' + name);
if (!url) {
  console.error('usage: probe.mjs <url> [--shot out.png] [--wait ms] [--scroll frac] [--eval expr]');
  process.exit(2);
}
const WAIT = Number(flag('wait', 6000));
const W = Number(flag('width', has('mobile') ? 390 : 1728));
const H = Number(flag('height', has('mobile') ? 844 : 1080));

const profile = await mkdtemp(join(tmpdir(), 'probe-chrome-'));
const port = 9222 + Math.floor(Math.random() * 500);
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--disable-gpu-sandbox',
  '--hide-scrollbars',
  '--mute-audio',
  `--window-size=${W},${H}`,
  'about:blank',
]);
const cleanup = async (code) => {
  chrome.kill();
  await rm(profile, { recursive: true, force: true }).catch(() => {});
  process.exit(code);
};

// wait for devtools endpoint
let target;
for (let i = 0; i < 50; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    target = list.find((t) => t.type === 'page');
    if (target) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 200));
}
if (!target) {
  console.error('FATAL: no CDP target');
  await cleanup(3);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
let msgId = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

const consoleMsgs = [];
const pageErrors = [];
const failures = [];
const requests = new Map();

ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(m.error.message)) : resolve(m.result);
    return;
  }
  switch (m.method) {
    case 'Runtime.consoleAPICalled': {
      const text = m.params.args
        .map((a) => a.value ?? a.description ?? JSON.stringify(a.preview?.properties ?? a.type))
        .join(' ');
      consoleMsgs.push(`[${m.params.type}] ${text}`);
      break;
    }
    case 'Runtime.exceptionThrown':
      pageErrors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
      break;
    case 'Network.requestWillBeSent':
      requests.set(m.params.requestId, m.params.request.url);
      break;
    case 'Network.responseReceived': {
      const s = m.params.response.status;
      if (s >= 400) failures.push(`HTTP ${s} ${m.params.response.url}`);
      break;
    }
    case 'Network.loadingFailed': {
      const u = requests.get(m.params.requestId) || '?';
      if (!m.params.canceled) failures.push(`FAILED ${m.params.errorText} ${u}`);
      break;
    }
  }
};

await new Promise((r) => (ws.onopen = r));
await send('Network.enable');
await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: W,
  height: H,
  deviceScaleFactor: 1,
  mobile: has('mobile'),
});
if (has('mobile'))
  await send('Emulation.setUserAgentOverride', {
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  });

const loaded = new Promise((r) => {
  const h = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Page.loadEventFired') r();
  };
  ws.addEventListener('message', h);
});
await send('Page.navigate', { url });
await Promise.race([loaded, new Promise((r) => setTimeout(r, 20000))]);
await new Promise((r) => setTimeout(r, WAIT));

const scroll = Number(flag('scroll', 0));
if (scroll > 0) {
  await send('Runtime.evaluate', {
    expression: `window.scrollTo({top: (document.documentElement.scrollHeight - innerHeight) * ${scroll}, behavior: 'instant'})`,
  });
  await new Promise((r) => setTimeout(r, 1500));
}

const evalExpr = flag('eval', null);
if (evalExpr) {
  const r = await send('Runtime.evaluate', { expression: evalExpr, returnByValue: true });
  console.log('EVAL:', JSON.stringify(r.result?.value ?? r.result?.description, null, 1));
}

const shot = flag('shot', null);
if (shot) {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(shot, Buffer.from(data, 'base64'));
  console.log('screenshot ->', shot);
}

console.log(`\n=== console (${consoleMsgs.length}) ===`);
for (const c of consoleMsgs.slice(0, 40)) console.log(c);
console.log(`=== page errors (${pageErrors.length}) ===`);
for (const e of pageErrors.slice(0, 20)) console.log(e);
console.log(`=== request failures (${failures.length}) ===`);
for (const f of failures.slice(0, 40)) console.log(f);

const errCount = pageErrors.length + failures.length + consoleMsgs.filter((c) => c.startsWith('[error]')).length;
console.log(`\nRESULT: ${errCount === 0 ? 'CLEAN' : errCount + ' problems'}`);
await cleanup(errCount === 0 ? 0 : 1);
