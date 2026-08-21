/**
 * slices.config.mjs — slice table for scripts/skill/extract-source.mjs (porting-discipline.md §2.2).
 *
 * RETROACTIVE port/ (2026-08-20, skill v0.1.51 M(n+1) gate): this project ported
 * mirror -> src/app/*.ts directly in M2-M6 with pretty-line provenance comments.
 * port/_gen/app.gen.js is the verbatim byte slice of every APPLICATION region of
 * the OFF+BRAND bundle — the other end of the symbol-equivalence gate
 * (docs/rename-map.json + scripts/verify-decls.mjs / scripts/skill/verify-symbols.mjs).
 * It is a coordinate artifact: never executed, never hand-edited, regenerate with
 *   node scripts/skill/extract-source.mjs --slices scripts/slices.config.mjs
 *   node scripts/skill/extract-source.mjs --slices scripts/slices.config.mjs --check --balance-check
 *
 * Vendor regions are NOT sliced — they are the pinned npm packages (REBUILD_PLAN §2, 6.7, 6.8):
 *       1-32    esbuild runtime (bundler plumbing)
 *      90-5042  @rive-app/canvas-lite 2.26.4 UMD
 *    5043-9406  gsap 3.13.0 core + CSSPlugin + Observer + ScrollTrigger + paths + MotionPathPlugin + SplitText
 *   10334-30143 three r174 core (10281-10333 WebGL detect IS sliced: src ports it verbatim)
 *   30180-30712 OrbitControls
 *   30930-30930 BufferGeometryUtils (inside head region span — see note)
 *   32012-32500 postprocessing (EffectComposer/UnrealBloom)
 *   33179-33996 word-wrapper + three-msdf-text-utils MSDF stack
 *   35883-38003 lil-gui + stats-gl
 *   38127-41230 DRACOLoader + GLTFLoader + RGBELoader + FontLoader + KTX2 stack
 *   41751-42433 selector-set + @unseenco/e + @unseenco/taxi
 *   46469-47010 lenis 1.1.20
 */
export default {
  root: "..",
  source: "legacy-mirror/_pretty/lando.OFF+BRAND.gold-android-fix-03.pretty.js",
  sha256: "3a888487166a91bd070d1b967447a42b7c50d14b4071957be643e7835313d6c0",
  out: "port/_gen/app.gen.js",
  generator: "scripts/skill/extract-source.mjs",
  imports: [],
  header: [
    "Verbatim application-region slices of the OFF+BRAND bundle (pretty coordinates).",
    "Vendor regions (three/gsap/lenis/rive/taxi/msdf/lil-gui/loaders) are the pinned npm",
    "packages in package.json, not sliced. Symbol map: docs/rename-map.json.",
  ],
  slices: [
    { from: 33, to: 89, note: "esbuild helpers tail + utils: BD(34) ED(41) ID(46) CD(56) KD(75) — safari/iphone flags, Webflow destroy+ready, w--current, breakpoint reload", symbols: [] },
    { from: 9407, to: 10280, note: "LB (9408) + vC Rive system (9438-10280): runtime aliases, file preload, components, window.loadedRiveFiles", symbols: [] },
    { from: 10281, to: 10333, note: "tR WebGL2 capability detect (three/examples WebGL.js shape, ported verbatim as WebGLSupport) + eR alias + AX init wrapper", symbols: [] },
    { from: 30144, to: 30179, note: "camera / renderer (30144-30175) + u5 init wrapper", symbols: [] },
    { from: 30715, to: 30816, note: "head scene group part 1 (30715-30816): W9 HeadDefault + c5 init wrapper", symbols: [] },
    // 30817-30941 is three/examples/jsm BufferGeometryUtils (s5/l5/QY + BY init wrapper) sitting between two app modules — vendor, not sliced
    { from: 30942, to: 32010, note: "head scene group part 2 (30942-32010): FT/R9 google variant, lens-flare/disco materials, Helmet, LightingDefault, O9 HeadScene + composite shader (32011 `var M9;` belongs to the postprocessing module that follows)", symbols: [] },
    { from: 32502, to: 33061, note: "tracks scene (32502-33061): 3D circuits, bloom, DOM markers, sprint labels", symbols: [] },
    { from: 33062, to: 33178, note: "background scene (33072-33174) + HN/qN init wrappers", symbols: [] },
    { from: 33997, to: 34177, note: "carousel scene (34002-34177) + sN init wrapper", symbols: [] },
    { from: 34178, to: 34413, note: "helmet-scroll scene (34185-34413) + oN init wrapper", symbols: [] },
    { from: 34414, to: 34753, note: "not-found scene (34421-34753) + iN init wrapper", symbols: [] },
    { from: 34754, to: 35705, note: "noise / fluid (6 passes) / idle (34761-35625) + MO init wrapper + VO simplex GLSL chunk + LO", symbols: [] },
    { from: 35706, to: 35888, note: "World / Time / Sizes (35706-35888); World.destroy scene.remove(name) no-op is load-bearing (Q13)", symbols: [] },
    { from: 38004, to: 38126, note: "Debug / Mouse / Chunks (38004-38126)", symbols: [] },
    { from: 41231, to: 41534, note: "Assets manifest + RQ GL app (41231-41534): webp vs ktx2 fork on innerWidth (Q12)", symbols: [] },
    { from: 41535, to: 41750, note: "EZ landoGL config + WebGL2 gate (41535-41685), q$ page-transition rive (41745-41749)", symbols: [] },
    { from: 42434, to: 43157, note: "FL init wrapper + text components (42438-43156): SplitText N$, reveal, counters", symbols: [] },
    { from: 43158, to: 43846, note: "horizontal / marquee / social cards (43158-43754) + scroll indicator qZ (43755-43845)", symbols: [] },
    { from: 43847, to: 44405, note: "navigation (43847-44404): open/close, window.closeNavigation", symbols: [] },
    { from: 44406, to: 44585, note: "Vimeo (44406-44584): init has no call site in the bundle", symbols: [] },
    { from: 44586, to: 44664, note: "PL (44586-44663)", symbols: [] },
    { from: 44665, to: 45001, note: "home page w$/TL (44665-45000)", symbols: [] },
    { from: 45002, to: 45829, note: "on-track component group _$/yL (45002-45828): heroflip (Q10)", symbols: [] },
    { from: 45830, to: 46001, note: "off-track x$/xL (45830-46000)", symbols: [] },
    { from: 46002, to: 46165, note: "partnerships f$/bL, partnerships-item WZ/vL, calendar b$, not-found h$/dL (46002-46164) + hL/gL/uL/pL wrappers", symbols: [] },
    { from: 46166, to: 46376, note: "sL lifecycle (46166-46375): mL initial load, cL enter, lL leave; oL/iL/y_ hoisted", symbols: [] },
    { from: 46377, to: 46468, note: "taxi assembly aL (46377-46467): oL Transition, iL Renderer, y_ Core", symbols: [] },
    { from: 47011, to: 47099, note: "Lenis manager QV (47011-47099)", symbols: [] },
    { from: 47100, to: 47120, note: "entry (47100-47120): vC() EZ() q$() -> c_() boot sequence", symbols: [] },
  ],
};
