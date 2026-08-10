/**
 * GSAP assembly — source: pretty LB closure 9425-9436, dR 9408-9413, t2 9415-9423.
 *
 * Source registers ScrollTrigger (TA), MotionPathPlugin (u6, banner ~9083) and
 * SplitText (CI = vR, banner 9392). gsap.defaults({}) is called with an empty
 * object (r2 = {}, a no-op — kept for parity). ScrollTrigger's default scroller
 * is "body" on both breakpoints (dR's ternary has identical branches, quirk Q7).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, SplitText);
gsap.defaults({});

const SCROLLER = 'body'; // uR, 9423

function applyScrollerDefaults() {
  // dR 9408: `window.innerWidth <= 991 ? uR : uR` — both branches "body" (Q7)
  ScrollTrigger.defaults({ scroller: SCROLLER });
  ScrollTrigger.refresh();
}

/** t2 9415 — trailing debounce */
export function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return function (this: unknown, ...args: unknown[]) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args as never[]), ms);
  } as T;
}

applyScrollerDefaults();
window.addEventListener('resize', debounce(applyScrollerDefaults, 250));

export { gsap, ScrollTrigger, SplitText, MotionPathPlugin };
