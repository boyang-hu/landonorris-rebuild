#!/usr/bin/env node
/**
 * verify-decls.mjs — declaration reconciliation between port/_gen/app.gen.js
 * (verbatim application slices of the OFF+BRAND bundle) and src/app/**\/*.ts.
 *
 * This is the M(n) cold-head list reconciliation and the M(n+1) symbol gate of
 * skill v0.1.51 for THIS bundle's shape. The skill's verify-symbols.mjs assumes
 * a flat concatenation where every top-level declaration has a src symbol; this
 * bundle is esbuild output: module bodies sit inside `var X = VA(() => {...})`
 * lazy-init wrappers (`__esm`), hoisted bindings come as `var a, b, c;` comma
 * chains, and a few vars are import/alias bindings. So a port declaration here
 * is classified into exactly one of:
 *
 *   declarations  port name -> the ONE src declaration that is its port
 *   collapsed     N port names -> 1 src declaration (structural rewrite,
 *                 registered in REBUILD_PLAN §6; listed by src name)
 *   plumbing      esbuild wrapper / empty init / namespace object / import or
 *                 alias binding — no src symbol BY CONSTRUCTION; note names the
 *                 src module whose module scope carries it
 *   omitted       deliberately not ported (each a registered deviation/quirk)
 *
 * Targets may be written `path-suffix#name` when two src files declare one name.
 *
 * and every src top-level declaration must be the target of one of the above
 * or sit in allow_orphans with a reason (src-only TS helpers, literals hoisted
 * to named constants, ...).
 *
 * Assertions (each prints n/N examined — verification-gates.md §0.24.0):
 *   1 coverage    every port declaration (incl. chain members) is classified
 *   2 targets     every declarations/collapsed target exists in src
 *   3 injective   no two port names share a src target outside `collapsed`
 *   4 no orphans  every src declaration has a port ancestor or a registered reason
 *   5 fluid shaders: mapped GLSL string constants match their port text (content check)
 *
 * Presence and identity only; behaviour is the runtime gates' business.
 * Zero dependencies. Reads only the two sides' text + docs/rename-map.json —
 * never the tools that produced them (verification-gates.md §2.1.2).
 *
 *   node scripts/verify-decls.mjs [--port port/_gen/app.gen.js] [--src src/app] [--map docs/rename-map.json] [--list]
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const PORT = flag('port', 'port/_gen/app.gen.js');
const SRC = flag('src', 'src/app');
const MAP = flag('map', 'docs/rename-map.json');
const LIST = args.includes('--list');

const DECL = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:abstract\s+)?(class|function|const|let|var)\s+([A-Za-z_$][\w$]*)/;

// ---- port side: column-0 declarations, comma chains expanded --------------
function chainNames(lines, i) {
  // Consume the whole `var` statement (it may span template literals / nested
  // brackets across many lines) and return the names declared at depth 0.
  let text = '', j = i, q = null, depth = 0, done = false;
  for (; j < lines.length && !done; j++) {
    const l = lines[j];
    for (let k = 0; k < l.length; k++) {
      const c = l[k];
      if (q) { if (c === '\\') { k++; continue; } if (c === q) q = null; continue; }
      if (c === '"' || c === "'" || c === '`') { q = c; continue; }
      if (c === '/' && l[k + 1] === '/') break; // line comment
      if ('([{'.includes(c)) { depth++; continue; }
      if (')]}'.includes(c)) { depth--; continue; }
      if (depth === 0) { text += c; if (c === ';') { done = true; break; } }
    }
    if (q === '`') text += '\n'; // keep scanning inside a template literal
  }
  const names = [];
  for (const part of text.replace(/^\s*(var|let|const)\s+/, '').split(',')) {
    const m = part.trim().match(/^([A-Za-z_$][\w$]*)/);
    if (m) names.push(m[1]);
  }
  return { names, end: j - 1 };
}
async function portDecls(file) {
  const lines = (await readFile(file, 'utf8')).split('\n');
  const found = new Map(); // name -> { line, kind, text }
  let srcLine = null;
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^\/\/ ===== .* L(\d+)-L(\d+) =====$/);
    if (h) { srcLine = +h[1] - 1; continue; }
    if (srcLine === null) continue;
    if (!(lines[i].startsWith('// ') && i < 20)) srcLine++;
    const m = DECL.exec(lines[i]);
    if (!m) continue;
    const l = lines[i];
    const kind = /= (VA|DK)\(/.test(l) ? 'wrapper' : /= \(\) => \{\};?$/.test(l) ? 'empty-init' : /^var [\w$]+ = \{\};?$/.test(l) ? 'empty-ns' : /= `/.test(l) ? 'string' : m[1] === 'class' ? 'class' : m[1] === 'function' ? 'function' : 'var';
    if (m[1] === 'var' && !['wrapper', 'empty-init', 'empty-ns'].includes(kind)) {
      const { names, end } = chainNames(lines, i);
      names.forEach((n, idx) => { if (!found.has(n)) found.set(n, { line: srcLine, kind: kind === 'string' ? 'string' : names.length > 1 ? 'chain' : 'var', text: (idx === 0 ? l : `(chain member of ${names[0]})`).slice(0, 90) }); });
      srcLine += end - i; i = end;
    } else if (!found.has(m[2])) found.set(m[2], { line: srcLine, kind, text: l.slice(0, 90) });
  }
  return found;
}
// ---- src side ---------------------------------------------------------------
async function srcDecls(root) {
  const found = new Map();
  const walk = async (d) => {
    for (const e of await readdir(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules') await walk(p); continue; }
      if (!/\.(ts|mjs|js)$/.test(e.name)) continue;
      const lines = (await readFile(p, 'utf8')).split('\n');
      lines.forEach((l, i) => { const m = DECL.exec(l); if (m) { const key = m[2]; if (found.has(key)) found.get(key).dup.push(`${p}:${i + 1}`); else found.set(key, { file: p, line: i + 1, kind: m[1], dup: [] }); } });
    }
  };
  await walk(root);
  return found;
}

const port = await portDecls(PORT);
const src = await srcDecls(SRC);
const map = JSON.parse(await readFile(MAP, 'utf8'));
const decl = Object.assign(Object.create(null), map.declarations || {});
const plumbing = Object.assign(Object.create(null), map.plumbing || {});
const collapsed = Object.assign(Object.create(null), map.collapsed || {}); // srcName -> { ports: [...], why }
const orphans = Object.assign(Object.create(null), map.allow_orphans || {}); // srcName -> why
const omitted = Object.assign(Object.create(null), map.omitted || {}); // portName -> why (registered deviation: not ported)
const collapsedPorts = new Map(); for (const [s, v] of Object.entries(collapsed)) for (const p of v.ports) collapsedPorts.set(p, s);
// A target is `name` or `path-suffix#name` (two src files may declare the same bare name).
// resolve() returns the canonical `file#name` key or null.
const srcByName = new Map();
for (const [n, v] of src) { for (const loc of [v.file + ':' + v.line, ...v.dup]) { const f = loc.split(':')[0]; (srcByName.get(n) ?? srcByName.set(n, []).get(n)).push(f); } }
const resolve = (t) => { const [a, b] = t.includes('#') ? t.split('#') : [null, t]; const files = srcByName.get(b) || []; const hit = a ? files.filter((f) => f.endsWith(a)) : files; return hit.length === 1 || (!a && hit.length) ? `${hit[0]}#${b}` : null; };
const keyOf = (file, name) => `${file}#${name}`;

let fails = 0;
const fail = (m) => { fails++; console.log('  FAIL ' + m); };
const ok = (m) => console.log('  ok   ' + m);
console.log(`=== verify-decls  port=${PORT} (${port.size} declarations)  src=${SRC} (${src.size} declarations)  map=${MAP} ===`);

// 1 coverage
const unclassified = [...port].filter(([n]) => !(n in decl) && !(n in plumbing) && !collapsedPorts.has(n) && !(n in omitted));
const nDecl = [...port].filter(([n]) => n in decl).length, nPlumb = [...port].filter(([n]) => n in plumbing).length, nColl = [...port].filter(([n]) => collapsedPorts.has(n)).length, nOmit = [...port].filter(([n]) => n in omitted).length;
console.log(`\n--- 1 coverage: ${port.size - unclassified.length}/${port.size} port declarations classified (${nDecl} declarations, ${nColl} collapsed, ${nPlumb} plumbing, ${nOmit} omitted-registered) ---`);
for (const [n, why] of Object.entries(omitted)) console.log(`  info omitted ${n}: ${why}`);
if (unclassified.length) { fail(`${unclassified.length} unclassified:`); for (const [n, v] of unclassified) console.log(`         ${n.padEnd(5)} L${String(v.line).padStart(5)} ${v.kind.padEnd(10)} ${v.text}`); } else ok('every port declaration is classified');
const stale = [...Object.keys(decl), ...Object.keys(plumbing), ...collapsedPorts.keys(), ...Object.keys(omitted)].filter((n) => !port.has(n));
if (stale.length) fail(`${stale.length} map entries name no port declaration (stale): ${stale.join(' ')}`); else ok('no stale map entries');

// 2 targets
console.log(`\n--- 2 targets: ${Object.keys(decl).length + Object.keys(collapsed).length} mapped targets checked against src ---`);
const missing = Object.entries(decl).filter(([, s]) => !resolve(s)).concat(Object.keys(collapsed).filter((s) => !resolve(s)).map((s) => ['(collapsed)', s]));
if (missing.length) { fail(`${missing.length} target(s) not declared in src:`); for (const [p, s] of missing) console.log(`         ${p} -> ${s}`); } else ok('every mapped target exists in src');
const dups = [...src].filter(([, v]) => v.dup.length);
if (dups.length) console.log(`  info ${dups.length} src name(s) declared in more than one file (qualify targets as path#name): ${dups.map(([n]) => n).join(' ')}`);

// 3 injective
console.log(`\n--- 3 injective: ${Object.keys(decl).length} declaration mappings ---`);
const byTarget = new Map();
for (const [p, s] of Object.entries(decl)) { const k = resolve(s) ?? s; if (!byTarget.has(k)) byTarget.set(k, []); byTarget.get(k).push(p); }
const collide = [...byTarget].filter(([, ps]) => ps.length > 1);
if (collide.length) { fail(`${collide.length} src symbol(s) claimed by several port declarations outside \`collapsed\`:`); for (const [s, ps] of collide) console.log(`         ${s} <- ${ps.join(', ')}`); } else ok('injective outside registered collapses');
for (const [s, v] of Object.entries(collapsed)) console.log(`  info collapsed ${v.ports.join(' + ')} -> ${s}: ${v.why}`);

// 4 orphans
const claimed = new Set([...Object.values(decl), ...Object.keys(collapsed)].map((t) => resolve(t)).filter(Boolean));
// every src declaration site (including same-name declarations in other files)
const sites = []; for (const [n, v] of src) { sites.push([n, v.file, v.line]); for (const d of v.dup) sites.push([n, d.split(':')[0], +d.split(':')[1]]); }
console.log(`\n--- 4 orphans: ${sites.length} src declarations checked for a port ancestor ---`);
const orphanKey = (n, f) => Object.keys(orphans).find((k) => (k.includes('#') ? f.endsWith(k.split('#')[0]) && k.split('#')[1] === n : k === n));
const orphan = sites.filter(([n, f]) => !claimed.has(keyOf(f, n)) && !orphanKey(n, f));
const usedOrphans = new Set(sites.map(([n, f]) => orphanKey(n, f)).filter(Boolean));
const unusedOrphanReasons = Object.keys(orphans).filter((k) => !usedOrphans.has(k) || sites.some(([n, f]) => orphanKey(n, f) === k && claimed.has(keyOf(f, n))));
if (orphan.length) { fail(`${orphan.length} src declaration(s) with no port ancestor and no registered reason:`); for (const [n, f, l] of orphan) console.log(`         ${n.padEnd(28)} ${f}:${l}`); } else ok(`no unregistered orphans (${Object.keys(orphans).length} registered)`);
if (unusedOrphanReasons.length) fail(`allow_orphans names ${unusedOrphanReasons.length} symbol(s) that are not orphans / not in src: ${unusedOrphanReasons.join(' ')}`);

// 5 content check for mapped GLSL/template string constants
console.log(`\n--- 5 content: template-string constants ---`);
{
  const portText = await readFile(PORT, 'utf8');
  const srcCache = new Map();
  // a literal is `NAME = \`...\`` either as a declaration head or as a chain member; it ends at a
  // backtick that closes the statement (`;) or continues the chain (`,)
  const grab = (text, name) => { const m = text.match(new RegExp(`^(?:\\s*|(?:export )?(?:const|var|let) )${name.replace(/\$/g, '\\$')} = \`([\\s\\S]*?)\`[;,]?$`, 'm')); return m ? m[1].replace(/\s+/g, ' ').trim() : null; };
  let n = 0, bad = 0;
  for (const [p, v] of port) {
    if (v.kind !== 'string' || !(p in decl)) continue;
    const r = resolve(decl[p]); if (!r) continue; const [sf, sn] = r.split('#');
    if (!srcCache.has(sf)) srcCache.set(sf, await readFile(sf, 'utf8'));
    const a = grab(portText, p), b = grab(srcCache.get(sf), sn);
    n++;
    if (a === null || b === null) { console.log(`  info ${p} -> ${decl[p]}: could not isolate one side's literal (multi-declaration line?)`); continue; }
    if (a !== b) { bad++; console.log(`  FAIL ${p} -> ${decl[p]}: literal differs (port ${a.length} chars, src ${b.length} chars)`); }
  }
  if (bad) fails++; else ok(`${n}/${n} mapped template-string constants are identical modulo whitespace`);
}

if (LIST) { console.log('\n--- full table ---'); for (const [n, v] of port) console.log(`${n.padEnd(5)} L${String(v.line).padStart(5)} ${v.kind.padEnd(10)} -> ${decl[n] ?? (collapsedPorts.get(n) ? collapsedPorts.get(n) + ' (collapsed)' : plumbing[n] ? 'plumbing: ' + plumbing[n] : omitted[n] ? 'omitted: ' + omitted[n] : '???')}`); }

console.log(`\n${fails ? `FAIL — ${fails} assertion(s) failed.` : 'PASS — port and src declarations reconcile.'}`);
process.exit(fails ? 1 : 0);
