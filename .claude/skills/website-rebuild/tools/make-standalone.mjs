#!/usr/bin/env node
/**
 * make-standalone.mjs — give src/ everything it needs to run somewhere else.
 *
 * ⛔ The no-copy policy REVERSES at this stage. Through M(n) the mirror is the
 * one asset store and nothing duplicates it, because two copies of an asset is
 * two things that can disagree with the evidence. The deliverable has the
 * opposite requirement: copy src/ anywhere, run it, and the site comes up.
 *
 * ⚠ Copy what the built page REFERENCES, not the whole mirror. The mirror also
 * holds forensic material — the beautified bundles, the ledgers, the origin's
 * own bundle that this port replaces — and shipping those would put the thing
 * the port replaced right back next to it.
 *
 *   node tools/make-standalone.mjs --shell site/airpods-pro/index.html --out src
 */
import { readFile, writeFile, mkdir, cp, stat } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf("--" + n); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : d; };
const SHELL = path.resolve(flag("shell", "site/airpods-pro/index.html"));
const MIRROR = path.resolve(flag("mirror", "mirror"));
const OUT = path.resolve(flag("out", "src"));
// The origin bundle this port replaces. ⛔ It must not travel with the
// deliverable: shipping the thing you replaced next to its replacement makes
// "which one is running" a question the reader has to answer by experiment.
const REPLACED = flag("replaced", "");
const PUBLIC = path.join(OUT, "public");

let html = await readFile(SHELL, "utf8");

// ⛔ COPY FROM THE LEDGER, NOT FROM THE DOCUMENT. Scanning the document's own
// src/href/srcset finds what the HTML names — and misses everything a script
// requests at runtime. Measured: the document scan copied 491 files and the
// out-of-repo copy came up with 17 page errors while the in-repo build had 1.
// "It built" said nothing, exactly as the gate warns.
//
// The ledger is the authority on completeness (asset-management.md §2.2), so the
// deliverable takes every mirrored file except the forensic material — the
// beautified bundles, the ledgers themselves, and the origin bundle this port
// replaces, which must not travel back alongside its own replacement.
const EXCLUDE = [/^_pretty\//, /^mirror-manifest\.json$/, /^inventory\.tsv$/, /^netcapture\.tsv$/, /^redirects\.tsv$/, /^urlpath-policy\.json$/, /^external\.txt$/];

// The document's own references are still collected — not to decide what to
// copy, but to report what it names that the mirror does not have.
const refs = new Set();
for (const m of html.matchAll(/(?:src|href|content|data-[\w-]*)="(\/[^"?#]+)/g)) refs.add(m[1]);
for (const m of html.matchAll(/url\((["']?)(\/[^)"']+)/g)) refs.add(m[2]);
for (const m of html.matchAll(/(?:srcset|data-srcset)="([^"]+)"/g)) {
  for (const part of m[1].split(",")) {
    const u = part.trim().split(/\s+/)[0];
    if (u.startsWith("/")) refs.add(u.split("?")[0]);
  }
}

// --- copy the ledger ---------------------------------------------------------
const ledger = (await readFile(path.join(MIRROR, "inventory.tsv"), "utf8"))
  .split("\n").slice(1).filter(Boolean)
  .map((l) => l.split("\t")[2]).filter(Boolean);

let copied = 0, bytes = 0, skipped = 0;
for (const rel of ledger) {
  if (EXCLUDE.some((re) => re.test(rel))) { skipped++; continue; }
  if (rel === REPLACED.replace(/^\//, "")) { skipped++; continue; }
  const from = path.join(MIRROR, rel);
  const st = await stat(from).catch(() => null);
  if (!st || !st.isFile()) continue;
  const to = path.join(PUBLIC, rel);
  await mkdir(path.dirname(to), { recursive: true });
  await cp(from, to);
  copied++; bytes += st.size;
}

let missing = [];
for (const ref of refs) {
  if (ref.startsWith("/assets/js/")) continue;           // the port's own build
  // ⚠ A directory-style URL is a PAGE, not a missing file. `/at/airpods-pro/`
  // resolves to that directory's index.html the way the crawler stored it, and
  // treating it as absent reported 185 "missing" references that were mostly
  // the locale switcher's hreflang alternates.
  const candidates = ref.endsWith("/")
    ? [path.join(MIRROR, ref.replace(/^\//, ""), "index.html")]
    : [path.join(MIRROR, ref.replace(/^\//, "")), path.join(MIRROR, ref.replace(/^\//, ""), "index.html")];
  let from = null, st = null;
  for (const c of candidates) {
    const s2 = await stat(c).catch(() => null);
    if (s2 && s2.isFile()) { from = c; st = s2; break; }
  }
  if (!from) { missing.push(ref); continue; }
}

// The shell itself, with the port's bundle beside it.
await mkdir(PUBLIC, { recursive: true });
html = html.replace(/(<script\b[^>]*\bsrc=")\/assets\/js\/app\.js(")/, "$1./app.js$2");
await writeFile(path.join(PUBLIC, "index.html"), html);

await writeFile(path.join(OUT, "package.json"), JSON.stringify({
  name: "airpodspro-src",
  private: true,
  version: "1.0.0",
  type: "module",
  description: "Readable source for an unofficial study rebuild. Private, noindex, never deployed.",
  scripts: {
    build: "esbuild index.js --bundle --format=iife --outfile=public/app.js --external:@marcom/ac-analytics",
    // ⭐ The deliverable ships its own server. readable-source.md §2.4: without a
    // verification hook travelling with it, "it builds" is the whole of what can
    // be said about a copy — and building is not running.
    serve: "node serve.mjs --root public --port 6190",
  },
  devDependencies: { esbuild: "^0.25.0" },
}, null, 2) + "\n");

// The zero-dependency server travels with the deliverable, AND SO DOES THE
// DETERMINISM SHIM. ⛔ serve.mjs injects probe-shim.js for `?__probe` requests
// and looks for it beside itself; shipping the server without it produced a copy
// that served fine and could not be MEASURED — nine checkpoints of
// "window.__pump never appeared". A verification hook that travels half-way is
// a verification hook that does not travel (readable-source.md §2.4).
for (const f of ["serve.mjs", "probe-shim.js"]) await cp(path.resolve("scripts", f), path.join(OUT, f));
await cp(path.resolve("scripts/lib"), path.join(OUT, "lib"), { recursive: true });

console.log(`=== make-standalone ===`);
console.log(`  ${copied} file(s) copied into ${path.relative(process.cwd(), PUBLIC)}  (${(bytes / 1048576).toFixed(1)} MB)`);
console.log(`  ${skipped} ledger row(s) skipped: forensic material${REPLACED ? " + the replaced origin bundle" : ""}`);
// ⛔ One undifferentiated "missing" list is unusable. The classes have different
// meanings and only one of them is a defect:
//   • a PAGE outside the declared scope is expected — the scope is a declared
//     boundary, and a link crossing it is a link, not a hole;
//   • an ASSET with no file is a real hole in the deliverable.
// ⚠ `.html` is a page, extension or not. Testing only "has no extension" filed
// a registered out-of-scope PAGE under missing ASSETS and produced a FAIL that
// was really a naming mistake in the classifier.
const isPage = (r) => r.endsWith("/") || /\.x?html?$/i.test(r) || !/\.[a-z0-9]{2,5}$/i.test(r);
const pages = missing.filter(isPage);
const assets = missing.filter((r) => !isPage(r));
if (pages.length) {
  console.log(`\n  ⚠ ${pages.length} PAGE link(s) point outside the mirrored scope (locale alternates,`);
  console.log(`    site-wide nav, query-parameterised endpoints stored under encoded names).`);
  console.log(`    Expected — but the scope they fall outside of must be stated in the plan:`);
  for (const m of pages.slice(0, 5)) console.log(`      ${m}`);
  if (pages.length > 5) console.log(`      … ${pages.length - 5} more`);
}
if (assets.length) {
  console.log(`\n  FAIL ${assets.length} ASSET(s) referenced with no file in the mirror. Unlike a page`);
  console.log(`    link, this is a hole in the deliverable — it will 404 wherever this is copied:`);
  for (const m of assets.slice(0, 10)) console.log(`      ${m}`);
}
console.log(assets.length ? `\n  FAIL — ${assets.length} asset(s) missing.` : `\n  ok   every referenced ASSET is present.`);
console.log(`\n  ⚠ This copies what the DOCUMENT references. Assets a script builds at runtime`);
console.log(`    are invisible to it — walk the built copy with a probe before believing it.`);
