/**
 * Off-track page — source: fL module 45830-46000.
 * z_ -> initHeroflipImages (MotionPathPlugin variant); x$/xL.
 */
import { gsap as m, ScrollTrigger as TA } from '../gsap';
import { initHorizontalSections, killHorizontalSections, initSocialCallout, initCampCollection } from '../components/layout';
import { initOvalScroll, initAnimHigh, initTextHover } from '../components/text';
import { destroyAllVideos } from '../components/vimeo';

let heroflipCleanup: (() => void) | null = null; // DZ

/** z_ 45830 — image-layer heroflip on a motion path */
export function initHeroflipImages(debug = false): { cleanup: () => void; toggleDebug: () => boolean } | undefined {
  const track = document.querySelector<HTMLElement>('[data-heroflip="track"]');
  const pos1 = document.querySelector<HTMLElement>('[data-heroflip="pos1"]');
  const pos2 = document.querySelector<HTMLElement>('[data-heroflip="pos2"]');
  const pos3 = document.querySelector<HTMLElement>('[data-heroflip="pos3"]');
  const img = document.querySelector<HTMLElement>('[data-heroflip="img"]');
  const mediaSource = document.querySelector<HTMLElement>('.is-off-t-hero-scroll-media');
  let sources: string[] = [];
  let lastProgress = 0;
  if (mediaSource) {
    const imgs = mediaSource.querySelectorAll<HTMLImageElement>('.off-t-hero-scroll-meda-img');
    sources = Array.from(imgs).map((i) => i.src);
    mediaSource.style.display = 'none';
    if (sources.length > 0 && img) {
      img.innerHTML = '';
      sources.forEach((src, i) => {
        const layer = document.createElement('div');
        layer.classList.add('hero-img-layer');
        layer.setAttribute('data-index', String(i));
        layer.style.position = 'absolute';
        layer.style.top = '0';
        layer.style.left = '0';
        layer.style.width = '100%';
        layer.style.height = '100%';
        layer.style.backgroundImage = `url(${src})`;
        layer.style.backgroundSize = 'cover';
        layer.style.backgroundPosition = 'center';
        layer.style.zIndex = String(sources.length - i);
        layer.style.opacity = i === 0 ? '1' : '0';
        img.appendChild(layer);
      });
    }
  }
  if (!track || !pos1 || !pos2 || !pos3 || !img) {
    console.error('Missing required elements for hero scroll animation');
    return;
  }
  img.style.backgroundImage = 'none';
  const savedStyle = {
    position: img.style.position,
    top: img.style.top,
    left: img.style.left,
    width: img.style.width,
    height: img.style.height,
    transform: img.style.transform,
    zIndex: img.style.zIndex,
    backgroundImage: img.style.backgroundImage,
    backgroundSize: img.style.backgroundSize,
    backgroundPosition: img.style.backgroundPosition,
  };
  if (getComputedStyle(track).position === 'static') track.style.position = 'relative';
  if (img.parentNode !== track) {
    img.parentNode!.removeChild(img);
    track.appendChild(img);
  }
  img.style.position = 'absolute';
  img.style.objectFit = 'cover';
  img.style.zIndex = '10';
  m.set(img, { transformOrigin: '50% 50%', xPercent: -50, yPercent: -50 });
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

  let tl: gsap.core.Timeline | undefined;

  function build() {
    if (tl) tl.kill();
    const P = positions();
    m.set(img, { x: P[0].x, y: P[0].y, width: P[0].width, height: P[0].height });
    const cp1 = { x: P[0].x, y: P[0].y + (P[1].y - P[0].y) * 0.8 };
    const cp2 = { x: P[1].x, y: P[1].y - Math.min(800, (P[1].y - P[0].y) * 0.3) };
    const cp3 = { x: P[1].x, y: P[1].y + Math.min(80, (P[2].y - P[1].y) * 0.3) };
    const cp4 = { x: P[1].x + (P[2].x - P[1].x) * 0.6, y: P[2].y - (P[2].y - P[1].y) * 0.2 };
    const d = `M${P[0].x},${P[0].y} C${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${P[1].x},${P[1].y} C${cp3.x},${cp3.y} ${cp4.x},${cp4.y} ${P[2].x},${P[2].y}`;
    path.setAttribute('d', d);
    tl = m.timeline({
      scrollTrigger: {
        trigger: track!,
        start: window.innerWidth <= 991 ? '20% top' : 'top top',
        end: window.innerWidth <= 991 ? 'bottom 80%' : 'bottom center',
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
    tl.to(img, {
      duration: 1.5,
      motionPath: { path: d, autoRotate: false },
      ease: 'none',
      onUpdate: function (this: gsap.core.Tween) {
        const p = this.progress();
        lastProgress = p;
        void lastProgress;
        if (sources.length > 0) {
          const idx = Math.min(Math.floor(p * sources.length), sources.length - 1);
          img!.querySelectorAll<HTMLElement>('.hero-img-layer').forEach((layer) => {
            const i = parseInt(layer.getAttribute('data-index')!);
            layer.style.opacity = i === idx ? '1' : '0';
          });
        }
        if (p <= 0.5) {
          const t = p * 2;
          img!.style.width = `${P[0].width + (P[1].width - P[0].width) * t}px`;
          img!.style.height = `${P[0].height + (P[1].height - P[0].height) * t}px`;
        } else {
          const t = (p - 0.5) * 2;
          img!.style.width = `${P[1].width + (P[2].width - P[1].width) * t}px`;
          img!.style.height = `${P[1].height + (P[2].height - P[1].height) * t}px`;
        }
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
    if (tl && tl.scrollTrigger) tl.scrollTrigger.kill();
    window.removeEventListener('resize', onResize);
    if (svg.parentNode) svg.parentNode.removeChild(svg);
    img!.querySelectorAll('.hero-img-layer').forEach((l) => l.remove());
    (Object.keys(savedStyle) as (keyof typeof savedStyle)[]).forEach((k) => {
      img!.style[k as never] = savedStyle[k];
    });
    if (mediaSource) mediaSource.style.display = '';
  }
  return { cleanup, toggleDebug };
}

/** x$ 45982 */
export function initOffTrackPage() {
  initHorizontalSections();
  initCampCollection();
  setTimeout(() => {
    const inst = initHeroflipImages();
    if (inst && inst.cleanup) heroflipCleanup = inst.cleanup;
  }, 0);
  initSocialCallout();
  if (window.innerWidth >= 992) {
    initOvalScroll();
    initAnimHigh();
    initTextHover();
  }
}

/** xL 45989 */
export function cleanupOffTrackPage() {
  killHorizontalSections();
  if (heroflipCleanup) {
    heroflipCleanup();
    heroflipCleanup = null;
  }
  destroyAllVideos();
}
void TA;
