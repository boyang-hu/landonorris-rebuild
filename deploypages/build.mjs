#!/usr/bin/env node
/**
 * deploypages/build.mjs — turn the self-contained build (../src/dist) into a Cloudflare
 * Pages upload directory (./site). Pages-specific adaptations, each one explained:
 *
 *  1. CLEAN-URL PARITY. Pages redirects `/calendar` -> `/calendar/` (308) when only
 *     calendar/index.html exists. The origin (Webflow) answers `/calendar` with 200 and the
 *     taxi router fetches that exact URL on every navigation, so a redirect is a behaviour
 *     difference. Writing `calendar.html` next to `calendar/index.html` makes Pages serve
 *     both spellings with 200 and no redirect (same for nested legal/* pages).
 *  2. `_headers` (noindex, HSTS, nosniff, long cache for /ext and /assets) copied in.
 *  3. 404.html stays at the root: Pages serves it with HTTP 404 for unknown paths,
 *     i.e. the origin's Webflow semantics.
 * Everything else is byte-identical to ../src/dist (which is what the gates certified).
 *
 *   node build.mjs          (from deploypages/)
 */
import { cp, rm, mkdir, readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'src', 'dist');
const SITE = join(HERE, 'site');

if (!existsSync(join(DIST, 'index.html')) || !existsSync(join(DIST, 'ext'))) {
  console.error('FATAL: ../src/dist is missing or incomplete — run `npm run build` at the repository root first (after `npm run assets:restore`).');
  process.exit(2);
}
await rm(SITE, { recursive: true, force: true });
await mkdir(SITE, { recursive: true });
await cp(DIST, SITE, { recursive: true });

// 1. clean-url parity: <route>/index.html -> also <route>.html
let mirrored = 0;
async function walk(rel) {
  for (const e of await readdir(join(SITE, rel), { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) { if (!['ext', 'assets', 'images'].includes(r)) await walk(r); continue; }
    if (e.name === 'index.html' && rel) {
      await writeFile(join(SITE, `${rel}.html`), await readFile(join(SITE, r)));
      mirrored++;
    }
  }
}
await walk('');

// 2. headers
await cp(join(HERE, '_headers'), join(SITE, '_headers'));

// census + limits (Pages: 20,000 files, 25 MiB per file)
let files = 0, bytes = 0, tooBig = [];
async function census(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { await census(p); continue; }
    const s = await stat(p); files++; bytes += s.size;
    if (s.size > 25 * 1024 * 1024) tooBig.push(p);
  }
}
await census(SITE);
if (files > 20000 || tooBig.length) { console.error(`FATAL: Pages limits exceeded — ${files} files, ${tooBig.length} over 25 MiB`); process.exit(1); }
console.log(`deploypages/site ready: ${files} files, ${(bytes / 1048576).toFixed(1)} MB, ${mirrored} clean-URL twins (route.html), _headers + 404.html in place`);
