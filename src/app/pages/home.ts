/**
 * Home page — source: P$ module 44665-45000.
 * Z_ -> initStickyHeroSequence; H_/k$ -> otot; q_/Y_ -> exe; $_/D_ -> swipe
 * toggle; w$/TL -> initHomePage/cleanupHomePage (+ kill helpers).
 */
import { gsap as m, ScrollTrigger as TA } from '../gsap';
import {
  initHorizontalSections,
  killHorizontalSections,
  initHelmetGrid,
  resetHelmetGrid,
  initSocialCallout,
} from '../components/layout';
import { initOvalScroll, initAnimHigh, initTextHover } from '../components/text';
import { destroyAllVideos } from '../components/vimeo';
import { initGlColorTracks } from '../components/glBridge';

// w0 (44997)
const swipeState: {
  button: HTMLElement | null;
  handler: ((e: Event) => void) | null;
  isScrollDisabled: boolean;
  scrollTrigger: ScrollTrigger | null;
} = { button: null, handler: null, isScrollDisabled: false, scrollTrigger: null };

/** Z_ 44665 — hero DOM entrance sequence */
function initStickyHeroSequence() {
  const track = document.querySelector('[data-sticky-hero="track"]');
  if (!track) return;
  const tracker = track.querySelector('.hero-eyebrow-tracker');
  const msgChars = track.querySelector('[data-hero-anim="msg"]')?.querySelectorAll('.char');
  const imgs = track.querySelectorAll('[data-hero-anim="img"]');
  const mob1 = track.querySelector('[data-hero-anim="mob1"]');
  const mob2Chars = track.querySelector('[data-hero-anim="mob2"]')?.querySelectorAll('.char');
  if (!tracker || !msgChars || !imgs) return;
  const D = 0.8;
  m.set(msgChars, { y: '100%' });
  m.set(imgs, { autoAlpha: 0, y: '1rem' });
  m.set(mob1, { clipPath: 'ellipse(110% 110% at 50% 0%)' });
  if (mob2Chars) m.set(mob2Chars, { y: '0%' });
  const tl = m.timeline({
    scrollTrigger: { trigger: tracker, start: 'top bottom', end: 'center bottom', scrub: true },
  });
  tl.to(mob1, { clipPath: 'ellipse(100% 0% at 50% 0%)', duration: D, ease: 'power3.out' });
  if (mob2Chars && mob2Chars.length)
    tl.to(mob2Chars, { y: '-100%', duration: D, stagger: 0.02, ease: 'power3.out' }, '<');
  m.timeline({
    scrollTrigger: { trigger: tracker, start: 'top bottom', end: 'bottom bottom', scrub: true },
  })
    .to(msgChars, { y: '0', duration: D, stagger: 0.02, ease: 'power3.out' })
    .to(imgs, { autoAlpha: 1, y: 0, duration: D, ease: 'power3.out' }, '<0.3');
}

/** H_ 44723 */
function initOtotSection() {
  const section = document.querySelector('[data-otot-section]');
  if (!section) return;
  const img1 = section.querySelector('.otot-home-img-w.is-1 img');
  const img2 = section.querySelector('.otot-home-img-w.is-2 img');
  const col1 = section.querySelector('.otot-home-text-col.is-1');
  const col2 = section.querySelector('.otot-home-text-col.is-2');
  if (!img1 || !img2 || !col1 || !col2) return;
  m.set(img1, { x: '-20rem' });
  m.set(img2, { x: '20rem' });
  m.set(col1, { x: '-5rem' });
  m.set(col2, { x: '5rem' });
  m.to([img1, img2], {
    x: 0,
    ease: 'power2.out',
    scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom bottom', scrub: true },
  });
  m.to([col1, col2], {
    x: 0,
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top bottom', end: '60% bottom', scrub: true },
  });
}

/** k$ 44760 — shared with on-track */
export function initOtotBottomParallax() {
  const section = document.querySelector('[data-otot-bottom]');
  if (!section) return;
  const img = section.querySelector('img');
  if (!img) return;
  m.to(img, {
    y: '-20vh',
    scale: 1.1,
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
  });
}

/** q_ 44778 */
function initExeVisor() {
  const visor = document.querySelector('[data-exe-visor]');
  if (!visor) return;
  m.set(visor, { clipPath: 'ellipse(70% 0% at 50% 0%)' });
  m.to(visor, {
    clipPath: 'ellipse(70% 100% at 50% 0%)',
    ease: 'none',
    scrollTrigger: { trigger: visor, start: 'top bottom', end: 'bottom center', scrub: true },
  });
}

/** Y_ 44795 */
function initExeSection() {
  const section = document.querySelector('[data-exe-section]');
  if (!section) return;
  const wraps = section.querySelectorAll('.exe-cta-img-w');
  if (!wraps.length) return;
  const entries: { element: Element; fromY: number; toY: string }[] = [];
  wraps.forEach((w) => {
    const img = w.querySelector('img');
    if (!img) return;
    entries.push({ element: img, fromY: 0, toY: '-4rem' });
  });
  entries.forEach((e) => {
    m.set(e.element, { y: e.fromY });
    m.to(e.element, {
      y: e.toY,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

/** $_ 44826 — mobile scroll-lock toggle */
function initHomeSwipeToggle() {
  const button = document.querySelector<HTMLElement>('[data-home-swipe-toggle]');
  if (!button) {
    console.warn('Home swipe toggle button [data-home-swipe-toggle] not found');
    return;
  }
  const unlockedIcon = button.querySelector<HTMLElement>('.btn-rive-w.is-unlocked');
  const lockedIcon = button.querySelector<HTMLElement>('.btn-rive-w.is-locked');
  if (!unlockedIcon || !lockedIcon) {
    console.warn('Swipe toggle icons not found within button');
    return;
  }
  const unlockedDesc = document.querySelector('[data-home-swipe-desc="unlocked"]');
  const lockedDesc = document.querySelector('[data-home-swipe-desc="locked"]');
  if (!unlockedDesc || !lockedDesc) {
    console.warn('Swipe toggle description elements not found');
    return;
  }
  const unlockedText = unlockedDesc.querySelector('.text-eyebrow');
  const lockedText = lockedDesc.querySelector('.text-eyebrow');
  if (!unlockedText || !lockedText) {
    console.warn('Eyebrow elements not found within description elements');
    return;
  }
  swipeState.button = button;
  button.setAttribute('aria-label', 'Disable smooth scrolling and scroll to top');
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('role', 'switch');
  button.setAttribute('data-scroll-disabled', 'false');
  unlockedIcon.style.display = 'flex';
  lockedIcon.style.display = 'none';
  m.set(unlockedText, { y: '0%' });
  m.set(lockedText, { y: '100%' });
  swipeState.handler = function (e: Event) {
    e.preventDefault();
    if (!swipeState.isScrollDisabled) {
      if (typeof window.lenisStop === 'function') window.lenisStop();
      if (window.lenis && typeof window.lenis.scrollTo === 'function')
        window.lenis.scrollTo(0, { duration: 0 });
      swipeState.isScrollDisabled = true;
      button.setAttribute('aria-pressed', 'true');
      button.setAttribute('aria-label', 'Enable smooth scrolling');
      button.setAttribute('data-scroll-disabled', 'true');
      unlockedIcon.style.display = 'none';
      lockedIcon.style.display = 'flex';
      m.to(unlockedText, { y: '100%', duration: 0.3, ease: 'power2.out' });
      m.to(lockedText, { y: '0%', duration: 0.3, ease: 'power2.out' });
    } else {
      if (typeof window.lenisStart === 'function') window.lenisStart();
      swipeState.isScrollDisabled = false;
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', 'Disable smooth scrolling and scroll to top');
      button.setAttribute('data-scroll-disabled', 'false');
      unlockedIcon.style.display = 'block';
      lockedIcon.style.display = 'none';
      m.to(lockedText, { y: '100%', duration: 0.3, ease: 'power2.out' });
      m.to(unlockedText, { y: '0%', duration: 0.3, ease: 'power2.out' });
    }
  };
  button.addEventListener('click', swipeState.handler);
  const marker = document.querySelector('.top-marker');
  const wrap = document.querySelector('[data-home-swipe-wrap]');
  if (marker && wrap) {
    m.set(wrap, { autoAlpha: 1, pointerEvents: 'auto' });
    swipeState.scrollTrigger = TA.create({
      trigger: marker,
      start: 'top 95%',
      end: 'bottom top',
      onToggle: (self) => {
        if (self.isActive)
          m.to(wrap, { autoAlpha: 1, pointerEvents: 'auto', duration: 0.3, ease: 'power2.out' });
        else m.to(wrap, { autoAlpha: 0, pointerEvents: 'none', duration: 0.3, ease: 'power2.out' });
      },
    });
  } else {
    if (!marker) console.warn('.top-marker element not found');
    if (!wrap) console.warn('[data-home-swipe-wrap] element not found');
  }
}

/** D_ 44912 */
function destroyHomeSwipeToggle() {
  if (swipeState.button && swipeState.handler)
    swipeState.button.removeEventListener('click', swipeState.handler);
  if (swipeState.scrollTrigger) swipeState.scrollTrigger.kill();
  const wrap = document.querySelector('[data-home-swipe-wrap]');
  if (wrap) m.set(wrap, { autoAlpha: 1, pointerEvents: 'auto' });
  if (swipeState.isScrollDisabled && typeof window.lenisStart === 'function') window.lenisStart();
  swipeState.button = null;
  swipeState.handler = null;
  swipeState.isScrollDisabled = false;
  swipeState.scrollTrigger = null;
}

/** w$ 44924 — home init */
export function initHomePage() {
  initSocialCallout();
  initStickyHeroSequence();
  initHorizontalSections();
  initOtotSection();
  initOtotBottomParallax();
  if (window.innerWidth >= 992) initHelmetGrid();
  initExeVisor();
  initExeSection();
  if (window.innerWidth < 992) initHomeSwipeToggle();
  if (window.innerWidth < 992) m.set('.nav-middle', { y: '3.5rem' });
  initGlColorTracks();
  if (window.innerWidth >= 992) {
    initOvalScroll();
    initAnimHigh();
    initTextHover();
  }
}

// kill helpers W_/R_/X_/F_/N_/O_/M_ 44933-44977
function killStickyHero() {
  TA.getAll().forEach((st) => {
    const t = st.trigger as Element | undefined;
    if (t?.querySelector?.('[data-sticky-hero="canvas"]') || t?.matches?.('[data-sticky-hero="track"]')) st.kill();
  });
}
function killHeroAnim() {
  TA.getAll().forEach((st) => {
    if ((st.trigger as Element | undefined)?.querySelector?.('[data-hero-anim]')) st.kill();
  });
}
function killOtot() {
  TA.getAll().forEach((st) => {
    if ((st.trigger as Element | undefined)?.matches?.('[data-otot-section]')) st.kill();
  });
}
function killOtotBottom() {
  TA.getAll().forEach((st) => {
    if ((st.trigger as Element | undefined)?.matches?.('[data-otot-bottom]')) st.kill();
  });
}
function killExeVisor() {
  TA.getAll().forEach((st) => {
    if ((st.trigger as Element | undefined)?.matches?.('[data-exe-visor]')) st.kill();
  });
}
function killExeSection() {
  TA.getAll().forEach((st) => {
    if ((st.trigger as Element | undefined)?.matches?.('[data-exe-section]')) st.kill();
  });
}
function killSocialCallout() {
  TA.getAll().forEach((st) => {
    if ((st.trigger as Element | undefined)?.matches?.('[data-social-callout="wrap"]')) st.kill();
  });
  const wrap = document.querySelector('[data-social-callout="wrap"]');
  if (wrap) {
    wrap.querySelectorAll('.callout-socials-card-w').forEach((c) => c.replaceWith(c.cloneNode(true)));
    wrap.replaceWith(wrap.cloneNode(true));
  }
}

/** TL 44979 — home cleanup */
export function cleanupHomePage() {
  killStickyHero();
  killHeroAnim();
  killHorizontalSections();
  killSocialCallout();
  killOtot();
  killOtotBottom();
  resetHelmetGrid();
  killExeVisor();
  killExeSection();
  if (window.innerWidth < 992) destroyHomeSwipeToggle();
  destroyAllVideos();
  m.set('.nav-middle', { y: '0rem' });
  TA.getAll().forEach((st) => {
    const t = st.trigger as Element | undefined;
    if (
      t?.querySelector?.('[data-oval-scroll]') ||
      t?.querySelector?.('[data-text-highlight]') ||
      t?.querySelector?.('[data-text-hover-chars]')
    )
      st.kill();
  });
}
