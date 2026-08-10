# GL 应用核心（RQ / renderer / assets / params）

## 生命周期
- eM()=bI.load()（41519）；AL()=bI.init()（41522）；yU()=renderer.add()+world.add()（41526，home/on-track/calendar/not-found 切入时）；QL()=world.destroy()+移除 gl__is-disco（41530，切出时）。
- RQ（41447）：单例；time=s9、sizes=o9、mouse=e9(document)、shaderChunks=AZ、scene、camera=Y9、renderer=$9、assets=BZ、isDebug=?debug。params.canvas 无效（canvas 动态创建）。
- load()：Promise.all([DOM load 事件, assets.load()])。init()（41461）：renderer.add() → world=new l9 → m.ticker.add(update)（gsap ticker 驱动渲染）→ world.add()；1s 后 TA.refresh()+resize()（"resize issue prevention"）。
- update()：renderer.update() → world.update() → mouse.update()。

## Renderer $9（30156-30175）
```js
ColorManagement.enabled = true;
new WebGLRenderer({ powerPreference: "high-performance", alpha: true, precision: "lowp" });
autoClear = false; setPixelRatio(sizes.pixelRatio); setSize(w, h);
```
antialias/toneMapping/outputColorSpace/clearColor 全默认。add()：.gl-wrap appendChild + canvas class "gl"。update()：逐场景 renderPipeline() + clear()，最后 setRenderTarget(null) 渲全局合成 scene。

## 合成相机 Y9（30144）：z=10，fov=2*atan(height/2/10)*(180/π) → 1 unit = 1 px。
## Sizes o9（35879）：pixelRatio = width>768 ? min(dpr,1.25) : min(dpr,2)。
## Time s9（35856）：独立 rAF；delta = min(clock.getDelta(), 1/30)*100；getVariantAccordingToTime：6:00-18:00 "Lime" 否则 "Dark"。R9 = Math.random()>0.5 → 50% VARIANT="Google"（30942）。
## World l9（35706）：ShaderChunk.simplex=VO；fluidCursor=m9、idleState=c9、backgroundNoise=f9；add() 扫 [data-gl]：head→O9、tracks→k9、background→w9、carousel→_9、helmet-scroll→y9、not-found→x9；renderPlane.mesh 加入全局 scene。

## Assets BZ（41231-41437）
- DRACOLoader.setDecoderPath(vQ+"/draco/")→GLTFLoader；KTX2Loader.setTranscoderPath(vQ+"/basis/")+detectSupport；RGBELoader；TextureLoader；FontLoader。
- activeTextureLoader = innerWidth>991 ? TextureLoader : KTX2Loader（41296）。
- 运行时不加载：models.sotd、models.head、hdri.dark（debug only）、head.shadow.default/toZipEdit（debug only）。textures.helmet.mask 被 uniform 引用但 manifest 无 → undefined（怪癖）。
- setTexturesParams（41343）：head.diffuse+shadow.softerEdit Nearest；head depth/diffuse/shadow.softerEdit+helmet diffuse+glass.base+track matcap = sRGB；非 head flipY=false+Nearest+Repeat；notFound.diffuse.flipY=true；HDRI EquirectangularReflectionMapping。

## window.landoGL 逐字（41539-41680）
```js
{ reveal: 1,
  lenis: { velocity: 0, instance: null },
  bounds: { helmetScroll: { width:0, height:0, left:0, top:0 } },
  params: {
    headScene: { REVEAL_DURATION:1.1, COLOR_OUTLINE:"#CBCBB9", COLOR_FOREGROUND:"#D2FF00",
      COLOR_BACKGROUND:"#F8F8F3", COLOR_CURSOR_FOREGROUND:"#CFD2C5", COLOR_CURSOR_BACKGROUND:"#E8E8DF",
      COLOR_CURSOR_OUTLINE:"#E8E8DF", COLOR_FILTER:"#50593F", SCALE:1, SPEED:0.1, THICKNESS:0.000005,
      OUTLINE:true, SHOW_HELMET_PERMANENTLY:false, DISTORT_SCALE:1, DISTORT_INTENSITY:0.5,
      NOISE_DETAIL:3, CURSOR_INTENSITY:0.15, CURSOR_SCALE:3, CURSOR_BOUNCE:-0.75, REVEAL_SIZE:25,
      IS_WIREFRAME_ANIMATING:true, VARIANT:"Lime" },
    backgroundScene: { THICKNESS:0.000005, OUTLINE:true, COLOR_BACKGROUND:"#282C20",
      COLOR_FOREGROUND:"#363B25", COLOR_CURSOR_BACKGROUND:"#b2c73a", COLOR_CURSOR_FOREGROUND:"#b2c73a" },
    carouselScene: { TEXT_TOP:"WE DID IT AT HOME WE DID IT AT HOME",
      TEXT_BOTTOM:"A BRITISH GP WEEKEND I WILL REMEMBER FOREVER", COLOR_TOP:"#b2c73a", COLOR_BOTTOM:"#dde1d2" },
    tracksScene: { CURRENT:"austin", TRANSITION_DURATION:2, AUTOROTATE_SPEED:0.2 },
    helmetScrollScene: { VARIANT:"Lime", PROGRESS:0, REVEAL_OUT_PROGRESS:0 },
    notFoundScene: { VARIANT:"Lime", HELMET_AUTOROTATE_SPEED:1, HELMET_ANGLE:-21 } },
  assets: { draco: vQ+"/draco/", ktx2: vQ+"/basis/",
    fonts: { brier:{atlas:"/fonts/Brier-Bold-02.webp", json:"/fonts/Brier-Bold-msdf.json"},
             mona:{atlas:"/fonts/MonaSans-Bold-02.webp", json:"/fonts/MonaSans-Bold-msdf.json"} },
    hdri: { light/faded/dark: "/hdri/studio_small_08_1k--{light,faded,dark}.hdr" },
    models: { helmet:"/models/helmet-21.glb", disco:"/models/disco-02.glb",
              tracks:"/models/tracks/tracks-05.glb", sotd:"/models/sotd.glb"(未用) },
    textures: {
      head: { diffuse/depth/alpha/roughness: `/textures/head/${iQ}/*.${iQ}`, normal: webp 恒定,
              shadow: { default/softerEdit/toZipEdit: `/textures/head/${iQ}/shadow*.${iQ}` } },
      helmet: { diffuseLime=Dark=Grid=Google: `${iQ}/gold/Norris_Helmet_mat_BaseColor.${iQ}`,
                diffuseDisco: `${iQ}/disco/...BaseColor.${iQ}`, normal: webp,
                roughness/metallic: `${iQ}/Norris_Helmet_mat_{Roughness,Metallic}.${iQ}` },
      glass: { base/roughness/metallic: `${iQ}/Norris_Glass_mat_*.${iQ}`, normal: webp },
      plastic: { matcap: "plastic__matcap-02.webp" },
      disco: { matcap: webp, mask: `${iQ}/disco/disco_mask-01.${iQ}`, lensFlare: webp },
      noise: { texture: "noise-03.webp" }, matcaps: { track: "lando__matcap-02.webp" },
      notFound: { diffuse: "not-found-alpha-6.webp" } } } }
```
- vQ = "https://lando.itsoffbrand.io/gl"（41533）；iQ = innerWidth>991 ? "webp" : "ktx2"（41538）。
- WebGL2 可用 → bI = new RQ({canvas:"canvas.gl"})；否则 html.classList.add("gl-fallback")（41681-41684）。
