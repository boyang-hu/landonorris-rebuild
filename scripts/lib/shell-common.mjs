/**
 * lib/shell-common.mjs — the ONE registered transform table for this site's
 * strategy-A shells (dom-shell-strategies.md §2), shared by the port/ and src/
 * shell configs. Side-effect free: scripts/skill/build-site.mjs (producer) and
 * scripts/skill/verify-shell.mjs (gate) both import the config that imports this.
 *
 * Every transform here is a REBUILD_PLAN §6 deviation. Transform order is fixed by
 * lib/shell-build.mjs: T-LOCALIZE (built-in) → these → T-NOINDEX (built-in), so
 * T-ENTRY matches the already-localised bundle URL.
 */
export const PAGES = [
  { rel: 'index.html', route: '/' },
  { rel: 'calendar/index.html', route: '/calendar' },
  { rel: 'on-track/index.html', route: '/on-track' },
  { rel: 'off-track/index.html', route: '/off-track' },
  { rel: 'partnerships/index.html', route: '/partnerships' },
  { rel: 'legal/privacy-policy/index.html', route: '/legal/privacy-policy' },
  { rel: 'legal/terms-conditions/index.html', route: '/legal/terms-conditions' },
  { rel: '404.html', route: '/404' },
];

/** Mirrored external hosts (mirror/assets/<host>/), localised to /ext/<host>/. */
export const MIRRORED_EXT_HOSTS = [
  'cdn.prod.website-files.com',
  'lando.itsoffbrand.io',
  'assets.itsoffbrand.io',
  'd3e54v103j8qbb.cloudfront.net',
  'static.klaviyo.com',
  'cs.iubenda.com',
  'cdn.iubenda.com',
  'unpkg.com',
];

/** The source app bundle tag AFTER T-LOCALIZE has rewritten its host. */
export const APP_BUNDLE_TAG =
  /<script defer src="\/ext\/lando\.itsoffbrand\.io\/dev-js\/lando\.OFF\+BRAND\.gold-android-fix-03\.js"><\/script>/;

export const NOTICE =
  '<!--\n' +
  '  UNOFFICIAL STUDY REBUILD — not landonorris.com. Generated from a private forensic\n' +
  '  mirror (2026-08-10) for the sole purpose of studying its implementation (OFF+BRAND /\n' +
  '  Webflow / three.js / GSAP / Rive). Not affiliated with or endorsed by Lando Norris,\n' +
  '  McLaren or OFF+BRAND. All artwork, copy, fonts, likenesses and trade dress belong to\n' +
  '  their owners. Private, noindex.\n' +
  '-->\n';

/**
 * @param {{ entryTags: string, entryDev: string }} o  what replaces the bundle tag, and
 *        the §6 deviation that registers it (port: the verbatim classic-script port;
 *        src: the readable TypeScript entry).
 */
export function makeShellConfig({ entryTags, entryDev }) {
  return {
    pages: PAGES,
    originHosts: [],
    stubExtHosts: [],
    mirroredExtHosts: MIRRORED_EXT_HOSTS,
    notice: NOTICE,
    floors: {
      // measured on the pinned 2026-08-10 mirror (8 documents); a drop means the mirror
      // or the markup shape changed — check the mirror first (§2 step 3)
      'T-LOCALIZE': 1840,
      'T-GA': 24,
      'T-ENTRY': 8,
      'T-SRI': 32,
      'T-SVG': 1,
      'T-NOINDEX': 8,
    },
    transforms: [
      {
        id: 'T-GA',
        dev: '6.1 / 6.11',
        what: 'Webflow GA reverse-proxy blob loader + the two gtag inline scripts removed (telemetry is not site behaviour; a private rebuild must not report)',
        apply: (html, { bump }) =>
          html
            .replace(/<script async(?:="")? src="\/(?:nvhc|avljl)[^"]*"><\/script>/g, () => (bump(), ''))
            .replace(/<script>\(function\(w,i,g\)\{[^<]*google_tags_first_party[^<]*<\/script>/g, () => (bump(), ''))
            .replace(/<script type="text\/javascript">window\.dataLayer[^<]*gtag\('config'[^<]*<\/script>/g, () => (bump(), '')),
      },
      {
        id: 'T-ENTRY',
        dev: entryDev,
        what: 'the site\'s OFF+BRAND bundle tag -> our entry (this ONE replacement is the rebuild)',
        apply: (html, { bump }) => html.replace(APP_BUNDLE_TAG, () => (bump(), entryTags)),
      },
      {
        id: 'T-SRI',
        dev: '6.10',
        what: 'SRI integrity attributes dropped: the Webflow CSS/JS are served as /ext/ rewritten copies whose bytes no longer match the hashes (Chrome blocks them silently otherwise)',
        apply: (html, { bump }) => html.replace(/ integrity="[^"]*"/g, () => (bump(), '')),
      },
      {
        id: 'T-SVG',
        dev: '6.5',
        what: 'one malformed SVG attribute boundary on the home page (`"stroke=`, quirk Q5) given its space so parse5/Vite can parse; browser DOM is identical either way',
        apply: (html, { bump }) => html.replaceAll('"stroke="currentColor"', () => (bump(), '" stroke="currentColor"')),
      },
    ],
    purposeChecks: [
      { name: 'bundle tag gone', values: (mirrorHtml) => [(mirrorHtml.match(/<script defer src="https:\/\/lando\.itsoffbrand\.io\/dev-js\/lando\.OFF\+BRAND\.gold-android-fix-03\.js"><\/script>/) || [null])[0]].filter(Boolean).map((t) => t.replace('https://lando.itsoffbrand.io/', '/ext/lando.itsoffbrand.io/')) },
      { name: 'no SRI left', values: () => [' integrity="'] },
      { name: 'no GA first-party loader left', values: () => ['google_tags_first_party', "gtag('config'"] },
    ],
  };
}
