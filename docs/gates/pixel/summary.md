# pixel gate — 2026-08-21 — target src (/Users/boyang/Documents/GitHub/landonorris-rebuild/src/dist)

Quantified A/B pixel gate (scripts/skill/pixelcompare.mjs, 64×40 grid luma metric, 1280×800 desktop / 390×844 mobile, PNG) under the determinism shim (probe-shim.js via ?__probe on both serve.mjs sides; pump 16.7,240 = dt,frames; scroll applied at load and at +1500 ms virtual; state clicks at +1200 ms virtual). **29/29 cells PASS.** Per cell: 4 self-band sessions per side, interleaved mirror/rebuild, then one cross-side run; tolerance = max(self band of both sides) + 0.5 — fixed before any cross-side number. Non-empty-frame precondition: ≥ 100 colours on both frames.

| cell | self band mirror (4) | self band rebuild (4) | band | cross meanAbsDiff | worst cell | similarity | verdict |
|---|---|---|---|---|---|---|---|
| desktop-home-000 | 0 / 0 / 0 / 5.38 | 0 / 5.38 / 0 / 3.66 | 5.38 | 3.66 | 165 @37,20 | 98.6% | PASS |
| desktop-home-017 | 0.01 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | 0.01 | 0 | 0 | 100% | PASS |
| desktop-home-033 | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0.01 | 0.01 | 0.01 | 1 @14,23 | 100% | PASS |
| desktop-home-050 | 0 / 0.03 / 0 / 0.03 | 0.03 / 0.03 / 0 / 0.03 | 0.03 | 0 | 0 | 100% | PASS |
| desktop-home-067 | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | 0 | 0 | 0 | 100% | PASS |
| desktop-home-083 | 0.01 / 0 / 0.01 / 0 | 0 / 0.01 / 0.3 / 0.01 | 0.3 | 0.01 | 1 @44,1 | 100% | PASS |
| desktop-home-100 | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | 0 | 0 | 0 | 100% | PASS |
| desktop-home-000-menu-open | 0 / 0 / 0 / 0.01 | 0.02 / 0 / 0 / 0 | 0.02 | 0 | 0.7 @5,25 | 100% | PASS |
| desktop-calendar-000 | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | 0 | 0 | 0.3 @28,35 | 100% | PASS |
| desktop-calendar-033 | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | 0 | 0 | 0 | 100% | PASS |
| desktop-calendar-067 | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | 0 | 0 | 0 | 100% | PASS |
| desktop-calendar-100 | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | 0 | 0 | 0 | 100% | PASS |
| desktop-on-track-000 | 0 / 0.01 / 0 / 0.02 | 0.01 / 0.01 / 0.01 / 0 | 0.02 | 0 | 0.7 @51,35 | 100% | PASS |
| desktop-on-track-025 | 0.02 / 0 / 0.02 / 0 | 0 / 0.02 / 0 / 0 | 0.02 | 0 | 0 | 100% | PASS |
| desktop-on-track-050 | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0.02 | 0.02 | 0 | 0 | 100% | PASS |
| desktop-on-track-075 | 0.04 / 0 / 0 / 0 | 0 / 0.04 / 0 / 0.04 | 0.04 | 0 | 0 | 100% | PASS |
| desktop-on-track-100 | 0.1 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | 0.1 | 0 | 0 | 100% | PASS |
| desktop-off-track-000 | 0 / 0.13 / 0 / 0 | 0.13 / 0 / 0 / 0 | 0.13 | 0.13 | 17 @12,38 | 100% | PASS |
| desktop-off-track-033 | 0 / 0 / 0.02 / 0 | 0 / 0.03 / 0.03 / 0.02 | 0.03 | 0.03 | 1 @35,31 | 100% | PASS |
| desktop-off-track-067 | 0.02 / 0.04 / 0.02 / 0.01 | 0.01 / 0.04 / 0.01 / 0.01 | 0.04 | 0 | 0 | 100% | PASS |
| desktop-off-track-100 | 0.09 / 0 / 0 / 0 | 0 / 0 / 0 / 0.09 | 0.09 | 0 | 0 | 100% | PASS |
| desktop-partnerships-000 | 0.54 / 0 / 0 / 0 | 0 / 0.54 / 0 / 0 | 0.54 | 0 | 0 | 100% | PASS |
| desktop-partnerships-000-variant-dark | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0.68 | 0.68 | 0 | 0 | 100% | PASS |
| mobile-home-000 | 2.46 / 2.46 / 2.46 / 2.46 | 2.46 / 0 / 3.96 / 0 | 3.96 | 0 | 0 | 100% | PASS |
| mobile-home-000-menu-open | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | 0 | 0 | 0 | 100% | PASS |
| mobile-on-track-000 | 0.03 / 0.03 / 0.03 / 0.02 | 0.03 / 0.04 / 0.02 / 0.04 | 0.04 | 0 | 2 @43,21 | 100% | PASS |
| mobile-on-track-033 | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | 0 | 0 | 0 | 100% | PASS |
| mobile-on-track-067 | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0.14 | 0.14 | 0 | 0 | 100% | PASS |
| mobile-on-track-100 | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | 0 | 0 | 0 | 100% | PASS |

## movement check (distinct colour counts across a page's checkpoints)

| page | checkpoints | distinct frames | ok |
|---|---|---|---|
| desktop / idle | 7 | 7 | yes |
| desktop / menu-open | 1 | 1 | yes |
| desktop /calendar idle | 4 | 4 | yes |
| desktop /on-track idle | 5 | 5 | yes |
| desktop /off-track idle | 4 | 4 | yes |
| desktop /partnerships idle | 1 | 1 | yes |
| desktop /partnerships variant-dark | 1 | 1 | yes |
| mobile / idle | 1 | 1 | yes |
| mobile / menu-open | 1 | 1 | yes |
| mobile /on-track idle | 4 | 4 | yes |

## driven states

- **menu-open**: nav menu opened through the hamburger click handler (nav.ts initNavMenu / kL 44001) at +1200 ms virtual
- **variant-dark**: 404 helmet variant switched through [data-gl-switcher] (misc.ts initGlSwitchers / T_ 46121) at +1200 ms virtual

## states enumerated but NOT driven (open items, not covered)

- home disco easter egg (DiscoController I8 31098) — no DOM entry wired in this gate
- home mobile swipe/scroll-lock toggle ($_ 44826) — mobile home is photographed only in its locked (top) position
- calendar circuit hover/selection (I4 9790 circuits rive)
- page transition mid-frame (taxi leave/enter overlay, oL 46381)

Composites of every cross-side run: docs/gates/pixel/composites/<cell>.jpg ([rebuild | mirror | diff]). Raw numbers: results.json.
