/**
 * port/vendor-globals.js — TRIO #3 of porting-discipline.md §2.2: the symbol alias
 * table that re-binds the bundle's minified VENDOR identifiers to the pinned npm
 * packages, so port/_gen/app.gen.js (verbatim application slices) can run.
 *
 * FORM: global assignments, not `import` lines in the generated file. The source
 * bundle is a CLASSIC script (sloppy mode) and the application code relies on it:
 * `j$(debug = !1)` assigns the undeclared `debug` (quirk Q9), which a module would
 * throw on. So the port stays a classic `<script defer>` and this prelude (an ES
 * module Vite bundles) publishes every vendor binding on globalThis before it runs.
 *
 * EVERY LINE CARRIES ITS EVIDENCE: the class brand (`isXxx = !0`, `type = "Xxx"`) or
 * the constructor shape found at the cited mirror/_pretty line, or the constant's
 * value + the property it is assigned to in the app slices. The list itself is the
 * output of tools/free-idents.mjs (acorn scope analysis over app.gen.js): 92 free
 * identifiers = these bindings + the runtime-only globals listed at the bottom.
 *
 * Versions are the ones the bundle carries (REBUILD_PLAN §2): three r174, gsap 3.13.0,
 * lenis 1.1.20, @rive-app/canvas-lite 2.26.4, three-msdf-text-utils 1.5.0;
 * @unseenco/taxi 1.8.0 (6.7), dat.gui 0.7.9 + stats-gl 4.2.3 for the ?debug panel (6.9).
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import * as rive from '@rive-app/canvas-lite';
import { Core, Renderer, Transition } from '@unseenco/taxi';
import { MSDFTextGeometry, MSDFTextMaterial } from 'three-msdf-text-utils';
import { GUI } from 'dat.gui';
import Stats from 'stats-gl';

const {
  Box3, Sphere, BufferAttribute, Clock, Uniform, ShaderMaterial, WebGLRenderer, ShaderChunk, Cache,
  PerspectiveCamera, PlaneGeometry, MeshStandardMaterial, Mesh, Vector3, Color, Group, InstancedMesh,
  InstancedBufferAttribute, Object3D, MeshMatcapMaterial, Scene, WebGLRenderTarget, Euler, HemisphereLight,
  PointLight, PointLightHelper, Vector2, MathUtils, MeshBasicMaterial, Camera, RenderTarget, RawShaderMaterial,
  BufferGeometry, LineSegments, TextureLoader,
  DoubleSide, AdditiveBlending, EquirectangularReflectionMapping, RepeatWrapping, NearestFilter, FloatType,
  HalfFloatType, SRGBColorSpace,
} = THREE;

// Constant identities are checked by VALUE against the bundle (the number is the evidence).
const expect = (name, got, want) => { if (got !== want) throw new Error(`vendor-globals: ${name} = ${got}, bundle has ${want}`); };
expect('DoubleSide', DoubleSide, 2); expect('AdditiveBlending', AdditiveBlending, 2);
expect('EquirectangularReflectionMapping', EquirectangularReflectionMapping, 303);
expect('RepeatWrapping', RepeatWrapping, 1000); expect('NearestFilter', NearestFilter, 1003);
expect('FloatType', FloatType, 1015); expect('HalfFloatType', HalfFloatType, 1016); expect('SRGBColorSpace', SRGBColorSpace, 'srgb');

const noop = () => {}; // esbuild __esm init wrappers of vendor modules: the module is the npm package now

Object.assign(globalThis, {
  // ---- rive (CommonJS UMD wrapped by DK at L90; app does dJ(cU(), 1) = __toESM(require_rive()))
  cU: () => rive,                      // require_rive factory -> the @rive-app/canvas-lite namespace (Rive, Layout, Fit, Alignment, EventType…)
  // ---- gsap (E1 declared L6738, assigned in DW; registerPlugin(TA, u6, CI) at app L104)
  E1: gsap,                            // gsap core — `E1.registerPlugin`, `E1.defaults`, `m = E1`
  DW: noop,                            // init_gsap-core
  TA: ScrollTrigger,                   // L7586 chain; `TA.create`, `TA.refresh`, `TA.getAll` throughout the app
  KR: noop,                            // init_ScrollTrigger
  u6: MotionPathPlugin,                // L9071, assigned in TR (MotionPathPlugin region 9072-9272); 2nd registerPlugin arg
  TR: noop,                            // init_MotionPathPlugin
  CI: SplitText,                       // L9389, assigned in gR (SplitText region 9273-9406); 3rd registerPlugin arg, `new CI(...)` in N$
  gR: noop,                            // init_SplitText
  // ---- three core (brands at the cited lines)
  V0: Box3,                            // class V0 L10882 — isBox3
  f0: Sphere,                          // class f0 L11037 — isSphere
  hQ: BufferAttribute,                 // class hQ L11815 — isBufferAttribute
  E8: Clock,                           // class E8 L13788 — autoStart/startTime/oldTime/elapsedTime ctor
  YA: Uniform,                         // class YA L14049 — `constructor(A) { this.value = A }`
  hB: DoubleSide,                      // L14314 hB = 2, used as `side: hB`
  YC: AdditiveBlending,                // L14317 YC = 2, used as `blending: YC`
  $I: EquirectangularReflectionMapping,// L14362 $I = 303, assigned to hdri .mapping
  DC: RepeatWrapping,                  // L14365 DC = 1000, texture wrap
  K0: NearestFilter,                   // L14368 K0 = 1003, min/magFilter
  J0: FloatType,                       // L14380 J0 = 1015 (render target type, non-iOS)
  vB: HalfFloatType,                   // L14381 vB = 1016 (iOS branch)
  VB: SRGBColorSpace,                  // L14439 VB = "srgb", texture colorSpace
  fQ: ShaderMaterial,                  // fQ = class L17315 — isShaderMaterial, type "ShaderMaterial"
  tq: WebGLRenderer,                   // class tq L24433 — isWebGLRenderer
  TQ: ShaderChunk,                     // L28971 chain; `TQ.simplex = VO`, `TQ.rotateUV = …`
  VQ: noop,                            // init_three (29 call sites in the app's own wrappers)
  bQ: Cache,                           // L14713 bQ = L4() — the loader cache; `bQ.enabled = !0`
  RB: PerspectiveCamera,               // L17398 — isPerspectiveCamera
  QB: PlaneGeometry,                   // L18557 — type "PlaneGeometry"
  Y0: MeshStandardMaterial,            // L18659 — isMeshStandardMaterial
  OQ: Mesh,                            // L17138 — isMesh
  o: Vector3,                          // L15409 — isVector3
  pA: Color,                           // L16337 — isColor
  TB: Group,                           // L17601 — isGroup
  XJ: InstancedMesh,                   // L17741 — isInstancedMesh
  ZC: InstancedBufferAttribute,        // L17727 — isInstancedBufferAttribute
  qB: Object3D,                        // L15826 — isObject3D
  rC: MeshMatcapMaterial,              // L18754 — isMeshMatcapMaterial
  rB: Scene,                           // L17610 — isScene
  XB: WebGLRenderTarget,               // L15117 — isWebGLRenderTarget
  M0: Euler,                           // L15709 — isEuler
  Q9: HemisphereLight,                 // L19148 — isHemisphereLight
  LJ: PointLight,                      // L19207 — isPointLight
  K9: PointLightHelper,                // L19367 — type "PointLightHelper"
  kA: Vector2,                         // L14511 — isVector2
  jB: MathUtils,                       // L14485 jB = { … } — `jB.lerp`, `jB.degToRad`
  a0: MeshBasicMaterial,               // L16730 — isMeshBasicMaterial
  jI: Camera,                          // L17376 — isCamera
  n8: RenderTarget,                    // L15049 — isRenderTarget
  _I: RawShaderMaterial,               // L18653 — isRawShaderMaterial
  sB: BufferGeometry,                  // L16757 — isBufferGeometry
  NJ: LineSegments,                    // L17910 — isLineSegments
  OJ: TextureLoader,                   // L19115 OJ = class extends t0 (t0 = Loader, L13694); `this.textureLoader = new OJ` (the isLight brand 80 lines below belongs to the next class)
  // ---- three/examples
  XC: OrbitControls,                   // L30361, OrbitControls region 30180-30712; `new XC(camera, dom)` + enableDamping
  XU: noop,                            // init_OrbitControls
  s5: mergeGeometries,                 // function s5(A, Q = !1) L30817 — BufferGeometryUtils.mergeGeometries(geometries, useGroups)
  BY: noop,                            // init_BufferGeometryUtils
  JY: EffectComposer,                  // class JY L32149 — (renderer, renderTarget) ctor, _pixelRatio
  BN: noop,                            // init_EffectComposer
  UY: RenderPass,                      // L32227, `new UY(scene, camera)`
  EN: noop,                            // init_RenderPass
  CK: UnrealBloomPass,                 // L32311, `new CK(new kA(w, h), strength, radius, threshold)`
  KN: noop,                            // init_UnrealBloomPass
  AM: noop,                            // init_draco (38127)
  wY: DRACOLoader,                     // L38250, `setDecoderPath`
  QM: noop,                            // init_DRACOLoader
  yY: GLTFLoader,                      // L39905 chain (VM = "glTF"), `setDRACOLoader`/`setKTX2Loader`
  jM: noop,                            // init_GLTFLoader
  fY: RGBELoader,                      // L40201
  _M: noop,                            // init_RGBELoader
  bY: FontLoader,                      // L40435
  xM: noop,                            // init_FontLoader
  rM: noop,                            // init_ktx2 (40767)
  hE: KTX2Loader,                      // L40773 hE = class extends Loader; `setTranscoderPath`, `detectSupport`
  // ---- three-msdf-text-utils (33274-33996)
  MU: MSDFTextGeometry,                // L33720, `new MU({ text, font, … })`
  uN: noop,                            // init
  VU: MSDFTextMaterial,                // L33967, `new VU`
  HY: noop,                            // init
  // ---- ?debug panel (6.9): dat.gui (35889-37996: __state.conversionName / litmus / conversions = dat.gui's Color) + stats-gl (threeRendererPatched, Panel)
  sO: GUI,                             // L36463; `new sO({ width: 300 })`
  oO: noop,
  aO: Stats,                           // L37997 aO = nO, nO.Panel = jU; `new aO({ trackGPU: !0 })`, `.init(renderer)`, `.dom`
  rO: noop,
  // ---- @unseenco/taxi (42070-42433; 6.7)
  LC: Transition,                      // class LC L42108 — onLeave/onEnter/ isTransitioning
  G8: Renderer,                        // class G8 L42145
  hU: Core,                            // class hU L42209 — renderers/transitions options, navigateTo
  X$: noop,                            // L42192 `var X$ = () => {}` (already a no-op in the source)
  XL: noop,                            // init_taxi
  // ---- lenis 1.1.20 (46469-47010)
  u$: Lenis,                           // L46672 u$ = class — `new u$({ …options })`
});

// Runtime-only globals deliberately NOT bound here (they are not vendor modules):
//   OrbitControls — referenced undeclared in HelmetScrollScene.setOrbitControls (quirk Q8: that
//                   method throws ReferenceError in the source too; the call site is dead);
//   Vimeo         — window.Vimeo, loaded by the app from player.vimeo.com on demand (6.3);
//   debug         — implicit global created by `j$(debug = !1)` (quirk Q9) — needs sloppy mode,
//                   which is why app.gen.js is a classic script;
//   Y8            — the app's own listener-options object; its `var` landed in the Lenis chain
//                   (L46592) so here it becomes an implicit global with identical behaviour.
