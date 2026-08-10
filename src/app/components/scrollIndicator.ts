/** Scroll indicator — source: zL module, qZ 43757-43845 (VL/vU/J_ 43436-43438). */
import { gsap as m } from '../gsap';

let hideTimer: ReturnType<typeof setTimeout>; // VL
let visible = false; // vU
const HIDE_DELAY = 500; // J_

export interface ScrollIndicator {
  cleanup: () => void;
  reinit: () => void;
}

/** qZ 43757 */
export function createScrollIndicator(): ScrollIndicator {
  const indicator = document.querySelector<HTMLElement>('.scroll-indicator');
  const bar = document.querySelector<HTMLElement>('.scroll-indicator-bar');
  if (!indicator || !bar) {
    console.warn('Scroll indicator elements not found');
    return { cleanup: () => {}, reinit: () => {} };
  }
  if (!visible) m.set(indicator, { autoAlpha: 0 });

  const sizeBar = () => {
    if (!indicator || !bar) return 0;
    const vh = window.innerHeight;
    const total = document.documentElement.scrollHeight;
    const ratio = vh / total;
    const pct = m.utils.clamp(10, 25, ratio * 100);
    m.set(bar, { height: `${pct}%` });
    return pct;
  };
  const barPct = sizeBar();

  const position = () => {
    if (!indicator || !bar) return;
    const vh = window.innerHeight;
    const scrollable = document.documentElement.scrollHeight - vh;
    const progress = window.scrollY / scrollable;
    const trackH = indicator.offsetHeight;
    const barH = (barPct / 100) * trackH;
    const range = trackH - barH;
    m.set(bar, { y: progress * range });
  };

  const onScroll = () => {
    if (!indicator || !bar) return;
    if (!visible) {
      visible = true;
      m.to(indicator, { autoAlpha: 1, duration: 0.5 });
    }
    clearTimeout(hideTimer);
    const vh = window.innerHeight;
    const scrollable = document.documentElement.scrollHeight - vh;
    const progress = window.scrollY / scrollable;
    const trackH = indicator.offsetHeight;
    const barH = (barPct / 100) * trackH;
    const range = trackH - barH;
    m.to(bar, { y: progress * range, duration: 0.3, ease: 'power2.out' });
    hideTimer = setTimeout(() => {
      if (!indicator) return;
      visible = false;
      m.to(indicator, { autoAlpha: 0, duration: 0.5 });
    }, HIDE_DELAY);
  };

  window.addEventListener('scroll', onScroll);
  const onResize = () => {
    sizeBar();
    position();
  };
  window.addEventListener('resize', onResize);
  position();

  const cleanup = () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', sizeBar as never);
    if (indicator) m.set(indicator, { autoAlpha: 0, duration: 0.5 } as never);
    if (bar) m.set(bar, { clearProps: 'all' });
  };

  return {
    cleanup,
    reinit: () => {
      cleanup();
      const el = document.querySelector('.scroll-indicator');
      const alpha = el ? m.getProperty(el, 'autoAlpha') : visible ? 1 : 0;
      createScrollIndicator();
      const fresh = document.querySelector('.scroll-indicator');
      if (fresh) m.set(fresh, { autoAlpha: alpha as number });
    },
  };
}
