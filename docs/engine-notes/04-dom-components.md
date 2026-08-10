# DOM 组件层移植规格（全部 GSAP 参数逐字）

## 0. 基础设施
- 断点：跨 992 整页 reload（KD 75-89，150ms 防抖）；GL 内部 768；marquee/nav 479/480。
- 视口检测：ST（标准配方 start:"top 90%" once:true）+ IO（marquee 43305 rootMargin "200px 0px"；stat/podium 45092/45216 threshold 0.1；rive 兜底 9559）。
- L$() 副作用：先 TA.getAll().forEach(kill) + clearMatchMedia() —— **必须最先调**。
- 转场清理大量用 cloneNode 替换剥离监听（yL 45797、q8、M_）——组件需幂等可重建。
- 色表：--color--lime #d2ff00、--color--black #111112、--color--dark-green #282c20、dark-green-tint-1 #3b3c38（GL 侧 #363B25）、--color--white #f4f4ed、lime-off #b2c73a。
- 三大揭示配方：①线性 inset+色条（0.6/0.6/行距0.15/色条+0.3）②椭圆 clip（0.8/0.6/-0.4）③卡片 elastic.out(1, 0.75)。

## 1. 组件明细

### data-heroflip（home 版 _L 45620-45777，GL 头盔）
[data-heroflip="track|pos1|pos2|pos3"] + [data-gl="helmet-scroll"]。canvas 挪进 track（absolute zIndex 10）；两段三次贝塞尔（CP1=(p0.x, p0.y+(p1.y-p0.y)*0.4), CP2=(p1.x, p1.y-(p1.y-p0.y)*0.3), CP3=(p1.x, p1.y+(p2.y-p1.y)*0.3), CP4=(p1.x+(p2.x-p1.x)*0.6, p2.y-(p2.y-p1.y)*0.2)）。
ST①：trigger track, start "top top", end "bottom 25%", scrub true, invalidateOnRefresh；onUpdate 手算点位宽高（p≤0.5 第一段），写 landoGL.bounds.helmetScroll 与 helmetScrollScene.PROGRESS。
ST②：start "bottom center", end "bottom+=innerHeight center" → REVEAL_OUT_PROGRESS。resize 200ms 防抖重建。返回 {cleanup, toggleDebug}。

### data-heroflip（off-track 版 z_ 45830-45980，纯图）
[data-heroflip="img"]；从 .is-off-t-hero-scroll-media .off-t-hero-scroll-meda-img 收集 src 生成 .hero-img-layer 层叠。CP1 y 系数 0.8；CP2 y 位移 min(800, Δy*0.3)；CP3 min(80, Δy*0.3)。MotionPathPlugin：
timeline ST {trigger track, start: ≤991?"20% top":"top top", end: ≤991?"bottom 80%":"bottom center", scrub, invalidateOnRefresh} .to(img, {duration:1.5, motionPath:{path, autoRotate:false}, ease:"none"})；onUpdate floor(p*N) 切图层 + 宽高插值。

### data-sticky-hero DOM 序列（Z_ 44665-44721）
初始：msg chars y "100%"；imgs autoAlpha 0 y "1rem"；mob1 clipPath "ellipse(110% 110% at 50% 0%)"。
TL①（trigger .hero-eyebrow-tracker, start "top bottom", end "center bottom", scrub)：mob1 → "ellipse(100% 0% at 50% 0%)" 0.8 power3.out；mob2 chars y "-100%" 0.8 stagger 0.02 power3.out @"<"。
TL②（end "bottom bottom"）：msg chars y 0, 0.8, stagger 0.02, power3.out；imgs autoAlpha 1 y 0 0.8 power3.out @"<0.3"。清理 W_ 44933。

### data-horizontal-section（Z8 43293 → I_ 43158，仅桌面）
section 高度 = trackWidth - innerWidth（CSS sticky，非 pin）；resize setTimeout 200 重算+TA.refresh。主 tween（存 ML Map 43750）：m.to(track, {x: -(trackWidth-innerWidth), ease:"none", scrollTrigger:{trigger:section, start:"top bottom", end:"bottom bottom", scrub:1, invalidateOnRefresh}})。
图片视差（43213）：ST {trigger:item, containerAnimation:主tween, start:"left right", end:"right left", scrub}，x = 4*progress rem（onEnter 预设 -4*(1-left/innerWidth) rem）。
C_ 43232 横向段文字揭示：前两组普通 ST（top 90% once），其余 containerAnimation start "left 95%" once；配方①。清理 H8 43297。

### data-oval-scroll（e0 42555-42640，仅桌面）
值 "top"（默认）/其他=bottom。每 .line 包 .oval-line-clip-wrap + .oval-outer-wrapper{overflow:clip}。初始 wrap clipPath "ellipse(20% 0% at 50% 0%)"（bottom: at 50% 100%），line y "-40%"（bottom "40%"），chars 同。paused TL（el._ovalScrollInstance）：
wraps → "ellipse(100% 120% at 50% 0%)" delay 0 duration 1.5 power2.inOut stagger 0.15；每行 line → y 0 1.5 power2.inOut delay 0.15+0.1*行号；每行 chars → y 0 1.5 power2.inOut delay 0.15*行号 stagger {amount: 0.015*字符数, from:"center"}。
非 hero 容器时自建 ST {trigger, start "top 95%", once, onEnter play}。

### data-anim-high（AE 42642-42715，仅桌面）
值 "方向,颜色,延迟ms"（默认 "right, lime, 0"）；色表 42657。Q=0.6 揭示、B=0.6 色条、E=0.15 行间隔。每 .line：clipPath "inset(0 100% 0 0)"（left: "inset(0 0 0 100%)"）+ 注入 .high-line-reveal（scaleX 1）。TL：行 → inset 0 @行号*0.15 duration 0.6 power2.out；色条 scaleX 0 duration 0.6 power2.inOut @行号*0.15+0.3。ST top 90% once（hero 除外）。

### data-stat-list（UZ 42717）
可选 data-reveal-direction/color/delay。TL {ST: trigger list "top 90%" once, delay}；item clipPath inset 揭示 0.6 power2.out @序号*0.05；.item-reveal scaleX 0 0.6 power2.inOut @+0.3。

### data-car-counter（NL 42892）：按原文本位数补零；ST top 90% once；m.to({val:0}→target, 1s, power1.out)，含逗号 toLocaleString 否则 padStart。

### stat hover 跟随图（T$ 45083-45195，仅桌面）
[data-mouse-track]（内 .f1-highlight-mouse-over-reveal 色板 + img）absolute overflow hidden clipPath "ellipse(120% 0% at 50% 0%)" zIndex 10 pointerEvents none。paused TL：容器 → "ellipse(120% 120% at 50% 0%)" autoAlpha 1 0.8 power2.out；色板 → "ellipse(120% 0% at 50% 100%)" 0.6 power2.out @"-=0.4"。mouseenter play；mouseleave timeScale(2).reverse()；mousemove m.to(track, {x:relX+20, y:relY-20, 0.5, power2.out})；[data-stat-item] mouseover 用其 .display-none [data-stat-hover-img] src 换图。全局 mousemove+scroll 兜底（IO threshold 0.1 维护可见集）。

### data-podium（L_ 45052 视差 + V_ 45197 刮图，V_ 仅桌面）
L_：[data-podium="text"] 初始 y ≥992?"17.5rem":"4rem" → 0 power1.in，ST {trigger [data-podium="wrap"], start "top bottom", end "bottom center", scrub}；.text-on-t-stat-label-gigantic .char 第 2 字符 → y ≥480?"-17.5rem":"-6rem" power1.in 同 ST。
V_：结构同 T$（0.8/0.6/-=0.4）；[data-podium-media] 多 img 序列帧，W(relX, width) floor(f*N) 换 src —— 左右刮出名次照片。

### data-social-callout（q8 43437-43713）
克隆替换清理。7 张 .callout-socials-card-w；桌面/移动姿态表（scale 0.7756/0.8498/0.9346/1、rotation ±21/±14/±7/0、x ±30/22/11（移动 ±15/11/6）、y 7.3/4/1.3/0、zIndex 1/2/3/10）。初始 set {x:0, y:"10rem", scale:1, rotation:0}。TL {ST trigger wrap "top 90%" once, onComplete 启 hover}：
.to(cards, {y:0, 0.8, power2.out, stagger {amount:0.5, from:"end"}})
.to(cards, {姿态, 1.2, elastic.out(1, 0.75), stagger {amount:0.2, from:"center"}}, "-=0.4")。
hover G() 43558：该卡 y-2.5rem scale*1.08 0.5 elastic.out(1,0.75) overwrite auto；两侧按距离推开 8*p*c rem、rotation ±3/(距离+1) @距离*0.02；离开 50ms 防抖回位。resize 无 hover 时重排。

### data-home-swipe（$_ 44826-44909，<992）
按钮 .btn-rive-w.is-unlocked/.is-locked 切换；desc y "100%"↔"0%" 0.3 power2.out。点击：lenisStop + scrollTo(0,{duration:0})（锁）/lenisStart（解）；aria-pressed/data-scroll-disabled 同步。浮层 ST {trigger ".top-marker", start "top 95%", end "bottom top", onToggle autoAlpha 1/0 + pointerEvents, 0.3, power2.out}。清理 D_ 44912。

### data-otot（H_ 44723 + k$ 44760）
H_：is-1/is-2 img 初始 x "-20rem"/"20rem" → 0 power2.out，ST {trigger section, start "top bottom", end "bottom bottom", scrub}；两列文字 x "-5rem"/"5rem" → 0 ease none，end "60% bottom"。
k$：[data-otot-bottom] img → y "-20vh" scale 1.1 ease none，ST {start "top bottom", end "bottom top", scrub}。清理 X_/F_ 44945。

### Vimeo（U_ 44409-44584）
单例。init({selector:"[data-video-stream]"}) 注入 player.vimeo.com/api/player.js；属性 data-stream-url（视频 id）/source（"vimeo"）/muted/loop/autoplay/hover。iframe `https://player.vimeo.com/video/{id}?autoplay=…&loop=1&muted=1&background=1&transparent=0&dnt=1` → .iframe-wrapper。cover 布局按 wrap 宽高比放大 width%/height%；resize 重算。hover：wrap enter play/leave pause，placeholder opacity 0.3s；.hover-indicator "Playing…"/"Hover to play"；visibilitychange 暂停。
⚠️ bundle 只调 destroyAll（YZ 44406，home/off-track 清理）；init 无调用点 —— 待确认（可能死代码）。

### marquee（O$ 43303-43372）
[data-marquee-scroll-direction-target] IO 懒初始化（rootMargin "200px 0px"）。dataset：marqueeSpeed/Direction（right=1）/Duplicate/ScrollSpeed。速度系数 <479→0.25, <991→0.5, 否则 1；duration = speed*(collection宽/视口宽)*系数。scroll-target marginLeft -scrollSpeed%、width scrollSpeed*2+100%。主 tween：m.to(collections, {xPercent:-100, repeat:-1, duration, ease:"linear"}).totalProgress(0.5)，初始 xPercent dir==1?100:-100，timeScale(dir)。方向反转 ST {trigger, start "top bottom", end "bottom top", onUpdate timeScale(±dir)} + data-marquee-status。滚动位移 TL {ST scrub 0} fromTo x ±Xvw。观察者存 window._marqueeObservers；清理 LL 43374。

### PL（44586-44658，home）
[data-gl-change-track] 读 data-gl-change-from/to（色名或 "bg,fg" 对）、-trigger-start（默认 "top top"）、-end（默认 "bottom bottom"）；m.fromTo({progress:0}→1, {ST scrub, invalidateOnRefresh, immediateRender}) onUpdate interpolate 混色写 landoGL.params.backgroundScene.COLOR_* + body.style.backgroundColor。

### 其他
- data-img-highlight（fJ 42828）："top|bottom,色,延迟"；配方②（0.8/0.6/-=0.4）；ST trigger wrapper "top 80%" once。
- data-helmet-grid（ZZ 43392，home/on-track 桌面）：4 列错位 列号*5rem → 0，ST {trigger grid, start "top bottom", end "bottom top", scrub}。
- data-exe-visor（q_ 44778）：ellipse(70% 0% at 50% 0%)→ellipse(70% 100% at 50% 0%) ease none，ST {start "top bottom", end "bottom center", scrub}；data-exe-section（Y_ 44795）：img y 0→"-4rem" ease none。
- 滚动指示条（qZ 43757）：bar 高 clamp(10,25, vh/scrollH*100)%；m.to(bar,{y, 0.3, power2.out})；500ms 无滚动 autoAlpha 0 0.5s 淡出。
- data-countdown-wrap（S$ 45002）：[data-countdown-date-target] "DD/MM/YYYY HH:MM" 按 Date.UTC 解析；4 个 [data-countdown-digit] 每秒 padStart(2)。
- .camp-collection-w（bJ 43715，partnerships/off-track）：成对图 x "-4rem"/"4rem"→0 power2.out，ST {trigger item, start "top bottom", end "bottom center", scrub}。

## 2. Calendar 组件群（j$ 45289-45618）
纯 DOM 解析（[data-cal-wrap] 内 [data-cal-item] 是 CMS 烘焙数据源；[data-cal-track-wrap] 内 [data-cal-target=字段] 是投影目标）。
- 日期 [data-cal-list="date-actual"] split(/[\/ :]/) → new Date(年,月-1,日)（本地时区；倒计时用 UTC，不同——照抄）；< 今日0点 → .is-in-past。
- 排序后当前 index = 第一个 date >= today，否则最后。
- 投影特殊值：past-reveal/past-hide（display 切）、circuit-flag（img.src）、circuit-about（innerHTML）、results（过去场按钮改 "Schedule"）；过去场映射 prac1-time→prac1-time-result、prac1-date→prac1-time-pos …（prac1/2/3、qual、race）。
- circuit-id 文本写 landoGL.params.tracksScene.CURRENT（45368）。
- Sprint：item 含 [data-cal-sprint="true"]:not(.w-condition-invisible) → label practice2→"Sprint Quali"、practice3→"Sprint"；否则复位。
- 入场 TL {ST trigger trackWrap "top 90%" once}：.cal-target-wrapper clipPath inset(0 100%→0% 0 0) 0.5 stagger 0.015 power2.out；.cal-target-reveal scaleX 0 0.5 stagger 0.015 power2.inOut @"-=0.2"。切换 N(i)：out inset→100% 0.5 stagger 0.015 power2.in → call 投影 → set reveals scaleX 1 → in。
- data-cal-control="next-item/previous-item" 循环 ±1；列表项点击 → 设当前 + lenis.scrollTo(trackWrap 上方 8rem, {duration:1.2, easeInOutQuad t<0.5?2t²:1-(-2t+2)²/2})。
- data-calendar-history 手风琴（S_ 46059）：wrap>item>trigger/content；display none；aria 补齐 + Enter/Space；同 wrap 互斥；展开 10ms 后若 top<0||top>30%vh → lenis.scrollTo(item, {offset:-100, duration:0.5})。

## 3. 文字系统
- SplitText 管理器 N$/JZ（42438+43129）：[split-text] 属性值即 type（默认 "lines,words,chars"）；CI.create(el, {tag:"span", linesClass:"line", wordsClass:"word", charsClass:"char", aria:"auto", type})；切分前克隆纯文本节点加 screen-reader 属性，原元素 aria-hidden。转场进入 RZ=new N$ 全量重切。
- OL [split-rich-text]（42992，partnerships-item）："方向,色,延迟"；h1-h6/p/span/div 逐个 create {type:"lines, words", tag:"div"}（[split-center] flex center）；配方①；ST top 90% once。
- GZ（42943）= Q_+A_（display flex）+B_（"position"：/^(\d+)([a-zA-Z]+)$/ 拆数字+上标 span，数字 1 lime 否则灰）+E_（"round"：补两位）。on-track/calendar 调用。
- QE [data-anim="text-hover"]（42775，仅桌面）：mouseenter chars y 目标 0.6 stagger 0.02 power3.out overwrite；leave y 0。位移 .nav-menu-link-w <480?"-4.3rem":"-5.25rem"，其余 "-100%"。

## 4. 导航
- L$（43847）：先 kill 全部 ST + clearMatchMedia；创建 .top-marker（absolute top 0 h 10vh zIndex -1）；lenis.scrollTo(0, immediate)；TA.refresh(true)。桌面：brand+btns scale 1.2 → 1，ST {trigger ".top-marker", start "top top", end "bottom top", scrub, invalidateOnRefresh, onEnter pK(false), onLeaveBack pK(true)}（50ms 后建）。.home-hero-next-race-w：ST {trigger body, start "1px top"} onEnter 加 .hidden/onLeaveBack 移除。移动：scroll scrollY<=10 ? pK(true) : pK(false)。partnerships-item/404 隐藏 brand（k_/j_ visibility hidden）。
- V$（43910）：[data-nav-theme] 根 + [data-nav-theme-target] 区段 ST {start "top top", end "bottom top", onEnter/onEnterBack 切}（存 window.themeScrollTriggers）；失败回退 scroll 100ms 节流最小 |rect.top|；K() 200ms 冷却写回属性；light → HE("white")+AC("white")；dark → HE("transparent")+AC("black")；home 首次 window.homeLogoColorSet；riveAllLoaded 重建；1000ms 后 TA.refresh。
- kL（44001-44398）菜单：初始 菜单 clipPath "ellipse(120% 0% at 50% 0%)" display none；图 clip 同 + y 25；链接 "ellipse(30% 0% at 50% 0%)" y 20；bg autoAlpha 0。
  开启 TL X（paused）onStart lenisStop+display flex+rive scroll 归零播放；onReverseComplete lenisStart+display none+rive pause：
  容器 → "ellipse(120% 100% at 50% 20%)" 0.8 power3.out @0；图（按 data-nav-img 序号）同 clip + y 0 0.8 stagger 0.06 power3.out @0.15；链接 同 clip + y 0 0.6 stagger 0.08 back.out(1.2) @0.35；菜单头盔 rive value→1000 1.7 immediateRender @0.2；bg autoAlpha 0.12 0.6 @0.6；当前页下划线 SVG strokeDashoffset 0 0.6 stagger 0.05 power2.inOut @0.4（反向：回满 0.4 stagger 0.03 power2.in @0）；[data-nav-link-highlight] inset 0 + y 0 0.7 stagger 0.04 back.out(1.1) @0.5、色条 scaleX 0 0.6 stagger 0.05 power2.inOut @0.7（反向：色条 scaleX 1 0.2 stagger 0.03 power2.in @0、行 inset 100% y 15 0.3 stagger 0.03 power3.in @0.1）；链接反向 "ellipse(30% 0%...)" y 20 0.3 stagger 0.02 power2.in @0.1。
  T() 44286：开 = X.timeScale(1).play() + 主题暂存强设 "light" + HE("transparent") + .nav-middle {opacity 0, 0.4, power2.out} + g8(true)；关 = 恢复主题 + HE(theme==="light"?"white":"transparent") + g8(false) + X.timeScale(1.5).reverse()。click/touchend(preventDefault)/Enter+Space；window.closeNavigation = V。
  菜单内：mousemove 两列图 y ∓(clientY/vh-0.5)*2*6 rem 2s power2.out overwrite auto；链接 hover 预览图：当前页图 0.5，hover 图 opacity 1 0.2 power2.inOut，其余 0 0.3，离开 50ms 回当前页 0.5。
- 移动端 .nav-middle 在 home y "3.5rem"（44927），离开复位（44981）。
