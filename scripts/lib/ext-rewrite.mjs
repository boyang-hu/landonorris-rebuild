/**
 * lib/ext-rewrite.mjs — the ONE implementation of "absolute external-host URL
 * -> /ext/<host>/..." for the build side, shared by gen-shells.mjs (HTML shells)
 * and postbuild.mjs (text assets materialised into dist/ext). Its spelling set
 * is the EXT_HOSTS half of scripts/skill/serve.mjs rewrite(), so the static
 * build localises exactly what the mirror's response layer localises
 * (verification-gates.md §2.1.1: logic that must agree in two places is
 * written once). Deviation 6.2 / 6.4.
 *
 * Spellings, per host h:
 *   https://h/  http://h/            -> /ext/h/
 *   https:\/\/h\/  \/\/h\/           -> \/ext\/h\/        (JSON-escaped)
 *   https://h/        -> /ext/h/
 *   //h/  (.html/.css only)          -> /ext/h/            (inside JS it is often
 *                                                           concatenated with "https:")
 *   https://h  (bare host constant)  -> /ext/h             (preconnect/dns-prefetch
 *                                                           href, JS base literals)
 */
export const EXT_HOSTS = [
  'cdn.prod.website-files.com',
  'lando.itsoffbrand.io',
  'assets.itsoffbrand.io',
  'd3e54v103j8qbb.cloudfront.net',
  'static.klaviyo.com',
  'cs.iubenda.com',
  'cdn.iubenda.com',
  'unpkg.com',
];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const U = '\\u002F';
const U_RE = '\\\\u002F';

export function rewriteExt(text, ext, hosts = EXT_HOSTS) {
  for (const h of hosts) {
    const to = `/ext/${h}`;
    text = text.replaceAll(`https://${h}/`, `${to}/`).replaceAll(`http://${h}/`, `${to}/`);
    text = text
      .replaceAll(`https:\\/\\/${h}\\/`, `\\/ext\\/${h}\\/`)
      .replaceAll(`http:\\/\\/${h}\\/`, `\\/ext\\/${h}\\/`)
      .replaceAll(`\\/\\/${h}\\/`, `\\/ext\\/${h}\\/`);
    const toU = to.replace(/\//g, U);
    text = text
      .replace(new RegExp(`https?:${U_RE}${U_RE}${esc(h)}${U_RE}`, 'gi'), `${toU}${U}`)
      .replace(new RegExp(`https?:${U_RE}${U_RE}${esc(h)}(?!${U_RE})`, 'gi'), toU);
    if (ext === '.html' || ext === '.css') text = text.replaceAll(`//${h}/`, `${to}/`);
    text = text.replace(new RegExp(`https?://${esc(h)}(?![\\w.-])`, 'g'), to);
  }
  return text;
}
