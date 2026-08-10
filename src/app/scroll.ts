/**
 * Lenis manager — source: QV class 47020-47091, EV closure 47092-47099.
 *
 * Both breakpoint branches of createLenisInstance are identical in the source
 * (quirk, wrapper documentElement / content body either way) — collapsed here
 * with the quirk noted.
 */
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';

class LenisManager {
  isDesktop: boolean;
  lenis: Lenis;

  constructor() {
    if (!window.landoGL) (window as never as { landoGL: object }).landoGL = {};
    this.isDesktop = window.innerWidth > 991;
    this.lenis = this.createLenisInstance();
    window.lenis = this.lenis;
    this.init();
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  createLenisInstance(): Lenis {
    // 47034-47043: identical config on both branches (quirk)
    return new Lenis({
      infinite: false,
      lerp: 0.1,
      smoothWheel: true,
      touchMultiplier: 1.25,
      autoResize: true,
      syncTouch: true,
      wrapper: document.documentElement,
      content: document.body,
    });
  }

  handleResize() {
    const wasDesktop = this.isDesktop;
    this.isDesktop = window.innerWidth > 991;
    if (wasDesktop !== this.isDesktop) {
      const pos = this.lenis.scroll;
      this.lenis.destroy();
      this.lenis = this.createLenisInstance();
      window.lenis = this.lenis;
      if (window.landoGL) window.landoGL.lenis = this.lenis as never;
      this.init();
      if (pos) this.lenis.scrollTo(pos, { immediate: true });
      ScrollTrigger.refresh();
    }
  }

  init() {
    this.lenis.on('scroll', () => {
      ScrollTrigger.update();
    });
    gsap.ticker.add((t) => {
      this.lenis.raf(t * 1000);
    }, false, true);
    gsap.ticker.lagSmoothing(0);
    (window.lenis as Lenis & { resize?: () => void }).resize = this.resize.bind(this);
  }

  scrollTo(target: number, options: Record<string, unknown> = {}) {
    this.lenis.scrollTo(target, { duration: 0, ...options });
  }

  stop() {
    this.lenis.stop();
  }

  start() {
    this.lenis.start();
  }

  resize() {
    if (this.lenis) {
      this.lenis.resize();
      ScrollTrigger.refresh();
    }
  }

  getCurrentScroll() {
    return this.lenis.scroll;
  }
}

let manager: LenisManager | null = null;

/** EV 47092 — create singleton + expose window.lenisStart/lenisStop */
export function initScroll(): LenisManager {
  if (manager) return manager;
  manager = new LenisManager();
  window.lenisStart = () => manager!.start();
  window.lenisStop = () => manager!.stop();
  return manager;
}

export const getScrollManager = () => manager;
