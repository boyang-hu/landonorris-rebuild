/**
 * shell-config.port.mjs — strategy-A shells for the VERBATIM PORT (port/).
 *   node scripts/skill/build-site.mjs  --config scripts/shell-config.port.mjs --mirror mirror --out port/site
 *   node scripts/skill/verify-shell.mjs --config scripts/shell-config.port.mjs --mirror mirror --site port/site
 * The entry is two CLASSIC deferred scripts — the same loading mode as the source
 * `<script defer>` (deviation 6.20): the vendor alias prelude (port/vendor-globals.js bundled
 * to an IIFE by esbuild, see `npm run port:build`) and the sliced bundle itself. Deferred
 * classic scripts execute in document order, so the globals exist before the port runs.
 * No bundler touches the shells: a first attempt with Vite hoisted the module prelude AFTER
 * the deferred port (ReferenceError: cU) and re-encoded srcset %20 (6.12) — the port serves
 * port/site directly.
 */
import { makeShellConfig } from './lib/shell-common.mjs';

const cfg = makeShellConfig({
  entryTags: '<script defer src="/vendor-globals.js"></script><script defer src="/_gen/app.gen.js"></script>',
  entryDev: '6.20',
});
cfg.extras = [
  { from: 'port/_gen/app.gen.js', to: '_gen/app.gen.js' },
  { from: 'port/_build/vendor-globals.js', to: 'vendor-globals.js' }, // esbuild IIFE of port/vendor-globals.js
];
export default cfg;
