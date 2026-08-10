/** App-level utilities — source: pretty 34-89 (BD/ED/ID/CD/KD), verbatim ports. */

/** BD 34 — UA classes consumed by the css-safari style block */
export function detectBrowser() {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isIphone = /iPhone/i.test(navigator.userAgent);
  if (isSafari) document.documentElement.classList.add('is-safari');
  if (isIphone) document.documentElement.classList.add('is-iphone');
}

/** ED 41 — re-arm the Webflow runtime after a taxi swap (webflow.js must be present) */
export function resetWebflow() {
  const wf = (window as never as { Webflow: { destroy(): void; ready(): void } }).Webflow;
  wf.destroy();
  wf.ready();
}

/** ID 46 — recompute w--current on all links */
export function refreshCurrentLinks() {
  const path = window.location.pathname;
  const links = document.querySelectorAll('a');
  links.forEach((a) => a.classList.remove('w--current'));
  links.forEach((a) => {
    if (a.getAttribute('href') === path) a.classList.add('w--current');
  });
}

/** CD 56 — console banner */
export function printBanner() {
  console.log(
    `%c
   ██╗      █████╗ ███╗   ██╗██████╗  ██████╗
   ██║     ██╔══██╗████╗  ██║██╔══██╗██╔═══██╗
   ██║     ███████║██╔██╗ ██║██║  ██║██║   ██║
   ██║     ██╔══██║██║╚██╗██║██║  ██║██║   ██║
   ███████╗██║  ██║██║ ╚████║██████╔╝╚██████╔╝
   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝  ╚═════╝
  %c
   ███╗   ██╗ ██████╗ ██████╗ ██████╗ ██╗███████╗
   ████╗  ██║██╔═══██╗██╔══██╗██╔══██╗██║██╔════╝
   ██╔██╗ ██║██║   ██║██████╔╝██████╔╝██║███████╗
   ██║╚██╗██║██║   ██║██╔══██╗██╔══██╗██║╚════██║
   ██║ ╚████║╚██████╔╝██║  ██║██║  ██║██║███████║
   ╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝

   %c%c`,
    'color: #d2ff00; font: 400 1em monospace;',
    '',
    'background-color: #d2ff00; color: black; font: 400 1em monospace; padding: 0.5em 0; font-weight: bold;',
    ''
  );
}

/** KD 75 — full page reload when crossing the 992px breakpoint (150ms debounce) */
export function watchBreakpointReload() {
  let isDesktop = window.innerWidth >= 992;
  let first = true;

  function check() {
    const was = isDesktop;
    isDesktop = window.innerWidth >= 992;
    if (!first && was !== isDesktop) window.location.reload();
    if (first) first = false;
  }
  check();
  let timer: ReturnType<typeof setTimeout>;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(check, 150);
  });
}
