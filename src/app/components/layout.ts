/**
 * Layout components — source: qK module 43158-43754.
 * I_ -> initHorizontalScroll; C_ -> initHorizontalTextReveal; Z8/H8 ->
 * initHorizontalSections/killHorizontalSections; O$/LL -> initMarquees/
 * destroyMarquees; ZZ/HZ -> initHelmetGrid/resetHelmetGrid; q8 ->
 * initSocialCallout; bJ/K_ -> initCampCollection/killCampTriggers.
 */
import { gsap as m, ScrollTrigger as TA } from '../gsap';

/** ML 43750 — horizontal container tweens, looked up by C_ */
export const horizontalTweens = new Map<Element, gsap.core.Tween>();

declare global {
  interface Window {
    _marqueeObservers?: IntersectionObserver[];
  }
}

/** I_ 43158 */
export function initHorizontalScroll() {
  document.querySelectorAll<HTMLElement>('[data-horizontal-section]').forEach((section) => {
    const sticky = section.querySelector<HTMLElement>('.horizontal-pin-sticky');
    const track = section.querySelector<HTMLElement>('.horizontal-track');
    const images = section.querySelectorAll<HTMLElement>('.image.is-horizontal-scroll');
    if (!track || !sticky) return;
    let trackWidth = track.offsetWidth;

    function measure() {
      void track!.offsetHeight;
      trackWidth = track!.offsetWidth;
      const overflow = trackWidth - window.innerWidth;
      if (overflow <= 0) {
        let sum = 0;
        Array.from(track!.children).forEach((c) => {
          sum += (c as HTMLElement).offsetWidth;
        });
        if (sum > trackWidth) trackWidth = sum;
      } else section.style.height = `${overflow}px`;
      TA.refresh();
    }
    measure();
    window.addEventListener('resize', () => {
      setTimeout(measure, 200);
    });

    function isVisible(el: Element) {
      const r = el.getBoundingClientRect();
      return r.left < window.innerWidth && r.right > 0;
    }

    function presetParallax() {
      images.forEach((img) => {
        const item = img.closest('.horizontal-item-w');
        if (!item) return;
        if (isVisible(item)) {
          const x = -4 * (1 - item.getBoundingClientRect().left / window.innerWidth);
          m.set(img, { x: `${x}rem` });
        }
      });
    }

    const tween = m.to(track, {
      x: () => -(trackWidth - window.innerWidth),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom bottom',
        scrub: 1,
        invalidateOnRefresh: true,
        onEnter: presetParallax,
      },
    });
    horizontalTweens.set(section, tween);
    images.forEach((img) => {
      const item = img.closest('.horizontal-item-w');
      if (!item) return;
      m.timeline({
        scrollTrigger: {
          trigger: item,
          containerAnimation: tween,
          start: 'left right',
          end: 'right left',
          scrub: true,
          onUpdate: (self) => {
            m.set(img, { x: `${4 * self.progress}rem` });
          },
        },
      });
    });
  });
}

/** C_ 43232 */
export function initHorizontalTextReveal() {
  const section = document.querySelector('.s.is-horizontal-track');
  if (!section) return;
  const texts = section.querySelectorAll<HTMLElement>('.text-eyebrow, .horizontal-item-text');
  const container = document.querySelector('[data-horizontal-section]');
  if (!container) return;
  const containerTween = horizontalTweens.get(container);
  if (!containerTween) {
    console.warn('Could not find the main horizontal scroll animation');
    return;
  }
  const REVEAL = 0.6;
  const BAR = 0.6;
  const GAP = 0.15;
  const color = 'var(--color--lime, #d2ff00)';
  texts.forEach((text, idx) => {
    const lines = text.querySelectorAll<HTMLElement>('.line');
    if (!lines.length) return;
    const isEarly = idx < 2;
    const tl = m.timeline({ paused: true, onComplete: () => {} });
    lines.forEach((line, i) => {
      if (getComputedStyle(line).position === 'static') line.style.position = 'relative';
      m.set(line, { clipPath: 'inset(0 100% 0 0)', autoAlpha: 1 });
      const bar = document.createElement('div');
      bar.className = 'high-line-reveal';
      bar.style.position = 'absolute';
      bar.style.top = '0';
      bar.style.left = '0';
      bar.style.width = '100%';
      bar.style.height = '100%';
      bar.style.backgroundColor = color;
      bar.style.transformOrigin = 'right center';
      bar.style.zIndex = '5';
      line.appendChild(bar);
      m.set(bar, { scaleX: 1 });
      const at = i * GAP;
      tl.to(line, { clipPath: 'inset(0 0% 0 0)', duration: REVEAL, ease: 'power2.out' }, at);
      tl.to(bar, { scaleX: 0, duration: BAR, ease: 'power2.inOut' }, at + REVEAL / 2);
    });
    const trigger = text.closest('.horizontal-item-w') || text;
    if (isEarly) TA.create({ trigger, start: 'top 90%', once: true, onEnter: () => tl.play() });
    else
      TA.create({
        trigger,
        containerAnimation: containerTween,
        start: 'left 95%',
        once: true,
        onEnter: () => tl.play(),
      });
  });
}

/** Z8 43293 — desktop only */
export function initHorizontalSections() {
  if (window.innerWidth >= 992) {
    initHorizontalScroll();
    initHorizontalTextReveal();
  }
}

/** H8 43297 */
export function killHorizontalSections() {
  if (window.innerWidth >= 992)
    TA.getAll().forEach((st) => {
      if ((st.trigger as Element | undefined)?.matches?.('[data-horizontal-section]')) st.kill();
    });
}

/** O$ 43303 — marquees (lazy via IntersectionObserver) */
export function initMarquees() {
  const started = new Map<Element, gsap.core.Tween>();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          if (!started.has(el)) start(el);
        }
      });
    },
    { rootMargin: '200px 0px', threshold: 0 }
  );
  document
    .querySelectorAll<HTMLElement>('[data-marquee-scroll-direction-target]')
    .forEach((el) => observer.observe(el));

  function start(el: HTMLElement) {
    const collection = el.querySelector<HTMLElement>('[data-marquee-collection-target]');
    const scrollTarget = el.querySelector<HTMLElement>('[data-marquee-scroll-target]');
    if (!collection || !scrollTarget) return;
    const { marqueeSpeed, marqueeDirection, marqueeDuplicate, marqueeScrollSpeed } = el.dataset;
    const speed = parseFloat(marqueeSpeed!);
    const dir = marqueeDirection === 'right' ? 1 : -1;
    const dupes = parseInt(marqueeDuplicate || '0');
    const scrollSpeed = parseFloat(marqueeScrollSpeed!);
    const factor = window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1;
    const duration = speed * (collection.offsetWidth / window.innerWidth) * factor;
    scrollTarget.style.marginLeft = `${scrollSpeed * -1}%`;
    scrollTarget.style.width = `${scrollSpeed * 2 + 100}%`;
    if (dupes > 0) {
      const frag = document.createDocumentFragment();
      for (let i = 0; i < dupes; i++) frag.appendChild(collection.cloneNode(true));
      scrollTarget.appendChild(frag);
    }
    const collections = el.querySelectorAll<HTMLElement>('[data-marquee-collection-target]');
    const tween = m
      .to(collections, { xPercent: -100, repeat: -1, duration, ease: 'linear' })
      .totalProgress(0.5);
    m.set(collections, { xPercent: dir === 1 ? 100 : -100 });
    tween.timeScale(dir);
    tween.play();
    started.set(el, tween);
    el.setAttribute('data-marquee-status', 'normal');
    TA.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const down = self.direction === 1;
        tween.timeScale(down ? -dir : dir);
        el.setAttribute('data-marquee-status', down ? 'normal' : 'inverted');
      },
    });
    const shift = m.timeline({
      scrollTrigger: { trigger: el, start: '0% 100%', end: '100% 0%', scrub: 0 },
    });
    const from = dir === -1 ? scrollSpeed : -scrollSpeed;
    const to = -from;
    shift.fromTo(scrollTarget, { x: `${from}vw` }, { x: `${to}vw`, ease: 'none' });
  }

  window._marqueeObservers = window._marqueeObservers || [];
  window._marqueeObservers.push(observer);
}

/** LL 43374 */
export function destroyMarquees() {
  if (window._marqueeObservers && window._marqueeObservers.length) {
    window._marqueeObservers.forEach((o) => o.disconnect());
    window._marqueeObservers = [];
  }
  document.querySelectorAll<HTMLElement>('[data-marquee-scroll-direction-target]').forEach((el) => {
    const collections = el.querySelectorAll('[data-marquee-collection-target]');
    const scrollTarget = el.querySelector('[data-marquee-scroll-target]');
    m.getTweensOf(collections).forEach((t) => t.kill());
    if (scrollTarget) m.getTweensOf(scrollTarget).forEach((t) => t.kill());
    TA.getAll().forEach((st) => {
      if (st.vars && st.vars.trigger === el) st.kill();
    });
  });
}

/** ZZ 43392 — helmet grid column offset parallax */
export function initHelmetGrid() {
  const grid = document.querySelector('[data-helmet-grid]');
  if (!grid) return;
  const items = grid.querySelectorAll<HTMLElement>('.helmet-grid-item-w');
  if (!items.length) return;
  const STEP = 5;
  const cols: HTMLElement[][] = [[], [], [], []];
  items.forEach((item, i) => {
    cols[i % 4].push(item);
  });
  cols.forEach((col, i) => {
    if (i > 0) m.set(col, { y: `${i * STEP}rem` });
  });
  cols.forEach((col, i) => {
    if (i > 0)
      m.to(col, {
        y: 0,
        ease: 'none',
        scrollTrigger: { trigger: grid, start: 'top bottom', end: 'bottom top', scrub: true },
      });
  });
}

/** HZ 43425 */
export function resetHelmetGrid() {
  const grid = document.querySelector('[data-helmet-grid]');
  if (!grid) return;
  TA.getAll().forEach((st) => {
    if (st.trigger === grid) st.kill();
  });
  const items = grid.querySelectorAll('.helmet-grid-item-w');
  if (items.length) m.set(items, { clearProps: 'y' });
}

/** q8 43437 — social callout card fan (clone-replace for idempotent rebuild) */
export function initSocialCallout() {
  const existing = document.querySelector<HTMLElement & { cleanup?: () => void }>(
    '[data-social-callout="wrap"]'
  );
  if (existing) {
    TA.getAll().forEach((st) => {
      if (st.trigger === existing) st.kill();
    });
    m.killTweensOf(existing.querySelectorAll('.callout-socials-card-w'));
    const clone = existing.cloneNode(true);
    existing.parentNode!.replaceChild(clone, existing);
  }
  const wrap = document.querySelector<HTMLElement & { cleanup?: () => void }>(
    '[data-social-callout="wrap"]'
  );
  if (!wrap) return;
  const cards = Array.from(wrap.querySelectorAll<HTMLElement>('.callout-socials-card-w'));
  if (!cards.length) return;
  const center = Math.floor(cards.length / 2);
  const DESKTOP = [
    { scale: 0.7756, rotation: -21, x: -30, y: 7.3, zIndex: 1 },
    { scale: 0.8498, rotation: -14, x: -22, y: 4, zIndex: 2 },
    { scale: 0.9346, rotation: -7, x: -11, y: 1.3, zIndex: 3 },
    { scale: 1, rotation: 0, x: 0, y: 0, zIndex: 10 },
    { scale: 0.9346, rotation: 7, x: 11, y: 1.3, zIndex: 3 },
    { scale: 0.8498, rotation: 14, x: 22, y: 4, zIndex: 2 },
    { scale: 0.7756, rotation: 21, x: 30, y: 7.3, zIndex: 1 },
  ];
  const MOBILE = [
    { scale: 0.7756, rotation: -21, x: -15, y: 7.3, zIndex: 1 },
    { scale: 0.8498, rotation: -14, x: -11, y: 4, zIndex: 2 },
    { scale: 0.9346, rotation: -7, x: -6, y: 1.3, zIndex: 3 },
    { scale: 1, rotation: 0, x: 0, y: 0, zIndex: 10 },
    { scale: 0.9346, rotation: 7, x: 6, y: 1.3, zIndex: 3 },
    { scale: 0.8498, rotation: 14, x: 11, y: 4, zIndex: 2 },
    { scale: 0.7756, rotation: 21, x: 15, y: 7.3, zIndex: 1 },
  ];
  const poses = () => (window.innerWidth <= 991 ? MOBILE : DESKTOP);
  let pose = poses();
  const base = [...pose];
  m.set(cards, { x: 0, y: '10rem', scale: 1, rotation: 0, transformOrigin: 'center center', opacity: 1 });
  cards.forEach((card, i) => {
    card.style.zIndex = String(pose[i].zIndex);
  });

  function enableHover() {
    let hovered: number | null = null;
    let leaveTimer: ReturnType<typeof setTimeout> | null = null;
    const handlers = new Map<HTMLElement, { enter: () => void; leave: () => void }>();
    const onResize = () => {
      pose = poses();
      if (hovered === null) settle();
    };
    window.addEventListener('resize', onResize);

    function spread(idx: number) {
      pose = poses();
      const tl = m.timeline();
      const order = cards.map((card, i) => ({ card, index: i, distance: Math.abs(i - idx) }));
      order.sort((a, b) => {
        if (a.index === idx) return -1;
        if (b.index === idx) return 1;
        return a.distance - b.distance;
      });
      const last = cards.length - 1;
      order.forEach(({ card, index, distance }) => {
        const before = index < idx;
        const after = index > idx;
        const isHovered = index === idx;
        const isLast = index === last;
        const rel = (index - center) / center;
        const proximity = 1 - Math.abs(rel);
        const boost = 1 + 0.2 * Math.max(0, 3 - distance);
        let vars: gsap.TweenVars = {};
        if (isHovered)
          vars = {
            y: base[index].y - 2.5 + 'rem',
            x: base[index].x + 'rem',
            scale: base[index].scale * 1.08,
            rotation: base[index].rotation,
            duration: 0.5,
            ease: 'elastic.out(1, 0.75)',
            overwrite: 'auto',
          };
        else if (before) {
          const push = 8 * proximity * boost;
          const rot = -3 * (1 / (distance + 1));
          vars = {
            x: base[index].x - push + 'rem',
            y: base[index].y + 'rem',
            scale: base[index].scale,
            rotation: base[index].rotation + rot,
            duration: 0.5,
            ease: 'elastic.out(1, 0.75)',
            overwrite: 'auto',
          };
        } else if (after) {
          const push = isLast ? 0 : 8 * proximity * boost;
          const rot = 3 * (1 / (distance + 1));
          vars = {
            x: base[index].x + push + 'rem',
            y: base[index].y + (isLast ? -1 : 0) + 'rem',
            scale: base[index].scale,
            rotation: base[index].rotation + rot,
            duration: 0.5,
            ease: 'elastic.out(1, 0.75)',
            overwrite: 'auto',
          };
        }
        tl.to(card, vars, distance * 0.02);
      });
      return tl;
    }

    function settle() {
      pose = poses();
      const tl = m.timeline();
      const order = cards.map((card, i) => ({ card, index: i, distance: Math.abs(i - center) }));
      order.sort((a, b) => a.distance - b.distance);
      order.forEach(({ card, index, distance }) => {
        tl.to(
          card,
          {
            x: base[index].x + 'rem',
            y: base[index].y + 'rem',
            scale: base[index].scale,
            rotation: base[index].rotation,
            duration: 0.5,
            ease: 'elastic.out(1, 0.75)',
            overwrite: 'auto',
          },
          distance * 0.02
        );
      });
      return tl;
    }

    cards.forEach((card, i) => {
      const enter = () => {
        if (leaveTimer) {
          clearTimeout(leaveTimer);
          leaveTimer = null;
        }
        hovered = i;
        spread(i);
      };
      const leave = () => {
        if (hovered === i)
          leaveTimer = setTimeout(() => {
            if (hovered === i) {
              hovered = null;
              settle();
            }
            leaveTimer = null;
          }, 50);
      };
      handlers.set(card, { enter, leave });
      card.addEventListener('mouseenter', enter);
      card.addEventListener('mouseleave', leave);
    });
    const wrapLeave = () => {
      if (leaveTimer) {
        clearTimeout(leaveTimer);
        leaveTimer = null;
      }
      hovered = null;
      settle();
    };
    wrap!.addEventListener('mouseleave', wrapLeave);
    wrap!.cleanup = () => {
      handlers.forEach((h, card) => {
        card.removeEventListener('mouseenter', h.enter);
        card.removeEventListener('mouseleave', h.leave);
      });
      wrap!.removeEventListener('mouseleave', wrapLeave);
      window.removeEventListener('resize', onResize);
      if (leaveTimer) clearTimeout(leaveTimer);
      m.killTweensOf(cards);
      TA.getAll().forEach((st) => {
        if (st.trigger === wrap) st.kill();
      });
    };
  }

  m.timeline({
    scrollTrigger: { trigger: wrap, start: 'top 90%', once: true },
    onComplete: enableHover,
  })
    .to(cards, { y: 0, duration: 0.8, ease: 'power2.out', stagger: { amount: 0.5, from: 'end' } })
    .to(
      cards,
      {
        x: (i: number) => pose[i].x + 'rem',
        y: (i: number) => pose[i].y + 'rem',
        scale: (i: number) => pose[i].scale,
        rotation: (i: number) => pose[i].rotation,
        duration: 1.2,
        ease: 'elastic.out(1, 0.75)',
        stagger: { amount: 0.2, from: 'center' },
      },
      '-=0.4'
    );
}

/** bJ 43715 — camp collection paired-image parallax */
export function initCampCollection() {
  killCampTriggers();
  const wrap = document.querySelector('.camp-collection-w');
  if (!wrap) return;
  const items = wrap.querySelectorAll<HTMLElement>('.camp-item');
  if (!items.length) return;
  items.forEach((item) => {
    const imgs = item.querySelectorAll<HTMLElement>('.camp-item-img-w');
    if (imgs.length !== 2) return;
    m.set(imgs[0], { x: '-4rem' });
    m.set(imgs[1], { x: '4rem' });
    m.to(imgs, {
      x: 0,
      ease: 'power2.out',
      scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom center', scrub: true },
    });
  });
}

/** K_ 43741 */
export function killCampTriggers() {
  TA.getAll()
    .filter((st) => {
      if (st.vars && st.vars.trigger) {
        const t = st.vars.trigger as Element;
        return !!(t.closest && t.closest('.camp-collection-w'));
      }
      return false;
    })
    .forEach((st) => st.kill());
}
