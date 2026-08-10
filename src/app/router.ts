/**
 * taxi.js assembly — source: aL closure 46377-46467.
 * oL -> DefaultTransition; iL -> DefaultRenderer; y_ -> core instance.
 * Deviation 6.7: @unseenco/taxi@1.8.0 npm instead of the vendored copy
 * (version not pinned in the bundle; behavior verified by probes).
 */
import { Core, Renderer, Transition } from '@unseenco/taxi';
import { initialLoad, transitionEnter, transitionLeave, EVENTS, TRANSITION_MS } from './lifecycle';

class DefaultTransition extends Transition {
  onLeave({ from, done }: { from: Element | HTMLElement; trigger: string | false | HTMLElement; done: Function }) {
    window.dispatchEvent(new CustomEvent(EVENTS.PAGE_TRANSITION_START));
    document.body.classList.add('is-transitioning');
    transitionLeave((from as HTMLElement).dataset.page!);
    setTimeout(() => {
      done();
    }, TRANSITION_MS);
  }

  onEnter({ to, done }: { to: Element | HTMLElement; trigger: string | false | HTMLElement; done: Function }) {
    transitionEnter((to as HTMLElement).dataset.page!);
    document.body.classList.remove('is-transitioning');
    window.dispatchEvent(new CustomEvent(EVENTS.PAGE_TRANSITION_END));
    done();
  }
}

class DefaultRenderer extends Renderer {
  initialLoad() {
    initialLoad();
  }
  onLeave() {
    window.trackingStyles = undefined;
  }
}

let core: unknown = null;

export function initRouter() {
  if (core) return core;
  core = new Core({
    renderers: { default: DefaultRenderer },
    transitions: { default: DefaultTransition },
    removeOldContent: true,
    allowInterruption: false,
    bypassCache: false,
  });
  return core;
}

export const taxi = () => core;
