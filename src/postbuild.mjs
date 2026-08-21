#!/usr/bin/env node
/**
 * src/postbuild.mjs — normalise the Vite output into the origin's URL space.
 *  1. dist/site/* -> dist/*  (pages were built from site/ so routes keep their paths)
 *  2. Vite's HTML asset pass re-percent-encodes srcset URLs (%20 -> %2520); the shells contain
 *     no %2520, so a blanket restore is an exact parity fix (REBUILD_PLAN deviation 6.12).
 * Assets under public/ext and public/images are copied by Vite itself (self-contained build).
 */
import { rename, rm, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const DIST = new URL('./dist/', import.meta.url).pathname;
const SITE = join(DIST, 'site');
if (existsSync(SITE)) {
  for (const entry of await readdir(SITE)) {
    const target = join(DIST, entry);
    await rm(target, { recursive: true, force: true });
    await rename(join(SITE, entry), target);
  }
  await rm(SITE, { recursive: true, force: true });
}
let fixed = 0;
async function fixDoubleEncoding(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'ext') await fixDoubleEncoding(p); }
    else if (entry.name.endsWith('.html')) {
      const html = await readFile(p, 'utf8');
      if (html.includes('%2520')) { await writeFile(p, html.replaceAll('%2520', '%20')); fixed++; }
    }
  }
}
await fixDoubleEncoding(DIST);
console.log(`postbuild: dist/ normalised (site/ lifted, %2520 restored in ${fixed} page(s))`);
