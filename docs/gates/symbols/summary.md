# symbols gate

| step | result | artifact |
|---|---|---|
| extract-check | PASS | docs/gates/symbols/extract-check.txt |
| extract-balance | PASS | docs/gates/symbols/extract-balance.txt |
| verify-decls | **FAIL** | docs/gates/symbols/verify-decls.txt |
| skill-verify-symbols | recorded (exit 1) | docs/gates/symbols/skill-verify-symbols.txt |

verify-decls.mjs decides (this bundle is esbuild output: lazy-init wrappers, hoisted chains, import/alias bindings — classified in docs/rename-map.json). The skill's verify-symbols.mjs is run and recorded for comparison; its misses are exactly the `plumbing` section.
