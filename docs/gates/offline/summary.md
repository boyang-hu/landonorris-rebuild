# offline gate — 2026-08-21

CLEAN + zero-outbound (probe.mjs --no-external), 42 cells examined = 2 sides × (8 routes × 2 viewports + 5 full-scroll walks). **42/42 PASS**. Static half (verify-offline.mjs): mirror PASS, rebuild PASS.

PASS* = clean except for registered residuals (listed per cell; definitions in scripts/run-gates.mjs RESIDUALS, deviations in REBUILD_PLAN §6).

| cell | result | probe RESULT | registered residuals used | unexplained |
|---|---|---|---|---|
| rebuild-home | CLEAN | CLEAN | — | — |
| mirror-home | CLEAN | CLEAN | — | — |
| rebuild-home-mobile | CLEAN | CLEAN | — | — |
| mirror-home-mobile | CLEAN | CLEAN | — | — |
| rebuild-calendar | CLEAN | CLEAN | — | — |
| mirror-calendar | CLEAN | CLEAN | — | — |
| rebuild-calendar-mobile | CLEAN | CLEAN | — | — |
| mirror-calendar-mobile | CLEAN | CLEAN | — | — |
| rebuild-on-track | CLEAN | CLEAN | — | — |
| mirror-on-track | CLEAN | CLEAN | — | — |
| mirror-on-track-mobile | CLEAN | CLEAN | — | — |
| rebuild-on-track-mobile | CLEAN | CLEAN | — | — |
| rebuild-off-track | CLEAN | CLEAN | — | — |
| mirror-off-track | CLEAN | CLEAN | — | — |
| mirror-off-track-mobile | CLEAN | CLEAN | — | — |
| rebuild-off-track-mobile | CLEAN | CLEAN | — | — |
| rebuild-partnerships | CLEAN | CLEAN | — | — |
| mirror-partnerships | CLEAN | CLEAN | — | — |
| rebuild-partnerships-mobile | CLEAN | CLEAN | — | — |
| mirror-partnerships-mobile | CLEAN | CLEAN | — | — |
| rebuild-legal-privacy-policy | PASS* | 4 problems | 6.3-iubenda-badge-css, 6.3-iubenda-api, 6.3-iubenda-badge-css-host | — |
| mirror-legal-privacy-policy | PASS* | 6 problems | 6.3-iubenda-badge-css, 6.3-iubenda-icons-mirror, 6.3-iubenda-api, 6.3-iubenda-badge-css-host | — |
| rebuild-legal-privacy-policy-mobile | PASS* | 4 problems | 6.3-iubenda-badge-css, 6.3-iubenda-api, 6.3-iubenda-badge-css-host | — |
| mirror-legal-privacy-policy-mobile | PASS* | 6 problems | 6.3-iubenda-icons-mirror, 6.3-iubenda-badge-css, 6.3-iubenda-api, 6.3-iubenda-badge-css-host | — |
| rebuild-legal-terms-conditions | CLEAN | CLEAN | — | — |
| mirror-legal-terms-conditions | CLEAN | CLEAN | — | — |
| rebuild-legal-terms-conditions-mobile | CLEAN | CLEAN | — | — |
| mirror-legal-terms-conditions-mobile | CLEAN | CLEAN | — | — |
| mirror-nope-404 | PASS* | 2 problems | 404-semantics | — |
| rebuild-nope-404 | PASS* | 2 problems | 404-semantics | — |
| rebuild-nope-404-mobile | PASS* | 2 problems | 404-semantics | — |
| mirror-nope-404-mobile | PASS* | 2 problems | 404-semantics | — |
| rebuild-home-walk | CLEAN | CLEAN | — | — |
| mirror-home-walk | CLEAN | CLEAN | — | — |
| rebuild-calendar-walk | CLEAN | CLEAN | — | — |
| mirror-calendar-walk | CLEAN | CLEAN | — | — |
| rebuild-on-track-walk | CLEAN | CLEAN | — | — |
| mirror-on-track-walk | CLEAN | CLEAN | — | — |
| rebuild-off-track-walk | CLEAN | CLEAN | — | — |
| mirror-off-track-walk | CLEAN | CLEAN | — | — |
| rebuild-home-mobile-walk | CLEAN | CLEAN | — | — |
| mirror-home-mobile-walk | CLEAN | CLEAN | — | — |

## registered residuals

| id | side | routes | reason |
|---|---|---|---|
| 404-semantics | both | /nope-404 | the unknown-route document itself is served with HTTP 404 + the origin 404 template (source semantics) |
| 6.3-iubenda-api | both | /legal/privacy-policy, /legal/terms-conditions | legal body is fetched from iubenda's online API (source behaviour; deviation 6.3) |
| 6.3-iubenda-badge-css | both | /legal/privacy-policy, /legal/terms-conditions | iubenda.js re-prefixes its stylesheet URL with "https:" after the /ext/<host>/ rewrite (both sides identically); decorative badge CSS (deviation 6.3) |
| 6.3-iubenda-badge-css-host | both | /legal/privacy-policy, /legal/terms-conditions | same malformed https:/ext/... request as above, counted by the probe as an off-origin host |
| 6.3-iubenda-icons-mirror | mirror | /legal/privacy-policy, /legal/terms-conditions | badge icons resolved against the page origin; the mirror has no /images/site (dist bakes them in, postbuild.mjs) |
