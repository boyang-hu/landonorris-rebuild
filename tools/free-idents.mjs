#!/usr/bin/env node
/**
 * tools/free-idents.mjs — which identifiers does the sliced application code
 * reference without declaring? Those are the bundle's VENDOR bindings (three,
 * gsap, lenis, rive, taxi, msdf, loaders, esbuild runtime helpers) that the
 * runnable port/ must re-bind to npm exports (porting-discipline.md §2.2 trio
 * #3, the alias table). Real parser + scope analysis (acorn), so shadowing by
 * parameters and inner declarations is handled — a text scan cannot.
 *
 *   node tools/free-idents.mjs [--in port/_gen/app.gen.js] [--pretty mirror/_pretty/<bundle>.js] [--json out.json]
 *
 * For every free identifier it also looks up the DEFINITION in the beautified
 * bundle (column-0 `var|class|function NAME`, or a hoisted `NAME = …` inside an
 * esbuild __esm wrapper) and prints the first line, so the alias can be
 * resolved from evidence rather than guessed. Producer-side tool: may have
 * dependencies; no gate imports it.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const IN = flag('in', 'port/_gen/app.gen.js');
const PRETTY = flag('pretty', 'mirror/_pretty/lando.OFF+BRAND.gold-android-fix-03.js');
const JSON_OUT = flag('json', null);

const src = readFileSync(IN, 'utf8');
const ast = acorn.parse(src, { ecmaVersion: 2022, sourceType: 'module', locations: true, allowHashBang: true });

// ---- scope analysis -------------------------------------------------------
// Build scopes: Program, function (incl. params), block (let/const/class), catch.
const BROWSER_GLOBALS = new Set(`window document navigator location history console Math JSON Date Number String Object Array Promise Symbol Map Set WeakMap WeakSet Error TypeError RangeError Reflect Proxy Uint8Array Uint16Array Uint32Array Int8Array Int16Array Int32Array Float32Array Float64Array ArrayBuffer DataView Intl setTimeout clearTimeout setInterval clearInterval requestAnimationFrame cancelAnimationFrame requestIdleCallback performance fetch Image HTMLElement HTMLCanvasElement HTMLVideoElement HTMLImageElement Element Node Event CustomEvent MouseEvent KeyboardEvent TouchEvent PointerEvent WheelEvent IntersectionObserver ResizeObserver MutationObserver matchMedia getComputedStyle parseInt parseFloat isNaN isFinite encodeURIComponent decodeURIComponent encodeURI decodeURI undefined NaN Infinity globalThis self localStorage sessionStorage URL URLSearchParams Blob FileReader Worker WebAssembly atob btoa structuredClone queueMicrotask TextDecoder TextEncoder AbortController DOMParser XMLHttpRequest Audio Option FormData Headers Request Response WebGL2RenderingContext WebGLRenderingContext OffscreenCanvas createImageBitmap ImageBitmap devicePixelRatio innerWidth innerHeight scrollY scrollX pageYOffset pageXOffset screen alert prompt confirm open close scrollTo scrollBy addEventListener removeEventListener dispatchEvent getSelection crypto MediaQueryList CSS HTMLIFrameElement ShadowRoot DocumentFragment Text Range AudioContext webkitAudioContext arguments eval`.split(/\s+/));

const declared = new Map(); // name -> scope id set (we only need program-level + nested)
const free = new Map(); // name -> [{line, col}]
// We do a simplified but correct-enough resolution: collect declarations per scope node, then for
// each Identifier reference walk up the ancestor chain.
const scopeOf = new WeakMap();
function addDecl(scopeNode, name) { if (!scopeOf.has(scopeNode)) scopeOf.set(scopeNode, new Set()); scopeOf.get(scopeNode).add(name); }
function patternNames(p, out = []) {
  if (!p) return out;
  switch (p.type) {
    case 'Identifier': out.push(p.name); break;
    case 'ObjectPattern': for (const pr of p.properties) patternNames(pr.type === 'RestElement' ? pr.argument : pr.value, out); break;
    case 'ArrayPattern': for (const e of p.elements) patternNames(e, out); break;
    case 'RestElement': patternNames(p.argument, out); break;
    case 'AssignmentPattern': patternNames(p.left, out); break;
  }
  return out;
}
const isScope = (n) => n.type === 'Program' || n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression' || n.type === 'BlockStatement' || n.type === 'CatchClause' || n.type === 'ForStatement' || n.type === 'ForInStatement' || n.type === 'ForOfStatement' || n.type === 'ClassBody' || n.type === 'SwitchStatement';
const isFn = (n) => n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression';
// pass 1: declarations (var hoists to nearest function scope; let/const/class to nearest block)
walk.fullAncestor(ast, (node, _state, ancestors) => {
  const enclosing = (pred) => { for (let i = ancestors.length - 2; i >= 0; i--) if (pred(ancestors[i])) return ancestors[i]; return ast; };
  if (node.type === 'VariableDeclaration') {
    const target = node.kind === 'var' ? enclosing((a) => a.type === 'Program' || isFn(a)) : enclosing(isScope);
    for (const d of node.declarations) for (const n of patternNames(d.id)) addDecl(target, n);
  } else if (node.type === 'FunctionDeclaration') {
    addDecl(enclosing((a) => a.type === 'Program' || isFn(a) || a.type === 'BlockStatement'), node.id.name);
  } else if (node.type === 'ClassDeclaration') {
    addDecl(enclosing(isScope), node.id.name);
  } else if (node.type === 'ClassExpression' && node.id) {
    addDecl(node, node.id.name);
  }
  if (isFn(node)) {
    for (const p of node.params) for (const n of patternNames(p)) addDecl(node, n);
    if (node.type === 'FunctionExpression' && node.id) addDecl(node, node.id.name);
  }
  if (node.type === 'CatchClause' && node.param) {
    for (const n of patternNames(node.param)) addDecl(node, n);
  }
  if (node.type === 'ImportDeclaration') {
    for (const s of node.specifiers) addDecl(ast, s.local.name);
  }
});
// pass 2: references
walk.fullAncestor(ast, (node, _state, ancestors) => {
  if (node.type !== 'Identifier') return;
  const parent = ancestors[ancestors.length - 2];
  // skip non-reference positions
  if (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) return;
  if ((parent.type === 'Property' || parent.type === 'PropertyDefinition' || parent.type === 'MethodDefinition') && parent.key === node && !parent.computed && !parent.shorthand) return;
  if (parent.type === 'Property' && parent.shorthand && parent.value === node && ancestors[ancestors.length - 3]?.type === 'ObjectPattern') return;
  if ((parent.type === 'VariableDeclarator' && parent.id === node) || (parent.type === 'FunctionDeclaration' && parent.id === node) || (parent.type === 'ClassDeclaration' && parent.id === node) || (parent.type === 'FunctionExpression' && parent.id === node) || (parent.type === 'ClassExpression' && parent.id === node)) return;
  if (parent.type === 'LabeledStatement' || parent.type === 'BreakStatement' || parent.type === 'ContinueStatement') return;
  if (parent.type === 'ImportSpecifier' || parent.type === 'ImportDefaultSpecifier' || parent.type === 'ExportSpecifier') return;
  if (parent.type === 'CatchClause' && parent.param === node) return;
  if (isFn(parent) && parent.params.includes(node)) return;
  if (parent.type === 'AssignmentPattern' && parent.left === node) return;
  if ((parent.type === 'RestElement') && parent.argument === node && ancestors[ancestors.length - 3] && isFn(ancestors[ancestors.length - 3])) return;
  if (parent.type === 'MetaProperty') return;
  const name = node.name;
  for (let i = ancestors.length - 1; i >= 0; i--) { const s = scopeOf.get(ancestors[i]); if (s && s.has(name)) return; }
  if (BROWSER_GLOBALS.has(name)) return;
  if (!free.has(name)) free.set(name, []);
  free.get(name).push({ line: node.loc.start.line, col: node.loc.start.column });
});

// ---- definitions in the beautified bundle -----------------------------------
const pretty = readFileSync(PRETTY, 'utf8').split('\n');
const defIndex = new Map();
for (let i = 0; i < pretty.length; i++) {
  const l = pretty[i];
  let m = l.match(/^(?:class|function|async function)\s+([A-Za-z_$][\w$]*)/);
  if (m) { if (!defIndex.has(m[1])) defIndex.set(m[1], { line: i + 1, text: l.slice(0, 120) }); continue; }
  m = l.match(/^(?:var|let|const)\s+(.+)$/);
  if (m) {
    // comma chain names on this line (names before `=` or `,`)
    for (const part of m[1].split(',')) { const n = part.trim().match(/^([A-Za-z_$][\w$]*)/); if (n && !defIndex.has(n[1])) defIndex.set(n[1], { line: i + 1, text: l.slice(0, 120) }); }
    continue;
  }
  // continuation lines of a top-level var chain: "    NAME = ..." or "    NAME,"
  m = l.match(/^    ([A-Za-z_$][\w$]*)\s*(=|,|;)/);
  if (m && !defIndex.has(m[1]) && i > 0 && /^(var|let|const)\s|,$/.test(pretty[i - 1].trimEnd())) defIndex.set(m[1], { line: i + 1, text: l.slice(0, 120) });
}
// hoisted assignment inside an __esm wrapper: "    NAME = class NAME" or "    NAME = " at 4-space indent
const assignIndex = new Map();
for (let i = 0; i < pretty.length; i++) {
  const m = pretty[i].match(/^    ([A-Za-z_$][\w$]*) = (.{0,100})/);
  if (m && !assignIndex.has(m[1])) assignIndex.set(m[1], { line: i + 1, text: pretty[i].trim().slice(0, 120) });
}

const rows = [...free].map(([name, uses]) => {
  const def = defIndex.get(name) || null;
  const asg = assignIndex.get(name) || null;
  let kind = 'unknown';
  if (def && /= VA\(/.test(def.text)) kind = 'esm-init-wrapper';
  else if (def && /= DK\(/.test(def.text)) kind = 'cjs-wrapper';
  else if (def && def.text.startsWith('class ')) kind = 'class';
  else if (def && def.text.startsWith('function ')) kind = 'function';
  else if (def) kind = 'var';
  else if (asg && /= class /.test(asg.text)) kind = 'hoisted-class';
  return { name, uses: uses.length, first: uses[0], def, assigned: asg, kind };
}).sort((a, b) => (a.def?.line ?? 1e9) - (b.def?.line ?? 1e9));

console.log(`${rows.length} free identifier(s) in ${IN} (${ast.body.length} top-level statements)`);
const byKind = {}; for (const r of rows) byKind[r.kind] = (byKind[r.kind] || 0) + 1; console.log(byKind);
for (const r of rows) console.log(`${r.name.padEnd(4)} ${String(r.uses).padStart(4)}x  L${String(r.def?.line ?? r.assigned?.line ?? '?').padStart(5)} ${r.kind.padEnd(16)} ${(r.def?.text ?? r.assigned?.text ?? '').slice(0, 90)}`);
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify(rows, null, 1));
