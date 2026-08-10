#!/usr/bin/env node
/**
 * Regression gate: probe every route on a target origin (rebuild dev by
 * default) across desktop + mobile, assert zero console/page/network errors.
 *
 *   node scripts/verify.mjs [--origin http://localhost:5180] [--shots]
 */
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : dflt;
};
const ORIGIN = flag('origin', 'http://localhost:5180');
const SHOTS = args.includes('--shots');

const ROUTES = [
  '/',
  '/calendar',
  '/on-track',
  '/off-track',
  '/partnerships',
  '/legal/privacy-policy',
  '/legal/terms-conditions',
];

let failures = 0;
const run = (route, mobile) => {
  const name = (route === '/' ? 'home' : route.slice(1).replace(/\//g, '-')) + (mobile ? '-mobile' : '');
  const probeArgs = ['scripts/probe.mjs', ORIGIN + route, '--wait', '12000', '--scroll', '0.5'];
  if (mobile) probeArgs.push('--mobile');
  if (SHOTS) probeArgs.push('--shot', `docs/compare/verify-${name}.png`);
  const res = spawnSync('node', probeArgs, { encoding: 'utf8', timeout: 180000 });
  const out = res.stdout + res.stderr;
  const clean = /RESULT: CLEAN/.test(out);
  // legal pages: iubenda badge css is a registered mirror-serving limitation (6.3)
  const onlyKnown =
    /RESULT: 1 problems/.test(out) && /iubenda/.test(out) && route.startsWith('/legal');
  if (clean || onlyKnown) console.log(`PASS ${name}${onlyKnown ? ' (known: iubenda badge)' : ''}`);
  else {
    failures++;
    console.log(`FAIL ${name}`);
    console.log(
      out
        .split('\n')
        .filter((l) => /HTTP |FAILED |\[error\]|\[network\]|\[security\]|RESULT/.test(l))
        .slice(0, 12)
        .join('\n')
    );
  }
};

for (const route of ROUTES) {
  run(route, false);
  run(route, true);
}
console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
