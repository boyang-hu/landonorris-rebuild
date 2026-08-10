/**
 * GL app facade — source: eM/AL/yU/QL 41519-41532 + EZ tail 41681-41684.
 * The full engine (RQ and friends) lands with M5; until then load/init are
 * resolved no-ops so the boot pipeline is exercisable end to end.
 */

export interface GlApp {
  load(): Promise<void>;
  init(): void;
  add(): void;
  destroyWorld(): void;
}

let app: GlApp | null = null;

export function setGlApp(a: GlApp) {
  app = a;
}

/** eM 41519 */
export async function glLoad() {
  if (app) await app.load();
}

/** AL 41522 */
export function glInit() {
  if (app) app.init();
}

/** yU 41526 — re-attach renderer + world on taxi enter (home/on-track/calendar/not-found) */
export function glAdd() {
  if (app) app.add();
}

/** QL 41530 */
export function glDestroyWorld() {
  if (app) app.destroyWorld();
  document.documentElement.classList.remove('gl__is-disco');
}
