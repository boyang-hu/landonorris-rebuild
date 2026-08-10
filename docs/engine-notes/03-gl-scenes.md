# WebGL 场景群逆向笔记（three.js r174）

## 0. 混淆名速查表

**核心框架**
| 混淆名 | 真身 | 行号 |
|---|---|---|
| RQ | 全局 GL 单例 | 41447 |
| l9 | World（场景工厂 + fluidCursor + idleState + backgroundNoise） | 35706 |
| $9 | Renderer 封装 | 30156 |
| Y9 | 合成相机（1 unit = 1 px） | 30144 |
| BZ | Assets 加载器 | 41231 |
| s9 | Time（getVariantAccordingToTime） | 35856 |
| o9 | Sizes（pixelRatio 分级） | 35879 |
| e9 | Mouse（eased 工具族） | 38021 |
| c9 | IdleState（闲置假光标） | 35576 |
| AZ | ShaderChunks（rotateUV） | 38117 |
| t9 | Debug（dat.GUI + stats-gl） | 38004 |
| PJ | EventEmitter | 35794 |

**场景类**（都有 renderPlane + renderPipeline() + update()）
| 混淆名 | id | 行号 |
|---|---|---|
| O9 | "head" | 31392–32001 |
| k9 | "tracks" | 32945–33061 |
| w9 | "background" | 33072–33174 |
| _9 | "carousel"（MSDF 文字） | 34002–34177 |
| y9 | "helmet-scroll"（heroflip） | 34185–34413 |
| x9 | "not-found" | 34421–34753 |

**场景内部**：W9 HeadDefault 30715；F9 Helmet 31165；N9 灯光 31382；I8 Disco 彩蛋 31097；i5 迪斯科球材质 31016；o5 lens flare 30947；z9 Tracks 几何 32516；V9 Track point 32502；f9 BackgroundNoise 34761；m9/p9/wJ 流体 35544/35421/35075；b9,h9,v9,g9,u9,d9 流体 pass 34986/35114/35187/35258/35315/35385；MU MSDFTextGeometry 33727；VU MSDFTextMaterial 33990。

**vendor**：M9 CopyShader 32013、xI Pass 32050、FU FullScreenQuad 32060、CY ShaderPass 32093、JY EffectComposer 32149、UY RenderPass 32231、IN LuminosityHighPass 32255、CK UnrealBloomPass 32317、30817 mergeGeometries、33179–33726 word-wrap+layout-bmfont-text、35888 dat.GUI、37637 stats-gl。

**three 别名**：Y0=MeshStandardMaterial、rC=MeshMatcapMaterial、a0=MeshBasicMaterial、fQ=ShaderMaterial、_I=RawShaderMaterial、XB=WebGLRenderTarget、n8=RenderTarget、XJ=InstancedMesh、XC=OrbitControls、pA=Color、TQ=ShaderChunk。常量：K0=NearestFilter、J0=FloatType、vB=HalfFloatType、DC=RepeatWrapping、YC=AdditiveBlending、$I=EquirectangularReflectionMapping、VB="srgb"。

## 1. 资产与参数（41533–41685）

- `vQ = "https://lando.itsoffbrand.io/gl"`；`iQ = innerWidth > 991 ? "webp" : "ktx2"`；loader 同断点分叉（41296）。无 detect-gpu。
- sotd.glb 声明未加载未用；hdri.dark、shadow.default、shadow.toZipEdit 仅 debug 加载。运行时 shadow 只加载 softerEdit。
- helmet diffuseLime/Dark/Grid/Google 同一张 gold BaseColor；只有 diffuseDisco 不同。
- setTexturesParams（41343）：head.diffuse 与 shadow.softerEdit NearestFilter；head depth/diffuse/shadow.softerEdit + helmet diffuse + glass.base + track matcap = sRGB；非 head 纹理 flipY=false + Nearest + Repeat；notFound.diffuse.flipY=true。
- params 逐字（41554–41606）：见 02-gl-core.md（headScene/backgroundScene/carouselScene/tracksScene/helmetScrollScene/notFoundScene）。

## 2. 渲染架构

- RQ.init()（41461）：renderer.add() → world = new l9 → m.ticker.add(update)（gsap ticker 驱动）→ world.add()；1s 后 TA.refresh()+resize()。
- $9（30156）：`new WebGLRenderer({powerPreference:"high-performance", alpha:true, precision:"lowp"})`，autoClear=false，canvas 挂 .gl-wrap class gl。antialias/toneMapping/colorSpace/clearColor 均默认。
- 每帧（30168）：逐场景 renderPipeline()（渲私有 RT）+ clear()；setRenderTarget(null) 后合成相机渲主 scene（只含各 renderPlane.mesh）。
- Y9（30144）：z=10，fov=2*atan(height/2/10) → 1 unit = 1 px。
- Sizes：pixelRatio = width>768 ? min(dpr,1.25) : min(dpr,2)。Time：delta = min(clock.getDelta(), 1/30)*100。
- l9.update：backgroundNoise → idleState → fluidCursor → 各场景。
- 场景工厂（35711）按 [data-gl] 实例化。setIsRendering 用 ST（±半屏，refreshPriority:-99）。
- 唯一 composer 在 tracks。

## 3. head 场景（O9）

- defaultScene：cameraTransformGroup→camera（fov 15，桌面 z=3 / 移动 3.75）、headDefault(W9)、helmet(F9)、灯光 N9（Hemi 0xffffff/0x000000/2.5 + Point 0xffffff/2.5 @(-0.75,0.2,0.4)）。
- W9：PlaneGeometry(1,1,128,128)；MeshStandardMaterial{displacementMap:depth, displacementScale:0.25, alphaMap, transparent, normalMap, roughnessMap:roughness, metalnessMap:roughness}。视差=位移贴图+平面随鼠标旋转（rotation.y = easedMouse.x*0.075*A；桌面 rotation.x = easedMouse.y*-1*0.075*A*(1-Q)；ease 0.025）。
- W9 onBeforeCompile（30739）：屏幕空间 UV 采样流体 tCursorEffect（1-rgb 后 step(0.1,r)）；color = mix(diffuse, shadowSofterEdit, min(cursorEffect + step(1-hoverTransition, uHelmetHover), 1))；hoverTransition = cameraUv.y + sin(cameraUv.x*PI)*sin(uHelmetHover*PI)*0.2。
- 合成 shader（31403–31703，renderOrder 3）：REVEAL（uv.y += (SIZE+SIZE/3)*(1-uReveal); uv.y /= 1+SIZE*(1-uReveal)；reveal 恒 1 已退化）；背景=噪声 r 二值 mix(BG,FG)；OUTLINE 4 邻域 THICKNESS 偏移画 COLOR_OUTLINE；hover: mix(bg, uColorHover, step(noise.g, -0.1+uHover*1.1))；光标区切 CURSOR_* 色；头盔显影 cursorEffect += step(1-hoverTransition, uHelmetHover)，final = mix(base, tHelmet.rgb, cursorEffect*tHelmet.a)；滚动滤镜 = 灰度→contrast 0.8→*0.75→hardLight(#50593F)，mix by uFilter。
- hover()（31744）：[data-gl-hover] mouseenter → uColorHover lerp 0.25s + uHover→1（0.5s power4.inOut）。
- helmetHover()（31780）：[data-gl-helmet="hover"] → uHelmetHover→1（1.5s expo.inOut）+ helmetRevealValue→0；leave 反向 1s。
- 相机视差：x = easedMouse.x*0.02*reveal；桌面 y = easedMouse.y*-1*0.02*reveal*(1-scrollProgress)（damp 0.025）。helmet.rotation = headDefault.rotation/1.5，再 x += PI*0.06。
- 滚动（31865/31949，trigger [data-gl-track="head"]）：cameraGroup.z 0→-1（scrub top top→top+=100vh）；uFilter 0→1；出场 y 0→0.1（bottom bottom→bottom+=h bottom）；uCursorIntensity 1→0 + wireframe uOpacity 1→0 @ top+=h/2.25（toggleActions "play none none reverse"，duration 0.25）；renderPlane bounds 全屏→[data-sticky-hero="target"] 尺寸（scrub，记录 scrollProgress）；bounds.top +h→0（入场）、0→-h（出场）。

## 4. helmet（F9）与 disco

- instance = clone，scale(6.9,6.9,7.1)。helmetMaterial{normalMap, metalness:1, roughness:0.05, envMap:light, envMapIntensity:3}；glassMaterial{map:glass.base, roughnessMap, normalMap, metalnessMap:helmet.metallic(!), envMap:light, envMapIntensity:1.5}——无 transmission；plasticMaterial=MeshMatcap{transparent, opacity:0.25, matcap, DoubleSide} renderOrder 1。
- helmet onBeforeCompile（31194）：transition = vLocalPosition.y - sin(vLocalPosition.x*PI)*sin(uHelmetTransition*PI)*0.1；mix(tNext, tCurrent, step(transition, mix(0.05,-0.05,uHelmetTransition)))，仅 FrontFacing。glass onBeforeCompile：darkEdges = clamp(1-abs(vLocalPosition.x)*30, 0.2, 1)，uDarkEdges 默认 0。
- setVariant（31322）：Lime/Dark/Grid/Google → gold diffuse + envMapIntensity 3；Disco → disco diffuse + 1.5；均设 iridescence=0（无效残留）。初始 VARIANT = R9 ? "Google" : byTime（R9 = Math.random()>0.5，30944）；byTime：6-18 点 Lime 否则 Dark。
- 线框扫描（31263）：mergeGeometries 后 wireframe ShaderMaterial：scanEffect = uIsWireframeAnimating ? pow(fract(-vPosition.y*10-uTime),4)*0.1 : 0.1；每帧 copy rotation。F9 渲私有 RT samples:2 → tHelmet。
- disco I8（31097）：keypress 拼 "disco"（5s 超时）→ transition(±1) + CustomEvent("disco")。transition(1)：html.classList.add("gl__is-disco")、显示 discoMesh + lensFlare、uTransitionIn→1（2s expo.inOut）。
- 迪斯科球 i5（31016）：Standard{color:0xffffff, envMap:light, envMapIntensity:1.5, roughness:0, metalness:0.9, transparent}；matcap UV（*0.495+0.5）；mask.r 白=纯白格缝；alpha 上下擦除 step(mix(0.0425,-0.0425,uTransitionIn), y)；customProgramCacheKey=random。
- lensFlare o5（30947）：empties 位置 InstancedMesh(Plane(0.5,0.5))，renderOrder 99，billboard + aRandom 尺寸（0.5+r*0.5）；vDot = smoothstep(0.9,0.95,dot(n,z轴))；additive，alpha = vDot*tex.a*0.95*uTransition。
- head 收 disco 事件：uHelmetTransition→1（2s expo.inOut）。

## 5. tracks（k9 + z9）

- 赛道=法线偏移的 0.1 高"墙带"：PlaneGeometry(1,1,count-1,1) 顶点重写为 (x,0,z)/(x,0.1,z)；inner/outer 双 mesh，uThickness inner=-0.0175/+0.035 等按 userData.side。
- 顶点 UN（32849）：p = position + normal*uThickness + matcap vN。片元 GN（32882）：cYellow=vec3(0.824,1.0,0.0)；上沿 smoothstep(0.075,0.025,vUv.y) × 脉冲 animationFract = pow(fract(vUv.x*5-uTime*uRaceDirection),2)*10-5（×0.3）；下沿 step(0.975,vUv.y)*0.25；alpha=0.35+描边-条纹擦除 transition = smoothstep(uProgress*1.2, uProgress*1.2-0.2, abs(uReverse - fract(vUv.x*8)))；color = vec3(0.1,0.15,0.05)+matcap+cYellow*outline。
- 切换（32672）：out uProgress 0→1（TRANSITION_DURATION/2=1s expo.in）+ rotation.y ∓π/4 + DOM 点淡出（-25%，delay 0.015/个）；in 反向 expo.out；html 加 gl-tracks-isTransitioning。update() 轮询 params.tracksScene.CURRENT。
- DOM 点（V9/setPoints 32609）：.lando-gl__point：start=棋盘旗 SVG、corner=双位编号、drs=DRS；每帧 getWorldPosition→project→translate px。
- k9：scene.background = Color(0x121212).convertLinearToSRGB()；相机 fov 1°@(87.5,70,175)；setScenePlaneDimensions 反算 fov B = 2*atan(tan(0.5°)/aspect)；composer = RenderPass + UnrealBloom(strength 1.5, radius 0.5, threshold 0.25)，renderToScreen=false，readBuffer→renderPlane；RT samples 2；OrbitControls 始终启用（damping、禁 zoom、polar 锁 π/2.5、autoRotate 0.2）；滚动只有 renderPlane top +h→-h。

## 6. carousel（_9，MSDF）

- vendor：word-wrap+TextLayout+MU+VU。VU 默认 uThreshold:0.05, uAlphaTest:0.01, uStrokeInsetWidth:0.3；片元 median-0.5/fwidth。
- 文字硬编码于 params（非 DOM）。顶行 Brier{size:0.0115, shrink:1, letterSpacing:-2, direction:"left", yShift:0.175, #b2c73a}；底行 Mona{size:0.02, shrink:0.9, verticalGap:-0.175, letterSpacing:-1, direction:"right", #dde1d2}。每行双 mesh 首尾相接（gap 0.1），rotation.x=PI（flipY 配合）。
- 跑马灯：x -= delta*0.01 + |lenis.velocity|*0.001（右行 +=）；越界回绕 -max.x*shrink。
- 相机 fov 75 z=4.5；480-768: z=lerp(11,6.5,(w-480)/288)；<480: z=lerp(14,9.5,(w-320)/160)，topMobile=h*0.35。
- RT samples:1 → renderPlane renderOrder 2；isRendering/滚动 trigger 复用 [data-gl-track="head"]。

## 7. helmet-scroll（y9）

- 头盔 clone scale 6；helmet envMapIntensity 1.5、glass 用 hdri.faded；擦除纯水平（±0.0425 无正弦）。也挂 I8（invertOut 无）。
- setVariant envMapIntensity：Lime/Dark/Disco 1.5、Grid 1、Google 0.75。
- setTimeline（34349）：paused；helmetGroup.rotation.y π/2.2→4π（power1.inOut 全程）；helmet.rotation.x π/12→-π/10（前半 power1.in）→π/20（后半 power1.out）；update：timeline.progress(PROGRESS + 0.001)。
- PROGRESS/bounds 由 DOM 模块（45664–45759）经 landoGL.bounds.helmetScroll 驱动；renderPlane 为正方形 width×width，位置补偿 lenis.scroll；片元 xy 双向羽化 smoothstep(0.5,0.4,|uv-0.5|)。
- bug：setOrbitControls 引用未定义 OrbitControls（34346，不被调用）。

## 8. not-found（x9）

- 头盔第三实例 scale 6 + 两块 "4"：PlaneGeometry(0.305,0.305) + MeshBasic{color:0xD2FF00, alphaMap:notFound, transparent}，±0.3275（≤479: ±0.245 scale 1.75）；foursGroup.lookAt(camera)。
- OrbitControls 绑 .gl-wrap（禁 pan/zoom，polar 锁 π/2）；change 累计方位角写 envMapRotation.y。
- 自转：autoRotateValue += delta*0.0025*SPEED；helmetGroup.rotation.y = π/2.5 + easedMouse.x*(degToRad(-21)*0.5) + autoRotateValue；helmet.rotation.x = -easedMouse.y*degToRad(-21)。
- translate(A)（34657）：tNextTexture + envMapIntensity 目标（Lime/Dark 1.5、Grid/Disco 1、Google 0.75）+ uHelmetTransition 0→1（2s expo.inOut）+ rotation.y → 2π+方位角（back.inOut）；gl-not-found-isTransitioning class；disco → translate("Disco"/"Lime")。
- renderPlane y 向羽化。

## 9. 支撑系统

- background（w9）：无私有渲染，消费 backgroundNoise RT；OUTLINE 简化版；每帧轮询 params 色变。
- backgroundNoise（f9）：全屏 RawTarget（不乘 dpr）；simplex 双层（distort SCALE 1 ×SPEED×0.1 扰动主噪声 SCALE 1 ×SPEED 0.1）；cursor = clamp(1-dist*CURSOR_SCALE 3, CURSOR_BOUNCE -0.75, 1)*uMousePace（pace ×4）；noiseFinal = fract(noise*NOISE_DETAIL 3)；out r = step(0.5, nf)（二值）、g = nf（连续）。
- 流体（35043–35567）：Advection(BFECC)→ExternalForce→(Viscous off)→Divergence→Poisson(4)→Pressure；参数 iterations_poisson:4, iterations_viscous:4, dissipation:0.96, mouse_force:50, resolution:0.1, cursor_size:18, straightness:1, viscous:30, isBounce:false, dt:0.014, isViscous:false, BFECC:true；iOS HalfFloat 否则 Float；cellScale 归一 1100px；输出 mix(vec3(1), vec3(vel.x,vel.y,1), length(vel)) 渲 sourceTarget samples:2，60fps 节流；idle 2s（首次 2.5s）假光标 x=-cos(px*4π)*0.75, y=cos(py*π)*0.5。
- Mouse e9：createEasedNormalized/Pace = MathUtils.damp。

## 10. 自定义 shader 行号清单

30739 W9 注入；30949 o5；31035 i5；31194 F9 helmet；31232 F9 glass；31263 wireframe；31403 O9 合成；32550/32565+32849/32882 赛道；32950 tracks 直通；33078 w9；33839/33898 MSDF；34005 _9 直通；34188 y9 plane；34251/34289 y9 helmet/glass；34426 x9 plane；34502/34563 x9 helmet/glass；34771 f9；34874+ 流体六 pass；35709 TQ.simplex=VO（35631）；38119 TQ.rotateUV。

## 11. 复刻要点

1. sotd.glb 未使用；reveal 恒 1；gold 变体共用贴图。
2. 头像视差 = displacementMap + 平面旋转，非 shader parallax。
3. 玻璃无 transmission；plastic 单独 mesh。
4. 赛道非 Line/Tube，流动感来自片元描边调制。
5. 唯一 bloom 在 tracks；主渲染 lowp + autoClear false。
6. 性能分级：断点选格式、dpr 上限、WebGL2 fallback、isRendering 剔除、流体降分辨率+节流、iOS HalfFloat。
