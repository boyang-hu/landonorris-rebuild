/**
 * Vimeo stream manager — source: z$ module 44409-44584 (U_ singleton, YZ destroyAll).
 * Note: init() has no caller in the source bundle (only destroyAll is invoked);
 * behavior preserved — the manager exists, videos stay on their placeholders.
 */

interface VimeoPlayerLike {
  play(): Promise<void>;
  pause(): void;
  destroy(): void;
  setVolume(v: number): void;
  setCurrentTime(t: number): void;
  getVideoWidth(): Promise<number>;
  getVideoHeight(): Promise<number>;
}
declare global {
  interface Window {
    Vimeo?: { Player: new (el: Element) => VimeoPlayerLike };
  }
}

interface ManagedPlayer {
  id: string;
  player: VimeoPlayerLike;
  element: HTMLElement;
  wrapper: Element | null;
  hoverControl: boolean;
  adjustVideoSizing: () => void;
  play: () => Promise<void>;
  pause: () => void;
  restart: () => void;
  setVolume: (v: number) => void;
  mute: () => void;
  unmute: () => void;
  destroy: () => void;
}

let players: ManagedPlayer[] = [];
let visibilityBound = false;

function onVisibilityChange() {
  if (document.hidden)
    players.forEach((p) => {
      if (p.hoverControl) p.pause();
    });
}

function loadApi(forceReload = false): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Vimeo && window.Vimeo.Player && !forceReload) {
      resolve();
      return;
    }
    if (forceReload) {
      const existing = document.querySelector('script[src*="player.vimeo.com/api/player.js"]');
      if (existing) existing.parentNode!.removeChild(existing);
    }
    const script = document.createElement('script');
    script.src = 'https://player.vimeo.com/api/player.js';
    script.async = true;
    script.onload = () => {
      if (window.Vimeo && window.Vimeo.Player) resolve();
      else
        setTimeout(() => {
          if (window.Vimeo && window.Vimeo.Player) resolve();
          else reject(new Error('Vimeo Player API failed to initialize'));
        }, 100);
    };
    script.onerror = () => reject(new Error('Failed to load Vimeo Player API script'));
    document.body.appendChild(script);
  });
}

function createPlayer(el: HTMLElement, index: number): ManagedPlayer | null {
  const videoId = el.getAttribute('data-stream-url');
  const source = el.getAttribute('data-stream-source') || 'vimeo';
  const muted = el.getAttribute('data-stream-muted') === 'true';
  const loop = el.getAttribute('data-stream-loop') === 'true';
  const autoplay = el.getAttribute('data-stream-autoplay') === 'true';
  const hover = el.getAttribute('data-stream-hover') === 'true';
  if (source !== 'vimeo' || !videoId) return null;
  let wrapper = el.querySelector<HTMLElement>('.iframe-wrapper');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.className = 'iframe-wrapper';
    el.appendChild(wrapper);
  }
  const iframe = document.createElement('iframe');
  iframe.allow = 'autoplay';
  iframe.frameBorder = '0';
  let src = `https://player.vimeo.com/video/${videoId}?`;
  src += autoplay && !hover ? 'autoplay=1&' : 'autoplay=0&';
  src += loop ? 'loop=1&' : '';
  src += muted ? 'muted=1&' : '';
  src += 'background=1&transparent=0&dnt=1';
  iframe.src = src;
  wrapper.appendChild(iframe);
  const id = 'vimeo-player-' + index;
  el.id = id;
  const player = new window.Vimeo!.Player(iframe);
  let aspect: number | undefined;
  player.getVideoWidth().then((w) => {
    player.getVideoHeight().then((h) => {
      aspect = h / w;
      cover();
    });
  });

  function cover() {
    if (!aspect) return;
    const wrap = el.closest<HTMLElement>('[data-video-stream-wrap]');
    if (!wrap) return;
    const wrapAspect = wrap.offsetHeight / wrap.offsetWidth;
    if (wrapAspect > aspect) {
      wrapper!.style.width = (wrapAspect / aspect) * 100 + '%';
      wrapper!.style.height = '100%';
    } else {
      wrapper!.style.width = '100%';
      wrapper!.style.height = (aspect / wrapAspect) * 100 + '%';
    }
  }
  const onResize = () => cover();
  window.addEventListener('resize', onResize);
  player.setVolume(0);
  if (hover) player.pause();
  else if (autoplay) player.play();

  let onEnter: (() => void) | undefined;
  let onLeave: (() => void) | undefined;
  if (hover) {
    const wrap = el.closest<HTMLElement>('[data-video-stream-wrap]');
    let playPromise: Promise<void> | null = null;
    if (wrap) {
      onEnter = () => {
        if (!playPromise)
          playPromise = player.play().catch((e: Error) => {
            if (e && e.name !== 'PlayInterrupted') console.error('Play error:', e);
          }) as Promise<void>;
        const ph = wrap.querySelector<HTMLElement>('[data-video-stream-placeholder]');
        if (ph) {
          ph.style.transition = 'opacity 0.3s ease';
          ph.style.opacity = '0';
        }
        const ind = wrap.querySelector('.hover-indicator');
        if (ind) ind.textContent = 'Playing...';
      };
      onLeave = () => {
        if (playPromise)
          playPromise
            .then(() => {
              player.pause();
              playPromise = null;
            })
            .catch(() => {
              playPromise = null;
            });
        else player.pause();
        const ph = wrap.querySelector<HTMLElement>('[data-video-stream-placeholder]');
        if (ph) {
          ph.style.transition = 'opacity 0.3s ease';
          ph.style.opacity = '1';
        }
        const ind = wrap.querySelector('.hover-indicator');
        if (ind) ind.textContent = 'Hover to play';
      };
      wrap.addEventListener('mouseenter', onEnter);
      wrap.addEventListener('mouseleave', onLeave);
    }
  }
  return {
    id,
    player,
    element: el,
    wrapper: el.closest('[data-video-stream-wrap]'),
    hoverControl: hover,
    adjustVideoSizing: cover,
    play: () => player.play(),
    pause: () => player.pause(),
    restart: () => {
      player.setCurrentTime(0);
      player.play();
    },
    setVolume: (v: number) => player.setVolume(v),
    mute: () => player.setVolume(0),
    unmute: () => player.setVolume(1),
    destroy: () => {
      window.removeEventListener('resize', onResize);
      if (hover) {
        const wrap = el.closest('[data-video-stream-wrap]');
        if (wrap) {
          if (onEnter) wrap.removeEventListener('mouseenter', onEnter);
          if (onLeave) wrap.removeEventListener('mouseleave', onLeave);
        }
      }
      player.destroy();
      if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
      el.removeAttribute('id');
    },
  };
}

export const vimeoManager = {
  init(options: { selector?: string; forceReload?: boolean; onReady?: ((p: ManagedPlayer[]) => void) | null } = {}) {
    const opts = { selector: '[data-video-stream]', forceReload: false, onReady: null, ...options };
    return new Promise((resolve, reject) => {
      loadApi(opts.forceReload)
        .then(() => {
          const els = document.querySelectorAll<HTMLElement>(opts.selector);
          if (els.length === 0) {
            console.warn('No video elements found with selector:', opts.selector);
            resolve({ players: [] });
            return;
          }
          els.forEach((el, i) => {
            try {
              const p = createPlayer(el, i);
              if (p) players.push(p);
            } catch (e) {
              console.error('Error initializing video player:', e);
            }
          });
          if (!visibilityBound) {
            document.addEventListener('visibilitychange', onVisibilityChange);
            visibilityBound = true;
          }
          if (typeof opts.onReady === 'function') (opts.onReady as (p: ManagedPlayer[]) => void)(players);
          resolve({ players });
        })
        .catch((e) => {
          console.error('Failed to load Vimeo API:', e);
          reject(e);
        });
    });
  },
  destroyAll() {
    players.forEach((p) => p.destroy());
    players = [];
    if (visibilityBound) {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      visibilityBound = false;
    }
    return { success: true };
  },
  getPlayers: () => players,
};

/** YZ 44406 */
export function destroyAllVideos() {
  vimeoManager.destroyAll();
}
