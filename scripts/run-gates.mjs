#!/usr/bin/env node
/**
 * run-gates.mjs — every acceptance gate of this project, with its exact
 * invocation and its registered-residual allow-list, in ONE place in the repo
 * (verification-gates.md §2.1.0: a verdict includes how it was invoked and what
 * it excuses; neither may live in shell history).
 *
 *   node scripts/run-gates.mjs mirror   [--resample N]   mirror's own gate (verify-mirror.mjs, 5 assertions)
 *   node scripts/run-gates.mjs offline                   CLEAN + zero-outbound, both sides, every route × viewport
 *                                                          (+ full-scroll walks), plus the static half (verify-offline.mjs)
 *   node scripts/run-gates.mjs symbols                   port/ byte slices in sync + parse, declaration reconciliation
 *                                                          (verify-decls.mjs) and the skill's verify-symbols.mjs for the record
 *   node scripts/run-gates.mjs pixel [--only slug,slug]  quantified pixel gate (pixelcompare.mjs under the determinism
 *                                                          shim): per cell 4 self-band sessions PER SIDE, interleaved
 *                                                          M/R/M/R, then one cross-side run judged against the band.
 *                                                          --only re-runs the named cells and merges them into the
 *                                                          existing results (a cell invalidated by a machine sleep etc.)
 *   --target src|port   which rebuild side to gate (default src = dist/; port = port/site + mirror assets)
 *   node scripts/run-gates.mjs standalone                 copy src/ out, install offline, build, probe the copy (readable-source.md §4.3)
 *   node scripts/run-gates.mjs all
 *
 * Servers: the skill's serve.mjs, one per side (ports from scripts/skill/lib/ports.mjs).
 * A server already answering on its port with the right side identity is reused,
 * otherwise it is spawned for the run and reaped at exit.
 *
 * Artifacts: docs/gates/<gate>/... (raw probe output per cell + summary.md).
 * Every check prints n/N examined (§0.24.0).
 */
import { spawn, execFile } from 'node:child_process';
import { mkdir, writeFile, rm, readFile, cp } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { allocPort, fetchIdentity } from './skill/lib/ports.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const SKILL = join(ROOT, 'scripts', 'skill');
const GATES_ROOT = join(ROOT, 'docs', 'gates');
let GATES = GATES_ROOT; // offline/pixel append the target below
const run = promisify(execFile);
const args = process.argv.slice(2);
const cmd = args[0];
const flag = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };

// ---------------------------------------------------------------------------
// Registered residuals. Each entry names a deviation in REBUILD_PLAN §6; an item
// a probe reports that matches none of these is a FAIL. Nothing here is a
// "tolerance": they are exact URLs/hosts, each with its registered reason.
// ---------------------------------------------------------------------------
const ROUTES = ['/', '/calendar', '/on-track', '/off-track', '/partnerships', '/legal/privacy-policy', '/legal/terms-conditions', '/nope-404'];
const WALK_ROUTES = { desktop: ['/', '/calendar', '/on-track', '/off-track'], mobile: ['/'] };
const LEGAL = (r) => r.startsWith('/legal/');
const RESIDUALS = [
  { id: '404-semantics', route: (r) => r === '/nope-404', side: 'both', kind: 'failure',
    match: (s, base) => s === `HTTP 404 ${base}/nope-404`,
    why: 'the unknown-route document itself is served with HTTP 404 + the origin 404 template (source semantics)' },
  { id: '6.3-iubenda-api', route: LEGAL, side: 'both', kind: 'external',
    match: (host) => host === 'www.iubenda.com',
    why: 'legal body is fetched from iubenda\'s online API (source behaviour; deviation 6.3)' },
  { id: '6.3-iubenda-badge-css', route: LEGAL, side: 'both', kind: 'failure',
    match: (s) => s === 'FAILED net::ERR_CONNECTION_CLOSED https://ext/cdn.iubenda.com/iubenda_badge.css' || s === 'FAILED net::ERR_NAME_NOT_RESOLVED https://ext/cdn.iubenda.com/iubenda_badge.css',
    why: 'iubenda.js re-prefixes its stylesheet URL with "https:" after the /ext/<host>/ rewrite (both sides identically); decorative badge CSS (deviation 6.3)' },
  { id: '6.3-iubenda-badge-css-host', route: LEGAL, side: 'both', kind: 'external',
    match: (host) => host === 'ext',
    why: 'same malformed https:/ext/... request as above, counted by the probe as an off-origin host' },
  { id: '6.3-iubenda-icons', route: LEGAL, side: 'mirror-or-port', kind: 'failure',
    match: (s, base) => s === `HTTP 404 ${base}/images/site/icons/owner.png`,
    why: 'badge icons resolved against the page origin; neither the mirror nor the no-copy port has /images/site (src/public/images bakes them in, assets-restore.mjs)' },
];

// ---------------------------------------------------------------------------
// --target src (default): the readable source's static build (dist/, served as plain static
// files — exactly what nginx does). --target port: the verbatim port (port/site) with assets
// resolved from the read-only mirror (asset-management.md no-copy policy for stage ②).
const TARGET = flag('target', 'src');
if (!['src', 'port'].includes(TARGET)) { console.error('--target must be src or port'); process.exit(2); }
const SIDES = {
  mirror: { root: join(ROOT, 'mirror'), port: allocPort('serve', 'mirror'), extra: [] },
  rebuild: TARGET === 'port'
    ? { root: join(ROOT, 'port', 'site'), port: allocPort('serve', 'rebuild'), extra: ['--fallback-root', join(ROOT, 'mirror')] }
    : { root: join(ROOT, 'src', 'dist'), port: allocPort('serve', 'rebuild'), extra: [] },
};
const spawned = [];
async function ensureServer(side) {
  const { root, port, extra } = SIDES[side];
  const base = `http://127.0.0.1:${port}`;
  const id = await fetchIdentity(base);
  if (id && id.side === side && (!id.root || id.root === root)) { console.log(`[gates] reusing ${side} server on ${base} (identity ${id.token}, root ${id.root || '?'})`); return base; }
  if (id) throw new Error(`port ${port} is held by a ${id.side} server rooted at ${id.root || '?'}; expected ${side} at ${root} — stop it first`);
  const child = spawn('node', [join(SKILL, 'serve.mjs'), '--side', side, '--root', root, ...extra], { stdio: ['ignore', 'pipe', 'pipe'] });
  spawned.push(child);
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 250));
    const now = await fetchIdentity(base);
    if (now && now.side === side) { console.log(`[gates] started ${side} server on ${base}`); return base; }
  }
  throw new Error(`${side} server did not come up on ${base}`);
}
function reap() { for (const c of spawned) { try { c.kill('SIGTERM'); } catch {} } }
process.on('exit', reap); process.on('SIGINT', () => { reap(); process.exit(130); });

async function probe(url, extra = []) {
  const argv = [join(SKILL, 'probe.mjs'), url, '--no-external', '--wait', '8000', ...extra];
  try { const { stdout, stderr } = await run('node', argv, { maxBuffer: 64 * 1024 * 1024 }); return { code: 0, out: stdout + stderr, argv }; }
  catch (e) { return { code: e.code ?? 1, out: (e.stdout || '') + (e.stderr || ''), argv }; }
}
function parseProbe(out) {
  const sec = (name) => {
    const m = out.match(new RegExp(`^=== ${name} \\((\\d+)[^)]*\\) ===\\n([\\s\\S]*?)(?=^=== |^RESULT:)`, 'm'));
    return m ? m[2].split('\n').map((s) => s.trim()).filter(Boolean) : null;
  };
  return {
    pageErrors: sec('page errors') ?? [],
    failures: sec('request failures') ?? [],
    externals: (sec('external requests') ?? []).map((l) => l.replace(/^\d+x\s+/, '')),
    result: (out.match(/^RESULT: (.*)$/m) || [, '(no RESULT line — probe crashed?)'])[1],
  };
}
function judge(parsed, { route, side, base }) {
  const used = new Set(); const unexplained = [];
  const allow = (kind, item) => {
    const sideOk = (x) => x.side === 'both' || x.side === side || (x.side === 'mirror-or-port' && (side === 'mirror' || (side === 'rebuild' && TARGET === 'port')));
    const r = RESIDUALS.find((x) => x.kind === kind && sideOk(x) && x.route(route) && x.match(item, base));
    if (r) used.add(r.id); return !!r;
  };
  for (const f of parsed.failures) if (!allow('failure', f)) unexplained.push('failure: ' + f);
  for (const h of parsed.externals) if (!allow('external', h)) unexplained.push('external: ' + h);
  for (const e of parsed.pageErrors) {
    // Chrome echoes every failed request as a console error; it is the same item.
    if (/^\[network\] Failed to load resource/.test(e) && parsed.failures.length && parsed.failures.every((f) => allow('failure', f))) continue;
    unexplained.push('page error: ' + e);
  }
  if (/RESULT line/.test(parsed.result)) unexplained.push(parsed.result);
  return { ok: unexplained.length === 0, used: [...used], unexplained };
}

async function gateMirror() {
  const out = join(GATES, 'mirror'); await mkdir(out, { recursive: true });
  const argv = [join(SKILL, 'verify-mirror.mjs'), '--mirror', join(ROOT, 'mirror'), '--origin', 'https://landonorris.com',
    '--allow-missing', join(ROOT, 'mirror', 'external.txt'), '--max-report', '200'];
  const n = flag('resample', null); if (n) argv.push('--resample', n);
  let code = 0, text = '';
  try { const r = await run('node', argv, { maxBuffer: 64 * 1024 * 1024 }); text = r.stdout + r.stderr; }
  catch (e) { code = e.code ?? 1; text = (e.stdout || '') + (e.stderr || ''); }
  await writeFile(join(out, 'verify-mirror.txt'), `$ node ${argv.map((a) => a.replace(ROOT, '')).join(' ')}\n\n` + text);
  const verdict = /^PASS — 0 mirror-level problem/m.test(text) && code === 0;
  console.log(`[gates] mirror: ${verdict ? 'PASS' : 'FAIL'} (docs/gates/mirror/verify-mirror.txt)`);
  return verdict;
}

async function gateOffline() {
  const out = join(GATES, TARGET === 'port' ? 'offline-port' : 'offline'); await rm(out, { recursive: true, force: true }); await mkdir(out, { recursive: true });
  const bases = { mirror: await ensureServer('mirror'), rebuild: await ensureServer('rebuild') };
  const cells = [];
  for (const side of ['mirror', 'rebuild']) {
    for (const route of ROUTES) for (const vp of ['desktop', 'mobile']) cells.push({ side, route, vp, walk: 0 });
    for (const vp of ['desktop', 'mobile']) for (const route of WALK_ROUTES[vp]) cells.push({ side, route, vp, walk: 16 });
  }
  const slug = (c) => `${c.side}${c.route === '/' ? '-home' : c.route.replace(/\//g, '-')}${c.vp === 'mobile' ? '-mobile' : ''}${c.walk ? '-walk' : ''}`;
  const results = [];
  // the two sides drive two different browsers (per-side CDP ports) -> run them in parallel, each side sequentially
  await Promise.all(['mirror', 'rebuild'].map(async (side) => {
    for (const c of cells.filter((x) => x.side === side)) {
      const base = bases[side];
      const extra = []; if (c.vp === 'mobile') extra.push('--mobile'); if (c.walk) extra.push('--walk', String(c.walk), '--walk-dwell', '700'); else extra.push('--scroll', '0.5');
      const r = await probe(base + c.route, extra);
      const parsed = parseProbe(r.out); const v = judge(parsed, { route: c.route, side, base });
      await writeFile(join(out, slug(c) + '.txt'), `$ node ${r.argv.map((a) => a.replace(ROOT, '')).join(' ')}\nverdict: ${v.ok ? 'PASS' : 'FAIL'}${v.used.length ? ' (registered: ' + v.used.join(', ') + ')' : ''}\n${v.unexplained.map((u) => 'UNEXPLAINED ' + u).join('\n')}\n\n` + r.out);
      results.push({ ...c, parsed, v });
      console.log(`[gates] ${slug(c).padEnd(44)} ${v.ok ? (v.used.length ? 'PASS*' : 'CLEAN') : 'FAIL'}  ${parsed.result}${v.unexplained.length ? '  <- ' + v.unexplained.join(' | ') : ''}`);
    }
  }));
  // static half
  const offline = {};
  for (const side of ['mirror', 'rebuild']) {
    const argv = [join(SKILL, 'verify-offline.mjs'), '--base', bases[side], '--routes', ROUTES.join(',')];
    let code = 0, text = '';
    try { const r = await run('node', argv, { maxBuffer: 64 * 1024 * 1024 }); text = r.stdout + r.stderr; } catch (e) { code = e.code ?? 1; text = (e.stdout || '') + (e.stderr || ''); }
    await writeFile(join(out, `verify-offline-${side}.txt`), `$ node ${argv.map((a) => a.replace(ROOT, '')).join(' ')}\n\n` + text);
    offline[side] = code === 0 && /^PASS/m.test(text);
    console.log(`[gates] verify-offline ${side}: ${offline[side] ? 'PASS' : 'FAIL'}`);
  }
  const pass = results.filter((r) => r.v.ok).length;
  const lines = [`# offline gate — ${new Date().toISOString().slice(0, 10)} — target ${TARGET} (${SIDES.rebuild.root.replace(ROOT + '/', '')}${TARGET === 'port' ? ', assets via --fallback-root mirror' : ''})`, '',
    `CLEAN + zero-outbound (probe.mjs --no-external), ${results.length} cells examined = 2 sides × (${ROUTES.length} routes × 2 viewports + ${WALK_ROUTES.desktop.length + WALK_ROUTES.mobile.length} full-scroll walks). **${pass}/${results.length} PASS**. Static half (verify-offline.mjs): mirror ${offline.mirror ? 'PASS' : 'FAIL'}, rebuild ${offline.rebuild ? 'PASS' : 'FAIL'}.`, '',
    'PASS* = clean except for registered residuals (listed per cell; definitions in scripts/run-gates.mjs RESIDUALS, deviations in REBUILD_PLAN §6).', '',
    '| cell | result | probe RESULT | registered residuals used | unexplained |', '|---|---|---|---|---|'];
  for (const r of results) lines.push(`| ${slug(r)} | ${r.v.ok ? (r.v.used.length ? 'PASS*' : 'CLEAN') : '**FAIL**'} | ${r.parsed.result} | ${r.v.used.join(', ') || '—'} | ${r.v.unexplained.join('<br>') || '—'} |`);
  lines.push('', '## registered residuals', '', '| id | side | routes | reason |', '|---|---|---|---|');
  for (const x of RESIDUALS) lines.push(`| ${x.id} | ${x.side} | ${ROUTES.filter(x.route).join(', ')} | ${x.why} |`);
  await writeFile(join(out, 'summary.md'), lines.join('\n') + '\n');
  console.log(`[gates] offline (${TARGET}): ${pass}/${results.length} cells PASS; summary ${out.replace(ROOT + '/', '')}/summary.md`);
  return pass === results.length && offline.mirror && offline.rebuild;
}

async function gateSymbols() {
  const out = join(GATES, 'symbols'); await mkdir(out, { recursive: true });
  const steps = [
    ['extract-check', ['node', join(SKILL, 'extract-source.mjs'), '--slices', join(ROOT, 'scripts', 'slices.config.mjs'), '--check']],
    ['extract-balance', ['node', join(SKILL, 'extract-source.mjs'), '--slices', join(ROOT, 'scripts', 'slices.config.mjs'), '--balance-check']],
    ['verify-decls', ['node', join(ROOT, 'scripts', 'verify-decls.mjs'), '--port', join(ROOT, 'port', '_gen', 'app.gen.js'), '--src', join(ROOT, 'src', 'app'), '--map', join(ROOT, 'docs', 'rename-map.json'), '--list']],
  ];
  // the skill gate reads {declarations, allow_orphans[]} with bare names; derive that view from the richer map
  const map = JSON.parse(await readFile(join(ROOT, 'docs', 'rename-map.json'), 'utf8'));
  const bare = (t) => t.split('#').pop();
  const compat = { declarations: Object.fromEntries(Object.entries(map.declarations).map(([p, s]) => [p, bare(s)])), allow_orphans: Object.keys(map.allow_orphans).map(bare) };
  for (const [s, v] of Object.entries(map.collapsed)) for (const p of v.ports) compat.declarations[p] = bare(s);
  const compatPath = join(out, 'rename-map.symbols.json'); await writeFile(compatPath, JSON.stringify(compat, null, 1) + '\n');
  steps.push(['skill-verify-symbols', ['node', join(SKILL, 'verify-symbols.mjs'), '--port', join(ROOT, 'port', '_gen'), '--src', join(ROOT, 'src', 'app'), '--map', compatPath]]);
  let allOk = true; const summary = [];
  for (const [name, argv] of steps) {
    let code = 0, text = '';
    try { const r = await run(argv[0], argv.slice(1), { maxBuffer: 64 * 1024 * 1024, cwd: ROOT }); text = r.stdout + r.stderr; } catch (e) { code = e.code ?? 1; text = (e.stdout || '') + (e.stderr || ''); }
    await writeFile(join(out, name + '.txt'), `$ ${argv.map((a) => a.replace(ROOT + '/', '')).join(' ')}\nexit ${code}\n\n` + text);
    // the skill gate is recorded, not decided: it cannot see esbuild plumbing (see docs/rename-map.json _doc)
    const decides = name !== 'skill-verify-symbols';
    if (decides && code !== 0) allOk = false;
    summary.push(`| ${name} | ${code === 0 ? 'PASS' : decides ? '**FAIL**' : 'recorded (exit ' + code + ')'} | docs/gates/symbols/${name}.txt |`);
    console.log(`[gates] symbols/${name.padEnd(22)} ${code === 0 ? 'PASS' : decides ? 'FAIL' : 'recorded (non-deciding, exit ' + code + ')'}`);
  }
  await writeFile(join(out, 'summary.md'), ['# symbols gate', '', '| step | result | artifact |', '|---|---|---|', ...summary, '', 'verify-decls.mjs decides (this bundle is esbuild output: lazy-init wrappers, hoisted chains, import/alias bindings — classified in docs/rename-map.json). The skill\'s verify-symbols.mjs is run and recorded for comparison; its misses are exactly the `plumbing` section.'].join('\n') + '\n');
  return allOk;
}

// ---------------------------------------------------------------------------
// Pixel gate — verification-gates.md §1.3 / §1.3.1 / §1.3.2, determinism.md §3.
// Checkpoints are position × state. Positions: per page by content length, always
// including scrollY = 0 and max. States are driven through the source's own DOM
// entry points at a VIRTUAL time after the app's own init timers (mL schedules
// initNavMenu at +500 ms); the shim makes setTimeout pump-driven, so the click
// lands on the same virtual frame on both sides.
// Tolerance is fixed BEFORE any cross-side number: per cell, band = max of all
// self samples of BOTH sides; PASS iff cross meanAbsDiff <= band + TOL_CONST.
// ---------------------------------------------------------------------------
const TOL_CONST = 0.5;
const SELF_SESSIONS = 4; // per side, per cell (verification-gates.md §1.3.2 rule 1/5)
// Non-empty-frame precondition (§4.8). A blank/unpainted frame has a handful of colours (a
// 1280x800 canvas that never drew: 1-10). Measured lower bound of a REAL flat frame on this
// site: the mobile nav-menu overlay (solid background + a few text colours) is 969 colours —
// so the floor must sit well below that. First run used 1000 and marked that rendered frame
// INVALID; 100 separates "nothing painted" from "a flat UI" with an order of magnitude each way.
const MIN_COLOURS = 100;
// One pump budget for every cell: 240 frames × 16.7 ms = 4.0 s virtual. The scroll is applied
// at `load` AND again at +1500 ms virtual: calendar and off-track reset the scroll position
// during their own init (mL's 500/750/1000 ms timers), so a load-time scroll alone left every
// checkpoint of those pages photographing the top of the page (first full run: 4 calendar and
// 4 off-track checkpoints with identical colour counts — the §4.8 movement check caught it).
// State clicks land at +1200 ms virtual, after initNavMenu/initGlSwitchers have run.
const PUMP = '16.7,240';
const STATES = {
  idle: { drive: '', pump: PUMP },
  'menu-open': { drive: `setTimeout(() => document.querySelector('[data-nav-wrap] [data-nav-ham]')?.click(), 1200);`, pump: PUMP, why: 'nav menu opened through the hamburger click handler (nav.ts initNavMenu / kL 44001) at +1200 ms virtual' },
  'variant-dark': { drive: `setTimeout(() => document.querySelector('[data-gl-switcher="dark"]')?.click(), 1200);`, pump: PUMP, why: '404 helmet variant switched through [data-gl-switcher] (misc.ts initGlSwitchers / T_ 46121) at +1200 ms virtual' },
};
const PIXEL_CELLS = [];
const addCells = (route, vp, fracs, state = 'idle') => { for (const f of fracs) PIXEL_CELLS.push({ route, vp, f, state }); };
const span = (n) => Array.from({ length: n }, (_, i) => Math.round((i / (n - 1)) * 100) / 100);
addCells('/', 'desktop', span(7)); addCells('/', 'desktop', [0], 'menu-open');
addCells('/calendar', 'desktop', span(4));
addCells('/on-track', 'desktop', span(5));
addCells('/off-track', 'desktop', span(4));
// The not-found page is photographed via /partnerships: the origin retired that page and serves the
// not-found template there with HTTP 200 (quirk Q6; mirror file is byte-identical to 404.html).
// pixelcompare.mjs refuses a non-2xx document, so /nope-404 itself cannot be a cell.
// The not-found template is exactly one viewport tall (scrollHeight == innerHeight measured on both
// sides), so it has ONE position; a second checkpoint at f=1 photographs the same frame.
addCells('/partnerships', 'desktop', [0]); addCells('/partnerships', 'desktop', [0], 'variant-dark');
// Mobile home is scroll-locked until the user taps "TAP TO LOCK" ($_ 44826 swipe toggle): scrollTo is
// a no-op there (first full run: 5 checkpoints, 1 distinct frame). One position + the menu state;
// the unlocked/scrolled state is listed under UNDRIVEN_STATES.
addCells('/', 'mobile', [0]); addCells('/', 'mobile', [0], 'menu-open');
addCells('/on-track', 'mobile', span(4));
const UNDRIVEN_STATES = [
  'home disco easter egg (DiscoController I8 31098) — no DOM entry wired in this gate',
  'home mobile swipe/scroll-lock toggle ($_ 44826) — mobile home is photographed only in its locked (top) position',
  'calendar circuit hover/selection (I4 9790 circuits rive)',
  'page transition mid-frame (taxi leave/enter overlay, oL 46381)',
];
const cellSlug = (c) => `${c.vp}${c.route === '/' ? '-home' : c.route.replace(/\//g, '-')}-${String(Math.round(c.f * 100)).padStart(3, '0')}${c.state === 'idle' ? '' : '-' + c.state}`;
const seedFor = (c) => `window.addEventListener("load", () => { const go = () => { const m = document.documentElement.scrollHeight - innerHeight; window.scrollTo(0, Math.round(m * ${c.f})); }; go(); setTimeout(go, 1500); ${STATES[c.state].drive} });`;

async function pixelRun({ a, b, name, out, c, self }) {
  const argv = [join(SKILL, 'pixelcompare.mjs'), '--a', a, '--b', b, '--name', name, '--out', out, '--pump', STATES[c.state].pump, '--seed', seedFor(c), '--format', 'png',
    '--width', c.vp === 'mobile' ? '390' : '1280', '--height', c.vp === 'mobile' ? '844' : '800'];
  if (self) argv.push('--self');
  let code = 0, text = '';
  try { const r = await run('node', argv, { maxBuffer: 64 * 1024 * 1024 }); text = r.stdout + r.stderr; } catch (e) { code = e.code ?? 1; text = (e.stdout || '') + (e.stderr || ''); }
  const m = text.match(/\{"meanAbsDiff":[^}]+\}/);
  const census = [...text.matchAll(/(REBUILD|MIRROR): (\d+) colours/g)].map((x) => Number(x[2]));
  return { code, metric: m ? JSON.parse(m[0]) : null, colours: census, fatal: (text.match(/FATAL[^\n]*/) || [null])[0], text };
}

async function gatePixel() {
  const out = join(GATES, TARGET === 'port' ? 'pixel-port' : 'pixel');
  const only = flag('only', null)?.split(',').map((x) => x.trim()).filter(Boolean) ?? null;
  let previous = [];
  if (only) { try { previous = JSON.parse(await readFile(join(out, 'results.json'), 'utf8')).results; } catch {} }
  else await rm(out, { recursive: true, force: true });
  await mkdir(join(out, 'composites'), { recursive: true });
  const scratch = join(ROOT, 'node_modules', '.cache', 'wrs-pixel'); await rm(scratch, { recursive: true, force: true }); await mkdir(scratch, { recursive: true });
  const bases = { mirror: await ensureServer('mirror'), rebuild: await ensureServer('rebuild') };
  const url = (side, c) => `${bases[side]}${c.route}?__probe`;
  const cells = only ? PIXEL_CELLS.filter((c) => only.includes(cellSlug(c))) : PIXEL_CELLS;
  if (only && cells.length !== only.length) throw new Error(`--only names unknown cell(s): ${only.filter((o) => !cells.some((c) => cellSlug(c) === o)).join(', ')}`);
  const current = new Set(PIXEL_CELLS.map(cellSlug));
  const dropped = previous.filter((r) => !current.has(r.slug)).map((r) => r.slug);
  if (dropped.length) console.log(`[gates] pixel: dropping ${dropped.length} stale result(s) no longer in PIXEL_CELLS: ${dropped.join(', ')}`);
  const results = previous.filter((r) => current.has(r.slug) && !cells.some((c) => cellSlug(c) === r.slug));
  const total = cells.length * (SELF_SESSIONS * 2 + 1);
  let done = 0;
  console.log(`[gates] pixel: ${cells.length} cells × (${SELF_SESSIONS}×2 self + 1 cross) = ${total} pixelcompare runs${only ? ` (re-running ${only.join(', ')}; ${results.length} kept from the previous run)` : ''}`);
  for (const c of cells) {
    const slug = cellSlug(c);
    const samples = { mirror: [], rebuild: [] };
    const notes = [];
    for (let s = 1; s <= SELF_SESSIONS; s++) {
      for (const side of ['mirror', 'rebuild']) { // interleaved M/R/M/R (§1.3.2 rule 5)
        const r = await pixelRun({ a: url(side, c), b: url(side, c), name: `${slug}-self-${side}-${s}`, out: join(scratch, `${slug}-self-${side}-${s}`), c, self: true });
        done++;
        if (!r.metric || r.colours.some((n) => n < MIN_COLOURS)) { notes.push(`self ${side} #${s}: ${r.fatal || 'no metric'} colours=${r.colours.join('/')}`); continue; }
        samples[side].push({ mean: r.metric.meanAbsDiff, worst: r.metric.worstCellDiff, colours: r.colours[0] });
      }
    }
    const band = Math.max(0, ...samples.mirror.map((x) => x.mean), ...samples.rebuild.map((x) => x.mean));
    const tol = band + TOL_CONST;
    const cross = await pixelRun({ a: url('rebuild', c), b: url('mirror', c), name: `${slug}-cross`, out: join(scratch, `${slug}-cross`), c, self: false });
    done++;
    let verdict, reason = '';
    if (samples.mirror.length < SELF_SESSIONS || samples.rebuild.length < SELF_SESSIONS) { verdict = 'INVALID'; reason = 'incomplete self band'; }
    else if (!cross.metric) { verdict = 'INVALID'; reason = cross.fatal || 'cross run produced no metric'; }
    else if (cross.colours.some((n) => n < MIN_COLOURS)) { verdict = 'INVALID'; reason = `empty frame (colours ${cross.colours.join('/')})`; }
    else if (cross.metric.meanAbsDiff <= tol) verdict = 'PASS';
    else { verdict = 'FAIL'; reason = `cross ${cross.metric.meanAbsDiff} > band ${band} + ${TOL_CONST}`; }
    if (cross.metric) { try { await cp(join(scratch, `${slug}-cross`, `side-by-side-${slug}-cross.jpg`), join(out, 'composites', `${slug}.jpg`)); } catch {} }
    results.push({ ...c, slug, samples, band, tol, cross: cross.metric, crossColours: cross.colours, verdict, reason, notes, ranAt: new Date().toISOString() });
    results.sort((x, y) => PIXEL_CELLS.findIndex((c) => cellSlug(c) === x.slug) - PIXEL_CELLS.findIndex((c) => cellSlug(c) === y.slug));
    console.log(`[gates] ${slug.padEnd(36)} band ${String(band).padEnd(5)} cross ${String(cross.metric?.meanAbsDiff ?? '-').padEnd(6)} worst ${String(cross.metric?.worstCellDiff ?? '-').padEnd(6)} ${verdict}${reason ? '  <- ' + reason : ''}  [${done}/${total}]`);
    await writeFile(join(out, 'results.json'), JSON.stringify({ TOL_CONST, SELF_SESSIONS, MIN_COLOURS, results }, null, 1));
  }
  // movement check per page/viewport/state (pixel-walk.mjs's census rule)
  const moved = [];
  for (const key of new Set(results.map((r) => `${r.vp} ${r.route} ${r.state}`))) {
    const rs = results.filter((r) => `${r.vp} ${r.route} ${r.state}` === key && r.cross);
    const distinct = new Set(rs.map((r) => r.crossColours[0]));
    moved.push({ key, checkpoints: rs.length, distinct: distinct.size, ok: rs.length < 2 || distinct.size > 1 });
  }
  const pass = results.filter((r) => r.verdict === 'PASS').length;
  const L = [`# pixel gate — ${new Date().toISOString().slice(0, 10)} — target ${TARGET} (${SIDES.rebuild.root.replace(ROOT + '/', '')})`, '',
    `Quantified A/B pixel gate (scripts/skill/pixelcompare.mjs, 64×40 grid luma metric, 1280×800 desktop / 390×844 mobile, PNG) under the determinism shim (probe-shim.js via ?__probe on both serve.mjs sides; pump ${PUMP} = dt,frames; scroll applied at load and at +1500 ms virtual; state clicks at +1200 ms virtual). **${pass}/${results.length} cells PASS.** Per cell: ${SELF_SESSIONS} self-band sessions per side, interleaved mirror/rebuild, then one cross-side run; tolerance = max(self band of both sides) + ${TOL_CONST} — fixed before any cross-side number. Non-empty-frame precondition: ≥ ${MIN_COLOURS} colours on both frames.`, '',
    '| cell | self band mirror (4) | self band rebuild (4) | band | cross meanAbsDiff | worst cell | similarity | verdict |', '|---|---|---|---|---|---|---|---|'];
  for (const r of results) L.push(`| ${r.slug} | ${r.samples.mirror.map((x) => x.mean).join(' / ') || '—'} | ${r.samples.rebuild.map((x) => x.mean).join(' / ') || '—'} | ${r.band} | ${r.cross?.meanAbsDiff ?? '—'} | ${r.cross ? r.cross.worstCellDiff + (r.cross.worstCell ? ' @' + r.cross.worstCell.join(',') : '') : '—'} | ${r.cross?.similarityPct ?? '—'}% | ${r.verdict === 'PASS' ? 'PASS' : '**' + r.verdict + '**'}${r.reason ? ' — ' + r.reason : ''} |`);
  L.push('', '## movement check (distinct colour counts across a page\'s checkpoints)', '', '| page | checkpoints | distinct frames | ok |', '|---|---|---|---|');
  for (const m of moved) L.push(`| ${m.key} | ${m.checkpoints} | ${m.distinct} | ${m.ok ? 'yes' : '**NO — scroll did not move the page**'} |`);
  L.push('', '## driven states', '', ...Object.entries(STATES).filter(([k]) => k !== 'idle').map(([k, v]) => `- **${k}**: ${v.why}`), '', '## states enumerated but NOT driven (open items, not covered)', '', ...UNDRIVEN_STATES.map((s) => `- ${s}`), '', 'Composites of every cross-side run: docs/gates/pixel/composites/<cell>.jpg ([rebuild | mirror | diff]). Raw numbers: results.json.');
  await writeFile(join(out, 'summary.md'), L.join('\n') + '\n');
  await rm(scratch, { recursive: true, force: true });
  console.log(`[gates] pixel: ${pass}/${results.length} PASS; summary docs/gates/pixel/summary.md`);
  return pass === results.length && moved.every((m) => m.ok);
}

// ---------------------------------------------------------------------------
// Standalone gate (readable-source.md §4.3): the skill's verify-standalone.mjs copies src/
// OUTSIDE the repo, installs offline and builds; then — because "build success ≠ correct" —
// the COPY's dist is served by a plain static server and every route is probed for CLEAN +
// zero-outbound (legal routes keep the registered iubenda residuals).
// ---------------------------------------------------------------------------
async function gateStandalone() {
  const out = join(GATES_ROOT, 'standalone'); await rm(out, { recursive: true, force: true }); await mkdir(out, { recursive: true });
  const argv = [join(SKILL, 'verify-standalone.mjs'), '--src', join(ROOT, 'src'), '--full', '--keep'];
  let code = 0, text = '';
  try { const r = await run('node', argv, { maxBuffer: 64 * 1024 * 1024, cwd: ROOT }); text = r.stdout + r.stderr; } catch (e) { code = e.code ?? 1; text = (e.stdout || '') + (e.stderr || ''); }
  await writeFile(join(out, 'verify-standalone.txt'), `$ node ${argv.map((a) => a.replace(ROOT + '/', '')).join(' ')}\nexit ${code}\n\n` + text);
  const copy = (text.match(/copying to (\S+)/) || [])[1];
  console.log(`[gates] standalone: verify-standalone ${code === 0 ? 'PASS' : 'FAIL'}${copy ? ' (copy kept at ' + copy + ')' : ''}`);
  if (code !== 0 || !copy) return false;
  const dist = join(copy, 'dist');
  const port = allocPort('serve', 'unset');
  const child = spawn('node', [join(SKILL, 'serve.mjs'), '--root', dist, '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'] });
  spawned.push(child);
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 40 && !(await fetchIdentity(base)); i++) await new Promise((r) => setTimeout(r, 250));
  const results = [];
  for (const route of ROUTES) {
    const r = await probe(base + route, ['--scroll', '0.5', '--cdp-port', String(allocPort('probe.cdp', 'unset'))]);
    const parsed = parseProbe(r.out); const v = judge(parsed, { route, side: 'rebuild', base });
    await writeFile(join(out, `copy${route === '/' ? '-home' : route.replace(/\//g, '-')}.txt`), `$ node ${r.argv.map((a) => a.replace(ROOT + '/', '')).join(' ')}\nverdict: ${v.ok ? 'PASS' : 'FAIL'}\n${v.unexplained.map((u) => 'UNEXPLAINED ' + u).join('\n')}\n\n` + r.out);
    results.push({ route, v, parsed });
    console.log(`[gates] standalone copy ${route.padEnd(26)} ${v.ok ? (v.used.length ? 'PASS*' : 'CLEAN') : 'FAIL'}  ${parsed.result}${v.unexplained.length ? '  <- ' + v.unexplained.join(' | ') : ''}`);
  }
  try { child.kill('SIGTERM'); } catch {}
  await rm(copy, { recursive: true, force: true }).catch(() => {});
  const pass = results.filter((r) => r.v.ok).length;
  await writeFile(join(out, 'summary.md'), [`# standalone gate — ${new Date().toISOString().slice(0, 10)}`, '', `src/ copied outside the repository, \`npm install --offline\`, \`npm run build\` (verify-standalone.mjs --full): **PASS**. The copy's dist served as plain static files and probed with --no-external on ${ROUTES.length} routes: **${pass}/${results.length} PASS** (legal routes: registered iubenda residuals only).`, '', '| route | result | probe RESULT | residuals | unexplained |', '|---|---|---|---|---|', ...results.map((r) => `| ${r.route} | ${r.v.ok ? (r.v.used.length ? 'PASS*' : 'CLEAN') : '**FAIL**'} | ${r.parsed.result} | ${r.v.used.join(', ') || '—'} | ${r.v.unexplained.join('<br>') || '—'} |`)].join('\n') + '\n');
  console.log(`[gates] standalone: ${pass}/${results.length} routes PASS on the copy`);
  return pass === results.length;
}

let ok = true;
if (cmd === 'mirror' || cmd === 'all') ok = (await gateMirror()) && ok;
if (cmd === 'standalone' || cmd === 'all') ok = (await gateStandalone()) && ok;
if (cmd === 'pixel' || cmd === 'all') ok = (await gatePixel()) && ok;
if (cmd === 'symbols' || cmd === 'all') ok = (await gateSymbols()) && ok;
if (cmd === 'offline' || cmd === 'all') ok = (await gateOffline()) && ok;
if (!['mirror', 'offline', 'symbols', 'pixel', 'standalone', 'all'].includes(cmd)) { console.error('usage: run-gates.mjs <mirror|offline|symbols|pixel|standalone|all> [--target src|port] [--resample N] [--only cells]'); process.exit(2); }
reap();
process.exit(ok ? 0 : 1);
