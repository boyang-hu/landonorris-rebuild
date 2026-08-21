#!/usr/bin/env node
/**
 * Post-build: lift the shells/ prefix out of dist/ so the output tree matches
 * the origin URL space, and link mirrored external assets at dist/ext/.
 *
 * dist/ext: binaries are per-file symlinks into mirror/assets (heavy
 * assets single-copy, deviation 6.4), text assets are rewritten copies. Deploy
 * by dereferencing (rsync -L / cp -RL).
 */
import { rename, rm, symlink, readdir, readFile, writeFile, cp, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { rewriteExt } from './lib/ext-rewrite.mjs';
import { existsSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');
const SHELLS = join(DIST, 'shells');

if (existsSync(SHELLS)) {
  for (const entry of await readdir(SHELLS)) {
    const target = join(DIST, entry);
    await rm(target, { recursive: true, force: true });
    await rename(join(SHELLS, entry), target);
  }
  await rm(SHELLS, { recursive: true, force: true });
}

// Vite's build HTML pass re-percent-encodes srcset URLs (%20 -> %2520), which
// breaks files whose names contain spaces. The shells contain no %2520, so a
// blanket restore is an exact parity fix.
async function fixDoubleEncoding(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) await fixDoubleEncoding(p);
    else if (entry.name.endsWith('.html')) {
      const html = await readFile(p, 'utf8');
      if (html.includes('%2520')) await writeFile(p, html.replaceAll('%2520', '%20'));
    }
  }
}
await fixDoubleEncoding(DIST);

// iubenda's badge script resolves its icons against the page origin (see
// serve.mjs note); bake the mirrored icons into dist so static hosting needs
// no rewrite rule.
const iubendaIcons = join(ROOT, 'mirror', 'assets', 'cdn.iubenda.com', 'images');
if (existsSync(iubendaIcons)) await cp(iubendaIcons, join(DIST, 'images'), { recursive: true });

// dist/ext (deviation 6.4, revised 2026-08-20): a REAL directory tree whose
// binaries are per-file symlinks into mirror/assets (heavy bytes stay
// single-copy; deploy with rsync -L) and whose text assets (css/js/json/svg...)
// are copies passed through the same /ext/<host>/ rewriter as the shells.
// A plain symlink served the pristine Webflow CSS, whose absolute
// cdn.prod.website-files.com font/image urls made every static deployment
// fetch fonts from the live CDN (zero-outbound gate, probe --no-external:
// 3 CSS-initiated external requests per page; the fonts then raced the load
// event and SplitText warned 34x "called before fonts loaded").
const SRC = join(ROOT, 'mirror', 'assets');
const EXT = join(DIST, 'ext');
const TEXT = new Set(['.css', '.js', '.mjs', '.json', '.svg', '.html', '.txt', '.xml']);
await rm(EXT, { recursive: true, force: true });
let linked = 0, rewritten = 0;
async function materialize(rel) {
  await mkdir(join(EXT, rel), { recursive: true });
  for (const e of await readdir(join(SRC, rel), { withFileTypes: true })) {
    const r = join(rel, e.name);
    if (e.isDirectory()) { await materialize(r); continue; }
    const ext = extname(e.name).toLowerCase();
    if (TEXT.has(ext)) {
      const t = await readFile(join(SRC, r), 'utf8');
      const o = rewriteExt(t, ext);
      if (o !== t) { await writeFile(join(EXT, r), o); rewritten++; continue; }
    }
    await symlink(join(SRC, r), join(EXT, r));
    linked++;
  }
}
await materialize('');
console.log(`postbuild: dist/ tree normalized, dist/ext materialized (${linked} symlinks, ${rewritten} rewritten text files)`);
