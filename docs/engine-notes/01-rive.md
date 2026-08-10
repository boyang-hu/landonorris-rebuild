# Rive DOM 集成层逆向笔记（移植规格）

## 0. 运行时与全局变量表

- Rive 运行时：**`@rive-app/canvas-lite` v2.26.4**（内嵌打包，L2247），wasm 从 `https://unpkg.com/@rive-app/canvas-lite@2.26.4/rive.wasm` 加载，失败回退 jsdelivr（L2729、L2752）。模块别名 `jQ`（L10264 `jQ = dJ(cU(), 1)`）。
- `m` = gsap（L9435），`TA` = ScrollTrigger（L9430 注册）。
- 关键全局（L10256–10262，逐字）：
  ```js
  var jQ, UI, JI = 0,
      s0 = !1,
      pR = "https://assets.itsoffbrand.io/lando/rive/",
      p6, DB, e2 = null,
      dK = null,
      KI = !1,
      JH;
  ```
  - `UI`：所有 Rive 实例数组（resize 注册表）；`JI`：待加载计数；`s0`：全部加载完成标志；`DB`：RiveFile 缓存（= `window.loadedRiveFiles`）；`e2`：汉堡实例；`dK`：汉堡 state machine inputs 数组；`KI`：菜单开合布尔；`JH`：ln4 logo 实例数组 `{instance, canvas}`。

## 1. `p6` 清单与 `pR` 基址

- `pR = "https://assets.itsoffbrand.io/lando/rive/"`（L10258）。
- `p6` 定义（L10266–10274）：signature/btn-ui/circuits/reef/phrases/logo(=ln4.riv)/mob-landscape。
- **`page-transition.riv` 不在 `p6` 里，且用不同基址**（L41743、L41746）：`mj = "https://lando.itsoffbrand.io/rive/"`, `cj = mj + "page-transition.riv"`。
- URL 解析 `cR(A)`（L9501–9504）：`if (p6[A]) return pR + p6[A]; return pR + A`。
- 预载 `kI()`（L9456–9471）：对 `Object.keys(p6)` 逐个 `A4(url, ok, err)`；`A4`（L9486–9499）命中 `DB` 缓存直接回调，否则 `new jQ.default.RiveFile({src, onLoad, onLoadError})` + `E.init().catch(B)`。每完成一个 `JI--` 并 `mR()`；`kI` 末尾挂 `window.addEventListener("resize", lR)` 与 `window.matchMedia((resolution: ${dpr}dppx)).addEventListener("change", lR)`。
- `mR()`（L9473–9479）：`JI <= 0 && !s0` 时置 `s0=true`、`window.loadingComplete=true`、`window.loadedRiveFiles=DB`，派发 `allriveloaded`，随后 `sR()` 派发 `riveAllLoaded`。
- `lR()`（L9520–9524）：遍历 `UI` 调 `resizeDrawingSurfaceToCanvas()`。
- 启动序列（L47106–47119）：`c_()` → 先 `await BL()`，再 `Promise.all([eM(), m_()])`（`m_()` = 监听 allriveloaded + 调 `kI()`）；完成后动态加载 taxi 路由模块与 lenis 模块。

## 2. `data-rive-file`/`data-rive-object` 组件生命周期

统一工厂模式（`S1()`＝`B4(), E4(), I4(), C4(), K4()`，L10134–10136）：

**守卫/时机**（每个工厂尾部相同，例 L9729–9733）：
```js
if (s0 && DB.reef) A();
else if (window.addEventListener("riveAllLoaded", A, { once: !0 }), JI === 0 && !s0) kI()
```

**实例存储**：`UI.push(instance)` + `canvas.riveInstance = instance`；inputs 存 `canvas.riveInputs`；清理经 `IH(canvas)`（L9526）读回。

**清理 `Q4(canvas)`**（L9530–9543）：`rive.cleanup()`；kill riveScrollControl 的 ST+timeline；lenis off scrollHandler；从 `UI` splice；`canvas.riveInstance = null`。⚠️ 只有 mob-landscape 的 `destroy()`（L10248）调用过 `Q4` —— taxi 页面切换时旧页面 rive 实例并不显式销毁（跟随 DOM 移除，UI 里残留，原站即如此）。

**fit 映射 `u8`**（L9506–9518）：contain/cover/fill/fitwidth/fitheight/none/scaledown/layout → Fit.*，默认 Contain。alignment 一律 Alignment.center。

**hero 容器判定 `KH`**（L9669）：向上找祖先 `data-hero-animation-container`。

### 2a. reef `B4()`（L9678–9733）
选择器 `'canvas[data-rive-object][data-rive-file="reef"]'`。属性：`data-rive-artboard`（默认 "helmet-reef"）、`data-rive-state-machine`、`data-rive-scrolltrigger-target`（空串→canvas 自身）、`data-rive-input`（Boolean 输入名，onLoad 置 true）、`data-rive-instant-play === "true"`、`data-rive-fit`（默认 "contain"）。
`autoplay = instantPlay && !inHero`。onLoad 分派（L9718–9723）：hero 容器内 → `canvas.dataset.heroAnimation="true"`，在播则 pause（等 o0）；SM 名 includes("_play") 且非 instant-play → `CH`；SM 名 includes("_scroll") → `oR`；SM === "off-icons" → 直接 play。

### 2b. signature `E4()`（L9735–9788）
同 reef，artboard 硬编码 "signature"；分派全等：`"signature_play"` → CH；`"signature_scroll"` → oR。

### 2c. circuits `I4()`（L9790–9867）
artboard 硬编码 "circuits"，autoplay 恒真。属性：`data-rive-state-machine`、`data-rive-input-track`、`data-rive-input-color`、`data-rive-input-weight`、`data-rive-circuit-hover === "true"`、`data-rive-fit`。onLoad：color/weight 输入置 true；赛道选择 `H(name)`（L9822–9829）：先把所有不以 color_/weight_ 开头的 Boolean 输入清 false，再置 name 为 true；初始 `H(data-rive-input-track)`。
hover（L9839–9857）：仅 `data-rive-circuit-hover="true"` 时启用；监听全部 `[data-rive-circuit-hover-target]`：mouseenter → `H(目标名)` + `[data-rive-circuit-hover-text]` 文本改为赛道名；mouseleave → 恢复默认。（hover-text 在镜像 HTML 0 处出现，死路径。）

### 2d. btn-ui `C4()`（L9869–9923）
artboard 默认 "arrow"、SM 默认 "arrow"、autoplay true。hover 载体：canvas 向上最近 `[data-btn-rive-hover]` 祖先（找不到用 canvas）。输入 "hover"：mouseenter/touchstart → true，mouseleave/touchend → false。（canvas 上 `data-rive-hover`、`data-rive-btn-invert`、`data-btn-rive-rotate` JS 均不读。）

### 2e. phrases `K4()`（L9995–10040）
属性：`data-rive-artboard`、`data-rive-state-machine`（必填）、`data-rive-scrolltrigger === "true"`、`data-rive-scrolltrigger-target`、`data-rive-scrolltrigger-start`（默认 "top 80%"）、`data-rive-fit`。`autoplay = !scrolltrigger && !hero`。hero → 标记+pause；scrolltrigger → CH。

### 2f. ln4 `nR()`（L10042–10096）
选择器 `canvas[data-rive-ln4]`，file DB.logo，artboard "logo"、SM "logo"、autoplay true。inputs：`logo-active`（onLoad true）、`hover`、`color_dark-green`、`color_white`、`color_lime`。canvas mouseenter/mouseleave/touchstart/touchend 切 hover。实例进 JH。

### 2g. mob-landscape `aR` 类（L10190–10251），工厂 `rR()`（L10253）
canvas `canvas[data-rive-mob-landscape]`，遮罩 `[data-mob-landscape]`。手机 UA（排除 iPad/Tablet）+ 横屏 → display flex + 懒初始化：SM "mob-landscape"、autoplay true、Fit.Cover；竖屏 → display none + pause。只在 `innerWidth <= 991` 构造（L46223）。destroy() 走 Q4。

### 2h. page-transition `BL()`（L41686–41722）
不走 DB 缓存，src=cj，canvas = `.transition-w` 内 `canvas[data-rive-primary]`（L41746）。artboard/SM "page-transition"，autoplay true，Fit.Cover、Alignment.Center。onLoad 找 `initial`/`transition-out`/`transition-in` 存 xJ，初值 I=true,C=false,K=false，`ZK.style.backgroundColor="transparent"`；单独 resize 监听。
- 出场 `EL()`（L41724）：遮罩 visible+pointerEvents auto；initial=false, transition-in=false, transition-out=true。调用：lL() L46304。
- 入场 `H$()`（L41732）：initial=false, transition-out=false, transition-in=true；100ms 后 `.transition-btn` opacity 0；500ms 后遮罩 hidden + 按钮 display none。调用：mL() 1000ms 后（L46229）、cL() 500ms 后（L46239）。
- 转场时长常量 `v$ = 1000`（L46337）。

### 2i. 播放辅助 `CH`（L9545–9571）与 `o0`（L10138–10189）
`CH(canvas, rive, trigger, start = "top 80%")`：opacity 0 + transition 0.1s；play 后 50ms pause（预热首帧）；ST `{trigger, start, once:true, onEnter: setTimeout(() => {opacity=1, play()}, 0)}`；无 ST 时 IO 兜底 `{threshold: 0.1, rootMargin: "0px 0px -10% 0px"}` isIntersecting 后 100ms play。
`o0()`：hero rive 点火。未 loadingComplete 时 500ms 轮询（上限 10s）；对 hero 容器内 canvas：SM 含 "_scroll" 跳过；play() + "play" Boolean 输入置 true；实例未就绪 200ms 重试。调用：首载 init 后 `setTimeout(() => { k0(), o0() }, 750)`（L46181–46208）；转场进入 `setTimeout(..., 50)`。

## 3. 滚动驱动 `oR()`（L9573–9667）

SM：名含 `_scroll`（HTML 实际：helmet-reef_scroll、signature_scroll、3d-helmet-reef_scroll）。
- 输入名固定 `"scroll"`（L9578），找不到报错。
- 映射（L9588–9592）：paused timeline（内含 `U.to({}, {duration:1})`），onUpdate：`I.value = clamp(0,1,progress) * 1000`（量程 0–1000）。
- ST（L9598–9621）：trigger = scrolltrigger-target（空→canvas），`start: K || "top bottom"`，`end: J || "bottom top"`，`scrub: 0.5`；onUpdate `U.progress(H.progress)` + 未播则 play；onEnter play+scroll=0；onLeave scroll=1000+50ms pause；onEnterBack play；onLeaveBack scroll=0+50ms pause。存 `canvas.riveScrollControl = {timeline, scrollTrigger}`。
- lenis 甩尾（L9625–9638）：`lenis.on("scroll", H)` 存 canvas.lenisScrollHandler。trigger 激活时读 velocity，`|v| > 100` 时：v<0 && progress<0.1 → scroll=0；v>0 && progress>0.9 → scroll=1000。
- 无 GSAP 兜底（L9640–9666）：手算 `N/R`（R = rect.height + innerHeight，N = innerHeight - rect.top），scroll = p*1000；仅 0<p<1 播放，经 m.ticker。
- 导航菜单 reef（`canvas[data-rive-nav-object]`，helmet-reef_scroll）由 kL() 菜单时间线驱动（L44193–44213）：`X.to(F, {value:1000, duration:1.7, immediateRender:true}, 0.2)` onUpdate 写 round(F.value) 进 scroll input；实例初始化后 pause（L44120），open 时 play + scrollInput=0（L44131），reverse 完成 pause。canvas 属性：data-rive-file（默认 reef）、data-rive-artboard（默认 helmet-reef）、data-rive-state-machine（默认 helmet-reef_scroll）、data-rive-color-input（HTML: color_green-off-white-2，onLoad true，L44113）。

## 4. 导航 rive 接线

汉堡 `iR()`（L9925–9993）：容器 `[data-nav-ham]`，canvas `canvas[data-rive-nav-hamburger]`，file btn-ui，artboard/SM 默认 "hamburger"。inputs：hover、close、color-transparent、color-white（缺一报错）；`E.riveInputs = J, dK = J, e2 = K`（L9967）。初始主题：`[data-nav-theme] === "light"` → color-white=true，否则 color-transparent=true。ARIA：aria-label="Open menu"、aria-expanded="false"、tabindex="0"。事件：mouseenter/leave 切 hover；touchstart preventDefault + hover=true；touchend preventDefault + hover=false + 翻转 KI→close+aria；click 翻转 KI；keydown Enter/Space → click()。
- `g8(A)`（L9438）：close 置值 + 全部 [data-nav-ham] aria 同步 + KI=A。
- `HE(A)`（L9446）："transparent" → transparent=true,white=false；"white" → 反之。
- 页面强制白色：on-track `_$` L45783、calendar `b$` L46108、404 `h$` L46151：`[200, 200].forEach((Q) => setTimeout(() => { HE("white"), AC("white") }, Q))`。
- ln4 联动：`pK(A)`（L10098）批量写 logo-active；`AC(A)`（L10108）互斥写 color_*（black/默认 → dark-green）。首页 hero：桌面 `.top-marker` ST onEnter → pK(false)、onLeaveBack → pK(true)；移动 scroll `scrollY <= 10 ? pK(true) : pK(false)`。

## 5. riv × 页面矩阵

全页面共有：nav 汉堡（btn-ui/hamburger）、ln4 logo、nav reef（helmet-reef_scroll + color_green-off-white-2）、mob-landscape（≤991）、page-transition 遮罩。

| riv | artboard/SM | 页面分布 |
|---|---|---|
| page-transition | page-transition，输入 initial/transition-out/transition-in | 全页 |
| btn-ui | arrow/arrow（hover）；hamburger（hover,close,color-transparent,color-white） | 全页。arrow：home 6、on-track 7、calendar 5、off-track 1、其余 1 |
| ln4 | logo，输入 logo-active/hover/color_dark-green/color_white/color_lime | 全页 |
| mob-landscape | mob-landscape | 全页 ≤991 横屏 |
| reef | helmet-reef（_play/_scroll）、reef（reef_play）、3d-helmet-reef（_scroll）、off-icons、off-icons-reef（_play）；色输入 color_lime/color_green-off-white-2/color_grey-on-track | home ×5；on-track ×13（3d-helmet-reef_scroll target .on-track-impact-reef-rive-w）；calendar ×2；off-track ×4 |
| signature | signature（_play/_scroll），色输入 color_lime/color_dark-green-tint-2/color_grey-on-track | home ×2（_scroll target .hero-rive-tracker start "top center" end "bottom 80%"；footer _play）；on-track ×3；off-track ×3（_scroll target .base-helmet-rive.off-track-impact start "top 50%" end "top 10%"）；calendar ×2、legal ×1 |
| circuits | circuits，赛道 Boolean + color_*/weight_* | home ×1（zandvoort）；on-track ×4（monaco hover=true + color_black）；calendar ×2 |
| phrases | phrase_on、collabs/page_home、phrase_p1、race-day，均 scrolltrigger=true（start 多 "top center"，race-day 默认 "top 80%"） | home ×2；on-track ×3；calendar ×1 |

初始化链：首载 `mL()`：rR()（≤991）→ nR(), S1(), iR() → 500ms 后 kL(), V$() → 1000ms 后 H$()；转场进入 `cL()`：V$(), S1()（不再跑 nR/iR/kL，导航层跨转场持久）。
杂项：window.riveInstances 只读从未创建（L44123 死代码）；window.transitionRiveInputs 置 null 后从未赋值；线上 /partnerships 是 404 变体（页面已下架）。
