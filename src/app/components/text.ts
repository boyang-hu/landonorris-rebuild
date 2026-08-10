/**
 * Text components — source: VC module 42438-43156.
 * JZ/N$ -> SplitTextManager; e0 -> initOvalScroll; AE -> initAnimHigh;
 * UZ -> initStatListReveal; QE -> initTextHover; fJ -> initImgHighlight;
 * NL -> initCarCounter; k0 -> playHeroTextTimelines; GZ (Q_/A_/B_/E_) ->
 * formatText; OL/F$ -> initRichTextReveal/cleanupRichTextReveal.
 */
import { gsap as m, ScrollTrigger as TA, SplitText as CI } from '../gsap';

type El = HTMLElement & {
  splitTextInstance?: SplitText;
  _srClone?: HTMLElement | null;
  _srPrevAriaHidden?: string | null;
  _ovalScrollInstance?: { timeline: gsap.core.Timeline; cleanup: () => void; scrollTrigger?: ScrollTrigger };
  _highLinesInstance?: { timeline: gsap.core.Timeline; cleanup: () => void; scrollTrigger?: ScrollTrigger };
  _richTextInstance?: {
    timeline: gsap.core.Timeline;
    cleanup: () => void;
    scrollTrigger?: ScrollTrigger;
  } & Record<string, unknown>;
  _formattingCleanup?: () => void;
};
type SplitText = ReturnType<typeof CI.create> & { elements?: Element[] };

const COLOR_MAP: Record<string, string> = {
  lime: 'var(--color--lime, #d2ff00)',
  'lime-off': 'var(--color--lime-off, #b2c73a)',
  'dark-green': 'var(--color--dark-green, #282c20)',
  'dark-green-tint-1': 'var(--color--dark-green-tint-1, #3b3c38)',
  black: 'var(--color--black, #111112)',
  white: 'var(--color--white, #f4f4ed)',
};

/** JZ 42438 — [split-text] manager with screen-reader clones */
export class SplitTextManager {
  instances: SplitText[] = [];
  elements!: NodeListOf<El>;
  defaultOptions: Record<string, unknown>;

  constructor(options: Record<string, unknown> = {}) {
    this.defaultOptions = {
      tag: (options.tagName as string) || 'span',
      linesClass: (options.lineClass as string) || 'line',
      wordsClass: (options.wordClass as string) || 'word',
      charsClass: (options.charClass as string) || 'char',
      aria: 'auto',
      ...options,
    };
    this.init();
  }

  init() {
    this.elements = document.querySelectorAll<El>('[split-text]');
    if (this.elements.length) this.splitAll();
  }

  private _ensureScreenReaderClone(el: El) {
    if (!el || el._srClone) return;
    try {
      const clone = el.cloneNode(true) as HTMLElement;
      while (clone.attributes && clone.attributes.length > 0)
        clone.removeAttribute(clone.attributes[0].name);
      clone.setAttribute('screen-reader', '');
      clone.removeAttribute('split-text');
      if (el.parentNode) el.parentNode.insertBefore(clone, el);
      el._srPrevAriaHidden = el.getAttribute('aria-hidden');
      el.setAttribute('aria-hidden', 'true');
      el._srClone = clone;
    } catch (e) {
      console.error('Failed to create screen-reader clone:', e);
    }
  }

  private _removeScreenReaderClone(el: El) {
    if (!el) return;
    try {
      if (el._srClone && el._srClone.parentNode) el._srClone.parentNode.removeChild(el._srClone);
      delete el._srClone;
      const prev = el._srPrevAriaHidden;
      if (prev === null || prev === undefined) el.removeAttribute('aria-hidden');
      else el.setAttribute('aria-hidden', prev);
      delete el._srPrevAriaHidden;
    } catch (e) {
      console.error('Failed to remove screen-reader clone:', e);
    }
  }

  private _formatTypes(t: string) {
    return t.replace(/,/g, ', ').trim();
  }

  private _create(el: El): SplitText {
    this._ensureScreenReaderClone(el);
    const attr = el.getAttribute('split-text');
    const type = this._formatTypes(attr || 'lines,words,chars');
    const inst = CI.create(el, { ...this.defaultOptions, type }) as SplitText;
    inst.elements = [el];
    el.splitTextInstance = inst;
    return inst;
  }

  splitAll() {
    this.elements.forEach((el) => {
      if (el.splitTextInstance) {
        if (!this.instances.includes(el.splitTextInstance)) this.instances.push(el.splitTextInstance);
        return;
      }
      this.instances.push(this._create(el));
    });
  }

  split(target: El | null = null) {
    if (target) {
      const existing = this.instances.find((i) => i.elements && i.elements.includes(target));
      if (existing) {
        existing.revert();
        const fresh = this._create(target);
        this.instances = this.instances.map((i) => (i === existing ? fresh : i));
      } else {
        this.instances.push(this._create(target));
      }
    } else {
      this.instances.forEach((inst, idx) => {
        const el = inst.elements?.[0] as El | undefined;
        if (el) {
          inst.revert();
          this.instances[idx] = this._create(el);
        }
      });
    }
  }

  revert(target: El | null = null) {
    if (target) {
      const existing = this.instances.find((i) => i.elements && i.elements.includes(target));
      if (existing) {
        existing.revert();
        this.instances = this.instances.filter((i) => i !== existing);
        delete target.splitTextInstance;
        this._removeScreenReaderClone(target);
      }
    } else {
      this.instances.forEach((i) => {
        if (i && typeof i.revert === 'function') i.revert();
      });
      this.instances = [];
      if (this.elements)
        this.elements.forEach((el) => {
          delete el.splitTextInstance;
          this._removeScreenReaderClone(el);
        });
    }
  }
}

/** e0 42555 — [data-oval-scroll] elliptical line reveal (desktop pages call it) */
export function initOvalScroll() {
  document.querySelectorAll<El>('[data-oval-scroll]').forEach((el) => {
    if (el._ovalScrollInstance) el._ovalScrollInstance.cleanup();
  });
  const els = document.querySelectorAll<El>('[data-oval-scroll]');
  if (!els.length) return;
  els.forEach((el) => {
    const mode = el.getAttribute('data-oval-scroll') || 'top';
    const lines = el.querySelectorAll<HTMLElement>('.line');
    if (!lines.length) return;
    lines.forEach((line) => {
      if (line.parentElement!.classList.contains('oval-line-clip-wrap')) return;
      const wrap = document.createElement('div');
      wrap.classList.add('oval-line-clip-wrap');
      line.parentNode!.insertBefore(wrap, line);
      wrap.appendChild(line);
    });
    const wraps = el.querySelectorAll<HTMLElement>('.oval-line-clip-wrap');
    if (!wraps.length) return;
    const outer = document.createElement('div');
    outer.classList.add('oval-outer-wrapper');
    outer.style.overflow = 'clip';
    const first = wraps[0];
    first.parentNode!.insertBefore(outer, first);
    wraps.forEach((w) => outer.appendChild(w));
    wraps.forEach((w) => {
      const line = w.querySelector<HTMLElement>('.line')!;
      const chars = line.querySelectorAll<HTMLElement>('.char');
      if (mode === 'top') {
        m.set(w, { clipPath: 'ellipse(20% 0% at 50% 0%)' });
        m.set(line, { y: '-40%' });
        if (chars.length) m.set(chars, { y: '-40%' });
      } else {
        m.set(w, { clipPath: 'ellipse(20% 0% at 50% 100%)' });
        m.set(line, { y: '40%' });
        if (chars.length) m.set(chars, { y: '40%' });
      }
    });
    const stagger = 0.15;
    const tl = m.timeline({ paused: true });
    tl.to(wraps, {
      clipPath: mode === 'top' ? 'ellipse(100% 120% at 50% 0%)' : 'ellipse(100% 120% at 50% 100%)',
      delay: 0,
      duration: 1.5,
      ease: 'power2.inOut',
      stagger,
    });
    wraps.forEach((w, i) => {
      const line = w.querySelector<HTMLElement>('.line')!;
      const chars = line.querySelectorAll<HTMLElement>('.char');
      m.to(line, { y: '0%', duration: 1.5, ease: 'power2.inOut', delay: stagger + 0.1 * i });
      if (chars.length)
        m.to(chars, {
          y: '0%',
          ease: 'power2.inOut',
          duration: 1.5,
          delay: stagger * i,
          stagger: { amount: 0.015 * chars.length, from: 'center' },
        });
    });
    el._ovalScrollInstance = { timeline: tl, cleanup: () => tl.kill() };
    if (!el.closest('[data-hero-animation-container]')) {
      const st = TA.create({ trigger: el, start: 'top 95%', once: true, onEnter: () => tl.play() });
      el._ovalScrollInstance.scrollTrigger = st;
    }
  });
}

/** AE 42642 — [data-anim-high] highlight-bar line reveal */
export function initAnimHigh() {
  document.querySelectorAll<El>('[data-anim-high]').forEach((el) => {
    if (el._highLinesInstance) el._highLinesInstance.cleanup();
  });
  const REVEAL = 0.6;
  const BAR = 0.6;
  const GAP = 0.15;
  const els = document.querySelectorAll<El>('[data-anim-high]');
  if (!els.length) return;
  els.forEach((el) => {
    const attr = el.getAttribute('data-anim-high') || 'right, lime, 0';
    const [dirRaw, colorRaw, delayRaw] = attr.split(',').map((s) => s.trim());
    const dir = dirRaw === 'left' ? 'left' : 'right';
    const color = COLOR_MAP[colorRaw || 'lime'] || COLOR_MAP.lime;
    const delay = parseFloat(delayRaw || '0') / 1000;
    void delay; // parsed in source but unused for AE's paused timeline
    const lines = el.querySelectorAll<HTMLElement>('.line');
    const tl = m.timeline({ paused: true });
    lines.forEach((line, i) => {
      line.style.position = 'relative';
      if (dir === 'right') m.set(line, { clipPath: 'inset(0 100% 0 0)', autoAlpha: 1 });
      else m.set(line, { clipPath: 'inset(0 0 0 100%)', autoAlpha: 1 });
      const bar = document.createElement('div');
      bar.className = 'high-line-reveal';
      bar.style.position = 'absolute';
      bar.style.top = '0';
      bar.style.left = '0';
      bar.style.width = '100%';
      bar.style.height = '100%';
      bar.style.backgroundColor = color;
      bar.style.transformOrigin = dir === 'right' ? 'right center' : 'left center';
      bar.style.zIndex = '5';
      line.appendChild(bar);
      m.set(bar, { scaleX: 1 });
      const at = i * GAP;
      if (dir === 'right') tl.to(line, { clipPath: 'inset(0 0% 0 0)', duration: REVEAL, ease: 'power2.out' }, at);
      else tl.to(line, { clipPath: 'inset(0 0 0 0%)', duration: REVEAL, ease: 'power2.out' }, at);
      tl.to(bar, { scaleX: 0, duration: BAR, ease: 'power2.inOut' }, at + REVEAL / 2);
    });
    el._highLinesInstance = { timeline: tl, cleanup: () => tl.kill() };
    if (!el.closest('[data-hero-animation-container]')) {
      const st = TA.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => tl.play() });
      el._highLinesInstance.scrollTrigger = st;
    }
  });
}

/** UZ 42717 — [data-stat-list] item reveal */
export function initStatListReveal() {
  const lists = document.querySelectorAll<HTMLElement>('[data-stat-list]');
  lists.forEach((list) => {
    const items = list.querySelectorAll<HTMLElement>('[data-stat-item]');
    const dir = list.getAttribute('data-reveal-direction') || 'right';
    const colorName = list.getAttribute('data-reveal-color') || 'lime';
    const delay = parseFloat(list.getAttribute('data-reveal-delay') || '0') / 1000;
    const color = COLOR_MAP[colorName] || COLOR_MAP.lime;
    const tl = m.timeline({
      scrollTrigger: { trigger: list, start: 'top 90%', once: true },
      delay,
    });
    items.forEach((item, i) => {
      item.style.position = 'relative';
      item.style.overflow = 'hidden';
      if (dir === 'right') m.set(item, { clipPath: 'inset(0 100% 0 0)', autoAlpha: 1 });
      else m.set(item, { clipPath: 'inset(0 0 0 100%)', autoAlpha: 1 });
      const bar = document.createElement('div');
      bar.className = 'item-reveal';
      bar.style.position = 'absolute';
      bar.style.top = '0';
      bar.style.left = '0';
      bar.style.width = '100%';
      bar.style.height = '100%';
      bar.style.backgroundColor = color;
      bar.style.transformOrigin = dir === 'right' ? 'right center' : 'left center';
      bar.style.zIndex = '5';
      item.appendChild(bar);
      m.set(bar, { scaleX: 1 });
      const at = i * 0.05;
      if (dir === 'right') tl.to(item, { clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'power2.out' }, at);
      else tl.to(item, { clipPath: 'inset(0 0 0 0%)', duration: 0.6, ease: 'power2.out' }, at);
      tl.to(bar, { scaleX: 0, duration: 0.6, ease: 'power2.inOut' }, at + 0.3);
    });
  });
}

/** QE 42775 — [data-anim="text-hover"] char roll */
export function initTextHover() {
  const els = document.querySelectorAll<HTMLElement>("[data-anim='text-hover']");
  els.forEach((el) => {
    const lines = el.querySelectorAll<HTMLElement>('.line');
    const isNavLink = el.classList.contains('nav-menu-link-w');
    const offset = () => {
      if (isNavLink) return window.innerWidth < 480 ? '-4.3rem' : '-5.25rem';
      return '-100%';
    };
    const bind = (chars: NodeListOf<HTMLElement>) => {
      el.addEventListener('mouseenter', () => {
        m.to(chars, { y: offset(), duration: 0.6, stagger: 0.02, ease: 'power3.out', overwrite: true });
      });
      el.addEventListener('mouseleave', () => {
        m.to(chars, { y: 0, duration: 0.6, stagger: 0.02, ease: 'power3.out', overwrite: true });
      });
    };
    if (lines.length > 0) lines.forEach((line) => bind(line.querySelectorAll<HTMLElement>('.char')));
    else {
      const chars = el.querySelectorAll<HTMLElement>('.char');
      if (chars.length > 0) bind(chars);
    }
  });
}

/** fJ 42828 — [data-img-highlight] elliptical image reveal */
export function initImgHighlight() {
  const els = document.querySelectorAll<HTMLElement>('[data-img-highlight]');
  els.forEach((el) => {
    const attr = el.getAttribute('data-img-highlight') || 'top, lime, 0';
    const [posRaw, colorRaw, delayRaw] = attr.split(',').map((s) => s.trim());
    const pos = posRaw === 'bottom' ? 'bottom' : 'top';
    const color = COLOR_MAP[colorRaw || 'lime'] || COLOR_MAP.lime;
    const delay = parseFloat(delayRaw || '0') / 1000;
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.overflow = 'hidden';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    el.parentNode!.insertBefore(wrapper, el);
    wrapper.appendChild(el);
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.display = 'block';
    const reveal = document.createElement('div');
    reveal.className = 'img-highlight-reveal';
    reveal.style.position = 'absolute';
    reveal.style.top = '0';
    reveal.style.left = '0';
    reveal.style.width = '100%';
    reveal.style.height = '100%';
    reveal.style.backgroundColor = color;
    reveal.style.zIndex = '5';
    wrapper.appendChild(reveal);
    if (pos === 'top') {
      m.set(wrapper, { clipPath: 'ellipse(120% 0% at 50% 0%)' });
      m.set(el, { autoAlpha: 1 });
      m.set(reveal, { clipPath: 'ellipse(120% 120% at 50% 100%)' });
    } else {
      m.set(wrapper, { clipPath: 'ellipse(120% 0% at 50% 100%)' });
      m.set(el, { autoAlpha: 1 });
      m.set(reveal, { clipPath: 'ellipse(120% 120% at 50% 0%)' });
    }
    const tl = m.timeline({
      scrollTrigger: { trigger: wrapper, start: 'top 80%', once: true },
      delay,
    });
    if (pos === 'top') {
      tl.to(wrapper, { clipPath: 'ellipse(120% 120% at 50% 0%)', duration: 0.8, ease: 'power2.out' });
      tl.to(reveal, { clipPath: 'ellipse(120% 0% at 50% 100%)', duration: 0.6, ease: 'power2.out' }, '-=0.4');
    } else {
      tl.to(wrapper, { clipPath: 'ellipse(120% 120% at 50% 0%)', duration: 0.8, ease: 'power2.out' });
      tl.to(reveal, { clipPath: 'ellipse(120% 0% at 50% 0%)', duration: 0.6, ease: 'power2.out' }, '-=0.4');
    }
  });
}

/** NL 42892 — [data-car-counter] number roll-up */
export function initCarCounter() {
  const els = document.querySelectorAll<HTMLElement>('[data-car-counter]');
  els.forEach((el) => {
    const original = el.textContent!.trim();
    const target = parseInt(original.replace(/,/g, ''), 10);
    const digits = original.replace(/[^0-9]/g, '').length;
    let placeholder = '0';
    if (digits > 1) placeholder = '0'.repeat(digits);
    const hasComma = original.includes(',');
    el.textContent = placeholder;
    TA.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        m.to({ val: 0 }, {
          val: target,
          duration: 1,
          ease: 'power1.out',
          onUpdate: function (this: gsap.core.Tween) {
            const v = Math.round((this.targets()[0] as { val: number }).val);
            let text: string;
            if (hasComma) text = v.toLocaleString();
            else {
              text = v.toString();
              while (text.length < digits) text = '0' + text;
            }
            el.textContent = text;
          },
        });
      },
    });
  });
}

/** k0 42929 — play hero-container text timelines (called 750ms/50ms after page init) */
export function playHeroTextTimelines() {
  const containers = document.querySelectorAll('[data-hero-animation-container]');
  if (!containers.length) return;
  containers.forEach((c) => {
    c.querySelectorAll<El>('[data-oval-scroll]').forEach((el) => {
      el._ovalScrollInstance?.timeline?.play();
    });
    c.querySelectorAll<El>('[data-anim-high]').forEach((el) => {
      el._highLinesInstance?.timeline?.play();
    });
  });
}

/** GZ 42943 = Q_ + A_ + B_ + E_ — [data-text-format] */
export function formatText() {
  cleanupFormatting();
  applyFlexDisplay();
  formatPositions();
  formatRounds();
}

function applyFlexDisplay() {
  document.querySelectorAll<El>('[data-text-format]').forEach((el) => {
    const prev = el.style.display;
    el.style.display = 'flex';
    const prevCleanup = el._formattingCleanup;
    el._formattingCleanup = () => {
      el.style.display = prev;
      if (prevCleanup) prevCleanup();
    };
  });
}

function cleanupFormatting() {
  document.querySelectorAll<El>('[data-text-format="position"]').forEach((el) => {
    if (el._formattingCleanup) {
      el._formattingCleanup();
      delete el._formattingCleanup;
    }
  });
  document.querySelectorAll<El>('[data-text-format="round"]').forEach((el) => {
    if (el._formattingCleanup) {
      el._formattingCleanup();
      delete el._formattingCleanup;
    }
  });
}

function formatPositions() {
  document.querySelectorAll<El>('[data-text-format="position"]').forEach((el) => {
    const original = el.textContent!.trim();
    const match = original.match(/^(\d+)([a-zA-Z]+)$/);
    if (match) {
      const [, num, suffix] = match;
      const cls =
        num === '1'
          ? 'text-on-t-stat-label-sm is-super c-lime'
          : 'text-on-t-stat-label-sm is-super c-grey-on-track';
      el.innerHTML = `${num}<span class="${cls}">${suffix}</span>`;
      el._formattingCleanup = () => {
        el.textContent = original;
      };
    }
  });
}

function formatRounds() {
  document.querySelectorAll<El>('[data-text-format="round"]').forEach((el) => {
    const original = el.textContent!.trim();
    const n = parseInt(original, 10);
    if (!isNaN(n)) {
      el.textContent = n < 10 ? `0${n}` : `${n}`;
      el._formattingCleanup = () => {
        el.textContent = original;
      };
    }
  });
}

/** OL 42992 — [split-rich-text] reveal (partnerships-item) */
export function initRichTextReveal() {
  cleanupRichTextReveal();
  const REVEAL = 0.6;
  const BAR = 0.6;
  const GAP = 0.15;
  const els = document.querySelectorAll<El>('[split-rich-text]');
  if (!els.length) return;
  els.forEach((container) => {
    const attr = container.getAttribute('split-rich-text') || 'right, lime, 0';
    const [dirRaw, colorRaw, delayRaw] = attr.split(',').map((s) => s.trim());
    const dir = dirRaw === 'left' ? 'left' : 'right';
    const color = COLOR_MAP[colorRaw || 'lime'] || COLOR_MAP.lime;
    const delay = parseFloat(delayRaw || '0') / 1000;
    void delay;
    const candidates = container.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6, p, span, div');
    const textEls = Array.from(candidates).filter(
      (t) => t.textContent!.trim().length > 0 && !t.querySelector('h1, h2, h3, h4, h5, h6, p')
    );
    if (!textEls.length) return;
    const splits: SplitText[] = [];
    const allLines: HTMLElement[] = [];
    const originalStyles = new Map<HTMLElement, { display: string; flexDirection: string; alignItems: string }>();
    const center = container.hasAttribute('split-center');
    const clones = new Map<HTMLElement, HTMLElement>();
    const prevAria = new Map<HTMLElement, string | null>();
    textEls.forEach((t) => {
      const tt = t as El;
      try {
        if (!tt._srClone) {
          const clone = t.cloneNode(true) as HTMLElement;
          while (clone.attributes && clone.attributes.length > 0)
            clone.removeAttribute(clone.attributes[0].name);
          clone.setAttribute('screen-reader', '');
          clone.removeAttribute('split-text');
          if (t.parentNode) t.parentNode.insertBefore(clone, t);
          clones.set(t, clone);
          prevAria.set(t, t.getAttribute('aria-hidden'));
          t.setAttribute('aria-hidden', 'true');
          tt._srClone = clone;
        }
      } catch (e) {
        console.error('Failed to create screen-reader clone for rich text:', e);
      }
      if (center)
        originalStyles.set(t, {
          display: t.style.display,
          flexDirection: t.style.flexDirection,
          alignItems: t.style.alignItems,
        });
      t.setAttribute('split-text', 'lines, words');
      const split = CI.create(t, {
        type: 'lines, words',
        tag: 'div',
        linesClass: 'line',
        wordsClass: 'word',
      }) as SplitText;
      if (center) {
        t.style.display = 'flex';
        t.style.flexDirection = 'column';
        t.style.alignItems = 'center';
      }
      splits.push(split);
      if (split.lines) allLines.push(...(split.lines as HTMLElement[]));
    });
    const tl = m.timeline({ paused: true });
    allLines.forEach((line, i) => {
      line.style.position = 'relative';
      if (dir === 'right') m.set(line, { clipPath: 'inset(0 100% 0 0)', autoAlpha: 1 });
      else m.set(line, { clipPath: 'inset(0 0 0 100%)', autoAlpha: 1 });
      const bar = document.createElement('div');
      bar.className = 'rich-text-line-reveal';
      bar.style.position = 'absolute';
      bar.style.top = '0';
      bar.style.left = '0';
      bar.style.width = '100%';
      bar.style.height = '100%';
      bar.style.backgroundColor = color;
      bar.style.transformOrigin = dir === 'right' ? 'right center' : 'left center';
      bar.style.zIndex = '5';
      line.appendChild(bar);
      m.set(bar, { scaleX: 1 });
      const at = i * GAP;
      if (dir === 'right') tl.to(line, { clipPath: 'inset(0 0% 0 0)', duration: REVEAL, ease: 'power2.out' }, at);
      else tl.to(line, { clipPath: 'inset(0 0 0 0%)', duration: REVEAL, ease: 'power2.out' }, at);
      tl.to(bar, { scaleX: 0, duration: BAR, ease: 'power2.inOut' }, at + REVEAL / 2);
    });
    container._richTextInstance = {
      timeline: tl,
      splitInstances: splits,
      cleanup: () => {
        tl.kill();
        splits.forEach((s) => {
          if (s && typeof s.revert === 'function') s.revert();
        });
        if (center)
          textEls.forEach((t) => {
            const st = originalStyles.get(t);
            if (st) {
              t.style.display = st.display;
              t.style.flexDirection = st.flexDirection;
              t.style.alignItems = st.alignItems;
            }
          });
        textEls.forEach((t) => {
          const tt = t as El;
          const clone = clones.get(t) || tt._srClone;
          if (clone && clone.parentNode) clone.parentNode.removeChild(clone);
          const prev = prevAria.get(t);
          if (prev === null || prev === undefined) t.removeAttribute('aria-hidden');
          else t.setAttribute('aria-hidden', prev);
          if (tt._srClone) delete tt._srClone;
        });
        container.querySelectorAll('.rich-text-line-reveal').forEach((r) => r.remove());
        textEls.forEach((t) => t.removeAttribute('split-text'));
      },
    };
    if (!container.closest('[data-hero-animation-container]')) {
      const st = TA.create({ trigger: container, start: 'top 90%', once: true, onEnter: () => tl.play() });
      container._richTextInstance.scrollTrigger = st;
    }
  });
}

/** F$ 43120 */
export function cleanupRichTextReveal() {
  document.querySelectorAll<El>('[split-rich-text]').forEach((el) => {
    if (el._richTextInstance) {
      el._richTextInstance.cleanup();
      el._richTextInstance.scrollTrigger?.kill();
      delete el._richTextInstance;
    }
  });
}
