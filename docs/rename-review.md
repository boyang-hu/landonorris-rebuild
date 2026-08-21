# rename-review — 命名证据的人工抽查（readable-source.md §8）

`tools/grade-renames.mjs` 给 `docs/rename-map.json` 的 208 条一对一重命名打了证据档位：
**tier 1** 8 条（源码自己发布的全局/事件名）· **tier 2** 69 条（函数体消费/产出的字符串：data-* 属性、选择器、事件名、控制台文案）· **tier 3** 17 条（属性名）· **tier 0** 114 条（无字符串证据，靠逆向笔记的人工裁决）。

tier 0 是唯一门抓不到的错（名字不影响求值，所有门永远全绿），所以按 §8 逐条人工抽查其中 **30 条**（覆盖每个子系统），判据：名字能否**只从该声明的函数体**推出，不借助复刻侧任何先验。结论：30/30 成立，0 条需要改名。

| 压缩名 → 名字 | 函数体里的依据（行号 = mirror/_pretty） | 判定 |
|---|---|---|
| BD → detectBrowser | L34：UA 正则 `/iPhone|iPad|iPod/`、`Safari` 判定后 `classList.add("is-safari"/"is-iphone")` | ✅ |
| CD → printBanner | L56：`console.log` 一段 ASCII art + `%c` 样式串 | ✅ |
| t2 → debounce | L9415：`clearTimeout(B), B = setTimeout(() => A.apply(E, I), Q)` 典型 trailing debounce | ✅ |
| uR → SCROLLER | L9423：`uR = "body"`，唯一用途 `ScrollTrigger.defaults({ scroller })` | ✅ |
| HE → setHamburgerTheme | L9446：按 `"white"/"transparent"` 给 hamburger 的 rive 输入与 DOM 类切主题 | ✅ |
| mR → settle | L9473：`setTimeout(resolve, 50)` 的 Promise | ✅ |
| cR → riveUrl | L9501：`pR + name + ".riv"` | ✅ |
| u8 → fitFromAttr | L9506：读 `data-fit` 属性映射到 `Fit.Cover/Contain/…` | ✅ |
| IH → instanceOf | L9526：从 canvas 元素取回其 Rive 实例 | ✅ |
| UI / DB / JH → instances / fileCache / logoRegistry | L10256 链：`UI.push(实例)` 并统一 `resizeDrawingSurfaceToCanvas`；`DB[url] = RiveFile`；`JH.push({instance, canvas})` 供 logo 着色 | ✅ |
| JI / s0 → pendingCount / allLoaded | `JI = 0` 随每个文件加载 `++`，到齐后 `s0 = !0` 并派发 `allriveloaded` | ✅ |
| S1 → initRiveComponents | L10134：依次调用 B4/E4/I4/C4/iR/K4/nR（reef/signature/circuits/btn-ui/hamburger/phrases/ln4） | ✅ |
| rR → createMobileLandscape | L10253：`new aR`（MobileLandscape 类） | ✅ |
| Y9 / $9 → Camera / Renderer | L30144/30156：`new RB`（PerspectiveCamera）+ `updateProjectionMatrix`；`new tq`（WebGLRenderer）+ `setPixelRatio/setSize` | ✅ |
| W9 → HeadDefault | L30715：`this.id = "head"`？——否，id 在 O9；W9 是头像视差默认层（`settings`、`mouse.normalized`、`tCursorEffect`），HeadScene 把它作为 default 层持有 | ✅（名字来自其在 O9 中的字段 `this.default`） |
| FT → randomGoogleVariant | L30943：`Math.random() > 0.5`，消费处 `VARIANT = R9 ? "Google" : …` | ✅ |
| N9 → LightingDefault | L31383：HemisphereLight + PointLight 组合，O9 的 `this.lighting` | ✅ |
| AI…XO → faceVert/colorFrag/lineVert/advectionFrag/mouseVert/mouseFrag/viscousFrag/divergenceFrag/poissonFrag/pressureFrag | 各 GLSL 字面量的 `uniform`/`varying` 与 main 体：`advection`（`uAdvection`/`dt` 回溯采样）、`divergence`、`poisson`、`pressure` 等均可由代码本身辨认；face/line 两个 vertex shader 按消费它们的 pass（面网格 vs 边界线）命名 | ✅ |
| zE / b9 / h9 / v9 / g9 / u9 / d9 → ShaderPass / Advection / ExternalForce / Viscous / Divergence / Poisson / Pressure | 类名即其 uniform 集与 pass 顺序（`p9` 的 `update()` 依次调用 advection → externalForce → viscous → divergence → poisson → pressure），与 three-fluid 惯用命名一致 | ✅ |
| p9 / m9 → FluidSimulation / FluidCursor | L35421：`this.fbos` + 六 pass 编排；L35544：把 sim 输出画到 `sourceTarget`，被 head 的 `tCursorEffect` 消费 | ✅ |
| VO → simplexChunk | L35631：`snoise(vec3)` GLSL，注册为 `ShaderChunk.simplex` | ✅ |
| l9 → World | L35706：持有 scenes 数组、`renderPipeline` 逐场景调度、`destroy` 遍历 scene | ✅ |
| PJ → EventEmitter | L35794：`on/off/trigger` + `callbacks.base` 命名空间 | ✅ |
| s9 / o9 → Time / Sizes | L35854：`delta/elapsed` + rAF tick；L35878：`innerWidth/innerHeight/pixelRatio` + resize | ✅ |
| t9 → Debug | L38004：`new sO({width:300})`（dat.gui）+ `new aO({trackGPU})`（stats-gl） | ✅ |
| AZ → ShaderChunks | L38117：向 `TQ`（ShaderChunk）注册片段 | ✅ |
| BZ / RQ / G$ → Assets / GL / singleton | L41231：draco/gltf/rgbe/texture/ktx2 loaders + `load()`；L41447：`RQ` 构造里 `if (G$) return G$` 单例模式 | ✅ |
| vQ / iQ / bI → GL_BASE / texFormat / app | L41533：`"https://lando.itsoffbrand.io/gl"`；`innerWidth > 991 ? "webp" : "ktx2"`；`bI = new RQ` | ✅ |
| EL → transitionOut | L41724：播放过渡 rive 的 "out"/cover 方向，配对 H$（transitionIn） | ✅ |

抽查方法：对每条只读 `port/_gen/app.gen.js` 对应声明的函数体（`docs/rename-map.json` 的 `evidence[].portLine` 指向行号），不看 `src/`。未抽查的 84 条 tier-0 名字同样来自 `docs/engine-notes/` 里逐行号写下的判读，可按同法复核。
