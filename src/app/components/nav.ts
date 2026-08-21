/**
 * Navigation — source: wL module 43847-44404.
 * L$ -> initNavScale; V$ -> initNavTheme; kL -> initNavMenu.
 */
import { gsap as m, ScrollTrigger as TA } from '../gsap';
import { rive as riveNS, navState, setMenuClosedState, setHamburgerTheme } from '../rive/preload';
import { setLogoActive, setLogoColor } from '../rive/components';
import type { RiveCanvas } from '../rive/preload';

let navScaleTween: gsap.core.Tween | null = null; // hJ

declare global {
  interface Window {
    themeScrollTriggers?: ScrollTrigger[];
    rive?: typeof riveNS;
    riveRetryAttempt?: number;
    riveInstances?: unknown[];
    trackingStyles?: unknown;
  }
}

/**
 * L$ 43847 — nav brand/btns scale + .top-marker.
 * ⚠️ Kills ALL ScrollTriggers first (source behavior) — must run before other
 * components build theirs (mL/cL ordering preserves this).
 */
export function initNavScale() {
  if (navScaleTween && navScaleTween.scrollTrigger) {
    navScaleTween.scrollTrigger.kill();
    navScaleTween.kill();
  }
  TA.getAll().forEach((st) => st.kill());
  TA.clearMatchMedia();
  const brand = document.querySelectorAll<HTMLElement>('[data-nav-group="brand"]');
  const btns = document.querySelectorAll<HTMLElement>('[data-nav-group="btns"]');
  const els = [...brand, ...btns];
  m.set(els, { scale: 1 });
  const nextRace = document.querySelector<HTMLElement>('.home-hero-next-race-w');
  const oldMarker = document.querySelector('.top-marker');
  if (oldMarker) oldMarker.remove();
  const marker = document.createElement('div');
  marker.className = 'top-marker';
  marker.style.position = 'absolute';
  marker.style.top = '0';
  marker.style.left = '0';
  marker.style.width = '100%';
  marker.style.height = '10vh';
  marker.style.pointerEvents = 'none';
  marker.style.zIndex = '-1';
  document.body.appendChild(marker);
  if (els.length === 0) {
    console.warn('No elements found with data-nav-group="brand" or data-nav-group="btns"');
    return null;
  }
  if (window.lenis) window.lenis.scrollTo(0, { immediate: true });
  else window.scrollTo(0, 0);
  TA.refresh(true);
  if (window.innerWidth > 991) m.set(els, { scale: 1.2 });
  else m.set(els, { scale: 1 });
  setLogoActive(true);
  setTimeout(() => {
    if (window.innerWidth > 991) {
      navScaleTween = m.to(els, {
        scale: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.top-marker',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          markers: false,
          invalidateOnRefresh: true,
          onEnter: () => setLogoActive(false),
          onLeaveBack: () => setLogoActive(true),
        },
      });
      if (nextRace)
        m.to(nextRace, {
          scrollTrigger: {
            trigger: 'body',
            start: '1px top',
            onEnter: () => nextRace.classList.add('hidden'),
            onLeaveBack: () => nextRace.classList.remove('hidden'),
            markers: false,
          },
        });
      TA.refresh();
    } else {
      const onScroll = () => {
        if (window.scrollY <= 10) setLogoActive(true);
        else setLogoActive(false);
      };
      window.removeEventListener('scroll', onScroll);
      window.addEventListener('scroll', onScroll);
      onScroll();
    }
  }, 50);
  return navScaleTween;
}

/** V$ 43910 — nav theme switching driven by [data-nav-theme-target] sections */
export function initNavTheme() {
  const themeRoot = document.querySelector('[data-nav-theme]');
  const targets = document.querySelectorAll('[data-nav-theme-target]');
  if (!window.themeScrollTriggers) window.themeScrollTriggers = [];
  window.homeLogoColorSet = false;
  let current = themeRoot ? themeRoot.getAttribute('data-nav-theme') : 'light';
  let cooling = false;
  const COOLDOWN = 200;

  function destroy() {
    if (window.themeScrollTriggers && window.themeScrollTriggers.length) {
      window.themeScrollTriggers.forEach((st) => {
        if (st && typeof st.kill === 'function') st.kill();
      });
      window.themeScrollTriggers = [];
    }
    window.removeEventListener('riveAllLoaded', build);
    document.removeEventListener('scroll', throttledFallback);
  }

  function setTheme(theme: string | null) {
    if (!themeRoot) return;
    if (theme === current || cooling) return;
    cooling = true;
    setTimeout(() => {
      cooling = false;
    }, COOLDOWN);
    current = theme;
    themeRoot.setAttribute('data-nav-theme', theme!);
    const isHome =
      document.body.classList.contains('is-home') ||
      window.location.pathname === '/' ||
      window.location.pathname === '/index.html';
    if (theme === 'light') {
      setHamburgerTheme('white');
      if (!isHome || !window.homeLogoColorSet) {
        setLogoColor('white');
        if (isHome) window.homeLogoColorSet = true;
      }
    } else {
      setHamburgerTheme('transparent');
      if (!isHome || !window.homeLogoColorSet) {
        setLogoColor('black');
        if (isHome) window.homeLogoColorSet = true;
      }
    }
  }

  function fallbackCheck() {
    if (!targets.length) {
      setTheme('light');
      return;
    }
    let closest: Element | null = null;
    let minDist = Infinity;
    targets.forEach((t) => {
      const r = t.getBoundingClientRect();
      const d = Math.abs(r.top);
      if (d < minDist) {
        minDist = d;
        closest = t;
      }
    });
    if (closest) setTheme((closest as Element).getAttribute('data-nav-theme-target'));
    else setTheme('light');
  }

  let throttle: ReturnType<typeof setTimeout> | null = null;
  function throttledFallback() {
    if (!throttle)
      throttle = setTimeout(() => {
        fallbackCheck();
        throttle = null;
      }, 100);
  }

  function build() {
    destroy();
    // Verbatim global lookup (43968): `window.ScrollTrigger || window.gsap && window.gsap.ScrollTrigger`.
    // The source bundle never exposes gsap on window (esbuild ESM bundle), so on the live site
    // this branch is DEAD and the nav theme is driven by the throttled nearest-section fallback
    // below (quirk Q17). Porting it as `if (TA)` made the rebuild create 4 real ScrollTriggers +
    // an extra ScrollTrigger.refresh() at +1s — the pixel gate caught the resulting theme
    // mismatch at home 33% (mirror dark / rebuild light) and a heroflip timing difference.
    const Z = (window as unknown as { ScrollTrigger?: typeof TA }).ScrollTrigger ||
      ((window as unknown as { gsap?: { ScrollTrigger?: typeof TA } }).gsap &&
        (window as unknown as { gsap?: { ScrollTrigger?: typeof TA } }).gsap!.ScrollTrigger);
    if (Z) {
      targets.forEach((t) => {
        const theme = t.getAttribute('data-nav-theme-target');
        try {
          const st = Z.create({
            trigger: t,
            start: 'top top',
            end: 'bottom top',
            onEnter: () => setTheme(theme),
            onEnterBack: () => setTheme(theme),
            markers: false,
          });
          window.themeScrollTriggers!.push(st);
        } catch (e) {
          console.error('Error creating ScrollTrigger:', e);
          document.addEventListener('scroll', throttledFallback);
        }
      });
      try {
        setTimeout(() => Z.refresh(), 1000);
      } catch (e) {
        console.error('Error refreshing ScrollTrigger:', e);
      }
    } else document.addEventListener('scroll', throttledFallback);
    setTimeout(fallbackCheck, 100);
  }

  destroy();
  build();
  window.addEventListener('riveAllLoaded', build);
  return { destroy };
}

/** kL 44001 — fullscreen menu timeline + hamburger toggle + reef rive */
export function initNavMenu() {
  const navWrap = document.querySelector('[data-nav-wrap]');
  if (!navWrap) {
    console.log('Navigation wrapper not found');
    return;
  }
  let storedTheme: string | null = null;
  const themeRoot = document.querySelector('[data-nav-theme]');
  const ham = navWrap.querySelector<HTMLElement>('[data-nav-ham]');
  const menu = navWrap.querySelector<HTMLElement>('[data-nav-m]');
  if (!ham || !menu) {
    console.log('Hamburger or navigation menu not found');
    return;
  }
  const reefCanvas = menu.querySelector<RiveCanvas & { booleanInputs?: unknown[] }>(
    'canvas[data-rive-nav-object]'
  );
  const navMiddle = document.querySelector('.nav-middle');
  const imgs = menu.querySelectorAll<HTMLElement>('[data-nav-img]');
  const links = menu.querySelectorAll<HTMLElement>('.nav-menu-link-w');
  const highlights = menu.querySelectorAll<HTMLElement>('[data-nav-link-highlight]');
  const bg = menu.querySelector('.nav-menu-bg');
  const imgCols = menu.querySelectorAll<HTMLElement>('.nav-menu-images-col');
  let menuVisible = false; // Y
  let open = false; // W
  ham.setAttribute('aria-expanded', 'false');
  ham.setAttribute('aria-label', 'Open navigation menu');

  function parallax(e: MouseEvent) {
    if (!menuVisible || !imgCols || imgCols.length < 2) return;
    const [colA, colB] = [imgCols[0], imgCols[1]];
    const shift = (e.clientY / window.innerHeight - 0.5) * 2 * 6;
    m.to(colA, { y: -shift + 'rem', duration: 2, ease: 'power2.out', overwrite: 'auto' });
    m.to(colB, { y: shift + 'rem', duration: 2, ease: 'power2.out', overwrite: 'auto' });
  }
  document.addEventListener('mousemove', parallax);
  if (imgCols && imgCols.length === 2) m.set(imgCols, { y: 0 });
  m.set(menu, { clipPath: 'ellipse(120% 0% at 50% 0%)', display: 'none' });
  m.set(imgs, { clipPath: 'ellipse(120% 0% at 50% 0%)', y: 25 });
  m.set(links, { clipPath: 'ellipse(30% 0% at 50% 0%)', y: 20 });
  m.set(bg, { autoAlpha: 0 });

  const sortedImgs = Array.from(imgs).sort((a, b) => {
    const na = parseInt(a.getAttribute('data-nav-img')?.split('/')[0] || '0');
    const nb = parseInt(b.getAttribute('data-nav-img')?.split('/')[0] || '0');
    return na - nb;
  });
  const linkArr = Array.from(links);

  function initReef() {
    if (!window.rive) window.rive = riveNS;
    const file = reefCanvas!.getAttribute('data-rive-file') || 'reef';
    const artboard = reefCanvas!.getAttribute('data-rive-artboard') || 'helmet-reef';
    const sm = reefCanvas!.getAttribute('data-rive-state-machine') || 'helmet-reef_scroll';
    const colorInput = reefCanvas!.getAttribute('data-rive-color-input');
    if (!window.rive || !window.loadedRiveFiles || !window.loadedRiveFiles[file]) {
      console.error('Required Rive dependencies not available:', {
        rive: !!window.rive,
        loadedRiveFiles: !!window.loadedRiveFiles,
        riveFile: !!(window.loadedRiveFiles && window.loadedRiveFiles[file]),
      });
      if (!window.riveRetryAttempt) {
        window.riveRetryAttempt = 1;
        setTimeout(initReef, 500);
      } else if (window.riveRetryAttempt < 3) {
        window.riveRetryAttempt++;
        setTimeout(initReef, 500);
      } else console.error('Failed to initialize Rive after multiple attempts');
      return;
    }
    window.riveRetryAttempt = 0;
    try {
      const inst = new riveNS.Rive({
        riveFile: window.loadedRiveFiles[file],
        canvas: reefCanvas!,
        artboard,
        stateMachines: sm,
        autoplay: true,
        layout: new riveNS.Layout({ fit: riveNS.Fit.Contain, alignment: riveNS.Alignment.Center }),
        onLoad: () => {
          inst.resizeDrawingSurfaceToCanvas();
          const smInputs = inst.stateMachineInputs(sm);
          if (smInputs && smInputs.length > 0) {
            const bools = smInputs.filter((i) => i.type === riveNS.StateMachineInputType.Boolean);
            const scroll = smInputs.find((i) => i.name === 'scroll');
            if (scroll) {
              scroll.value = 0;
              reefCanvas!.scrollInput = scroll;
            }
            if (colorInput) {
              const c = smInputs.find((i) => i.name === colorInput);
              if (c) c.value = true;
              else console.warn(`Specified color input ${colorInput} not found`);
            }
            reefCanvas!.riveInputs = smInputs;
            reefCanvas!.booleanInputs = bools;
          }
          reefCanvas!.riveInstance = inst;
          inst.pause();
        },
      });
      // window.riveInstances is read but never created upstream (source quirk)
      if (window.riveInstances && Array.isArray(window.riveInstances)) window.riveInstances.push(inst);
    } catch (e) {
      console.error('Error initializing nav menu Rive animation:', e);
    }
  }

  if (reefCanvas) {
    const file = reefCanvas.getAttribute('data-rive-file') || 'reef';
    if (window.loadedRiveFiles && window.loadedRiveFiles[file]) initReef();
    else window.addEventListener('riveAllLoaded', initReef, { once: true });
  }

  const scrollProxy = { value: 0 }; // F

  function ensureReefPlaying() {
    if (!reefCanvas || !reefCanvas.riveInstance) {
      console.warn('Rive instance not available');
      return false;
    }
    if (!reefCanvas.riveInstance.isPlaying) reefCanvas.riveInstance.play();
    if (reefCanvas.scrollInput) reefCanvas.scrollInput.value = 0;
    return true;
  }

  const tl = m.timeline({
    paused: true,
    onStart: () => {
      window.lenisStop!();
      m.set(menu, { display: 'flex' });
      scrollProxy.value = 0;
      if (reefCanvas) {
        if (reefCanvas.scrollInput) reefCanvas.scrollInput.value = 0;
        if (reefCanvas.riveInstance) reefCanvas.riveInstance.play();
        else {
          console.warn('No Rive instance available on menu open');
          initReef();
        }
      }
      menuVisible = true;
    },
    onReverseComplete: () => {
      window.lenisStart!();
      m.set(menu, { display: 'none' });
      if (reefCanvas && reefCanvas.riveInstance) {
        if (reefCanvas.scrollInput) reefCanvas.scrollInput.value = 0;
        reefCanvas.riveInstance.pause();
      }
      menuVisible = false;
      if (imgCols && imgCols.length === 2) m.to(imgCols, { y: 0, duration: 0.3, ease: 'power2.inOut' });
    },
  });
  tl.to(menu, { clipPath: 'ellipse(120% 100% at 50% 20%)', duration: 0.8, ease: 'power3.out' }, 0);
  tl.to(
    sortedImgs,
    { clipPath: 'ellipse(120% 100% at 50% 20%)', y: 0, duration: 0.8, stagger: 0.06, ease: 'power3.out' },
    0.15
  );
  tl.to(
    linkArr,
    { clipPath: 'ellipse(120% 100% at 50% 20%)', y: 0, duration: 0.6, stagger: 0.08, ease: 'back.out(1.2)' },
    0.35
  );
  m.set(linkArr, { y: 20, clipPath: 'ellipse(30% 0% at 50% 0%)' });

  tl.call(ensureReefPlaying as never, [], 0.15);
  tl.to(
    scrollProxy,
    {
      value: 1000,
      duration: 1.7,
      immediateRender: true,
      onStart: function () {
        if (!ensureReefPlaying()) {
          setTimeout(ensureReefPlaying, 50);
          setTimeout(ensureReefPlaying, 150);
        }
      },
      onUpdate: function () {
        const v = Math.round(scrollProxy.value);
        if (reefCanvas && reefCanvas.scrollInput) {
          reefCanvas.scrollInput.value = v;
          if (reefCanvas.riveInstance && !reefCanvas.riveInstance.isPlaying) reefCanvas.riveInstance.play();
        }
      },
      onComplete: function () {
        if (reefCanvas && reefCanvas.scrollInput) reefCanvas.scrollInput.value = 1000;
      },
      onReverseComplete: function () {
        if (reefCanvas && reefCanvas.scrollInput) reefCanvas.scrollInput.value = 0;
      },
    },
    0.2
  );
  tl.call(
    (() => {
      if (reefCanvas && (!reefCanvas.riveInstance || !reefCanvas.riveInstance.isPlaying)) {
        initReef();
        setTimeout(ensureReefPlaying, 100);
      }
    }) as never,
    [],
    1
  );
  tl.to(bg, { autoAlpha: 0.12, duration: 0.6 }, 0.6);

  const currentPaths = menu.querySelectorAll<SVGPathElement>('.nav-menu-link-current-svg path');
  if (currentPaths && currentPaths.length > 0)
    currentPaths.forEach((p) => {
      const len = p.getTotalLength();
      m.set(p, { strokeDasharray: len, strokeDashoffset: len });
    });
  tl.to(currentPaths, { strokeDashoffset: 0, duration: 0.6, stagger: 0.05, ease: 'power2.inOut' }, 0.4);
  // source passes a 4th positional arg (ignored by GSAP); kept via untyped call
  (tl.to as (...a: unknown[]) => unknown)(
    currentPaths,
    {
      strokeDashoffset: (_i: number, target: SVGPathElement) => target.getTotalLength(),
      duration: 0.4,
      stagger: 0.03,
      ease: 'power2.in',
    },
    0,
    1
  );
  if (highlights && highlights.length > 0) {
    highlights.forEach((h) => {
      h.style.position = 'relative';
      m.set(h, { clipPath: 'inset(0 100% 0 0)', y: 15 });
      const bar = document.createElement('div');
      bar.className = 'high-line-reveal';
      bar.style.position = 'absolute';
      bar.style.top = '0';
      bar.style.left = '0';
      bar.style.width = '100%';
      bar.style.height = '100%';
      bar.style.backgroundColor = 'var(--color--lime, #d2ff00)';
      bar.style.transformOrigin = 'right center';
      bar.style.zIndex = '5';
      h.appendChild(bar);
      m.set(bar, { scaleX: 1 });
    });
    tl.to(highlights, { clipPath: 'inset(0 0% 0 0)', y: 0, duration: 0.7, stagger: 0.04, ease: 'back.out(1.1)' }, 0.5);
    const bars: HTMLElement[] = [];
    highlights.forEach((h) => {
      const bar = h.querySelector<HTMLElement>('.high-line-reveal');
      if (bar) bars.push(bar);
    });
    tl.to(bars, { scaleX: 0, duration: 0.6, stagger: 0.05, ease: 'power2.inOut' }, 0.7);
    (tl.to as (...a: unknown[]) => unknown)(bars, { scaleX: 1, duration: 0.2, stagger: 0.03, ease: 'power2.in' }, 0, 1);
    (tl.to as (...a: unknown[]) => unknown)(
      highlights,
      { clipPath: 'inset(0 100% 0 0)', y: 15, duration: 0.3, stagger: 0.03, ease: 'power3.in' },
      0.1,
      1
    );
  }
  (tl.to as (...a: unknown[]) => unknown)(
    linkArr,
    { clipPath: 'ellipse(30% 0% at 50% 0%)', y: 20, duration: 0.3, stagger: 0.02, ease: 'power2.in' },
    0.1,
    1
  );

  function toggle() {
    open = !open;
    ham!.setAttribute('aria-expanded', open ? 'true' : 'false');
    ham!.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    if (open) {
      if (themeRoot) {
        storedTheme = themeRoot.getAttribute('data-nav-theme');
        themeRoot.setAttribute('data-nav-theme', 'light');
        setHamburgerTheme('transparent');
        if (navMiddle) m.to(navMiddle, { opacity: 0, duration: 0.4, ease: 'power2.out' });
      }
      setMenuClosedState(true);
      tl.timeScale(1).play();
    } else {
      if (themeRoot && storedTheme) {
        themeRoot.setAttribute('data-nav-theme', storedTheme);
        setHamburgerTheme(storedTheme === 'light' ? 'white' : 'transparent');
        if (navMiddle) m.to(navMiddle, { opacity: 1, duration: 0.4, ease: 'power2.out' });
      }
      setMenuClosedState(false);
      tl.timeScale(1.5).reverse();
    }
  }

  ham.addEventListener('click', () => {
    ham.focus();
    toggle();
  });
  ham.addEventListener(
    'touchend',
    (e) => {
      if (e.cancelable) e.preventDefault();
      toggle();
    },
    { passive: false }
  );
  ham.setAttribute('role', 'button');
  ham.setAttribute('tabindex', '0');
  ham.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  });

  function close() {
    if (open) {
      open = false;
      ham!.setAttribute('aria-expanded', 'false');
      ham!.setAttribute('aria-label', 'Open navigation menu');
      if (themeRoot && storedTheme) {
        themeRoot.setAttribute('data-nav-theme', storedTheme);
        setHamburgerTheme(storedTheme === 'light' ? 'white' : 'transparent');
        if (navMiddle) m.to(navMiddle, { opacity: 1, duration: 0.4, ease: 'power2.out' });
      }
      setMenuClosedState(false);
      tl.timeScale(1.5).reverse();
    }
  }
  window.closeNavigation = close;

  // link hover -> preview image opacity choreography (44339-44396)
  if (links.length > 0 && sortedImgs.length > 0) {
    const imgByIndex: Record<number, HTMLElement> = {};
    let currentIdx = -1;
    linkArr.forEach((link, i) => {
      if (link.classList.contains('w--current')) currentIdx = i;
    });
    sortedImgs.forEach((img) => {
      const top = img.querySelector<HTMLElement>('.menu-img-top');
      if (top) {
        const num = img.getAttribute('data-nav-img')?.split('/')[0];
        if (num) {
          const idx = parseInt(num) - 1;
          imgByIndex[idx] = top;
          if (idx === currentIdx) m.set(top, { opacity: 0.5 });
          else m.set(top, { opacity: 0 });
        }
      }
    });
    let hoveredIdx = -1;
    let hovering = false;
    linkArr.forEach((link, i) => {
      link.addEventListener('mouseenter', () => {
        const img = imgByIndex[i];
        if (img) {
          Object.keys(imgByIndex).forEach((k) => {
            if (parseInt(k) !== i) m.to(imgByIndex[+k], { opacity: 0, duration: 0.3, overwrite: 'auto' });
          });
          hoveredIdx = i;
          hovering = true;
          m.to(img, { opacity: 1, duration: 0.2, overwrite: 'auto', ease: 'power2.inOut' });
        }
      });
      link.addEventListener('mouseleave', () => {
        hovering = false;
        setTimeout(() => {
          if (!hovering && hoveredIdx === i) {
            Object.keys(imgByIndex).forEach((k) => {
              const o = parseInt(k) === currentIdx ? 0.5 : 0;
              m.to(imgByIndex[+k], { opacity: o, duration: 0.2, ease: 'power2.inOut', overwrite: 'auto' });
            });
            hoveredIdx = -1;
          }
        }, 50);
      });
    });
    if (menu)
      menu.addEventListener('mouseleave', () => {
        hovering = false;
        Object.keys(imgByIndex).forEach((k) => {
          const o = parseInt(k) === currentIdx ? 0.5 : 0;
          m.to(imgByIndex[+k], { opacity: o, duration: 0.2, ease: 'power2.inOut', overwrite: 'auto' });
        });
        hoveredIdx = -1;
      });
  }
  void navState;
}
