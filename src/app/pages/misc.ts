/**
 * Partnerships / partnerships-item / calendar / not-found — source 46002-46164.
 * f$/bL, k_/w_/P_/WZ/vL, S_/b$, T_/j_/__/h$/dL.
 */
import { gsap as m, ScrollTrigger as TA } from '../gsap';
import {
  initHorizontalSections,
  killHorizontalSections,
  initSocialCallout,
  initCampCollection,
} from '../components/layout';
import {
  initOvalScroll,
  initAnimHigh,
  initTextHover,
  initRichTextReveal,
  cleanupRichTextReveal,
  initImgHighlight,
  initStatListReveal,
  formatText,
} from '../components/text';
import { setHamburgerTheme } from '../rive/preload';
import { setLogoColor } from '../rive/components';
import { initCountdowns, initStatHover, initCalendarSync } from './onTrack';

/** f$ 46002 */
export function initPartnershipsPage() {
  if (window.innerWidth >= 992)
    setTimeout(() => {
      initOvalScroll();
      initAnimHigh();
      initTextHover();
    }, 0);
  initCampCollection();
  initSocialCallout();
}

/** bL 46009 — empty in source */
export function cleanupPartnershipsPage() {}

/** k_ 46016 / w_ 46024 */
function hideBrand() {
  const brand = document.querySelector('[data-nav-group="brand"]');
  if (brand) m.set(brand, { visibility: 'hidden', pointerEvents: 'none' });
}
function showBrand() {
  const brand = document.querySelector('[data-nav-group="brand"]');
  if (brand) m.set(brand, { visibility: 'visible', pointerEvents: 'auto' });
}

/** P_ 46032 — remove empty more-list section */
function pruneEmptyMoreList() {
  const list = document.querySelector('[data-more-list]');
  if (!list) return;
  if (list.querySelectorAll('.camp-item').length === 0) {
    const section = document.querySelector('[data-more-section]');
    if (section) section.remove();
  }
}

/** WZ 46041 */
export function initPartnershipsItemPage() {
  if (window.innerWidth >= 992)
    setTimeout(() => {
      initOvalScroll();
      initAnimHigh();
      initTextHover();
      initHorizontalSections();
      initRichTextReveal();
      initImgHighlight();
    }, 10);
  initCampCollection();
  hideBrand();
  setTimeout(() => {
    pruneEmptyMoreList();
    TA.refresh();
  }, 100);
}

/** vL 46050 */
export function cleanupPartnershipsItemPage() {
  killHorizontalSections();
  cleanupRichTextReveal();
  showBrand();
}

/** S_ 46059 — calendar history accordion */
export function initCalendarHistory() {
  document.querySelectorAll('[data-calendar-history="wrap"]').forEach((wrap) => {
    wrap.querySelectorAll('[data-calendar-history="item"]').forEach((item) => {
      const trigger = item.querySelector<HTMLElement>('[data-calendar-history="trigger"]');
      const content = item.querySelector<HTMLElement>('[data-calendar-history="content"]');
      if (!trigger || !content) return;
      content.style.display = 'none';
      trigger.setAttribute('aria-expanded', 'false');
      if (!content.id) content.id = `calendar-history-content-${Math.random().toString(36).substring(2, 10)}`;
      trigger.setAttribute('aria-controls', content.id);
      content.setAttribute('aria-hidden', 'true');
      trigger.setAttribute('role', 'button');
      content.setAttribute('role', 'region');
      if (!trigger.hasAttribute('aria-label')) {
        const label = trigger.textContent!.trim();
        trigger.setAttribute('aria-label', label || 'Toggle calendar history item');
      }
      if (trigger.tagName !== 'BUTTON' && trigger.tagName !== 'A') trigger.setAttribute('tabindex', '0');
      trigger.addEventListener('click', () => toggle(item, trigger, content));
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle(item, trigger, content);
        }
      });
    });
  });

  function closeSiblings(item: Element, wrap: Element) {
    wrap.querySelectorAll('[data-calendar-history="item"]').forEach((other) => {
      if (other !== item) {
        const trigger = other.querySelector('[data-calendar-history="trigger"]');
        const content = other.querySelector<HTMLElement>('[data-calendar-history="content"]');
        if (other.classList.contains('is-open')) {
          other.classList.remove('is-open');
          content!.style.display = 'none';
          trigger!.setAttribute('aria-expanded', 'false');
          content!.setAttribute('aria-hidden', 'true');
        }
      }
    });
  }

  function toggle(item: Element, trigger: HTMLElement, content: HTMLElement) {
    const isOpen = item.classList.contains('is-open');
    const wrap = item.closest('[data-calendar-history="wrap"]')!;
    closeSiblings(item, wrap);
    if (isOpen) {
      item.classList.remove('is-open');
      content.style.display = 'none';
      trigger.setAttribute('aria-expanded', 'false');
      content.setAttribute('aria-hidden', 'true');
    } else {
      item.classList.add('is-open');
      content.style.display = 'block';
      trigger.setAttribute('aria-expanded', 'true');
      content.setAttribute('aria-hidden', 'false');
      setTimeout(() => {
        const r = item.getBoundingClientRect();
        if (r.top < 0 || r.top > window.innerHeight * 0.3) {
          if (window.lenis) window.lenis.scrollTo(item as HTMLElement, { offset: -100, duration: 0.5 });
          else (item as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 10);
    }
  }
}

/** b$ 46106 */
export function initCalendarPage() {
  if (window.innerWidth >= 992) {
    initOvalScroll();
    initAnimHigh();
    initTextHover();
  }
  initImgHighlight();
  initStatListReveal();
  formatText();
  initCountdowns();
  initCalendarHistory();
  [200, 200].forEach((delay) => {
    setTimeout(() => {
      setHamburgerTheme('white');
      setLogoColor('white');
    }, delay);
  });
  initStatHover();
  initCalendarSync(false);
}

/** T_ 46121 — 404 helmet variant switcher */
function initGlSwitchers() {
  const switchers = document.querySelectorAll<HTMLElement>('[data-gl-switcher]');
  console.log('switchers', switchers);
  console.log('gl', window.landoGL!.params.notFoundScene);
  switchers.forEach((s) => {
    s.addEventListener('click', () => {
      const name = s.getAttribute('data-gl-switcher')!;
      const variant = name.charAt(0).toUpperCase() + name.slice(1);
      window.landoGL!.params.notFoundScene.VARIANT = variant;
      s.classList.add('is-active');
      switchers.forEach((other) => {
        if (other !== s) other.classList.remove('is-active');
      });
    });
  });
}

/** h$ 46150 */
export function initNotFoundPage() {
  hideBrand();
  initGlSwitchers();
  [200, 200].forEach((delay) => {
    setTimeout(() => {
      setHamburgerTheme('white');
      setLogoColor('white');
    }, delay);
  });
}

/** dL 46158 */
export function cleanupNotFoundPage() {
  showBrand();
}
