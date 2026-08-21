#!/usr/bin/env node
/**
 * ledger-reconcile.mjs — the three ledger decisions verify-mirror.mjs demanded
 * of this mirror on 2026-08-20 (see REBUILD_PLAN §6.13 and docs/mirror-audit.md).
 * Bytes are never touched. Idempotent; run BEFORE ledger-backfill.mjs.
 *
 *  1. ALIAS ROWS. The 2026-08-10 crawler recorded two URL spellings for one
 *     resource three times (percent-encoding variant, query-less regex
 *     truncation). Live re-fetch proved the pairs byte-identical to disk for
 *     MonaSans (%2C vs ,) and jQuery (?site= vs bare); klaviyo's bare URL is
 *     referenced by no file (regex artefact). The non-canonical row moves from
 *     `files` to `aliases`, so the ledger still names the URL but no disk file
 *     is claimed by two URLs (injectivity).
 *  2. QUERY POLICY. urlpath-policy.json records `ignore: ["site"]` — Webflow's
 *     jQuery `?site=` is a cache key (two fetches, same sha256). `company_id`
 *     is NOT ignored: klaviyo serves different bytes per company (measured
 *     6243 B vs 863 B), so the klaviyo row moves to the query-aware path the
 *     mapping chooses (file renamed, bytes + sha256 unchanged) instead of
 *     lying in the policy.
 *
 *   node scripts/ledger-reconcile.mjs [--mirror legacy-mirror]
 */
import { readFile, writeFile, rename, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { localRelPath, loadPolicy, savePolicy, normalizePolicy } from './skill/lib/urlpath.mjs';

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const MIRROR = flag('mirror', 'legacy-mirror');
const ORIGIN_HOST = 'landonorris.com';

const ALIASES = {
  // alias (drop from files)  ->  canonical (keeps the disk file)
  'https://cdn.prod.website-files.com/67b5a02dc5d338960b17a7e9/67bc6274c5b4108b123aa4d5_MonaSans-VariableFont_wdth%2Cwght.woff2':
    'https://cdn.prod.website-files.com/67b5a02dc5d338960b17a7e9/67bc6274c5b4108b123aa4d5_MonaSans-VariableFont_wdth,wght.woff2',
  'https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js':
    'https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=67b5a02dc5d338960b17a7e9',
  'https://static.klaviyo.com/onsite/js/klaviyo.js':
    'https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=XWvzdS',
};
const POLICY = { ignore: ['site'], only: null };

const manifestPath = join(MIRROR, 'mirror-manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
manifest.aliases ??= {};
let changed = 0;

for (const [alias, canon] of Object.entries(ALIASES)) {
  const a = manifest.files[alias], c = manifest.files[canon];
  if (!c) throw new Error(`canonical row missing: ${canon}`);
  if (a) {
    if (a.path !== c.path) throw new Error(`alias ${alias} does not share a path with its canonical row`);
    delete manifest.files[alias];
    manifest.aliases[alias] = { canonical: canon, bytesIdentical: true, provenance: 'live re-fetch 2026-08-20 sha256 == disk (klaviyo: bare URL referenced by no mirrored file)' };
    changed++; console.log(`alias    ${alias}\n      -> ${canon}`);
  }
}

// query policy (written once; loadPolicy returns default when absent)
const cur = await loadPolicy(MIRROR);
if (JSON.stringify(cur) !== JSON.stringify(normalizePolicy(POLICY))) {
  await savePolicy(MIRROR, POLICY); changed++; console.log('policy   urlpath-policy.json written:', JSON.stringify(POLICY));
}
const policy = await loadPolicy(MIRROR);

// path migration: any row whose file sits where the CURRENT mapping would not look
for (const [url, f] of Object.entries(manifest.files)) {
  if (!f.path || f.path === '404.html') continue;
  const want = localRelPath(url, ORIGIN_HOST, policy);
  if (want === f.path) continue;
  const from = join(MIRROR, f.path), to = join(MIRROR, want);
  await stat(from);
  await rename(from, to);
  console.log(`migrate  ${f.path}\n      -> ${want}  (${url})`);
  f.migrated = { from: f.path, on: '2026-08-20', reason: 'mapping drift: file placed by the pathname-only 2026-08-10 crawler; bytes unchanged' };
  f.path = want;
  changed++;
}

if (changed) { await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n'); console.log(`reconciled: ${changed} change(s) written to ${manifestPath}`); }
else console.log('nothing to do — ledger already reconciled');
