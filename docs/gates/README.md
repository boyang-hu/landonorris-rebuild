# docs/gates — 验收门产物（skill v0.1.51，M8）

每道门的**调用方式与豁免清单都在仓库里**（`scripts/run-gates.mjs`），产物按门分目录，
每次跑门整目录重写（像素门除外——它只留跨侧合成图与全部数字）。

| 门 | 命令 | 判据 | 产物 |
|---|---|---|---|
| 镜像自检（M0） | `npm run gate:mirror` [`-- --resample N`] | `scripts/skill/verify-mirror.mjs` 五项：映射单射 / 账本一致 / 真实性 / 闭包 / 回源抽样；豁免 = `mirror/external.txt` | `mirror/verify-mirror.txt` |
| 零外联 + CLEAN（M0.5 / M7） | `npm run gate:offline` | `probe.mjs --no-external` 两侧 × 8 路由 × 2 视口 + 5 条全滚动 walk；`verify-offline.mjs` 静态面两侧；具名残差见 RESIDUALS | `offline/summary.md` + 每格原始输出 |
| 符号等价（M(n) 冷头清点 + M(n+1)） | `npm run gate:symbols` | `extract-source --check/--balance-check`（port/ 字节在位且可解析）+ `scripts/verify-decls.mjs`（294 port 声明 ↔ 233 src 声明，按 `docs/rename-map.json`）；skill `verify-symbols.mjs` 存档不判定 | `symbols/summary.md` + 各步输出 |
| 像素对拍（M(n-1)） | `npm run gate:pixel` | `pixelcompare.mjs` + probe-shim 确定性泵；每格两侧各 4 次自比（交错）→ 带宽 = 两侧自比最大值 → 跨侧 ≤ 带宽 + 0.5；非空帧前置 ≥1000 色 | `pixel/summary.md`、`pixel/results.json`、`pixel/composites/*.jpg` |
| 零依赖（工具链自检） | `npm run zerodep` | `scripts/` 零依赖、门不 import 生产工具（`tools/`） | — |

前置：`npm run build`（shells → vite → postbuild，dist/ext 物化）。门会自己起两侧 serve.mjs
（端口由 `scripts/skill/lib/ports.mjs` 分配：本工作区 slot 1 → 镜像 22001 / 复刻 22002），
已在跑的同侧服务器会被复用。像素门跑时不要并行跑别的浏览器门——后台负载会把自比带宽撑宽。
