# standalone gate — 2026-08-21

src/ copied outside the repository, `npm install --offline`, `npm run build` (verify-standalone.mjs --full): **PASS**. The copy's dist served as plain static files and probed with --no-external on 8 routes: **8/8 PASS** (legal routes: registered iubenda residuals only).

| route | result | probe RESULT | residuals | unexplained |
|---|---|---|---|---|
| / | CLEAN | CLEAN | — | — |
| /calendar | CLEAN | CLEAN | — | — |
| /on-track | CLEAN | CLEAN | — | — |
| /off-track | CLEAN | CLEAN | — | — |
| /partnerships | CLEAN | CLEAN | — | — |
| /legal/privacy-policy | PASS* | 4 problems | 6.3-iubenda-badge-css, 6.3-iubenda-api, 6.3-iubenda-badge-css-host | — |
| /legal/terms-conditions | CLEAN | CLEAN | — | — |
| /nope-404 | PASS* | 2 problems | 404-semantics | — |
