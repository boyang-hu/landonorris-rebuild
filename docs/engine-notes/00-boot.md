# Boot 流程与模块地图

## 1. Boot（47100-47119）

```
vC(); EZ(); q$();                 // Rive 环境 / landoGL+RQ / 过渡遮罩环境
console.time("debug");
history.scrollRestoration = "manual";
window.scrollTo(0, 0);
c_():
  1. await BL()                              // page-transition.riv，initial=true 保持覆盖
  2. await Promise.all([eM(), m_()])         // eM=bI.load()（DOM complete + 全 GL 资产）；m_=等 allriveloaded + kI()
  3. Promise.all([(aL(), nL), (EV(), BV)])   // taxi 装配（构造时即 initialLoad→mL()）+ Lenis
  4. CD()                                    // console banner
```

## 2. 顶层模块
- CD()（56-73）：banner。
- vC（10263-10280）：jQ=rive runtime；LB()；UI/p6/DB/window.loadedRiveFiles 等。
- EZ（41535-41685）：iQ 断点、window.landoGL 全量、eR.isWebGL2Available() ? bI=new RQ : html.gl-fallback。
- q$（41745-41749）：mj/cj、ZK=.transition-w、IZ=canvas[data-rive-primary]、Z$=.transition-btn（transition: opacity 300ms）、xJ={}。

## 3. taxi 装配（aL 46377-46467）
- vendor：selector-set（b0 41751-41937）、@unseenco/e（qL 41993-42062，单例 MC 42067）、@unseenco/taxi（LC Transition 42108、G8 Renderer 42145、KZ 42193、hU Core 42209-42427）。
- oL extends LC（46381-46417）：onLeave：派发 page-transition-start → body.is-transitioning → lL(from.dataset.page) → setTimeout(done, v$=1000)。onEnter：cL(to.dataset.page) → 移除 class → 派发 page-transition-end。
- iL extends G8（46418-46455）：initialLoad() → mL()；onLeave 清 window.trackingStyles。
- y_ = new hU({renderers:{default:iL}, transitions:{default:oL}, removeOldContent:true, allowInterruption:false, bypassCache:false})（46456）。
- 链接拦截选择器（默认，42216）：`a[href]:not([target]):not([href^=#]):not([data-taxi-ignore])`；meta/ctrl 放行；跨 host 放行；同 host preventDefault + navigateTo；mouseenter/focus 预取（42347/42367）。
- navigateTo（42257）：fetch（X-Requested-With: Taxi，42380）→ pushState（42299）→ renderer.update() 替换 [data-taxi-view]（42162）→ 必要时 replaceState；popstate 42360；失败回退整页跳转。
- reloadJsFilter：只有带 data-taxi-reload 的 script 重新执行（42227）；CSS 全重载（42228）。
- sL 模块（46340-46370）：v$=1000；oB 页面枚举 {HOME:"home", ON_TRACK:"on-track", OFF_TRACK:"off-track", PARTNERSHIPS, PARTNERSHIPS_ITEM, CALENDAR, BLOG, STYLE, NOT_FOUND}；g$ 事件名。

## 4. 页面识别与生命周期
- 识别：`document.querySelector("[data-page]").dataset.page`（46167）；taxi from/to = [data-taxi-view] 元素 dataset.page。
- 首页判断辅助（43932）：body.is-home || pathname === "/"。ID()（46-54）按 href===pathname 加 w--current。

### mL() 首屏（46166-46235）
readyState complete 后：BD()（is-safari/is-iphone）→ KD()（跨 992 断点整页 reload，L81）→ ≤991 时 rR() → YK=qZ()（滚动指示条）→ RZ=new N$（SplitText 全量切分）→ L$()（⚠️ 先 kill 全部 ST）→ nR() → S1() → iR() → 500ms 后 kL()+V$() → AL()（bI.init()）→ 按 data-page 分发页面 init → O$()（marquee）→ 各 init 后 750ms k0()+o0() → 1000ms 后 H$()。

### 页面 init/destroy 矩阵
| data-page | init | destroy |
|---|---|---|
| home | w$ 44924（q8+Z_+Z8+H_+k$+桌面 ZZ+q_+Y_+移动 $_+PL+桌面 e0/AE/QE） | TL 44979 |
| on-track | _$ 45779（S$+Z8+L_+k$+桌面 T$/V_+ZZ+_L+j$+q8+HE/AC white+e0/AE/QE+GZ+fJ+NL+UZ） | yL 45791 |
| off-track | x$ 45982（Z8+bJ+z_+q8+桌面 e0/AE/QE） | xL 45989 |
| partnerships | f$ 46002（e0/AE/QE+bJ+q8） | bL 46009（空） |
| partnerships-item | WZ 46041（e0/AE/QE/Z8/OL/fJ+bJ+k_+P_） | vL 46050 |
| calendar | b$ 46106（e0/AE/QE+fJ+UZ+GZ+S$+S_+HE/AC white+T$+j$） | 无（default） |
| not-found | h$ 46150（j_+T_+HE/AC white） | dL 46158 |
| style | 空 | — |
| default | e0()+AE()+QE() | — |

### 转场
- cL 进入（46237-46295）：500ms 后 H$()；scrollTo(0,0)；ID() → YK.reinit() → RZ=new N$ → V$() → L$() → S1() → O$() → ED()（Webflow destroy+ready）；home/on-track/calendar/not-found 加 yU()；init 后 50ms k0()+o0()。
- lL 离开（46297-46336）：window.closeNavigation() → YK.cleanup() → LL() → EL()；1000ms 后 QL() + 页面 destroy。

## 5. Lenis 管理器 QV（47020-47098）
- 配置：{infinite:false, lerp:0.1, smoothWheel:true, touchMultiplier:1.25, autoResize:true, syncTouch:true}，wrapper=documentElement、content=body（两分支相同，怪癖）。
- lenis.on("scroll", TA.update)；m.ticker.add(t => lenis.raf(t*1000))；lagSmoothing(0)。
- 跨 991 resize：destroy + 重建 + scrollTo(旧位置, immediate) + TA.refresh()。
- window.lenis / lenisStart / lenisStop；window.landoGL.lenis = this.lenis（47049）。

## 6. 全文件区段地图（vendor）
1-32 esbuild；34-89 工具（BD 34、ED 41、ID 46、CD 56、KD 75）；90-5042 Rive runtime UMD；5043-6743 GSAP core+CSSPlugin；6744-7729 Observer；7110-8771 ScrollTrigger；8772-9071 paths/matrix；9072-9272 MotionPathPlugin；9273-9406 SplitText；10281-10333 WebGL 检测；10334-30143 three core；30180-30712 OrbitControls；30930 BufferGeometryUtils；32012-32500 postprocessing；33274-33996 MSDF 栈；35883-38003 lil-gui+stats-gl；38127-38425 DRACOLoader；38426-40201 GLTFLoader；40202-40373 RGBELoader；40374-40454 FontLoader；40455-41230 KTX2 栈；41751-41937 selector-set；41938-42068 @unseenco/e；42070-42433 @unseenco/taxi；46469-47010 Lenis。

应用代码区段：9408-9436 LB；9438-10280 vC Rive 系统；30144-30175 相机/渲染器；30715-32011 head 场景群；32502-33061 tracks；33072-33174 background；34002-34177 carousel；34185-34413 helmet-scroll；34421-34753 not-found；34761-35625 噪声/流体/idle；35706-35882 World/Time/Sizes；38004-38126 Debug/Mouse/Chunks；41231-41534 Assets/RQ；41535-41749 EZ/q$；42438-43156 文本组件；43158-43754 横向/跑马灯/社交卡片；43755-43845 滚动指示条；43847-44404 导航；44406-44584 Vimeo；44586-44663 PL；44665-45000 home；45002-45828 on-track 组件群；45830-46000 off-track；46002-46164 其余页面；46166-46375 sL 生命周期；46377-46467 taxi 装配；47011-47099 Lenis 管理器；47100-47121 入口。

## 7. 移植要点
1. 加载顺序硬依赖：page-transition → (GL+rive) → taxi/Lenis → mL；遮罩 1000ms 后揭开。
2. [data-taxi]/[data-taxi-view]/[data-page] 三件套 + [data-gl] 驱动场景。
3. 992/991 断点：跨断点整页 reload；>991 桌面动画；>991 webp 否则 ktx2。
4. ?debug 开 lil-gui+stats；变体 50% 随机 Google，否则 6-18 点 Lime 否则 Dark。
