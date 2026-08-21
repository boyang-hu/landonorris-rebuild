# landonorris.com 逆向笔记（engine-notes）— 入口

> 模板：`.claude/skills/website-rebuild/assets/templates/engine-notes.md`。行号均指 `mirror/_pretty/lando.OFF+BRAND.gold-android-fix-03.js`（47,120 行，js-beautify@1.15.1，sha256 `3a888487…`，可逐字节再生）。六份分册在 `docs/engine-notes/`：`00-boot`（启动链/taxi/页面矩阵/区段图）、`01-rive`、`02-gl-core`、`03-gl-scenes`、`04-dom-components`、`05-webflow-html`。

## 第一部分：源站事实

### 0. bundle 形态判定（M1 第一个动作）
**esbuild ESM bundle，扁平拼接 + 懒初始化包装器**：顶层 776 个列 0 声明；模块以 `var X = VA(() => {…})`（`__esm`）/ `var X = DK((exports, module) => {…})`（`__commonJS`）包装，模块级变量被提升成 `var a, b, c;` 逗号链，运行时助手在 L1-32（`dJ`=`__toESM`、`DK`=`__commonJS`、`QD`=`__export`、`VA`=`__esm`）。不是 webpack/Turbopack 容器 → 分层表按**顶层声明 + 包装器**扫（`scripts/verify-decls.mjs` 的分类：一对一 / 折叠 / 管道 / 孤儿），不用 `module-map.mjs`。

### 1. bundle 区段地图
| 行号 | 内容 | 落点 |
|---|---|---|
| 1-32 | esbuild 运行时助手 | `port/_gen` 切片 0 |
| 33-89 | 工具函数 BD/ED/ID/CD/KD | `src/app/utils.ts` |
| 90-5042 | @rive-app/canvas-lite 2.26.4 UMD | npm |
| 5043-9406 | gsap 3.13.0 core/CSSPlugin/Observer/ScrollTrigger/paths/MotionPathPlugin/SplitText | npm |
| 9407-10280 | gsap 装配 LB + Rive 系统 vC（预载、组件工厂、导航、滚动驱动） | `src/app/gsap.ts`、`rive/` |
| 10281-10333 | WebGL2 能力检测 tR（three/examples WebGL.js 形状） | `gl/core/support.ts` |
| 10334-30143 | three r174 core | npm |
| 30144-30179 | 相机 / 渲染器 | `gl/core/app.ts` |
| 30180-30712 | OrbitControls | npm |
| 30715-30816、30942-32010 | head 场景群（30817-30941 夹着 BufferGeometryUtils） | `gl/scenes/head.ts` |
| 32012-32500 | postprocessing（EffectComposer/RenderPass/UnrealBloom） | npm |
| 32502-33061 | tracks 场景 | `gl/scenes/tracks.ts` |
| 33062-33178 | background 场景 | `gl/scenes/background.ts` |
| 33179-33996 | word-wrapper + three-msdf-text-utils | npm |
| 33997-34753 | carousel / helmet-scroll / not-found 场景 | `gl/scenes/*` |
| 34754-35705 | 噪声 / 流体六 pass / idle | `gl/noise.ts`、`gl/fluid.ts` |
| 35706-35888 | World / Time / Sizes / EventEmitter | `gl/world.ts`、`gl/core/*` |
| 35889-38003 | dat.gui + stats-gl（?debug 面板） | npm（port）/ 桩（src，6.9） |
| 38004-38126 | Debug / Mouse / ShaderChunks | `gl/core/*` |
| 38127-41230 | DRACO/GLTF/RGBE/Font/KTX2 loaders | npm |
| 41231-41750 | Assets / RQ GL 应用 / EZ landoGL 配置 / q$ 页面过渡 | `gl/core/Assets.ts`、`gl/params.ts`、`transition.ts` |
| 41751-42433 | selector-set / @unseenco/e / @unseenco/taxi | npm（6.7） |
| 42434-46468 | DOM 组件层、各页逻辑、生命周期、taxi 装配 | `components/*`、`pages/*`、`lifecycle.ts`、`router.ts` |
| 46469-47010 | lenis 1.1.20 | npm |
| 47011-47120 | Lenis 管理器 QV + 入口 c_ | `scroll.ts`、`main.ts` |

完整切片表（含每片的 note）：`scripts/slices.config.mjs`；vendor 绑定逐个证据：`port/vendor-globals.js`。

### 2. 技术栈取证表
| 层 | 版本 | 证据 |
|---|---|---|
| three | r174 | `REVISION` 字串 + 类品牌（`isWebGLRenderer` L24433 等） |
| gsap / ScrollTrigger / MotionPath / SplitText | 3.13.0 | 插件注册 L104（`E1.registerPlugin(TA, u6, CI)`） |
| lenis | 1.1.20 | L46469-47010 |
| @rive-app/canvas-lite | 2.26.4 | UMD L90 + unpkg 加载路径 |
| @unseenco/taxi | 1.8.0（bundle 无版本串，6.7） | L42070-42433 |
| three-msdf-text-utils | 1.5.0 | L33274-33996 |
| dat.gui / stats-gl | 0.7.9 / 4.2.3（就近，6.9） | L35889 `__state.conversionName`；L37997 `threeRendererPatched` |
| Webflow | jQuery 3.5.1 + webflow.js，无 IX2 | `05-webflow-html.md` |

### 3. 混淆名对照表
`docs/rename-map.json`（294 条 port 声明 → src 名字，含证据档位）+ `port/vendor-globals.js`（86 条 vendor 绑定）。

### 4. 启动链
`vC(); EZ(); q$();` → `c_()`：`BL()`（页面过渡 rive 就绪）→ `Promise.all([eM() GL 资产, m_() allriveloaded])` → `aL` taxi 装配（Core 构造触发 `initialLoad → mL`）+ `EV` Lenis → `CD()` banner。详见 `00-boot.md` §1/§3/§4。

### 5-12. 渲染管线 / GLSL / 动画参数 / 平台契约 / 页面矩阵
见分册 `02-gl-core.md`、`03-gl-scenes.md`（六场景 + 流体六 pass + bloom 链）、`04-dom-components.md`（全部 GSAP 参数逐字）、`05-webflow-html.md`（Webflow 三连保留、head 契约、data-* 体系）、`00-boot.md` §4（init/destroy 矩阵）。

### 13. 已证伪的假设
- "SplitText 告警是无头时序"——假；根因是 dist 从 CDN 取字体（M8，6.4）。
- "导航主题由 ScrollTrigger 驱动"——假；`window.ScrollTrigger` 在源站恒为 undefined，真正生效的是滚动监听兜底（Q17）。
- "35889-38003 是 lil-gui"——假；是 dat.gui（6.9）。

## 第二部分：怪癖清单（照抄不修）
`REBUILD_PLAN.md` §Q（Q1-Q17）。承重的：Q13（`scene.remove(name)` no-op）、Q9（`debug` 隐式全局 → port 必须是 classic script）、Q17（死分支）。

## 第三部分：对复刻的直接结论
1. 外壳走策略 A（Webflow 导出物即规格书），登记变换表 `scripts/lib/shell-common.mjs`，两侧同一张表。
2. 应用层逐字切片可直接运行（port/），vendor 全部换钉死 npm；src 在其上重写为可读 TS，等价由 `verify-decls` + 运行时门（CLEAN/零外联/像素）裁决。
3. 992px 断点整页 reload；桌面 webp / ≤991 ktx2 双套纹理；WebGL2 不可用走 `gl-fallback`。
4. 外部运行时依赖只剩 iubenda API（legal）与按需 Vimeo；其余零外联。
