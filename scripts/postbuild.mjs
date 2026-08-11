#!/usr/bin/env node
/**
 * Post-build: lift the shells/ prefix out of dist/ so the output tree matches
 * the origin URL space, and link mirrored external assets at dist/ext/.
 *
 * dist/ext is a symlink (not a copy): heavy assets live only in legacy-mirror
 * (deviation 6.4, same policy as careers-kimi's public/ symlink). Deploy by
 * dereferencing (rsync -L / cp -RL).
 */
import { rename, rm, symlink, readdir, readFile, writeFile, cp } from 'node:fs/promises';
import { join } from 'node:path';
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
const iubendaIcons = join(ROOT, 'legacy-mirror', 'assets', 'cdn.iubenda.com', 'images');
if (existsSync(iubendaIcons)) await cp(iubendaIcons, join(DIST, 'images'), { recursive: true });

const ext = join(DIST, 'ext');
await rm(ext, { recursive: true, force: true });
await symlink(join(ROOT, 'legacy-mirror', 'assets'), ext, 'dir');
console.log('postbuild: dist/ tree normalized, dist/ext -> legacy-mirror/assets');
