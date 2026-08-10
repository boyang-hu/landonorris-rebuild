#!/usr/bin/env node
/**
 * Post-build: lift the shells/ prefix out of dist/ so the output tree matches
 * the origin URL space, and link mirrored external assets at dist/ext/.
 *
 * dist/ext is a symlink (not a copy): heavy assets live only in legacy-mirror
 * (deviation 6.4, same policy as careers-kimi's public/ symlink). Deploy by
 * dereferencing (rsync -L / cp -RL).
 */
import { rename, rm, symlink, readdir, mkdir } from 'node:fs/promises';
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

const ext = join(DIST, 'ext');
await rm(ext, { recursive: true, force: true });
await symlink(join(ROOT, 'legacy-mirror', 'assets'), ext, 'dir');
console.log('postbuild: dist/ tree normalized, dist/ext -> legacy-mirror/assets');
