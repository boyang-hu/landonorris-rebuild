# REBUILD_PLAN — landonorris.com 1:1 工程化重建

沿用 rogierdeboeve → oryzo → samsyninja → careers-kimi → storytellingnoomo 的方法论。

## §0 纪律（宪法级）

1. 源站代码是唯一裁决：每个改动先归属到 `legacy-mirror/_pretty/*.pretty.js` 行号（或镜像 HTML/CSS 位置）再落地。
2. 源站有的都要有，没有的不做；bug 与死代码照抄不修，登记为怪癖（§Q）。
3. 有意偏差必须登记在 §6；未登记的差异一律视为 bug。
4. 不自创补偿性 CSS/JS。
5. 每个里程碑过浏览器实测取证（scripts/probe.mjs），全新加载验证。
6. 代码与文档同一次提交。

## §1 里程碑

- [x] M0 镜像（470+ 文件，31MB+，见 README）
- [x] M0.5 镜像本地断网跑通（serve.mjs + probe.mjs，7 页 + 404 全 CLEAN）
- [ ] M1 逆向主 bundle → docs/engine-notes.md（行号取证）
- [ ] M2 工程骨架（Vite + 钉死依赖 + 页面外壳流水线）
- [ ] M3 站点 chrome 层（Lenis/导航/SplitText/marquee）
- [ ] M4 Rive 层（8 riv + 页面过渡）
- [ ] M5 Three GL 层（helmet/tracks/disco/sotd + bloom 链）
- [ ] M6 各页专属逻辑（calendar/partnerships/legal/404）
- [ ] M7 三重验证 + 收尾

## §2 源站技术栈（Phase 0 结论，详见 README；M1 后补充行号）

Webflow（静态导出 + jQuery 3.5.1 + webflow.js，未用 IX2）+ OFF+BRAND 自定义 bundle
`lando.OFF+BRAND.gold-android-fix-03.js`（1.3MB min → `_pretty/` 47,120 行）：
Three r174 / GSAP 3.13.0（ScrollTrigger/SplitText/Observer/MotionPath）/ Lenis 1.1.20 /
@rive-app/canvas-lite 2.26.4。

## §5 难度评级

总评 ★★★☆☆（3/5），careers-kimi 同档。分项见 README。

## §6 有意偏差登记

| # | 偏差 | 理由 |
|---|---|---|
| 6.1 | GA/Webflow 反代 blob（/nvhc*、/avljl*）不复刻，本地 serve 返回 stub | 遥测非站点行为；私有部署不应上报 |
| 6.2 | 镜像服务层把外部 host 改写为 /ext/<host>/ 路径 | 磁盘镜像保持纯净；仅服务层行为 |
| 6.3 | iubenda badge CSS 在本地镜像服务下 404（脚本从自身 src 反推 base 所致）；legal 页正文依赖 iubenda 线上 API | 源站本身即三方运行时行为，无法离线化；badge 纯装饰 |

## §Q 怪癖登记（源站 bug/死代码，照抄不修）

| # | 现象 | 证据 |
|---|---|---|
| Q1 | HTML head 内保留大量注释掉的历史脚本（localhost:6645、Klaviyo、iubenda banner、旧版 bundle 列表） | index.html head 注释块 |
| Q2 | `--nav-height: calc(3.75rem (var(--gap) * 2))` 缺少运算符，非法 calc | index.html 内联 `<style>` css-root |
| Q3 | 已停用的 transitions-rive-isolate.js 仍部署在 assets.itsoffbrand.io（HTML 中注释引用） | index.html 注释块 |
| Q4 | riv 资产在 lando.itsoffbrand.io/rive/ 与 assets.itsoffbrand.io/lando/rive/ 双份部署，运行时用后者 | probe 网络记录 |

## §7 里程碑日志（倒序）

### 2026-08-10 M0.5 关闭
- scripts/serve.mjs：零依赖静态服务器，/ext/<host>/ 响应层映射（磁盘镜像纯净）；
  GA 反代 stub；iubenda 图标目录映射；404 走源站 404.html 模板（HTTP 404 状态）。
- scripts/probe.mjs：零依赖 CDP 无头探针（console/pageerror/网络失败 + 截图 + eval + scroll）。
- 实跑补录（静态解析盲区，方法论预期内）：head/helmet/glass 全套 PBR 纹理 13 件
  （disco/gold 变体在 bundle 里由纹理集拼接，正则不可见）、riv ×7 的 assets.itsoffbrand.io
  运行时副本、iubenda owner.png。
- 验收：7 页 + 404 探针全 CLEAN（首页含全滚动）；唯一残留 iubenda badge css（§6.3）。

### 2026-08-10 M0 关闭
- 见 README（镜像方式、防盗链、动态资产求解）。
