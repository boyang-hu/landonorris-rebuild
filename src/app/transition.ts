/**
 * Page-transition Rive overlay.
 * Source: q$ closure 41745-41749, BL 41686-41722, EL 41724-41730, H$ 41732-41742.
 *
 * Loads page-transition.riv from its own base (mj, lando.itsoffbrand.io/rive/ —
 * NOT the assets.itsoffbrand.io base used by the preloaded manifest, quirk Q4)
 * outside the RiveFile cache. State machine inputs: initial / transition-out /
 * transition-in.
 */
import * as rive from '@rive-app/canvas-lite';

/** mj + cj, 41743/41746 */
const PAGE_TRANSITION_SRC = '/ext/lando.itsoffbrand.io/rive/page-transition.riv';

interface TransitionInputs {
  initialInput: rive.StateMachineInput;
  transitionOutInput: rive.StateMachineInput;
  transitionInInput: rive.StateMachineInput;
}

// ZK / IZ / Z$ / xJ / lj (41746-41748)
let wrap: HTMLElement;
let canvas: (HTMLCanvasElement & { riveInstance?: rive.Rive }) | null;
let btn: HTMLElement;
let inputs: Partial<TransitionInputs> = {};
const instances: rive.Rive[] = [];

function initDom() {
  wrap = document.querySelector('.transition-w') as HTMLElement;
  canvas = wrap?.querySelector('canvas[data-rive-primary]') as HTMLCanvasElement | null;
  btn = wrap?.querySelector('.transition-btn') as HTMLElement;
  btn.style.transition = 'opacity 300ms';
}

/** BL 41686 — resolves once the overlay rive is ready (initial=true keeps it covering) */
export function loadPageTransition(): Promise<TransitionInputs> {
  initDom();
  return new Promise((resolve, reject) => {
    const r = new rive.Rive({
      src: PAGE_TRANSITION_SRC,
      canvas: canvas!,
      artboard: 'page-transition',
      stateMachines: 'page-transition',
      autoplay: true,
      layout: new rive.Layout({ fit: rive.Fit.Cover, alignment: rive.Alignment.Center }),
      onLoad: () => {
        r.resizeDrawingSurfaceToCanvas();
        const smInputs = r.stateMachineInputs('page-transition');
        if (!smInputs) {
          console.error('No inputs found for page transition state machine');
          reject('No inputs found');
          return;
        }
        const initial = smInputs.find((i) => i.name === 'initial');
        const out = smInputs.find((i) => i.name === 'transition-out');
        const inn = smInputs.find((i) => i.name === 'transition-in');
        if (!initial || !out || !inn) {
          console.error('Required transition inputs not found:', smInputs.map((i) => i.name));
          reject('Required inputs not found');
          return;
        }
        inputs.initialInput = initial;
        inputs.transitionOutInput = out;
        inputs.transitionInInput = inn;
        initial.value = true;
        out.value = false;
        inn.value = false;
        canvas!.riveInstance = r;
        instances.push(r);
        wrap.style.backgroundColor = 'transparent';
        resolve(inputs as TransitionInputs);
      },
      onLoadError: (e) => {
        console.error('Failed to load Page Transition Rive file:', e);
        reject(e);
      },
    });
    window.addEventListener('resize', () => {
      if (canvas?.riveInstance) canvas.riveInstance.resizeDrawingSurfaceToCanvas();
    });
  });
}

/** EL 41724 — cover the page (leaving); called from lifecycle onLeave only */
export function transitionOut({ initialInput, transitionInInput, transitionOutInput } = inputs as TransitionInputs) {
  wrap.style.visibility = 'visible';
  wrap.style.pointerEvents = 'auto';
  initialInput.value = false;
  transitionInInput.value = false;
  transitionOutInput.value = true;
}

/** H$ 41732 — reveal the page (arriving) */
export function transitionIn({ initialInput, transitionInInput, transitionOutInput } = inputs as TransitionInputs) {
  initialInput.value = false;
  transitionOutInput.value = false;
  transitionInInput.value = true;
  setTimeout(() => {
    btn.style.opacity = '0';
  }, 100);
  setTimeout(() => {
    wrap.style.visibility = 'hidden';
    wrap.style.pointerEvents = 'none';
    btn.style.display = 'none';
  }, 500);
}
