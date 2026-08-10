# landonorris-rebuild

以学习为目的，对 [landonorris.com](https://landonorris.com/)（Lando Norris 官网，OFF+BRAND 出品，Awwwards 风格 Webflow + WebGL 站）做 1:1 工程化重建。私有仓库，不公开部署。

沿用 rogierdeboeve → oryzo → samsyninja → careers-kimi → storytellingnoomo 五个前作的同一套方法论：
**镜像 → 逆向（_pretty 行号坐标系）→ 严格溯源移植 → 里程碑推进 + 三重验证**。
核心纪律：源站代码是唯一裁决；改动先归属到源码行号；死代码/bug 照抄不修；有意偏差必须登记。

## 当前状态：重建完成（M0-M7 全部关闭，2026-08-10）

复刻站已按方法论完成全量重建：Webflow DOM/CSS 外壳（shells 流水线）+ 自写 TypeScript
应用层（`src/app/`，对照 47k 行 pretty bundle 逐函数移植，全部带行号溯源注释）。
验收：`scripts/verify.mjs` 全 7 路由 × 桌面/移动回归门通过；真机 Chrome 三方对拍
（线上 / 镜像 / 复刻）首页 hero 视觉一致；对拍截图存 `docs/compare/`。
运行方式与部署边界见 `DEPLOY.md`；里程碑日志/偏差/怪癖登记见 `REBUILD_PLAN.md`。

### 复刻栈（同栈同版本钉死）

Vite 6 + TypeScript；three@0.174.0、gsap@3.13.0（ScrollTrigger/SplitText/MotionPath）、
lenis@1.1.20、@rive-app/canvas-lite@2.26.4、@unseenco/taxi@1.8.0（偏差 6.7）、
three-msdf-text-utils@1.5.0（偏差 6.8）。

### 镜像

- 2026-08-10 完成全站镜像：`legacy-mirror/`，508 文件 / 约 37MB（含双端 webp+ktx2 纹理变体），清单见 `legacy-mirror/mirror-manifest.json`
- 逆向坐标系：`legacy-mirror/_pretty/`（js-beautify@1.15.1 钉死版本展开）
  - `lando.OFF+BRAND.gold-android-fix-03.pretty.js` — 主应用 bundle，47,120 行
  - `transitions-rive-isolate.pretty.js` — 已停用的历史过渡脚本（4,210 行，HTML 中被注释）
  - `lando-offbrand.webflow.pretty.js` / `lando-offbrand.schunk.pretty.js` — Webflow 平台运行时

## 镜像方式（scripts/mirror-site.mjs）

纯 Node fetch BFS 爬虫（承袭 rogierdeboeve/noomo 的 mirror-site.mjs 思路）：

1. 从 `/` 出发爬同源页面（7 页 + 404 模板），按 URL 路径落成 `<path>/index.html`
2. 对文本响应正则提取白名单 host 资源，迭代下载至不动点（CSS 字体、JS 内 URL）
3. **人工补录**（正则抓不到的运行时拼接路径，从 bundle 静态求解）：
   - `lando.itsoffbrand.io` 的 `dev-js/`、`gl/`、`rive/` 全部带 `Referer: https://landonorris.com/` 抓取（**该域有防盗链，无 Referer 返回 403**）
   - GL 资产基址 `vQ="https://lando.itsoffbrand.io/gl"`：4 GLB 模型 + 3 HDRI + draco/basis 解码器 + MSDF 字体×2 + 纹理×9
   - Rive 基址 `mj="https://lando.itsoffbrand.io/rive/"`：8 个 .riv
   - Rive WASM：unpkg `@rive-app/canvas-lite@2.26.4` / `@2.26.6`

已知未入镜像：Webflow GA 反代 blob（`/avljl.../...`，逐次动态）、Klaviyo/iubenda 运行时二级加载（当前均未激活或按需）。

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

```
legacy-mirror/          源站镜像（URL 空间 1:1 落盘）
  assets/<host>/<path>  跨域资产按 host 组织
  _pretty/              js-beautify@1.15.1 展开的 bundle（逆向行号坐标系）
  mirror-manifest.json  权威清单（url → path/bytes/type）
docs/engine-notes/      M1 逆向笔记 ×6（行号取证）
docs/compare/           对拍截图
shells/（生成物）        gen-shells 从镜像生成的页面外壳（4 项登记变换）
src/app/                应用层移植（gsap/scroll/transition/rive/components/pages/gl）
  gl/                   Three 引擎（core/fluid/noise/world/scenes×6，GLSL 逐字）
scripts/
  mirror-site.mjs       镜像爬虫          gen-shells.mjs   外壳流水线
  serve.mjs             镜像/dist 服务器   probe.mjs        CDP 无头探针
  verify.mjs            全路由×双端回归门  postbuild.mjs    dist 规整
```
