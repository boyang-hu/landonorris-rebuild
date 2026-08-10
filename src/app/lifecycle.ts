/**
 * Page lifecycle — source: sL module 46166-46375.
 * mL -> initialLoad; cL -> transitionEnter; lL -> transitionLeave;
 * oB -> PAGES; v$ -> TRANSITION_MS; g$ -> EVENTS.
 */
import { detectBrowser, watchBreakpointReload, resetWebflow, refreshCurrentLinks } from './utils';
import { transitionIn, transitionOut } from './transition';
import { glInit, glAdd, glDestroyWorld } from './gl';
import { SplitTextManager, initOvalScroll, initAnimHigh, initTextHover, playHeroTextTimelines } from './components/text';
import { initMarquees, destroyMarquees } from './components/layout';
import { createScrollIndicator, type ScrollIndicator } from './components/scrollIndicator';
import { initNavScale, initNavTheme, initNavMenu } from './components/nav';
import {
  initRiveComponents,
  initLn4Logo,
  initNavHamburger,
  fireHeroRiveAnimations,
  createMobileLandscape,
} from './rive/components';
import { initHomePage, cleanupHomePage } from './pages/home';
import { initOnTrackPage, cleanupOnTrackPage } from './pages/onTrack';
import { initOffTrackPage, cleanupOffTrackPage } from './pages/offTrack';
import {
  initPartnershipsPage,
  cleanupPartnershipsPage,
  initPartnershipsItemPage,
  cleanupPartnershipsItemPage,
  initCalendarPage,
  initNotFoundPage,
  cleanupNotFoundPage,
} from './pages/misc';

/** oB 46357 */
export const PAGES = {
  HOME: 'home',
  ON_TRACK: 'on-track',
  OFF_TRACK: 'off-track',
  PARTNERSHIPS: 'partnerships',
  PARTNERSHIPS_ITEM: 'partnerships-item',
  CALENDAR: 'calendar',
  BLOG: 'blog',
  STYLE: 'style',
  NOT_FOUND: 'not-found',
} as const;

/** g$ 46367 */
export const EVENTS = {
  PAGE_TRANSITION_START: 'page-transition-start',
  PAGE_TRANSITION_END: 'page-transition-end',
} as const;

/** v$ 46337 */
export const TRANSITION_MS = 1000;

let scrollIndicator: ScrollIndicator | null = null; // YK
let splitManager: SplitTextManager | null = null; // RZ

function dispatchPageInit(page: string, heroDelay: number) {
  switch (page) {
    case PAGES.HOME:
      initHomePage();
      setTimeout(() => {
        playHeroTextTimelines();
        fireHeroRiveAnimations();
      }, heroDelay);
      break;
    case PAGES.ON_TRACK:
      initOnTrackPage();
      setTimeout(() => {
        playHeroTextTimelines();
        fireHeroRiveAnimations();
      }, heroDelay);
      break;
    case PAGES.OFF_TRACK:
      initOffTrackPage();
      setTimeout(() => {
        playHeroTextTimelines();
        fireHeroRiveAnimations();
      }, heroDelay);
      break;
    case PAGES.PARTNERSHIPS:
      initPartnershipsPage();
      console.log('Partnerships page IN');
      setTimeout(() => {
        playHeroTextTimelines();
        fireHeroRiveAnimations();
      }, heroDelay);
      break;
    case PAGES.PARTNERSHIPS_ITEM:
      initPartnershipsItemPage();
      setTimeout(() => {
        playHeroTextTimelines();
        fireHeroRiveAnimations();
      }, heroDelay);
      break;
    case PAGES.CALENDAR:
      initCalendarPage();
      setTimeout(() => {
        playHeroTextTimelines();
        fireHeroRiveAnimations();
      }, heroDelay);
      break;
    case PAGES.NOT_FOUND:
      initNotFoundPage();
      break;
    case PAGES.STYLE:
      break;
    default:
      console.warn(`No specific initialization for page: ${page}, initializing defaults`);
      initOvalScroll();
      initAnimHigh();
      initTextHover();
  }
}

/** mL 46166 — first load */
export function initialLoad() {
  const pageEl = document.querySelector<HTMLElement>('[data-page]');
  if (!pageEl) throw new Error('No data-page element found');
  const page = pageEl.dataset.page!;

  const attempt = () => {
    if (document.readyState === 'complete') {
      console.debug('Starting basic initialization...');
      detectBrowser();
      watchBreakpointReload();
      if (window.innerWidth <= 991) createMobileLandscape();
      if (!scrollIndicator) scrollIndicator = createScrollIndicator();
      if (splitManager) splitManager.split();
      else splitManager = new SplitTextManager();
      initNavScale();
      initLn4Logo();
      initRiveComponents();
      initNavHamburger();
      setTimeout(() => {
        initNavMenu();
        initNavTheme();
      }, 500);
      glInit();
      console.debug(`Initializing page: ${page}`);
      try {
        dispatchPageInit(page, 750);
      } catch (e) {
        console.error(`Error loading module for page ${page}:`, e);
        initOvalScroll();
        initAnimHigh();
        initTextHover();
        initRiveComponents();
      }
      initMarquees();
      setTimeout(() => {
        transitionIn();
      }, 1000);
    } else requestAnimationFrame(attempt);
  };
  attempt();
}

/** cL 46237 — taxi enter */
export function transitionEnter(page: string) {
  setTimeout(() => {
    transitionIn();
  }, 500);
  if (!page) {
    console.error('No page name provided for transition in');
    return;
  }
  try {
    window.scrollTo(0, 0);
    (() => {
      console.debug('Performing common initialization...');
      refreshCurrentLinks();
      if (!scrollIndicator) scrollIndicator = createScrollIndicator();
      else scrollIndicator.reinit();
      splitManager = new SplitTextManager();
      initNavTheme();
      initNavScale();
      initRiveComponents();
      initMarquees();
      resetWebflow();
    })();
    try {
      switch (page) {
        case PAGES.HOME:
          initHomePage();
          setTimeout(() => {
            playHeroTextTimelines();
            fireHeroRiveAnimations();
          }, 50);
          glAdd();
          break;
        case PAGES.ON_TRACK:
          initOnTrackPage();
          setTimeout(() => {
            playHeroTextTimelines();
            fireHeroRiveAnimations();
          }, 50);
          glAdd();
          break;
        case PAGES.OFF_TRACK:
          initOffTrackPage();
          setTimeout(() => {
            playHeroTextTimelines();
            fireHeroRiveAnimations();
          }, 50);
          break;
        case PAGES.PARTNERSHIPS:
          initPartnershipsPage();
          setTimeout(() => {
            playHeroTextTimelines();
            fireHeroRiveAnimations();
          }, 50);
          break;
        case PAGES.PARTNERSHIPS_ITEM:
          initPartnershipsItemPage();
          setTimeout(() => {
            playHeroTextTimelines();
            fireHeroRiveAnimations();
          }, 50);
          break;
        case PAGES.CALENDAR:
          initCalendarPage();
          setTimeout(() => {
            playHeroTextTimelines();
            fireHeroRiveAnimations();
          }, 50);
          glAdd();
          break;
        case PAGES.NOT_FOUND:
          initNotFoundPage();
          glAdd();
          break;
        default:
          console.warn(`No specific initialization for page: ${page}, initializing defaults`);
          initOvalScroll();
          initAnimHigh();
          initTextHover();
          initRiveComponents();
      }
    } catch (e) {
      console.error(`Error in transition to ${page}:`, e);
    }
  } catch (e) {
    console.error('Transition in error:', e);
  }
}

/** lL 46297 — taxi leave */
export function transitionLeave(page: string) {
  if (!page) {
    console.error('No page name provided for transition out');
    return;
  }
  try {
    console.debug(`Transitioning out of ${page}`);
    window.closeNavigation!();
    if (scrollIndicator) scrollIndicator.cleanup();
    destroyMarquees();
    transitionOut();
    setTimeout(() => {
      glDestroyWorld();
      try {
        switch (page) {
          case PAGES.HOME:
            cleanupHomePage();
            break;
          case PAGES.ON_TRACK:
            cleanupOnTrackPage();
            break;
          case PAGES.OFF_TRACK:
            cleanupOffTrackPage();
            break;
          case PAGES.PARTNERSHIPS:
            cleanupPartnershipsPage();
            break;
          case PAGES.PARTNERSHIPS_ITEM:
            cleanupPartnershipsItemPage();
            break;
          case PAGES.NOT_FOUND:
            cleanupNotFoundPage();
            break;
          default:
            console.warn(`No specific cleanup for page: ${page}, initializing defaults`);
        }
      } catch (e) {
        console.error(`Error in transition out from ${page}:`, e);
      }
    }, TRANSITION_MS);
  } catch (e) {
    console.error('Transition out error:', e);
  }
}
