/**
 * Rive DOM component factories — source: pretty 9545-10253.
 * CH -> playOnEnter, oR -> bindScrollDriven, KH -> isInHeroContainer,
 * B4/E4/I4/C4/iR/K4/nR -> init* factories, S1 -> initRiveComponents,
 * o0 -> fireHeroRiveAnimations, aR/rR -> MobileLandscape.
 */
import { gsap, ScrollTrigger } from '../gsap';
import {
  rive,
  fileCache,
  instances,
  logoRegistry,
  navState,
  fitFromAttr,
  instanceOf,
  cleanupCanvas,
  preloadAllRiveFiles,
  isAllLoaded,
  getPendingCount,
  type RiveCanvas,
} from './preload';

type SMInput = rive.StateMachineInput;

/** CH 9545 — play once when scrolled into view (first frame pre-warmed) */
export function playOnEnter(
  canvas: HTMLCanvasElement,
  r: rive.Rive,
  trigger: Element,
  start = 'top 80%'
) {
  canvas.style.opacity = '0';
  canvas.style.transition = 'opacity 0.1s ease-in-out';
  r.play();
  setTimeout(() => {
    r.pause();
    canvas.style.opacity = '0';
  }, 50);
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      trigger,
      start,
      onEnter: () => {
        setTimeout(() => {
          canvas.style.opacity = '1';
          r.play();
        }, 0);
      },
      once: true,
    });
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setTimeout(() => r.play(), 100);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
    );
    io.observe(trigger);
  }
}

/** oR 9573 — "scroll" input (0-1000) scrubbed by ScrollTrigger, lenis fling clamp */
export function bindScrollDriven(canvas: RiveCanvas, r: rive.Rive, trigger: Element) {
  const smName = canvas.getAttribute('data-rive-state-machine')!;
  let input: SMInput | null = null;
  const smInputs = r.stateMachineInputs(smName);
  if (smInputs) {
    input = smInputs.find((i) => i.name === 'scroll') ?? null;
    if (!input) {
      console.error(`Scroll input not found in state machine ${smName}`);
      return;
    }
  }
  if (typeof ScrollTrigger !== 'undefined') {
    const start = canvas.getAttribute('data-rive-scrolltrigger-start');
    const end = canvas.getAttribute('data-rive-scrolltrigger-end');
    const tl = gsap.timeline({
      paused: true,
      onUpdate: function (this: gsap.core.Timeline) {
        if (input) {
          const p = gsap.utils.clamp(0, 1, this.progress());
          input.value = p * 1000;
        }
      },
    });
    tl.to({}, { duration: 1 });
    const st = ScrollTrigger.create({
      trigger,
      start: start || 'top bottom',
      end: end || 'bottom top',
      scrub: 0.5,
      markers: false,
      onUpdate: (self) => {
        tl.progress(self.progress);
        if (!r.isPlaying) r.play();
      },
      onEnter: () => {
        r.play();
        if (input) input.value = 0;
      },
      onLeave: () => {
        if (input) input.value = 1000;
        setTimeout(() => r.pause(), 50);
      },
      onEnterBack: () => {
        r.play();
      },
      onLeaveBack: () => {
        if (input) input.value = 0;
        setTimeout(() => r.pause(), 50);
      },
    });
    canvas.riveScrollControl = { timeline: tl, scrollTrigger: st };
    if (window.lenis) {
      const handler = () => {
        if (st.isActive) {
          const v = window.lenis!.velocity || 0;
          if (Math.abs(v) > 100) {
            if (v < 0 && st.progress < 0.1) {
              if (input) input.value = 0;
            } else if (v > 0 && st.progress > 0.9) {
              if (input) input.value = 1000;
            }
          }
        }
      };
      window.lenis.on('scroll', handler);
      canvas.lenisScrollHandler = handler;
    }
  } else {
    // no-GSAP fallback (9640-9666): manual progress via gsap.ticker
    let queued = false;
    const progressOf = (el: Element) => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.bottom <= 0) return 1;
      if (rect.top >= vh) return 0;
      const total = rect.height + vh;
      const seen = vh - rect.top;
      return Math.min(Math.max(seen / total, 0), 1);
    };
    const update = () => {
      const p = progressOf(trigger);
      if (input) input.value = p * 1000;
      if (p > 0 && p < 1) {
        if (!r.isPlaying) r.play();
      } else if (r.isPlaying) r.pause();
      queued = false;
    };
    const onScroll = () => {
      if (!queued) {
        gsap.ticker.add(update as never);
        queued = true;
      }
    };
    window.addEventListener('scroll', onScroll);
    (canvas as RiveCanvas & { scrollListener?: () => void }).scrollListener = onScroll;
  }
}

/** KH 9669 */
export function isInHeroContainer(el: Element | null): boolean {
  let node: Element | null = el;
  while (node) {
    if (node.hasAttribute && node.hasAttribute('data-hero-animation-container')) return true;
    node = node.parentElement;
  }
  return false;
}

/** Shared factory guard (tail of every init function) */
function whenRiveReady(key: string, fn: () => void) {
  if (isAllLoaded() && fileCache[key]) fn();
  else {
    window.addEventListener('riveAllLoaded', fn, { once: true });
    if (getPendingCount() === 0 && !isAllLoaded()) preloadAllRiveFiles();
  }
}

/** B4 9678 — reef */
export function initReef() {
  whenRiveReady('reef', () => {
    if (!fileCache.reef) {
      console.error('Reef file not found in loaded files');
      return;
    }
    const canvases = document.querySelectorAll<RiveCanvas>(
      'canvas[data-rive-object][data-rive-file="reef"]'
    );
    if (canvases.length === 0) {
      console.log('No Reef Rive canvases found on page');
      return;
    }
    canvases.forEach((canvas) => {
      const artboard = canvas.getAttribute('data-rive-artboard') || 'helmet-reef';
      const smName = canvas.getAttribute('data-rive-state-machine')!;
      const targetSel = canvas.getAttribute('data-rive-scrolltrigger-target');
      const inputName = canvas.getAttribute('data-rive-input');
      const instantPlay = canvas.getAttribute('data-rive-instant-play') === 'true';
      const inHero = isInHeroContainer(canvas);
      const autoplay = instantPlay && !inHero;
      let target: Element | null = targetSel
        ? targetSel === ''
          ? canvas
          : document.querySelector(targetSel)
        : canvas;
      if (!target) target = canvas;
      const r = new rive.Rive({
        riveFile: fileCache.reef,
        canvas,
        artboard,
        stateMachines: smName,
        autoplay,
        layout: new rive.Layout({
          fit: fitFromAttr(canvas.getAttribute('data-rive-fit') || 'contain'),
          alignment: rive.Alignment.Center,
        }),
        onLoad: () => {
          r.resizeDrawingSurfaceToCanvas();
          if (inputName && smName) {
            const smInputs = r.stateMachineInputs(smName);
            if (smInputs) {
              const input = smInputs.find((i) => i.name === inputName);
              if (input && input.type === rive.StateMachineInputType.Boolean) input.value = true;
              canvas.riveInputs = smInputs;
            }
          }
          if (inHero) {
            canvas.dataset.heroAnimation = 'true';
            if (r.isPlaying) r.pause();
          } else if (smName.includes('_play')) {
            if (!instantPlay) playOnEnter(canvas, r, target!);
          } else if (smName.includes('_scroll')) bindScrollDriven(canvas, r, target!);
          else if (smName === 'off-icons') r.play();
        },
      });
      instances.push(r);
      canvas.riveInstance = r;
    });
  });
}

/** E4 9735 — signature */
export function initSignature() {
  whenRiveReady('signature', () => {
    if (!fileCache.signature) {
      console.error('Signature file not found in loaded files');
      return;
    }
    const canvases = document.querySelectorAll<RiveCanvas>(
      'canvas[data-rive-object][data-rive-file="signature"]'
    );
    if (canvases.length === 0) {
      console.log('No Signature Rive canvases found on page');
      return;
    }
    canvases.forEach((canvas) => {
      const smName = canvas.getAttribute('data-rive-state-machine')!;
      const targetSel = canvas.getAttribute('data-rive-scrolltrigger-target');
      const inputName = canvas.getAttribute('data-rive-input');
      const instantPlay = canvas.getAttribute('data-rive-instant-play') === 'true';
      const inHero = isInHeroContainer(canvas);
      const autoplay = instantPlay && !inHero;
      let target: Element | null = targetSel
        ? targetSel === ''
          ? canvas
          : document.querySelector(targetSel)
        : canvas;
      if (!target) target = canvas;
      const r = new rive.Rive({
        riveFile: fileCache.signature,
        canvas,
        artboard: 'signature',
        stateMachines: smName,
        autoplay,
        layout: new rive.Layout({
          fit: fitFromAttr(canvas.getAttribute('data-rive-fit') || 'contain'),
          alignment: rive.Alignment.Center,
        }),
        onLoad: () => {
          r.resizeDrawingSurfaceToCanvas();
          if (inputName && smName) {
            const smInputs = r.stateMachineInputs(smName);
            if (smInputs) {
              const input = smInputs.find((i) => i.name === inputName);
              if (input && input.type === rive.StateMachineInputType.Boolean) input.value = true;
              canvas.riveInputs = smInputs;
            }
          }
          if (inHero) {
            canvas.dataset.heroAnimation = 'true';
            if (r.isPlaying) r.pause();
          } else if (smName === 'signature_play') {
            if (!instantPlay) playOnEnter(canvas, r, target!);
          } else if (smName === 'signature_scroll') bindScrollDriven(canvas, r, target!);
        },
      });
      instances.push(r);
      canvas.riveInstance = r;
    });
  });
}

/** I4 9790 — circuits (track selector + optional hover wiring) */
export function initCircuits() {
  whenRiveReady('circuits', () => {
    if (!fileCache.circuits) {
      console.error('Circuits file not found in loaded files');
      return;
    }
    const canvases = document.querySelectorAll<RiveCanvas>(
      'canvas[data-rive-object][data-rive-file="circuits"]'
    );
    if (canvases.length === 0) return;
    canvases.forEach((canvas) => {
      const smName = canvas.getAttribute('data-rive-state-machine')!;
      const trackName = canvas.getAttribute('data-rive-input-track');
      const colorName = canvas.getAttribute('data-rive-input-color');
      const weightName = canvas.getAttribute('data-rive-input-weight');
      const hoverEnabled = canvas.getAttribute('data-rive-circuit-hover') === 'true';
      const r = new rive.Rive({
        riveFile: fileCache.circuits,
        canvas,
        artboard: 'circuits',
        stateMachines: smName,
        autoplay: true,
        layout: new rive.Layout({
          fit: fitFromAttr(canvas.getAttribute('data-rive-fit') || 'contain'),
          alignment: rive.Alignment.Center,
        }),
        onLoad: () => {
          r.resizeDrawingSurfaceToCanvas();
          const smInputs = r.stateMachineInputs(smName);
          if (!smInputs) {
            console.error('No inputs found for state machine:', smName);
            return;
          }
          canvas.riveInputs = smInputs;
          const selectTrack = (name: string | null) => {
            if (!name) return;
            smInputs
              .filter(
                (i) =>
                  i.type === rive.StateMachineInputType.Boolean &&
                  !i.name.startsWith('color_') &&
                  !i.name.startsWith('weight_')
              )
              .forEach((i) => {
                i.value = false;
              });
            const input = smInputs.find((i) => i.name === name);
            if (input) input.value = true;
          };
          if (colorName) {
            const c = smInputs.find((i) => i.name === colorName);
            if (c && c.type === rive.StateMachineInputType.Boolean) c.value = true;
          }
          if (weightName) {
            const w = smInputs.find((i) => i.name === weightName);
            if (w && w.type === rive.StateMachineInputType.Boolean) w.value = true;
          }
          if (trackName) selectTrack(trackName);
          if (hoverEnabled) {
            const targets = document.querySelectorAll('[data-rive-circuit-hover-target]');
            const texts = document.querySelectorAll('[data-rive-circuit-hover-text]');
            targets.forEach((t) => {
              t.addEventListener('mouseenter', () => {
                const name = t.getAttribute('data-rive-circuit-hover-target');
                selectTrack(name);
                if (texts.length > 0)
                  texts.forEach((el) => {
                    el.textContent = name;
                  });
              });
              t.addEventListener('mouseleave', () => {
                if (trackName) {
                  selectTrack(trackName);
                  if (texts.length > 0)
                    texts.forEach((el) => {
                      el.textContent = trackName;
                    });
                }
              });
            });
          }
        },
      });
      instances.push(r);
      canvas.riveInstance = r;
    });
  });
}

/** C4 9869 — btn-ui arrow hover */
export function initBtnUi() {
  whenRiveReady('btn-ui', () => {
    if (!fileCache['btn-ui']) {
      console.error('Button UI file not found in loaded files');
      return;
    }
    const canvases = document.querySelectorAll<RiveCanvas>(
      'canvas[data-rive-object][data-rive-file="btn-ui"]'
    );
    if (canvases.length === 0) return;
    canvases.forEach((canvas) => {
      const artboard = canvas.getAttribute('data-rive-artboard') || 'arrow';
      const smName = canvas.getAttribute('data-rive-state-machine') || 'arrow';
      let hoverEl: Element | null = canvas;
      while (hoverEl && !hoverEl.hasAttribute('data-btn-rive-hover')) hoverEl = hoverEl.parentElement;
      if (!hoverEl) hoverEl = canvas;
      const r = new rive.Rive({
        riveFile: fileCache['btn-ui'],
        canvas,
        artboard,
        stateMachines: smName,
        autoplay: true,
        layout: new rive.Layout({
          fit: fitFromAttr(canvas.getAttribute('data-rive-fit') || 'contain'),
          alignment: rive.Alignment.Center,
        }),
        onLoad: () => {
          r.resizeDrawingSurfaceToCanvas();
          const smInputs = r.stateMachineInputs(smName);
          if (!smInputs) {
            console.error(`No inputs found for state machine: ${smName}`);
            return;
          }
          const hover = smInputs.find((i) => i.name === 'hover');
          if (!hover) {
            console.error(`Hover input not found in state machine: ${smName}`);
            return;
          }
          hover.value = false;
          canvas.riveInputs = smInputs;
          hoverEl!.addEventListener('mouseenter', () => (hover.value = true));
          hoverEl!.addEventListener('mouseleave', () => (hover.value = false));
          hoverEl!.addEventListener('touchstart', () => (hover.value = true));
          hoverEl!.addEventListener('touchend', () => (hover.value = false));
        },
      });
      instances.push(r);
      canvas.riveInstance = r;
    });
  });
}

/** iR 9925 — nav hamburger (btn-ui/hamburger) */
export function initNavHamburger() {
  whenRiveReady('btn-ui', () => {
    if (!fileCache['btn-ui']) {
      console.error('Button UI file not found in loaded files');
      return;
    }
    const hams = document.querySelectorAll<HTMLElement>('[data-nav-ham]');
    if (hams.length === 0) return;
    hams.forEach((ham) => {
      const canvas = ham.querySelector<RiveCanvas>('canvas[data-rive-nav-hamburger]');
      if (!canvas) {
        console.error('Nav hamburger canvas not found in element:', ham);
        return;
      }
      const artboard = canvas.getAttribute('data-rive-artboard') || 'hamburger';
      const smName = canvas.getAttribute('data-rive-state-machine') || 'hamburger';
      ham.setAttribute('aria-label', 'Open menu');
      ham.setAttribute('aria-expanded', 'false');
      ham.setAttribute('tabindex', '0');
      const r = new rive.Rive({
        riveFile: fileCache['btn-ui'],
        canvas,
        artboard,
        stateMachines: smName,
        autoplay: true,
        layout: new rive.Layout({
          fit: fitFromAttr(canvas.getAttribute('data-rive-fit') || 'contain'),
          alignment: rive.Alignment.Center,
        }),
        onLoad: () => {
          r.resizeDrawingSurfaceToCanvas();
          const smInputs = r.stateMachineInputs(smName);
          if (!smInputs) {
            console.error(`No inputs found for state machine: ${smName}`);
            return;
          }
          const hover = smInputs.find((i) => i.name === 'hover');
          const close = smInputs.find((i) => i.name === 'close');
          const transparent = smInputs.find((i) => i.name === 'color-transparent');
          const white = smInputs.find((i) => i.name === 'color-white');
          if (!hover || !close || !transparent || !white) {
            console.error('Required inputs not found for nav hamburger:', smInputs.map((i) => i.name));
            return;
          }
          canvas.riveInputs = smInputs;
          navState.hamburgerInputs = smInputs;
          const themeEl = document.querySelector('[data-nav-theme]');
          if (themeEl && themeEl.getAttribute('data-nav-theme') === 'light') {
            transparent.value = false;
            white.value = true;
          } else {
            transparent.value = true;
            white.value = false;
          }
          const syncAria = () => {
            ham.setAttribute('aria-label', navState.menuOpen ? 'Close menu' : 'Open menu');
            ham.setAttribute('aria-expanded', navState.menuOpen ? 'true' : 'false');
          };
          ham.addEventListener('mouseenter', () => (hover.value = true));
          ham.addEventListener('mouseleave', () => (hover.value = false));
          ham.addEventListener('touchstart', (e) => {
            e.preventDefault();
            hover.value = true;
          });
          ham.addEventListener('touchend', (e) => {
            e.preventDefault();
            hover.value = false;
            navState.menuOpen = !navState.menuOpen;
            close.value = navState.menuOpen;
            syncAria();
          });
          ham.addEventListener('click', () => {
            navState.menuOpen = !navState.menuOpen;
            close.value = navState.menuOpen;
            syncAria();
          });
          ham.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              ham.click();
            }
          });
        },
      });
      instances.push(r);
      canvas.riveInstance = r;
    });
  });
}

/** K4 9995 — phrases */
export function initPhrases() {
  whenRiveReady('phrases', () => {
    if (!fileCache.phrases) {
      console.error('Phrases file not found in loaded files');
      return;
    }
    const canvases = document.querySelectorAll<RiveCanvas>(
      'canvas[data-rive-object][data-rive-file="phrases"]'
    );
    if (canvases.length === 0) return;
    canvases.forEach((canvas) => {
      const artboard = canvas.getAttribute('data-rive-artboard');
      const smName = canvas.getAttribute('data-rive-state-machine');
      const useScrollTrigger = canvas.getAttribute('data-rive-scrolltrigger') === 'true';
      const targetSel = canvas.getAttribute('data-rive-scrolltrigger-target');
      const start = canvas.getAttribute('data-rive-scrolltrigger-start') || 'top 80%';
      const inHero = isInHeroContainer(canvas);
      const autoplay = !useScrollTrigger && !inHero;
      if (!artboard || !smName) {
        console.error('Missing required data attributes for phrases Rive canvas');
        return;
      }
      let target: Element | null = targetSel
        ? targetSel === ''
          ? canvas
          : document.querySelector(targetSel)
        : canvas;
      if (!target) target = canvas;
      const r = new rive.Rive({
        riveFile: fileCache.phrases,
        canvas,
        artboard,
        stateMachines: smName,
        autoplay,
        layout: new rive.Layout({
          fit: fitFromAttr(canvas.getAttribute('data-rive-fit') || 'contain'),
          alignment: rive.Alignment.Center,
        }),
        onLoad: () => {
          r.resizeDrawingSurfaceToCanvas();
          if (inHero) {
            canvas.dataset.heroAnimation = 'true';
            if (r.isPlaying) r.pause();
          } else if (useScrollTrigger) playOnEnter(canvas, r, target!, start);
        },
      });
      instances.push(r);
      canvas.riveInstance = r;
    });
  });
}

/** nR 10042 — ln4 nav logo */
export function initLn4Logo() {
  whenRiveReady('logo', () => {
    if (!fileCache.logo) {
      console.error('LN4 Logo file not found in loaded files');
      return;
    }
    const canvases = document.querySelectorAll<RiveCanvas>('canvas[data-rive-ln4]');
    if (canvases.length === 0) return;
    canvases.forEach((canvas) => {
      const r = new rive.Rive({
        riveFile: fileCache.logo,
        canvas,
        artboard: 'logo',
        stateMachines: 'logo',
        autoplay: true,
        layout: new rive.Layout({
          fit: fitFromAttr(canvas.getAttribute('data-rive-fit') || 'contain'),
          alignment: rive.Alignment.Center,
        }),
        onLoad: () => {
          r.resizeDrawingSurfaceToCanvas();
          const smInputs = r.stateMachineInputs('logo');
          if (!smInputs) {
            console.error('No inputs found for LN4 logo state machine');
            return;
          }
          canvas.riveInputs = smInputs;
          const active = smInputs.find((i) => i.name === 'logo-active');
          const hover = smInputs.find((i) => i.name === 'hover');
          if (active) active.value = true;
          canvas.addEventListener('mouseenter', () => {
            if (hover) hover.value = true;
          });
          canvas.addEventListener('mouseleave', () => {
            if (hover) hover.value = false;
          });
          canvas.addEventListener('touchstart', () => {
            if (hover) hover.value = true;
          });
          canvas.addEventListener('touchend', () => {
            if (hover) hover.value = false;
          });
        },
      });
      instances.push(r);
      logoRegistry.push({ instance: r, canvas });
      canvas.riveInstance = r;
    });
  });
}

/** pK 10098 — reads inputs from canvas.riveInputs (overrides the preload.ts stub) */
export function setLogoActive(active: boolean) {
  logoRegistry.forEach(({ canvas }) => {
    const inputs = (canvas as RiveCanvas).riveInputs;
    if (!inputs) return;
    const input = inputs.find((i) => i.name === 'logo-active');
    if (input) input.value = active;
  });
}

/** AC 10108 */
export function setLogoColor(color: string) {
  logoRegistry.forEach(({ canvas }) => {
    const inputs = (canvas as RiveCanvas).riveInputs;
    if (!inputs) return;
    const darkGreen = inputs.find((i) => i.name === 'color_dark-green');
    const white = inputs.find((i) => i.name === 'color_white');
    const lime = inputs.find((i) => i.name === 'color_lime');
    if (darkGreen) darkGreen.value = false;
    if (white) white.value = false;
    if (lime) lime.value = false;
    switch (color.toLowerCase()) {
      case 'lime':
        if (lime) lime.value = true;
        break;
      case 'white':
        if (white) white.value = true;
        break;
      case 'black':
      default:
        if (darkGreen) darkGreen.value = true;
        break;
    }
  });
}

/** S1 10134 */
export function initRiveComponents() {
  initReef();
  initSignature();
  initCircuits();
  initBtnUi();
  initPhrases();
}

/** o0 10138 — fire hero-container rive (poll until loadingComplete, 10s cap) */
export function fireHeroRiveAnimations() {
  if (!window.loadingComplete) {
    console.warn('Cannot fire hero animations - Rive files not fully loaded yet');
    const interval = setInterval(() => {
      if (window.loadingComplete) {
        console.log('Rive files now loaded, firing hero animations');
        clearInterval(interval);
        fireHeroRiveAnimations();
      }
    }, 500);
    setTimeout(() => clearInterval(interval), 10000);
    return;
  }
  const containers = document.querySelectorAll('[data-hero-animation-container]');
  if (containers.length === 0) {
    console.log('No hero animation containers found on page');
    return;
  }
  containers.forEach((container) => {
    const canvases = container.querySelectorAll<RiveCanvas>('canvas[data-rive-object]');
    if (canvases.length === 0) {
      console.log('No Rive canvases found in hero container:', container);
      return;
    }
    canvases.forEach((canvas) => {
      const inst = instanceOf(canvas);
      if (!inst) {
        console.warn('No Rive instance found for canvas in hero container, will retry');
        const retry = () => {
          const found = instanceOf(canvas);
          if (found) {
            console.log('Found Rive instance on retry, playing animation');
            if (!found.isPlaying) found.play();
            if (canvas.riveInputs) {
              const play = canvas.riveInputs.find((i) => i.name === 'play');
              if (play && play.type === rive.StateMachineInputType.Boolean) play.value = true;
            }
          } else setTimeout(retry, 200);
        };
        setTimeout(retry, 200);
        return;
      }
      const smName = canvas.getAttribute('data-rive-state-machine');
      if (smName && smName.includes('_scroll')) {
        console.log('Skipping scroll-controlled animation:', smName);
        return;
      }
      if (!inst.isPlaying) inst.play();
      if (canvas.riveInputs) {
        const play = canvas.riveInputs.find((i) => i.name === 'play');
        if (play && play.type === rive.StateMachineInputType.Boolean) play.value = true;
      }
    });
  });
}

/** aR 10190 / rR 10253 — mobile landscape overlay */
export class MobileLandscape {
  riveInstance: rive.Rive | null = null;
  canvas = document.querySelector<RiveCanvas>('canvas[data-rive-mob-landscape]');
  isActive = false;
  private orientationHandler = this.handleOrientationChange.bind(this);

  constructor() {
    this.setupEventListeners();
    this.handleOrientationChange();
  }

  setupEventListeners() {
    if (window.screen.orientation)
      window.screen.orientation.addEventListener('change', this.orientationHandler);
    else window.addEventListener('orientationchange', this.orientationHandler);
    window.addEventListener('resize', this.orientationHandler);
  }

  detectLandscapeOrientation() {
    const isPhone =
      /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) &&
      !/iPad|Tablet/i.test(navigator.userAgent);
    let landscape = false;
    if (window.screen.orientation) landscape = window.screen.orientation.type.includes('landscape');
    else if (typeof window.orientation !== 'undefined')
      landscape = window.orientation === 90 || window.orientation === -90;
    else landscape = window.innerWidth > window.innerHeight;
    return isPhone && landscape;
  }

  handleOrientationChange() {
    if (this.detectLandscapeOrientation()) this.activateLandscapeMode();
    else this.deactivateLandscapeMode();
  }

  activateLandscapeMode() {
    if (this.isActive || !this.canvas) return;
    const overlay = document.querySelector<HTMLElement>('[data-mob-landscape]');
    if (overlay) overlay.style.display = 'flex';
    if (!this.riveInstance && fileCache['mob-landscape']) this.initRiveAnimation();
    else if (this.riveInstance && !this.riveInstance.isPlaying) this.riveInstance.play();
    this.isActive = true;
  }

  deactivateLandscapeMode() {
    if (!this.isActive) return;
    const overlay = document.querySelector<HTMLElement>('[data-mob-landscape]');
    if (overlay) overlay.style.display = 'none';
    if (this.riveInstance && this.riveInstance.isPlaying) this.riveInstance.pause();
    this.isActive = false;
  }

  initRiveAnimation() {
    if (!this.canvas || !fileCache['mob-landscape']) {
      console.warn('Canvas or Rive file not available for mobile landscape');
      return;
    }
    this.riveInstance = new rive.Rive({
      riveFile: fileCache['mob-landscape'],
      canvas: this.canvas,
      stateMachines: 'mob-landscape',
      autoplay: true,
      layout: new rive.Layout({ fit: rive.Fit.Cover, alignment: rive.Alignment.Center }),
      onLoad: () => {
        this.riveInstance!.resizeDrawingSurfaceToCanvas();
      },
    });
    instances.push(this.riveInstance);
    this.canvas.riveInstance = this.riveInstance;
  }

  destroy() {
    if (window.screen.orientation)
      window.screen.orientation.removeEventListener('change', this.orientationHandler);
    else window.removeEventListener('orientationchange', this.orientationHandler);
    window.removeEventListener('resize', this.orientationHandler);
    if (this.riveInstance && this.canvas) {
      cleanupCanvas(this.canvas);
      this.riveInstance = null;
    }
    this.isActive = false;
  }
}

export const createMobileLandscape = () => new MobileLandscape();
