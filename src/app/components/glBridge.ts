/**
 * GL background color scroll bridge — source: SL module 44586-44663 (PL).
 * [data-gl-change-track] scrubs backgroundScene colors + body background.
 */
import { gsap as m } from '../gsap';

let triggers: ScrollTrigger[] = []; // $Z

const COLOR_MAP: Record<string, string> = {
  black: '#111112',
  'dark-green': '#282c20',
  'dark-green-tint-1': '#363B25',
  'dark-green-tint-1-low': '#D4D7CA',
  white: '#f4f4ed',
  lime: '#D2FF00',
};

declare global {
  interface Window {
    debugGLColors?: boolean;
    toggleGLColorDebug?: (v?: boolean) => void;
  }
}

/** PL 44586 */
export function initGlColorTracks() {
  if (triggers.length > 0) {
    triggers.forEach((t) => t.kill());
    triggers = [];
  }
  const gl = window.landoGL;
  if (gl && gl.params && gl.params.backgroundScene) {
    gl.params.backgroundScene.COLOR_BACKGROUND = COLOR_MAP['dark-green'];
    gl.params.backgroundScene.COLOR_FOREGROUND = COLOR_MAP['dark-green-tint-1'];
    document.body.style.backgroundColor = COLOR_MAP['dark-green'];
    if (gl.updateColors) gl.updateColors();
  }
  const resolve = (name: string | null): string | null => {
    if (!name) return null;
    return COLOR_MAP[name.trim().toLowerCase()] || name.trim();
  };
  const pair = (attr: string | null): [string | null, string | null] => {
    if (!attr) return [null, null];
    const parts = attr.split(',').map((s) => s.trim());
    return [resolve(parts[0]), resolve(parts[1] || parts[0])];
  };
  document.querySelectorAll<HTMLElement>('[data-gl-change-track]').forEach((el) => {
    const fromAttr = el.getAttribute('data-gl-change-from');
    const toAttr = el.getAttribute('data-gl-change-to');
    const start = el.getAttribute('data-gl-change-trigger-start') || 'top top';
    const end = el.getAttribute('data-gl-change-trigger-end') || 'bottom bottom';
    const [fromBg, fromFg] = pair(fromAttr);
    const [toBg, toFg] = pair(toAttr);
    if (!fromBg || !toBg) {
      console.warn('Invalid color values for element:', el);
      return;
    }
    const proxy = { progress: 0 };
    const tween = m.fromTo(
      proxy,
      { progress: 0 },
      {
        progress: 1,
        scrollTrigger: {
          trigger: el,
          start,
          end,
          scrub: true,
          // source passes a (non-functional) ease inside scrollTrigger vars; kept
          ease: 'cubic-bezier(1, 0, 0.37, 1)',
          invalidateOnRefresh: true,
          onUpdate: () => {
            const bg = m.utils.interpolate(fromBg, toBg, proxy.progress);
            window.landoGL!.params.backgroundScene.COLOR_BACKGROUND = bg;
            if (fromFg && toFg) {
              window.landoGL!.params.backgroundScene.COLOR_FOREGROUND = m.utils.interpolate(
                fromFg,
                toFg,
                proxy.progress
              );
            }
            if (window.landoGL!.updateColors) window.landoGL!.updateColors();
            document.body.style.backgroundColor = bg;
          },
        } as never,
        immediateRender: true,
      }
    );
    triggers.push(tween.scrollTrigger!);
  });
  window.debugGLColors = false;
  window.toggleGLColorDebug = function (v?: boolean) {
    window.debugGLColors = v !== undefined ? v : !window.debugGLColors;
    console.log(`GL Color debug is now ${window.debugGLColors ? 'enabled' : 'disabled'}`);
  };
}
