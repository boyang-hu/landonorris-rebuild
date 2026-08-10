/**
 * Rive file preloader + shared registries.
 * Source: pretty 9438-9543 (kI/mR/sR/A4/cR/u8/lR/IH/Q4/g8/HE) and the vC module
 * state 10256-10280. Base URL pR and manifest p6 are verbatim; page-transition
 * is NOT part of this manifest (it loads separately, see transition.ts).
 *
 * Deviation 6.6: the Rive WASM is served from the local mirror instead of
 * unpkg (identical bytes, keeps the rebuild self-contained).
 */
import * as rive from '@rive-app/canvas-lite';

rive.RuntimeLoader.setWasmUrl('/ext/unpkg.com/@rive-app/canvas-lite@2.26.4/rive.wasm');

/** pR, 10258 — runtime base for all preloaded .riv files */
export const RIVE_BASE = '/ext/assets.itsoffbrand.io/lando/rive/';

/** p6, 10266-10274 */
export const RIVE_MANIFEST: Record<string, string> = {
  signature: 'signature.riv',
  'btn-ui': 'btn-ui.riv',
  circuits: 'circuits.riv',
  reef: 'reef.riv',
  phrases: 'phrases.riv',
  logo: 'ln4.riv',
  'mob-landscape': 'mob-landscape.riv',
};

export type RiveCanvas = HTMLCanvasElement & {
  riveInstance?: rive.Rive | null;
  riveInputs?: rive.StateMachineInput[];
  riveScrollControl?: { timeline: gsap.core.Timeline; scrollTrigger: ScrollTrigger } | null;
  lenisScrollHandler?: ((e: unknown) => void) | null;
  scrollInput?: { value: number | boolean };
  heroAnimation?: string;
};

/** UI — live Rive instances, resized together (10266) */
export const instances: rive.Rive[] = [];
/** DB — RiveFile cache, exposed as window.loadedRiveFiles (10274-10275) */
export const fileCache: Record<string, rive.RiveFile> = {};
/** JH — ln4 logo registry: {instance, canvas} (10280) */
export const logoRegistry: { instance: rive.Rive; canvas: HTMLCanvasElement }[] = [];
/** dK — hamburger state machine inputs; KI — menu-open flag (10260-10261) */
export const navState: { hamburgerInputs: rive.StateMachineInput[] | null; menuOpen: boolean } = {
  hamburgerInputs: null,
  menuOpen: false,
};

let pendingCount = 0; // JI
let allLoaded = false; // s0

declare global {
  interface Window {
    loadedRiveFiles: Record<string, rive.RiveFile>;
    transitionRiveInputs: null;
    loadingComplete: boolean;
    riveLoadingStarted: boolean;
    lenis?: import('lenis').default | null;
    lenisStart?: () => void;
    lenisStop?: () => void;
    closeNavigation?: () => void;
    homeLogoColorSet?: boolean;
  }
}
window.loadedRiveFiles = fileCache;
window.transitionRiveInputs = null;
window.loadingComplete = false;
window.riveLoadingStarted = false;

/** cR 9501 */
export function riveUrl(key: string): string {
  if (RIVE_MANIFEST[key]) return RIVE_BASE + RIVE_MANIFEST[key];
  return RIVE_BASE + key;
}

/** A4 9486 — cached RiveFile loader */
export function loadRiveFile(
  url: string,
  onLoad: (file: rive.RiveFile) => void,
  onError: (e: unknown) => void
) {
  if (fileCache[url]) {
    onLoad(fileCache[url]);
    return;
  }
  const file = new rive.RiveFile({ src: url, onLoad: () => onLoad(file), onLoadError: onError });
  file.init().catch(onError);
}

/** mR 9473 */
function settle() {
  if (pendingCount <= 0 && !allLoaded) {
    allLoaded = true;
    window.loadingComplete = true;
    window.loadedRiveFiles = fileCache;
    window.dispatchEvent(new CustomEvent('allriveloaded'));
    dispatchComponentsReady();
  }
}

/** sR 9481 */
function dispatchComponentsReady() {
  window.dispatchEvent(new CustomEvent('riveAllLoaded'));
}

/** kI 9456 — preload every manifest file, then announce */
export function preloadAllRiveFiles() {
  const urls = Object.keys(RIVE_MANIFEST).map((k) => riveUrl(k));
  if (urls.length === 0) {
    console.log('No Rive files to preload');
    dispatchComponentsReady();
    return;
  }
  pendingCount = urls.length;
  urls.forEach((url) => {
    loadRiveFile(
      url,
      (file) => {
        const key = Object.keys(RIVE_MANIFEST).find((k) => riveUrl(k) === url);
        if (key) fileCache[key] = file;
        pendingCount--;
        settle();
      },
      (e) => {
        console.error(`Failed to load Rive file ${url}:`, e);
        pendingCount--;
        settle();
      }
    );
  });
  window.addEventListener('resize', resizeAll);
  window
    .matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    .addEventListener('change', resizeAll);
}

export const isAllLoaded = () => allLoaded;
export const getPendingCount = () => pendingCount;

/** lR 9520 */
export function resizeAll() {
  instances.forEach((r) => {
    if (r) r.resizeDrawingSurfaceToCanvas();
  });
}

/** u8 9506 — fit attribute mapping (alignment is always Center) */
export function fitFromAttr(attr?: string | null): rive.Fit {
  const map: Record<string, rive.Fit> = {
    contain: rive.Fit.Contain,
    cover: rive.Fit.Cover,
    fill: rive.Fit.Fill,
    fitwidth: rive.Fit.FitWidth,
    fitheight: rive.Fit.FitHeight,
    none: rive.Fit.None,
    scaledown: rive.Fit.ScaleDown,
    layout: rive.Fit.Layout,
  };
  const fit = map[attr?.toLowerCase() ?? ''];
  return fit !== undefined ? fit : rive.Fit.Contain;
}

/** IH 9526 */
export const instanceOf = (canvas: RiveCanvas) => canvas.riveInstance || null;

/** Q4 9530 — full teardown of one canvas-bound instance */
export function cleanupCanvas(canvas: RiveCanvas) {
  const r = instanceOf(canvas);
  if (!r) return;
  r.cleanup();
  if (canvas.riveScrollControl) {
    canvas.riveScrollControl.scrollTrigger?.kill();
    canvas.riveScrollControl.timeline?.kill();
    canvas.riveScrollControl = null;
  }
  if (canvas.lenisScrollHandler && window.lenis) {
    window.lenis.off('scroll', canvas.lenisScrollHandler as never);
    canvas.lenisScrollHandler = null;
  }
  const i = instances.indexOf(r);
  if (i > -1) instances.splice(i, 1);
  canvas.riveInstance = null;
}

/** g8 9438 — hamburger "close" input + ARIA sync */
export function setMenuClosedState(open: boolean) {
  if (!navState.hamburgerInputs) return;
  const close = navState.hamburgerInputs.find((i) => i.name === 'close');
  if (close) {
    close.value = open;
    document.querySelectorAll('[data-nav-ham]').forEach((el) => {
      el.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      el.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navState.menuOpen = open;
  }
}

/** HE 9446 — hamburger color theme */
export function setHamburgerTheme(theme: string) {
  if (!navState.hamburgerInputs) return;
  const transparent = navState.hamburgerInputs.find((i) => i.name === 'color-transparent');
  const white = navState.hamburgerInputs.find((i) => i.name === 'color-white');
  if (transparent && white) {
    if (theme.toLowerCase() === 'transparent') {
      transparent.value = true;
      white.value = false;
    } else if (theme.toLowerCase() === 'white') {
      transparent.value = false;
      white.value = true;
    }
  }
}

export { rive };
