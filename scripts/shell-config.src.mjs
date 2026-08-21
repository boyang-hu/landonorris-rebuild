/**
 * shell-config.src.mjs — strategy-A shells for the READABLE SOURCE (src/).
 *   node scripts/skill/build-site.mjs  --config scripts/shell-config.src.mjs --mirror mirror --out src/site
 *   node scripts/skill/verify-shell.mjs --config scripts/shell-config.src.mjs --mirror mirror --site src/site
 * Same table as the port; only the entry differs (deviation 6.2 / M2).
 */
import { makeShellConfig } from './lib/shell-common.mjs';

export default makeShellConfig({
  entryTags: '<script type="module" src="/app/main.ts"></script>',
  entryDev: 'M2 entry swap (REBUILD_PLAN §1 M2)',
});
