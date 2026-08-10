/**
 * GL app facade — source: eM/AL/yU/QL 41519-41532 + EZ tail 41681-41684.
 * WebGL2 gate mirrors the source: available -> construct the app, otherwise
 * add the gl-fallback class and leave bI null.
 */
import { GL } from './core/app';
import { World } from './world';
import { WebGLSupport } from './core/support';

let app: GL | null = null; // bI

/** EZ tail 41681-41684 — call after initLandoGL() */
export function constructGlApp() {
  if (WebGLSupport.isWebGL2Available()) app = new GL();
  else {
    console.log('WebGL 2.0 is not available - initializing fallback.');
    document.documentElement.classList.add('gl-fallback');
  }
}

/** eM 41519 */
export async function glLoad() {
  if (app) await app.load();
}

/** AL 41522 */
export function glInit() {
  if (app) app.init((gl) => new World(gl));
}

/** yU 41526 — re-attach renderer + world on taxi enter (home/on-track/calendar/not-found) */
export function glAdd() {
  if (app) {
    app.renderer.add();
    app.world!.add();
  }
}

/** QL 41530 */
export function glDestroyWorld() {
  if (app) app.world!.destroy();
  document.documentElement.classList.remove('gl__is-disco');
}

export const getApp = () => app;
