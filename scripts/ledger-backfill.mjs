#!/usr/bin/env node
/**
 * ledger-backfill.mjs — add the sha256 column + inventory.tsv to a mirror ledger
 * that predates them (this mirror was taken 2026-08-10 with the pre-v0.1.24
 * crawler, whose manifest recorded url -> {path, bytes, type} only).
 *
 * The BYTES are not touched (mirror is sacred). Only the ledger gains a
 * per-file sha256 computed from what is on disk, and inventory.tsv
 * (SHA256 BYTES PATH URL, same shape mirror-site.mjs writes) is derived from
 * the same rows — so scripts/skill/verify-mirror.mjs can audit it.
 *
 * Rows without a path (crawler-recorded failures / regex fragments) are kept
 * verbatim and listed, never dropped: the ledger must keep saying what was
 * attempted. Idempotent.
 *
 *   node scripts/ledger-backfill.mjs [--mirror legacy-mirror] [--check]
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const MIRROR = flag('mirror', 'legacy-mirror');
const CHECK = args.includes('--check');

const sha256 = (p) => new Promise((res, rej) => {
  const h = createHash('sha256');
  createReadStream(p).on('data', (c) => h.update(c)).on('end', () => res(h.digest('hex'))).on('error', rej);
});

const manifestPath = join(MIRROR, 'mirror-manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const rows = Object.entries(manifest.files);
const noPath = [], sizeDrift = [], inv = [];
let added = 0, kept = 0;
for (const [url, f] of rows) {
  if (!f.path) { noPath.push(url); continue; }
  const abs = join(MIRROR, f.path);
  const st = await stat(abs);
  if (typeof f.bytes === 'number' && f.bytes !== st.size) sizeDrift.push({ url, ledger: f.bytes, disk: st.size });
  const sha = await sha256(abs);
  if (f.sha256 && f.sha256 !== sha) {
    console.error(`sha256 DRIFT ${f.path}: ledger ${f.sha256} disk ${sha}`);
    process.exitCode = 1;
  }
  if (!f.sha256) { if (!CHECK) f.sha256 = sha; added++; } else kept++;
  inv.push([sha, st.size, f.path, url].join('\t'));
}
console.log(`${rows.length} rows: ${kept} already had sha256, ${added} ${CHECK ? 'missing' : 'added'}, ${noPath.length} without a file (kept):`);
for (const u of noPath) console.log('   no-file  ' + u);
if (sizeDrift.length) { console.log('BYTES DRIFT (ledger vs disk):'); console.log(sizeDrift); process.exitCode = 1; }
if (CHECK) { if (added) { console.log('FAIL: sha256 column incomplete — run without --check'); process.exitCode = 1; } }
else {
  manifest.ledger = { ...(manifest.ledger || {}), sha256BackfilledAt: '2026-08-20', by: 'scripts/ledger-backfill.mjs' };
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(join(MIRROR, 'inventory.tsv'), ['SHA256', 'BYTES', 'PATH', 'URL'].join('\t') + '\n' + inv.join('\n') + '\n');
  console.log(`wrote ${manifestPath} (+sha256) and ${join(MIRROR, 'inventory.tsv')} (${inv.length} rows)`);
}
