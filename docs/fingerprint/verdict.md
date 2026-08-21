# Step 0 判级 — https://landonorris.com/ → **A 类**（主场）

探测：`node scripts/skill/fingerprint.mjs --target https://landonorris.com/ --bundle https://lando.itsoffbrand.io/dev-js/lando.OFF+BRAND.gold-android-fix-03.js`（2026-08-21，报告 `fingerprint-report.md`）。判级按 `references/scope-and-fingerprint.md` §3 判定树人工执行，命中即停：

| 序 | 判据 | 证据 | 结论 |
|---|---|---|---|
| 1 X 硬判据 | 终点域 = 目标域（`final=https://landonorris.com/ redirects=0`）；路径 GET 200；`© 2026`、无 generator meta、技术栈（three r174 / GSAP 3.13 / Lenis 1.1.20 / Rive 2.26）与当代一致 | 无一命中 | 不是 X |
| 2 D 信号 | `wp-content` = 0、无 WordPress generator；双抓 **byte-identical**（无分桶/注水）；签名行为全在客户端 bundle，无 cart/checkout/GraphQL 数据面 | 无一命中 | 不是 D |
| 3 C 二维 | 维度①：`self.__next_f` / `__reactRouterContext` / `__NUXT__` / `data-v-` 全为 0——Webflow 静态导出，HTML 即最终产物；维度②：bundle 内 three 强签名 `WebGLRenderer` 38 次（含 vendor 报错串 31 次）、GSAP/Lenis/Rive 命令式调用，无 theatre / @react-three | 落"静态产物 × 命令式"格 | 不是 C |
| 4 A 签名 | 静态构建器产物（esbuild ESM bundle，单行 113,672 字符，minified，无 sourcemap）；bundle 数量少（1 个应用 bundle 1.32MB + Webflow 运行时 3 个）；双抓 byte-identical；无内容级 API——bundle 内 `/api/` 仅 2 处且都是 `player.vimeo.com/api/player.js` 的 Vimeo 播放器加载器（L44469/44473），不是数据接口；three 强签名命中 | 五条全中 | **A** |

附注（不改变判级）：
- bundle 所在域 `lando.itsoffbrand.io` 有 **Referer 防盗链**（无 Referer 返回 32 字节拒绝页），探测脚本已按协议补 Referer 重试。
- legal 两页正文由 iubenda 线上 API 注入（第三方嵌入，非站点自身数据面），作为外部运行时依赖登记（REBUILD_PLAN 6.3）。
- **源站漂移记录**：2026-08-21 探测到的首页 HTML sha256 `d6f90164…`（218,897B）与 2026-08-10 镜像 `0c1b9333…`（219,553B）不同，Webflow 运行时 chunk 已从 `lando-offbrand.schunk.79b71263bda4d666.js` 换为 `…7321a5097fb66f41.js`；应用 bundle sha256 `11cdda6f…` **与镜像相同**。镜像按宪法保持 08-10 快照不动（坐标系钉死），漂移只登记不追。
