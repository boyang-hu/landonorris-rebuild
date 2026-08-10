/**
 * On-track page + shared calendar components — source: y$ module 45002-45828.
 * S$/jL -> initCountdowns/clearCountdowns; L_ -> initPodiumParallax;
 * T$ -> initStatHover; V_ -> initPodiumScrub; j$ -> initCalendarSync;
 * _L -> initHeroflipGl; _$/yL -> initOnTrackPage/cleanupOnTrackPage.
 */
import { gsap as m, ScrollTrigger as TA } from '../gsap';
import {
  initHorizontalSections,
  killHorizontalSections,
  initHelmetGrid,
  resetHelmetGrid,
  initSocialCallout,
} from '../components/layout';
import {
  initOvalScroll,
  initAnimHigh,
  initTextHover,
  formatText,
  initImgHighlight,
  initCarCounter,
  initStatListReveal,
} from '../components/text';
import { setHamburgerTheme } from '../rive/preload';
import { setLogoColor } from '../rive/components';
import { initOtotBottomParallax } from './home';

/** S$ 45002 — countdowns ("DD/MM/YYYY HH:MM" parsed as UTC) */
export function initCountdowns() {
  const wraps = document.querySelectorAll<HTMLElement>('[data-countdown-wrap]');
  if (!wraps || wraps.length === 0) return;
  const intervals: number[] = [];
  wraps.forEach((wrap) => {
    const dateEl = wrap.querySelector('[data-countdown-date-target]');
    if (!dateEl) return;
    const digits = wrap.querySelectorAll('[data-countdown-digit]');
    if (!digits || digits.length !== 4) return;
    const text = dateEl.textContent!.trim();
    const [datePart, timePart] = text.split(' ');
    const [dd, mm, yyyy] = datePart.split('/');
    const [hh, min] = timePart.split(':');
    const target = new Date(
      Date.UTC(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10), parseInt(hh, 10), parseInt(min, 10), 0)
    );

    function tick() {
      const left = target.getTime() - Date.now();
      if (left < 0) {
        digits.forEach((d) => {
          d.textContent = '00';
        });
        return;
      }
      const days = Math.floor(left / 86400000);
      const hours = Math.floor((left % 86400000) / 3600000);
      const mins = Math.floor((left % 3600000) / 60000);
      const secs = Math.floor((left % 60000) / 1000);
      const parts = [
        days.toString().padStart(2, '0'),
        hours.toString().padStart(2, '0'),
        mins.toString().padStart(2, '0'),
        secs.toString().padStart(2, '0'),
      ];
      digits.forEach((d, i) => {
        d.textContent = parts[i];
      });
    }
    tick();
    const interval = window.setInterval(tick, 1000);
    wrap.dataset.countdownInterval = String(interval);
    intervals.push(interval);
  });
  return intervals;
}

/** jL 45043 */
export function clearCountdowns() {
  document.querySelectorAll<HTMLElement>('[data-countdown-wrap]').forEach((wrap) => {
    const id = wrap.dataset.countdownInterval;
    if (id) {
      clearInterval(Number(id));
      delete wrap.dataset.countdownInterval;
    }
  });
}

/** L_ 45052 — podium text parallax */
export function initPodiumParallax() {
  const wrap = document.querySelector('[data-podium="wrap"]');
  const secondChar = document.querySelectorAll('.text-on-t-stat-label-gigantic .char')[1];
  const text = document.querySelector('[data-podium="text"]');
  if (window.innerWidth >= 992) m.set(text, { y: '17.5rem' });
  else m.set(text, { y: '4rem' });
  m.to(text, {
    scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom center', scrub: true },
    y: 0,
    ease: 'power1.in',
  });
  m.to(secondChar, {
    scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom center', scrub: true },
    y: window.innerWidth >= 480 ? '-17.5rem' : '-6rem',
    ease: 'power1.in',
  });
}

/** T$ 45083 — stat list hover-follow image (desktop) */
export function initStatHover() {
  const lists = document.querySelectorAll<HTMLElement>('[data-stat-list]');
  const state = new Map<HTMLElement, { hoverObject: HTMLElement; tl: gsap.core.Timeline; isHovered: boolean }>();
  let mouseX = 0;
  let mouseY = 0;
  const visible = new Set<Element>();
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      });
    },
    { threshold: 0.1 }
  );
  document.addEventListener(
    'mousemove',
    (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      check();
    },
    { passive: true }
  );

  function check() {
    visible.forEach((listEl) => {
      const s = state.get(listEl as HTMLElement);
      if (s) {
        const r = listEl.getBoundingClientRect();
        const inside = mouseX >= r.left && mouseX <= r.right && mouseY >= r.top && mouseY <= r.bottom;
        if (inside && !s.isHovered) {
          s.isHovered = true;
          s.tl.timeScale(1).play();
        } else if (!inside && s.isHovered) {
          s.isHovered = false;
          s.tl.timeScale(2).reverse();
        }
        if (inside)
          m.to(s.hoverObject, {
            x: mouseX - r.left + 20,
            y: mouseY - r.top - 20,
            duration: 0.5,
            ease: 'power2.out',
          });
      }
    });
  }

  lists.forEach((list) => {
    const track = list.querySelector<HTMLElement>('[data-mouse-track]');
    if (!track) return;
    const reveal = track.querySelector<HTMLElement>('.f1-highlight-mouse-over-reveal');
    if (!reveal) return;
    const img = track.querySelector('img');
    m.set(track, {
      position: 'absolute',
      overflow: 'hidden',
      clipPath: 'ellipse(120% 0% at 50% 0%)',
      zIndex: 10,
      pointerEvents: 'none',
      x: 0,
      y: 0,
    });
    m.set(reveal, {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'var(--color--lime, #d2ff00)',
      zIndex: 5,
      clipPath: 'ellipse(120% 120% at 50% 100%)',
    });
    const tl = m.timeline({ paused: true });
    tl.to(track, { clipPath: 'ellipse(120% 120% at 50% 0%)', autoAlpha: 1, duration: 0.8, ease: 'power2.out' });
    tl.to(reveal, { clipPath: 'ellipse(120% 0% at 50% 100%)', duration: 0.6, ease: 'power2.out' }, '-=0.4');
    list.querySelectorAll('[data-stat-item]').forEach((item) => {
      const hidden = item.querySelector('.display-none');
      const hoverImg = hidden ? hidden.querySelector('[data-stat-hover-img]') : null;
      if (hoverImg && img)
        item.addEventListener('mouseover', () => {
          const src = hoverImg.getAttribute('src');
          if (src) (img as HTMLImageElement).src = src;
        });
    });
    io.observe(list);
    state.set(list, { hoverObject: track, tl, isHovered: false });
    list.addEventListener('mouseenter', () => {
      const s = state.get(list)!;
      s.isHovered = true;
      s.tl.play();
    });
    list.addEventListener('mousemove', (e) => {
      const r = list.getBoundingClientRect();
      m.to(track, {
        x: e.clientX - r.left + 20,
        y: e.clientY - r.top - 20,
        duration: 0.5,
        ease: 'power2.out',
      });
    });
    list.addEventListener('mouseleave', () => {
      const s = state.get(list)!;
      s.isHovered = false;
      s.tl.timeScale(2).reverse();
    });
  });
  window.addEventListener('scroll', () => check(), { passive: true });
  return function cleanup() {
    io.disconnect();
    visible.clear();
  };
}

/** V_ 45197 — podium hover scrub-image (desktop) */
export function initPodiumScrub() {
  const wrap = document.querySelector<HTMLElement>('[data-podium="wrap"]');
  if (!wrap) return;
  const track = wrap.querySelector<HTMLElement>('[data-mouse-track]');
  if (!track) return;
  const reveal = track.querySelector<HTMLElement>('.f1-highlight-mouse-over-reveal');
  if (!reveal) return;
  const img = track.querySelector<HTMLImageElement>('img');
  if (!img) return;
  const media = document.querySelector('[data-podium-media]');
  if (!media) return;
  const frames = Array.from(media.querySelectorAll('img'));
  if (!frames.length) return;
  const IN = 0.8;
  const OUT = 0.6;
  let mouseX = 0;
  let mouseY = 0;
  let hovered = false;
  let inView = false;
  const io = new IntersectionObserver(
    (entries) => {
      inView = entries[0].isIntersecting;
    },
    { threshold: 0.1 }
  );
  io.observe(wrap);
  m.set(track, {
    position: 'absolute',
    overflow: 'hidden',
    clipPath: 'ellipse(120% 0% at 50% 0%)',
    zIndex: 10,
    pointerEvents: 'none',
    x: 0,
    y: 0,
  });
  m.set(reveal, {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'var(--color--lime, #d2ff00)',
    zIndex: 5,
    clipPath: 'ellipse(120% 120% at 50% 100%)',
  });
  const tl = m.timeline({ paused: true });
  tl.to(track, { clipPath: 'ellipse(120% 120% at 50% 0%)', autoAlpha: 1, duration: IN, ease: 'power2.out' });
  tl.to(reveal, { clipPath: 'ellipse(120% 0% at 50% 100%)', duration: OUT, ease: 'power2.out' }, `-=${IN / 2}`);

  function scrub(x: number, width: number) {
    const f = Math.min(Math.max(0, x / width), 1);
    const idx = Math.min(Math.floor(f * frames.length), frames.length - 1);
    const src = frames[idx].getAttribute('src');
    if (src && img!.src !== src) img!.src = src;
  }

  function check() {
    if (!inView) return;
    const r = wrap!.getBoundingClientRect();
    const inside = mouseX >= r.left && mouseX <= r.right && mouseY >= r.top && mouseY <= r.bottom;
    if (inside && !hovered) {
      hovered = true;
      tl.timeScale(1).play();
    } else if (!inside && hovered) {
      hovered = false;
      tl.timeScale(2).reverse();
    }
    if (inside) {
      m.to(track, { x: mouseX - r.left + 20, y: mouseY - r.top - 20, duration: 0.5, ease: 'power2.out' });
      scrub(mouseX - r.left, r.width);
    }
  }
  const onMove = (e: MouseEvent) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    check();
  };
  const onScroll = () => check();
  document.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  return function cleanup() {
    io.disconnect();
    document.removeEventListener('mousemove', onMove);
    window.removeEventListener('scroll', onScroll);
  };
}

/** j$ 45289 — calendar DOM sync (data lives in the CMS-baked hidden dictionary) */
export function initCalendarSync(debug = false) {
  const log = (...args: unknown[]) => {
    if (debug) console.log(...args);
  };
  const err = (...args: unknown[]) => console.error(...args);
  log('🔄 Initializing calendar sync');
  const wrap = document.querySelector('[data-cal-wrap]');
  if (!wrap) {
    err('❌ Calendar wrapper not found');
    return;
  }
  const items = Array.from(wrap.querySelectorAll<HTMLElement>('[data-cal-item]'));
  if (!items.length) {
    err('❌ No calendar items found');
    return;
  }
  const trackWrap = document.querySelector<HTMLElement>('[data-cal-track-wrap]');
  if (!trackWrap) {
    err('❌ Track wrapper not found');
    return;
  }
  const targets = Array.from(trackWrap.querySelectorAll<HTMLElement>('[data-cal-target]'));
  if (!targets.length) {
    err('❌ No target elements found');
    return;
  }
  const nextBtn = trackWrap.querySelector('[data-cal-control="next-item"]');
  const prevBtn = trackWrap.querySelector('[data-cal-control="previous-item"]');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dated = items.map((item) => {
    const dateEl = item.querySelector('[data-cal-list="date-actual"]');
    const raw = dateEl ? dateEl.textContent!.trim() : null;
    let date: Date | null = null;
    if (raw)
      try {
        const parts = raw.split(/[/ :]/);
        if (parts.length >= 3) date = new Date(+parts[2], +parts[1] - 1, +parts[0]);
        else err(`❌ Invalid date format: ${raw}`);
      } catch (e) {
        err(`❌ Error parsing date: ${raw}`, e);
        date = null;
      }
    if (date && date < today) item.classList.add('is-in-past');
    return { element: item, date };
  });
  dated.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.getTime() - b.date.getTime();
  });
  let current = dated.findIndex((d) => d.date && d.date >= today);
  if (current === -1) current = dated.length - 1;
  targets.forEach((target) => {
    if (target.dataset.animProcessed) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'cal-target-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.overflow = 'hidden';
    const reveal = document.createElement('div');
    reveal.className = 'cal-target-reveal';
    reveal.style.position = 'absolute';
    reveal.style.top = '0';
    reveal.style.left = '0';
    reveal.style.width = '100%';
    reveal.style.height = '100%';
    reveal.style.backgroundColor = 'var(--color--lime, #d2ff00)';
    reveal.style.transformOrigin = 'right center';
    reveal.style.zIndex = '15';
    target.parentNode!.insertBefore(wrapper, target);
    wrapper.appendChild(target);
    wrapper.appendChild(reveal);
    m.set(reveal, { scaleX: 1 });
    m.set(target, { position: 'relative', zIndex: 10, autoAlpha: 1 });
    m.set(wrapper, { clipPath: 'inset(0 100% 0 0)' });
    target.dataset.animProcessed = 'true';
  });
  const wrappers = trackWrap.querySelectorAll('.cal-target-wrapper');
  const reveals = trackWrap.querySelectorAll('.cal-target-reveal');

  function project(item: HTMLElement) {
    const circuitId = item.querySelector('[data-cal-list="circuit-id"]');
    if (circuitId && window.landoGL && window.landoGL.params && window.landoGL.params.tracksScene) {
      window.landoGL.params.tracksScene.CURRENT = circuitId.textContent!.trim();
    }
    targets.forEach((target) => {
      const field = target.getAttribute('data-cal-target');
      if (!field || field === 'transition-item') return;
      if (field === 'past-reveal') {
        if (item.classList.contains('is-in-past')) m.set(target, { display: 'block', autoAlpha: 1 });
        else m.set(target, { display: 'none', autoAlpha: 0 });
        return;
      }
      if (field === 'past-hide') {
        if (item.classList.contains('is-in-past')) m.set(target, { display: 'none', autoAlpha: 0 });
        else m.set(target, { display: 'block', autoAlpha: 1 });
        return;
      }
      if (field === 'circuit-flag') {
        const src = item.querySelector<HTMLImageElement>('[data-cal-list="circuit-flag"]');
        if (src && src.src) {
          if (target.tagName === 'IMG') (target as HTMLImageElement).src = src.src;
          else {
            const img = target.querySelector('img');
            if (img) img.src = src.src;
          }
        }
        return;
      }
      if (field === 'circuit-about') {
        const src = item.querySelector('[data-cal-list="circuit-about"]');
        if (src) target.innerHTML = src.innerHTML;
        return;
      }
      if (field === 'results' && item.classList.contains('is-in-past')) {
        target.textContent = 'Schedule';
        return;
      }
      if (item.classList.contains('is-in-past')) {
        const map: Record<string, string> = {
          'prac1-time': 'prac1-time-result',
          'prac1-date': 'prac1-time-pos',
          'prac2-time': 'prac2-time-result',
          'prac2-date': 'prac2-time-pos',
          'prac3-time': 'prac3-time-result',
          'prac3-date': 'prac3-time-pos',
          'qual-time': 'qual-time-result',
          'qual-date': 'qual-time-pos',
          'race-time': 'race-time-result',
          'race-date': 'race-time-pos',
        };
        if (map[field]) {
          const src = item.querySelector(`[data-cal-list="${map[field]}"]`);
          if (src) {
            target.textContent = src.textContent;
            return;
          }
        }
      }
      const src = item.querySelector(`[data-cal-list="${field}"]`);
      if (src) target.textContent = src.textContent;
    });
    if (item.querySelector('[data-cal-sprint="true"]:not(.w-condition-invisible)')) {
      const p2 = trackWrap!.querySelector('[data-cal-target-label="practice2"]');
      const p3 = trackWrap!.querySelector('[data-cal-target-label="practice3"]');
      if (p2) p2.textContent = 'Sprint Quali';
      if (p3) p3.textContent = 'Sprint';
    } else {
      const p2 = trackWrap!.querySelector('[data-cal-target-label="practice2"]');
      const p3 = trackWrap!.querySelector('[data-cal-target-label="practice3"]');
      if (p2) p2.textContent = 'Practice 2';
      if (p3) p3.textContent = 'Practice 3';
    }
  }

  const currentItem = dated[current].element;
  project(currentItem);
  items.forEach((i) => i.classList.remove('is-active'));
  currentItem.classList.add('is-active');
  items.forEach((item, i) => {
    item.addEventListener('click', () => {
      current = dated.findIndex((d) => d.element === item);
      if (current === -1) current = i;
      switchTo(current);
      const rect = trackWrap!.getBoundingClientRect();
      const offsetRem = 8;
      const offsetPx = offsetRem * parseFloat(getComputedStyle(document.documentElement).fontSize);
      const y = window.scrollY + rect.top - offsetPx;
      if (window.lenis)
        window.lenis.scrollTo(y, {
          duration: 1.2,
          easing: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
        });
      else window.scrollTo({ top: y, behavior: 'smooth' });
    });
    item.style.cursor = 'pointer';
  });

  const intro = m.timeline({ scrollTrigger: { trigger: trackWrap, start: 'top 90%', once: true } });
  intro.to(wrappers, { clipPath: 'inset(0 0% 0 0)', duration: 0.5, stagger: 0.015, ease: 'power2.out' });
  intro.to(reveals, { scaleX: 0, duration: 0.5, stagger: 0.015, ease: 'power2.inOut' }, '-=0.2');

  function switchTo(idx: number) {
    if (idx < 0 || idx >= dated.length) {
      err('❌ Invalid item index:', idx);
      return;
    }
    const item = dated[idx].element;
    const tl = m.timeline();
    tl.call(() => {
      const circuitId = item.querySelector('[data-cal-list="circuit-id"]');
      if (circuitId && window.landoGL?.params?.tracksScene)
        window.landoGL.params.tracksScene.CURRENT = circuitId.textContent!.trim();
    });
    tl.to(wrappers, { clipPath: 'inset(0 100% 0 0)', duration: 0.5, stagger: 0.015, ease: 'power2.in' });
    tl.call(() => {
      project(item);
      items.forEach((i) => i.classList.remove('is-active'));
      item.classList.add('is-active');
    });
    tl.set(reveals, { scaleX: 1 });
    tl.to(wrappers, { clipPath: 'inset(0 0% 0 0)', duration: 0.5, stagger: 0.015, ease: 'power2.out' });
    tl.to(reveals, { scaleX: 0, duration: 0.5, stagger: 0.015, ease: 'power2.inOut' }, '-=0.2');
  }

  if (nextBtn)
    nextBtn.addEventListener('click', () => {
      if (current < dated.length - 1) current++;
      else current = 0;
      switchTo(current);
    });
  if (prevBtn)
    prevBtn.addEventListener('click', () => {
      if (current > 0) current--;
      else current = dated.length - 1;
      switchTo(current);
    });
  log('✅ Calendar sync initialized successfully');
}

/** _L 45620 — heroflip GL helmet flight path (writes landoGL bounds/PROGRESS) */
export function initHeroflipGl(debug = false): { cleanup: () => void; toggleDebug: () => boolean } | undefined {
  const track = document.querySelector<HTMLElement>('[data-heroflip="track"]');
  const pos1 = document.querySelector<HTMLElement>('[data-heroflip="pos1"]');
  const pos2 = document.querySelector<HTMLElement>('[data-heroflip="pos2"]');
  const pos3 = document.querySelector<HTMLElement>('[data-heroflip="pos3"]');
  const canvas = document.querySelector<HTMLElement>('[data-gl="helmet-scroll"]');
  if (!track || !pos1 || !pos2 || !pos3 || !canvas) {
    console.error('Missing required elements for hero scroll animation');
    return;
  }
  const savedStyle = {
    position: canvas.style.position,
    top: canvas.style.top,
    left: canvas.style.left,
    width: canvas.style.width,
    height: canvas.style.height,
    transform: canvas.style.transform,
    zIndex: canvas.style.zIndex,
  };
  if (getComputedStyle(track).position === 'static') track.style.position = 'relative';
  if (canvas.parentNode !== track) {
    canvas.parentNode!.removeChild(canvas);
    track.appendChild(canvas);
  }
  canvas.style.position = 'absolute';
  canvas.style.objectFit = 'cover';
  canvas.style.zIndex = '10';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.position = 'absolute';
  svg.style.top = '0';
  svg.style.left = '0';
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.pointerEvents = 'none';
  svg.style.zIndex = '5';
  svg.style.display = debug ? 'block' : 'none';
  track.appendChild(svg);
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('stroke', 'red');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('fill', 'none');
  svg.appendChild(path);
  const clearDebugPoints = () => {
    track.querySelectorAll('.debug-point').forEach((p) => p.remove());
  };

  function positions() {
    const tr = track!.getBoundingClientRect();
    return [pos1!, pos2!, pos3!].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.left - tr.left + r.width / 2,
        y: r.top - tr.top + r.height / 2,
        width: r.width,
        height: r.height,
      };
    });
  }

  let heldTween: gsap.core.Tween | undefined; // Z (never assigned in source; kept for parity)

  function build() {
    if (heldTween && heldTween.scrollTrigger) heldTween.scrollTrigger.kill();
    if (heldTween) heldTween.kill();
    clearDebugPoints();
    const P = positions();
    canvas!.style.left = P[0].x + 'px';
    canvas!.style.top = P[0].y + 'px';
    canvas!.style.width = P[0].width + 'px';
    canvas!.style.height = P[0].height + 'px';
    canvas!.style.transform = 'translate(-50%, -50%)';
    const cp1 = { x: P[0].x, y: P[0].y + (P[1].y - P[0].y) * 0.4 };
    const cp2 = { x: P[1].x, y: P[1].y - (P[1].y - P[0].y) * 0.3 };
    const cp3 = { x: P[1].x, y: P[1].y + (P[2].y - P[1].y) * 0.3 };
    const cp4 = { x: P[1].x + (P[2].x - P[1].x) * 0.6, y: P[2].y - (P[2].y - P[1].y) * 0.2 };
    path.setAttribute(
      'd',
      `M${P[0].x},${P[0].y} C${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${P[1].x},${P[1].y} C${cp3.x},${cp3.y} ${cp4.x},${cp4.y} ${P[2].x},${P[2].y}`
    );

    type Pt = { x: number; y: number };
    function bezier(a: Pt, b: Pt, c: Pt, d: Pt, t: number): Pt {
      const u = 1 - t;
      return {
        x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
        y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
      };
    }

    function apply(self: { progress: number }) {
      const p = self.progress;
      if (window.landoGL?.params?.helmetScrollScene) window.landoGL.params.helmetScrollScene.PROGRESS = p;
      let pt: Pt;
      if (p <= 0.5) {
        const t = p * 2;
        pt = bezier(P[0], cp1, cp2, P[1], t);
        const w = P[0].width + (P[1].width - P[0].width) * t;
        const h = P[0].height + (P[1].height - P[0].height) * t;
        window.landoGL!.bounds.helmetScroll.width = w;
        window.landoGL!.bounds.helmetScroll.height = h;
      } else {
        const t = (p - 0.5) * 2;
        pt = bezier(P[1], cp3, cp4, P[2], t);
        const w = P[1].width + (P[2].width - P[1].width) * t;
        // source assigns width to BOTH fields in the second segment (square plane)
        window.landoGL!.bounds.helmetScroll.width = w;
        window.landoGL!.bounds.helmetScroll.height = w;
      }
      window.landoGL!.bounds.helmetScroll.left = pt.x;
      window.landoGL!.bounds.helmetScroll.top = pt.y;
    }
    window.landoGL!.params.helmetScrollScene.PROGRESS = 0;
    TA.create({
      trigger: track!,
      start: () => 'top top',
      end: () => 'bottom 25%',
      scrub: true,
      invalidateOnRefresh: true,
      onRefresh: apply,
      onEnter: () => {
        if (debug) console.log('ScrollTrigger entered');
      },
      onUpdate: apply,
    });
    TA.create({
      trigger: track!,
      start: () => 'bottom center',
      end: () => `bottom+=${window.innerHeight} center`,
      invalidateOnRefresh: true,
      onRefresh: (self) => {
        window.landoGL!.params.helmetScrollScene.REVEAL_OUT_PROGRESS = self.progress;
      },
      onUpdate: (self) => {
        window.landoGL!.params.helmetScrollScene.REVEAL_OUT_PROGRESS = self.progress;
      },
    });
  }
  build();
  let resizeTimer: ReturnType<typeof setTimeout>;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 200);
  }
  window.addEventListener('resize', onResize);

  function toggleDebug() {
    const shown = svg.style.display !== 'none';
    svg.style.display = shown ? 'none' : 'block';
    return !shown;
  }

  function cleanup() {
    if (heldTween && heldTween.scrollTrigger) heldTween.scrollTrigger.kill();
    window.removeEventListener('resize', onResize);
    if (svg.parentNode) svg.parentNode.removeChild(svg);
    clearDebugPoints();
    (Object.keys(savedStyle) as (keyof typeof savedStyle)[]).forEach((k) => {
      canvas!.style[k as never] = savedStyle[k];
    });
  }
  return { cleanup, toggleDebug };
}

/** _$ 45779 — on-track init */
export function initOnTrackPage(debug = false) {
  initCountdowns();
  initHorizontalSections();
  initPodiumParallax();
  initOtotBottomParallax();
  if (window.innerWidth >= 992) {
    initStatHover();
    initPodiumScrub();
  }
  initHelmetGrid();
  setTimeout(() => {
    initHeroflipGl();
  }, 0);
  initCalendarSync(debug);
  initSocialCallout();
  [200, 200].forEach((delay) => {
    setTimeout(() => {
      setHamburgerTheme('white');
      setLogoColor('white');
    }, delay);
  });
  if (window.innerWidth >= 992) {
    initOvalScroll();
    initAnimHigh();
    initTextHover();
  }
  formatText();
  initImgHighlight();
  initCarCounter();
  initStatListReveal();
}

/** yL 45791 — on-track cleanup (clone-replace strips listeners, source pattern) */
export function cleanupOnTrackPage() {
  clearCountdowns();
  killHorizontalSections();
  resetHelmetGrid();
  TA.getAll().forEach((st) => {
    const t = st.trigger as Element | undefined;
    if (
      t?.matches?.('[data-podium="wrap"]') ||
      t?.matches?.('[data-stat-list]') ||
      t?.matches?.('[data-image-highlight]') ||
      t?.matches?.('[data-list-reveal]')
    )
      st.kill();
  });
  // source re-runs _L() just to obtain a cleanup handle, then cleans up (quirk)
  const inst = initHeroflipGl();
  if (inst && inst.cleanup) inst.cleanup();
  document.querySelectorAll('[data-stat-list]').forEach((el) => {
    el.parentNode!.replaceChild(el.cloneNode(true), el);
  });
  const podium = document.querySelector('[data-podium="wrap"]');
  if (podium) podium.parentNode!.replaceChild(podium.cloneNode(true), podium);
  document.querySelectorAll('[data-cal-item]').forEach((el) => {
    el.parentNode!.replaceChild(el.cloneNode(true), el);
  });
  const next = document.querySelector('[data-cal-control="next-item"]');
  const prev = document.querySelector('[data-cal-control="previous-item"]');
  if (next) next.parentNode!.replaceChild(next.cloneNode(true), next);
  if (prev) prev.parentNode!.replaceChild(prev.cloneNode(true), prev);
  m.killTweensOf('[data-stat-list] [data-mouse-track]');
  m.killTweensOf('[data-podium="wrap"] [data-mouse-track]');
  m.killTweensOf('[data-podium="text"]');
  m.killTweensOf('.text-on-t-stat-label-gigantic .char');
}
