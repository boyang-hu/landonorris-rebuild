#!/usr/bin/env node
/**
 * Generate rebuild page shells from the legacy mirror.
 *
 * The Webflow-generated DOM/CSS is the byte-level spec (README §methodology),
 * so shells are the mirrored HTML with exactly three owned transforms:
 *   1. telemetry stripped (Webflow GA reverse-proxy blobs + gtag inline)     — deviation 6.1
 *   2. external asset hosts rewritten to local /ext/<host>/ paths           — deviation 6.2
 *   3. the OFF+BRAND app bundle replaced by our module entry (src/app)      — the rebuild itself
 *
 * Everything else — including commented-out historical script blocks (Q1) —
 * is preserved verbatim.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const MIRROR = join(ROOT, 'legacy-mirror');
const OUT = join(ROOT, 'shells');

const PAGES = [
  'index.html',
  'calendar/index.html',
  'on-track/index.html',
  'off-track/index.html',
  'partnerships/index.html',
  'legal/privacy-policy/index.html',
  'legal/terms-conditions/index.html',
  '404.html',
];

const EXT_HOSTS = [
  'cdn.prod.website-files.com',
  'lando.itsoffbrand.io',
  'assets.itsoffbrand.io',
  'd3e54v103j8qbb.cloudfront.net',
  'static.klaviyo.com',
  'cs.iubenda.com',
  'cdn.iubenda.com',
  'unpkg.com',
];

const APP_BUNDLE_TAG =
  /<script defer src="https:\/\/lando\.itsoffbrand\.io\/dev-js\/lando\.OFF\+BRAND\.gold-android-fix-03\.js"><\/script>/;

function transform(html) {
  const original = html;

  // 1. telemetry: GA proxy blob loaders + the two gtag inline scripts.
  html = html
    .replace(/<script async(?:="")? src="\/(?:nvhc|avljl)[^"]*"><\/script>/g, '')
    .replace(/<script>\(function\(w,i,g\)\{[^<]*google_tags_first_party[^<]*<\/script>/g, '')
    .replace(/<script type="text\/javascript">window\.dataLayer[^<]*gtag\('config'[^<]*<\/script>/g, '');

  // 3. our entry replaces the active OFF+BRAND bundle (must exist on every page).
  if (!APP_BUNDLE_TAG.test(html)) throw new Error('active OFF+BRAND bundle tag not found');
  html = html.replace(APP_BUNDLE_TAG, '<script type="module" src="/src/app/main.ts"></script>');

  // 2. local asset routing. Absolute https:// URLs everywhere; the protocol-
  // relative form only appears in markup (see serve.mjs note on JS concat).
  for (const h of EXT_HOSTS) {
    html = html
      .replaceAll(`https://${h}/`, `/ext/${h}/`)
      .replaceAll(`http://${h}/`, `/ext/${h}/`)
      .replaceAll(`//${h}/`, `/ext/${h}/`);
  }

  // 4. DOM-equivalent normalization (deviation 6.5): the source home page has one
  // malformed SVG attribute boundary (`..."stroke="currentColor"`, quirk Q5) that
  // browsers error-recover but Vite's parse5 rejects. Single enumerated fix-up;
  // browser DOM is identical either way.
  html = html.replaceAll('"stroke="currentColor"', '" stroke="currentColor"');

  if (html === original) throw new Error('no transforms applied — mirror layout changed?');
  return html;
}

for (const page of PAGES) {
  const src = await readFile(join(MIRROR, page), 'utf8');
  const out = join(OUT, page);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, transform(src));
  console.log('shell:', page);
}
console.log('done');
