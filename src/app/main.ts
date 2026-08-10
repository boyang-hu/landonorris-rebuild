/**
 * Rebuild entry — replaces lando.OFF+BRAND.gold-android-fix-03.js.
 * Boot pipeline (pretty 47100-47119):
 *   vC() / EZ() / q$() module init -> history.scrollRestoration -> c_():
 *   await BL() -> await Promise.all([eM(), m_()]) -> taxi + lenis -> CD().
 */
import './gsap';
import { initLandoGL } from './gl/params';
import { loadPageTransition } from './transition';
import { preloadAllRiveFiles } from './rive/preload';
import { glLoad } from './gl';
import { initScroll } from './scroll';
import { initRouter } from './router';
import { printBanner } from './utils';

// EZ (41535): landoGL config + (later) GL app construction. WebGL2 check and
// bI = new RQ(...) land with M5; gl-fallback class mirrors 41684.
initLandoGL();

console.time('debug');
history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

/** m_ 47106 — resolve when every manifest rive file is in */
function allRiveLoaded(): Promise<void> {
  return new Promise((resolve) => {
    window.addEventListener('allriveloaded', () => resolve());
    preloadAllRiveFiles();
  });
}

/** c_ 47113 */
async function boot() {
  await loadPageTransition();
  await Promise.all([glLoad(), allRiveLoaded()]);
  initScroll();
  initRouter(); // taxi Core constructor triggers renderer.initialLoad() -> mL()
  printBanner();
}

boot();
