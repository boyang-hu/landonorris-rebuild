# landonorris-rebuild

以学习为目的，对 [landonorris.com](https://landonorris.com/)（Lando Norris 官网，OFF+BRAND 出品，Awwwards 风格 Webflow + WebGL 站）做 1:1 工程化重建。私有仓库；私密预览部署在 Cloudflare Pages（`deploypages/`，noindex + Access，见 DEPLOY.md）。

沿用 rogierdeboeve → oryzo → samsyninja → careers-kimi → storytellingnoomo 五个前作的同一套方法论：
**镜像 → 逆向（_pretty 行号坐标系）→ 严格溯源移植 → 里程碑推进 + 三重验证**。
核心纪律：源站代码是唯一裁决；改动先归属到源码行号；死代码/bug 照抄不修；有意偏差必须登记。

## 当前状态：M0-M7 重建（2026-08-10）→ M8 补门（2026-08-20）→ **M9 按 skill 三段契约完成（2026-08-21）**

项目现在完整符合 website-rebuild-skill v0.1.51 的三段产物契约：`mirror/`（只读证据）→ `port/`（逐字切片，**能运行并过门**）→ `src/`（可读、自包含的 TypeScript 工程）。每道门固化在 `scripts/run-gates.mjs`（`--target port|src`），产物在 `docs/gates/`：

| 门 | port/（逐字移植） | src/（可读工程） |
|---|---|---|
| 镜像自检（映射单射 / 账本 sha256 / 真实性 / 闭包 / 回源抽样；netcapture GAP 逐条决策） | PASS | PASS |
| 外壳字节门（skill verify-shell，8 页 225 hunk 全部由变换表回放） | PASS | PASS |
| 零外联 + CLEAN（2 侧 × 8 路由 × 2 视口 + 5 条全滚动 walk；静态面 verify-offline） | 42/42 | 42/42 |
| 像素对拍（probe-shim 确定性泵；29 格位置×状态；每格两侧各 4 次自比交错建带宽） | 29/29，27 格跨侧 = 0 | 29/29，27 格跨侧 = 0 |
| 声明对账（300 port 声明 ↔ 233 src 声明；13/13 GLSL 逐字） | — | PASS |
| 自包含（复制到仓库外 → 离线安装 → 构建 → 复制件逐路由探针） | — | PASS 8/8 |

M8 首次补门时抓到并修掉的三处真问题：preconnect 裸 host 外联、dist 从 CDN 取字体、Q17 导航主题死分支。

运行方式与部署边界见 `DEPLOY.md`；里程碑日志/偏差/怪癖登记见 `REBUILD_PLAN.md`（§6.13–6.18 / §7 2026-08-20）。

### 复刻栈（同栈同版本钉死）

Vite 6 + TypeScript；three@0.174.0、gsap@3.13.0（ScrollTrigger/SplitText/MotionPath）、
lenis@1.1.20、@rive-app/canvas-lite@2.26.4、@unseenco/taxi@1.8.0（偏差 6.7）、
three-msdf-text-utils@1.5.0（偏差 6.8）。

### 镜像

- 2026-08-10 完成全站镜像：`mirror/`，508 文件 / 约 37MB（含双端 webp+ktx2 纹理变体），清单见 `mirror/mirror-manifest.json`
- 逆向坐标系：`mirror/_pretty/`（js-beautify@1.15.1 钉死版本展开）
  - `lando.OFF+BRAND.gold-android-fix-03.js` — 主应用 bundle，47,120 行
  - `transitions-rive-isolate.js` — 已停用的历史过渡脚本（4,210 行，HTML 中被注释）
  - `lando-offbrand.751e0867.148dc658e77a3916.js` / `lando-offbrand.schunk.79b71263bda4d666.js` — Webflow 平台运行时

## 镜像方式（scripts/mirror-site.mjs）

纯 Node fetch BFS 爬虫（承袭 rogierdeboeve/noomo 的 mirror-site.mjs 思路）：

1. 从 `/` 出发爬同源页面（7 页 + 404 模板），按 URL 路径落成 `<path>/index.html`
2. 对文本响应正则提取白名单 host 资源，迭代下载至不动点（CSS 字体、JS 内 URL）
3. **人工补录**（正则抓不到的运行时拼接路径，从 bundle 静态求解）：
   - `lando.itsoffbrand.io` 的 `dev-js/`、`gl/`、`rive/` 全部带 `Referer: https://landonorris.com/` 抓取（**该域有防盗链，无 Referer 返回 403**）
   - GL 资产基址 `vQ="https://lando.itsoffbrand.io/gl"`：4 GLB 模型 + 3 HDRI + draco/basis 解码器 + MSDF 字体×2 + 纹理×9
   - Rive 基址 `mj="https://lando.itsoffbrand.io/rive/"`：8 个 .riv
   - Rive WASM：unpkg `@rive-app/canvas-lite@2.26.4` / `@2.26.6`

已知未入镜像（全部有登记，`mirror/external.txt` + REBUILD_PLAN 6.13）：Webflow GA 反代 blob（`/avljl.../...`，逐次动态，本地 stub）、Klaviyo/iubenda cookie banner 的二级加载（两者的 `<script>` 在每个页面里都被注释掉了，从不执行）、Webflow 占位图 `placeholder.60f9b1840c.svg`（源站 CDN 对任何访客 403）。账本：`mirror-manifest.json`（url → path/bytes/type/sha256，+ aliases）、`inventory.tsv`、`urlpath-policy.json`。

## 源站技术栈（Phase 0 逆向结论，证据在 _pretty 行号）

| 层 | 结论 |
|---|---|
| 平台 | **Webflow**（静态导出 + CMS collections；jQuery 3.5.1 + Webflow 运行时；**未用 IX2 交互引擎**，动效全在自定义代码） |
| 自定义应用层 | OFF+BRAND 手写单 bundle `lando.OFF+BRAND.gold-android-fix-03.js`（1.3MB min / 47k 行 pretty），部署在自家域 `lando.itsoffbrand.io`，带 Referer 防盗链 |
| 滚动 | **Lenis 1.1.20** + GSAP ScrollTrigger |
| 动效 | **GSAP 3.13.0**（ScrollTrigger / SplitText 3.13.0 / Observer / MotionPath） |
| 2D 动画 | **Rive**（canvas-lite 2.26.4，8 个 .riv：页面过渡 / 按钮 / phrases / signature / reef / circuits / mob-landscape / ln4） |
| 3D | **Three.js r174** 内联：GLB（头盔 helmet-21 + 赛道 tracks-05 + disco 球 + sotd 奖杯）、DRACO + KTX2/Basis、RGBE HDRI ×3、MSDF 文字（Brier-Bold / MonaSans 图集）、matcap 材质、EffectComposer + UnrealBloom + ShaderPass 后处理、自定义 shader（~88 个 `void main`，多数为 three chunks，自研部分待 Phase 1 清点） |
| 布局 | 自研 clamp 流式缩放系统（`--fluid-font`，设计稿 1728px 基准），CSS 变量驱动 |
| 字体 | Mona Sans（变量字体 woff2）+ Brier Bold |
| 三方 | GA4（Webflow 反代）、Klaviyo（注释停用）、iubenda（注释停用） |

页面：`/`、`/on-track`、`/off-track`、`/calendar`、`/partnerships`、`/legal/privacy-policy`、`/legal/terms-conditions` + 404。

## 逆向难度评级（对标五个前作）

分项（★/5）：

| 难点 | 等级 | 对策 |
|---|---|---|
| 素材版权（F1/McLaren/人物肖像/商标，法务风险远大于技术） | ★★★★★ | 私有仓库、不公开部署，与前作同策 |
| Three 场景还原（头盔玻璃/matcap/bloom 链、滚动驱动相机） | ★★★☆☆ | 同版本 r174 + 资产直接复用，shader 可从 bundle 逐字提取 |
| 滚动编排手感（Lenis + ScrollTrigger 参数、SplitText 时序） | ★★★☆☆ | 生态标准库，全部可从 pretty bundle 取证 |
| Rive 状态机接线 | ★★☆☆☆ | .riv 是数据文件已入库，官方 runtime 播放即可 |
| Webflow DOM/CSS 层 | ★★☆☆☆ | 静态导出物即规格书，逐字节可对拍 |
| CMS 数据抽取（calendar 赛历等） | ★☆☆☆☆ | 全部渲染在静态 HTML 里 |

**总评：★★★☆☆（3/5）— 与 careers-kimi 同档（业余 3–5 周），显著低于 oryzo / samsyninja / storytellingnoomo。**
无私有二进制格式（vs oryzo .buf/.sog）、无 WebGPU/TSL（vs samsyninja）、无 SSR 字节对齐契约（vs noomo）、无多人协议。DOM 层 Webflow 静态导出甚至比 careers-kimi 的 Next/RSC 更省事；难度上限在 Three 场景与滚动编排的"手感级"对齐。

## 目录

三段坐标系 **mirror → port → src**（skill 的「证据 → 移植 → 源码」，单向依赖）：

```
mirror/                 ① 只读证据：源站 URL 空间 1:1 落盘（508 文件 / 35MB，2026-08-10 快照）
  assets/<host>/<path>     跨域资产按 host 组织
  _pretty/                 js-beautify@1.15.1 展开的 bundle（逆向行号坐标系，README 记再生命令，可逐字节再生）
  mirror-manifest.json     权威账本（url → path/bytes/type/sha256 + aliases）
  inventory.tsv / urlpath-policy.json / external.txt / netcapture.tsv   账本 / 映射策略 / 闭包与 GAP 决策 / 真浏览器对账
port/                   ② 逐字移植（机器读，永不手改，能运行）
  _gen/app.gen.js          esbuild 运行时 + 全部应用区段的字节切片（30 片，sha256 守卫，classic script）
  vendor-globals.js        压缩 vendor 名 → 钉死 npm 包的别名表（每行带品牌/行号证据）
  site/（生成物）           skill build-site 生成的外壳 + 前奏 + 切片；伺服时资产从 mirror 回落（不复制）
src/                    ③ 人写的工程：可读、可改、自包含（自己的 package.json；复制到任何地方 npm install --offline && npm run build）
  app/                     应用层 TypeScript（gsap/scroll/transition/rive/components/pages/gl），每个声明带 pretty 行号
  site/（生成物，已提交）    skill build-site 生成的外壳（入口 /app/main.ts）
  public/ext/（盘上有 git 无） 源站资产副本（npm run assets:restore），账本 ASSETS.md
  README.md                怎么跑 / 坐标系怎么读 / 注释三档
docs/
  engine-notes.md + engine-notes/   M1 逆向笔记（入口 + 6 份行号取证）
  fingerprint/             Step 0 指纹报告与判级（A 类）
  rename-map.json / rename-review.md   port 声明 ↔ src 声明（一对一 / 折叠 / esbuild 管道 / 孤儿 / 证据档位）+ 人工抽查
  gates/                   各门产物（mirror / offline / offline-port / symbols / pixel / pixel-port / standalone）
  compare/                 M7 对拍截图
scripts/
  run-gates.mjs            全部验收门的调用 + 豁免清单（mirror|offline|symbols|pixel|standalone|all，--target src|port）
  shell-config.{port,src}.mjs / lib/shell-common.mjs   策略 A 登记变换表（两侧同一张表）
  slices.config.mjs / verify-decls.mjs                 port/ 切片表、声明对账门
  assets-restore.mjs / ledger-backfill.mjs / ledger-reconcile.mjs   资产复制进 src / 镜像账本
  skill/                   website-rebuild-skill v0.1.51 判据脚本逐字拷贝（零依赖）
  mirror-site.mjs / serve.mjs / probe.mjs / verify.mjs   M0–M7 时期的项目脚本（保留作历史；门已改用 scripts/skill/）
tools/                  允许依赖的生产工具：free-idents（vendor 自由标识符）、grade-renames（命名证据档位）+ skill 自带三件
.claude/skills/website-rebuild/   项目级 skill（SKILL.md + references + scripts + tools）
```
