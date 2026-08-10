#!/usr/bin/env node
/**
 * Mirror landonorris.com into legacy-mirror/.
 *
 * - Crawls all same-origin pages starting from "/".
 * - Saves pages as legacy-mirror/<path>/index.html.
 * - Scans every fetched text file (html/css/js) for asset URLs on a host
 *   whitelist and downloads them under legacy-mirror/assets/<host>/<path>,
 *   repeating until no new URLs appear (CSS fonts, JS-referenced .riv, etc.).
 * - Writes legacy-mirror/mirror-manifest.json (url -> local path, size, type).
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const ORIGIN = 'https://landonorris.com';
const OUT = new URL('../legacy-mirror/', import.meta.url).pathname;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const ASSET_HOSTS = new Set([
  'cdn.prod.website-files.com',
  'lando.itsoffbrand.io',
  'assets.itsoffbrand.io',
  'd3e54v103j8qbb.cloudfront.net',
  'static.klaviyo.com',
  'cs.iubenda.com',
  'cdn.iubenda.com',
  'unpkg.com',
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
]);

const TEXT_EXT = /\.(css|js|mjs|json|svg|html?)($|\?)/i;
const manifest = {};
const fetched = new Set();

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#38;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"');
}

function localPathFor(url) {
  const u = new URL(url);
  let path = decodeURIComponent(u.pathname);
  if (u.hostname === 'landonorris.com') {
    if (path === '/' || path === '') return join(OUT, 'index.html');
    return join(OUT, path, 'index.html');
  }
  if (path.endsWith('/')) path += 'index';
  return join(OUT, 'assets', u.hostname, path);
}

async function save(url, buf, contentType) {
  const p = localPathFor(url);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, buf);
  manifest[url] = {
    path: p.slice(OUT.length),
    bytes: buf.length,
    type: contentType || '',
  };
}

async function get(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, accept: '*/*' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { buf, type: res.headers.get('content-type') || '' };
}

function extractAssetUrls(text, baseUrl) {
  const urls = new Set();
  const abs = text.matchAll(/https?:\/\/[a-z0-9.-]+\/[^\s"'`\\<>{}|^\][]+/gi);
  for (const m of abs) {
    let u = decodeEntities(m[0]).replace(/[),.;:!]+$/, '');
    try {
      const h = new URL(u).hostname;
      if (ASSET_HOSTS.has(h)) urls.add(u);
    } catch {}
  }
  // protocol-relative (//host/path)
  for (const m of text.matchAll(/["'(]\/\/([a-z0-9.-]+\/[^\s"')<>]+)/gi)) {
    const u = 'https://' + decodeEntities(m[1]);
    try {
      if (ASSET_HOSTS.has(new URL(u).hostname)) urls.add(u);
    } catch {}
  }
  // relative url(...) inside CSS
  if (baseUrl && /\.css($|\?)/i.test(baseUrl)) {
    for (const m of text.matchAll(/url\(\s*['"]?(?!data:|https?:|\/\/)([^'")]+)['"]?\s*\)/gi)) {
      try {
        const u = new URL(m[1], baseUrl).href;
        if (ASSET_HOSTS.has(new URL(u).hostname)) urls.add(u);
      } catch {}
    }
  }
  return urls;
}

function extractPageLinks(html) {
  const pages = new Set();
  for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    const p = m[1];
    if (/\.(css|js|png|jpg|webp|svg|ico|xml|txt|woff2?)$/i.test(p)) continue;
    if (p.startsWith('/nvhc') || p.startsWith('/avljl')) continue; // GA proxy blobs
    pages.add(p.replace(/\/$/, '') || '/');
  }
  return pages;
}

const pageQueue = ['/', '/404-page-not-found'];
const pagesDone = new Set();
let assetQueue = new Set();

// --- crawl pages ---
while (pageQueue.length) {
  const path = pageQueue.shift();
  if (pagesDone.has(path)) continue;
  pagesDone.add(path);
  const url = ORIGIN + (path === '/' ? '/' : path);
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA } });
    const buf = Buffer.from(await res.arrayBuffer());
    const html = buf.toString('utf8');
    const isNotFoundProbe = path === '/404-page-not-found';
    if (isNotFoundProbe) {
      await mkdir(OUT, { recursive: true });
      await writeFile(join(OUT, '404.html'), buf);
      manifest[url] = { path: '404.html', bytes: buf.length, type: 'text/html (404 template)' };
    } else {
      await save(url, buf, res.headers.get('content-type'));
    }
    console.log(`[page] ${path} (${buf.length}b${res.ok ? '' : `, HTTP ${res.status}`})`);
    for (const u of extractAssetUrls(html, url)) assetQueue.add(u);
    if (!isNotFoundProbe) {
      for (const p of extractPageLinks(html)) if (!pagesDone.has(p)) pageQueue.push(p);
    }
  } catch (e) {
    console.error(`[page FAIL] ${path}: ${e.message}`);
  }
}

// --- download assets, rescanning text assets until fixpoint ---
for (let round = 1; round <= 4 && assetQueue.size; round++) {
  const batch = [...assetQueue].filter((u) => !fetched.has(u));
  assetQueue = new Set();
  console.log(`--- asset round ${round}: ${batch.length} urls ---`);
  let i = 0;
  const workers = Array.from({ length: 8 }, async () => {
    while (i < batch.length) {
      const url = batch[i++];
      if (fetched.has(url)) continue;
      fetched.add(url);
      try {
        const { buf, type } = await get(url);
        await save(url, buf, type);
        console.log(`[asset] ${url.slice(0, 110)} (${buf.length}b)`);
        if (TEXT_EXT.test(url) || /text|javascript|json|css/.test(type)) {
          for (const u of extractAssetUrls(buf.toString('utf8'), url))
            if (!fetched.has(u)) assetQueue.add(u);
        }
      } catch (e) {
        console.error(`[asset FAIL] ${url}: ${e.message}`);
        manifest[url] = { path: null, error: e.message };
      }
    }
  });
  await Promise.all(workers);
}

await writeFile(
  join(OUT, 'mirror-manifest.json'),
  JSON.stringify({ origin: ORIGIN, mirroredAt: new Date().toISOString(), files: manifest }, null, 2)
);
const ok = Object.values(manifest).filter((f) => f.path).length;
const fail = Object.values(manifest).filter((f) => !f.path).length;
console.log(`\nDone: ${ok} files saved, ${fail} failed. Manifest written.`);
