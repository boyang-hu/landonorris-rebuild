#!/usr/bin/env node
/**
 * tools/grade-renames.mjs — evidence grade for every port→src name in docs/rename-map.json
 * (readable-source.md §3.2: a name must come from evidence; rename-map records "依据档位").
 *
 * For each `declarations` entry the port declaration's body (port/_gen/app.gen.js, from its
 * line to the next top-level statement) is searched for evidence that carries the src name:
 *   tier 1  a GLOBAL the source itself publishes (window.<name>, CustomEvent name) whose
 *           identifier tokens match the src name            — strongest, self-named
 *   tier 2  a STRING the body consumes/produces (data-* attribute, selector, event name,
 *           console message, rive file/input name) whose words match the src name
 *   tier 3  a PROPERTY the body assigns or reads (this.foo / obj.foo) whose name matches
 *   tier 0  none of the above: human judgement from the reverse-engineering notes —
 *           the `why` is the provenance comment next to the src declaration
 * Matching is on camelCase / kebab-case / snake_case word tokens (≥3 chars), not substrings.
 *
 * Writes the `evidence` section into docs/rename-map.json (verify-decls.mjs ignores it) and
 * prints the tier census + the tier-0 list for the manual spot-check readable-source.md §8 asks for.
 *
 *   node tools/grade-renames.mjs [--port port/_gen/app.gen.js] [--src src/app] [--map docs/rename-map.json] [--dry]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const PORT = flag('port', 'port/_gen/app.gen.js'), SRC = flag('src', 'src/app'), MAP = flag('map', 'docs/rename-map.json');
const DRY = args.includes('--dry');

const DECL = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:class|function|const|let|var)\s+([A-Za-z_$][\w$]*)/;
const STOP = new Set(['init', 'the', 'and', 'for', 'with', 'set', 'get', 'page', 'scene', 'data', 'all', 'create', 'update', 'default', 'value', 'type', 'name', 'index', 'item', 'items', 'element', 'elements', 'el', 'manager', 'instance', 'state', 'true', 'false', 'null', 'function', 'class', 'return', 'new', 'this', 'window', 'document', 'const', 'let', 'var']);
const tokens = (s) => [...new Set(String(s).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[-_./:$]+/g, ' ').toLowerCase().split(/\s+/).filter((t) => t.length >= 3 && !STOP.has(t)))];

// ---- port declarations with bodies
const portLines = readFileSync(PORT, 'utf8').split('\n');
const starts = [];
portLines.forEach((l, i) => { if (DECL.test(l) || /^[A-Za-z_$][\w$]*\(\);?$/.test(l)) starts.push(i); });
const bodyOf = new Map();
for (let k = 0; k < starts.length; k++) {
  const a = starts[k], b = k + 1 < starts.length ? starts[k + 1] : portLines.length;
  const head = portLines[a];
  const names = [];
  const m = DECL.exec(head);
  if (m) {
    if (/^var\s/.test(head)) { // comma chain: all names before `=`/`,` on the head line and 4-space continuation lines
      const chain = [head]; for (let j = a + 1; j < b && /^    [A-Za-z_$][\w$]*\s*(=|,|;)/.test(portLines[j]); j++) chain.push(portLines[j]);
      for (const c of chain) for (const part of c.replace(/^var\s+/, '').split(',')) { const n = part.trim().match(/^([A-Za-z_$][\w$]*)/); if (n) names.push(n[1]); }
    } else names.push(m[1]);
  }
  const body = portLines.slice(a, b).join('\n');
  for (const n of names) if (!bodyOf.has(n)) bodyOf.set(n, { line: a + 1, body });
}

// ---- src declarations with the comment right above them
const srcDecl = new Map();
const walk = (d) => { for (const e of readdirSync(d)) { const p = join(d, e); if (statSync(p).isDirectory()) walk(p); else if (/\.ts$/.test(e)) { const L = readFileSync(p, 'utf8').split('\n'); L.forEach((l, i) => { const m = DECL.exec(l); if (!m) return; let c = ''; for (let j = i - 1; j >= Math.max(0, i - 4); j--) { const t = L[j].trim(); if (/^(\/\/|\*|\/\*\*)/.test(t)) { c = t.replace(/^(\/\/|\/\*\*|\*\/?|\*)\s?/, '').replace(/\*\/$/, '').trim(); break; } if (t === '') continue; break; } const key = `${p.replace(/^src\/app\//, '')}#${m[1]}`; srcDecl.set(key, { name: m[1], file: p, line: i + 1, comment: c }); if (!srcDecl.has(m[1])) srcDecl.set(m[1], srcDecl.get(key)); }); } } };
walk(SRC);

const map = JSON.parse(readFileSync(MAP, 'utf8'));
const evidence = {};
const census = { 1: 0, 2: 0, 3: 0, 0: 0 };
const tier0 = [];
for (const [portName, target] of Object.entries(map.declarations)) {
  const srcName = target.split('#').pop();
  const sd = srcDecl.get(target.includes('#') ? target : srcName) || srcDecl.get(srcName);
  const want = tokens(srcName);
  const rec = bodyOf.get(portName);
  let tier = 0, why = '';
  if (rec && want.length) {
    const body = rec.body;
    const hit = (re) => { for (const m of body.matchAll(re)) { const t = tokens(m[1]); const common = want.filter((w) => t.includes(w)); if (common.length) return { text: m[1], common }; } return null; };
    let h;
    if ((h = hit(/window\.([A-Za-z_$][\w$]*)\s*=|new CustomEvent\("([^"]+)"\)|dispatchEvent\(new (?:Custom)?Event\("([^"]+)"/g) || hit(/window\.([A-Za-z_$][\w$]{2,})/g))) { tier = 1; why = `source global/event \`${h.text}\` ↔ ${h.common.join(',')}`; }
    else if ((h = hit(/"([^"\n]{3,80})"|'([^'\n]{3,80})'|`([^`\n]{3,80})`/g))) { tier = 2; why = `string \`${h.text.slice(0, 50)}\` ↔ ${h.common.join(',')}`; }
    else if ((h = hit(/\.([A-Za-z_$][\w$]{2,})\s*[=(]/g))) { tier = 3; why = `property \`.${h.text}\` ↔ ${h.common.join(',')}`; }
  }
  if (!tier) { why = sd?.comment ? `human judgement; provenance: ${sd.comment.slice(0, 90)}` : 'human judgement (no provenance comment found)'; tier0.push(`${portName} → ${srcName}${sd ? ` (${sd.file.replace(/^src\/app\//, '')}:${sd.line})` : ''}`); }
  census[tier]++;
  evidence[portName] = { src: srcName, tier, why, portLine: rec?.line ?? null };
}
console.log(`graded ${Object.keys(evidence).length} renames: tier1 ${census[1]} · tier2 ${census[2]} · tier3 ${census[3]} · tier0 (human) ${census[0]}`);
console.log('tier-0 (need manual review):'); for (const t of tier0) console.log('  ' + t);
if (!DRY) { map.evidence = evidence; map._evidence_doc = 'evidence tiers per rename (tools/grade-renames.mjs): 1 = a global/event the source itself names, 2 = a string the body consumes/produces, 3 = a property name, 0 = human judgement from the notes (why = provenance comment). See docs/rename-review.md for the manual spot-check.'; writeFileSync(MAP, JSON.stringify(map, null, 1) + '\n'); console.log('evidence written to ' + MAP); }
