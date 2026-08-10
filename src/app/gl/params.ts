/**
 * window.landoGL config — source: EZ closure 41535-41685, verbatim values.
 * Asset URLs point at the local mirror of lando.itsoffbrand.io/gl (deviation 6.2).
 */

/** vQ 41533 (via local /ext mapping) */
export const GL_BASE = '/ext/lando.itsoffbrand.io/gl';
/** iQ 41538 — desktop webp, <=991px ktx2 */
export const texFormat = window.innerWidth > 991 ? 'webp' : 'ktx2';

export interface LandoGL {
  reveal: number;
  lenis: { velocity: number; instance: unknown | null };
  bounds: { helmetScroll: { width: number; height: number; left: number; top: number } };
  params: {
    headScene: Record<string, string | number | boolean>;
    backgroundScene: Record<string, string | number | boolean>;
    carouselScene: Record<string, string>;
    tracksScene: { CURRENT: string; TRANSITION_DURATION: number; AUTOROTATE_SPEED: number };
    helmetScrollScene: { VARIANT: string; PROGRESS: number; REVEAL_OUT_PROGRESS: number };
    notFoundScene: { VARIANT: string; HELMET_AUTOROTATE_SPEED: number; HELMET_ANGLE: number };
  };
  assets: ReturnType<typeof buildAssets>;
  updateColors?: () => void;
}

declare global {
  interface Window {
    landoGL?: LandoGL;
  }
}

function buildAssets() {
  const iQ = texFormat;
  const vQ = GL_BASE;
  return {
    draco: vQ + '/draco/',
    ktx2: vQ + '/basis/',
    fonts: {
      brier: { atlas: vQ + '/fonts/Brier-Bold-02.webp', json: vQ + '/fonts/Brier-Bold-msdf.json' },
      mona: { atlas: vQ + '/fonts/MonaSans-Bold-02.webp', json: vQ + '/fonts/MonaSans-Bold-msdf.json' },
    },
    hdri: {
      light: vQ + '/hdri/studio_small_08_1k--light.hdr',
      faded: vQ + '/hdri/studio_small_08_1k--faded.hdr',
      dark: vQ + '/hdri/studio_small_08_1k--dark.hdr',
    },
    models: {
      helmet: vQ + '/models/helmet-21.glb',
      disco: vQ + '/models/disco-02.glb',
      tracks: vQ + '/models/tracks/tracks-05.glb',
      sotd: vQ + '/models/sotd.glb', // declared but never loaded (source quirk)
    },
    textures: {
      head: {
        diffuse: vQ + `/textures/head/${iQ}/diffuse.${iQ}`,
        depth: vQ + `/textures/head/${iQ}/depth.${iQ}`,
        alpha: vQ + `/textures/head/${iQ}/alpha.${iQ}`,
        normal: vQ + '/textures/head/webp/normal.webp',
        roughness: vQ + `/textures/head/${iQ}/roughness.${iQ}`,
        shadow: {
          default: vQ + `/textures/head/${iQ}/shadow.${iQ}`,
          softerEdit: vQ + `/textures/head/${iQ}/shadow-softer-edit.${iQ}`,
          toZipEdit: vQ + `/textures/head/${iQ}/shadow-to-zip-edit.${iQ}`,
        },
      },
      helmet: {
        diffuseLime: vQ + `/textures/helmet/${iQ}/gold/Norris_Helmet_mat_BaseColor.${iQ}`,
        diffuseDark: vQ + `/textures/helmet/${iQ}/gold/Norris_Helmet_mat_BaseColor.${iQ}`,
        diffuseGrid: vQ + `/textures/helmet/${iQ}/gold/Norris_Helmet_mat_BaseColor.${iQ}`,
        diffuseDisco: vQ + `/textures/helmet/${iQ}/disco/Norris_Helmet_mat_BaseColor.${iQ}`,
        diffuseGoogle: vQ + `/textures/helmet/${iQ}/gold/Norris_Helmet_mat_BaseColor.${iQ}`,
        normal: vQ + '/textures/helmet/webp/Norris_Helmet_mat_Normal.webp',
        roughness: vQ + `/textures/helmet/${iQ}/Norris_Helmet_mat_Roughness.${iQ}`,
        metallic: vQ + `/textures/helmet/${iQ}/Norris_Helmet_mat_Metallic.${iQ}`,
      },
      glass: {
        base: vQ + `/textures/glass/${iQ}/Norris_Glass_mat_BaseColor.${iQ}`,
        normal: vQ + '/textures/glass/webp/Norris_Glass_mat_Normal.webp',
        roughness: vQ + `/textures/glass/${iQ}/Norris_Glass_mat_Roughness.${iQ}`,
        metallic: vQ + `/textures/glass/${iQ}/Norris_Glass_mat_Metallic.${iQ}`,
      },
      plastic: { matcap: vQ + '/textures/plastic/plastic__matcap-02.webp' },
      disco: {
        matcap: vQ + '/textures/helmet/webp/disco/disco_matcap-01.webp',
        mask: vQ + `/textures/helmet/${iQ}/disco/disco_mask-01.${iQ}`,
        lensFlare: vQ + '/textures/helmet/webp/disco/disco_lens-flare-15.webp',
      },
      noise: { texture: vQ + '/textures/noise/noise-03.webp' },
      matcaps: { track: vQ + '/textures/tracks/lando__matcap-02.webp' },
      notFound: { diffuse: vQ + '/textures/not-found/webp/not-found-alpha-6.webp' },
    },
  };
}

/** EZ 41539-41680 verbatim */
export function initLandoGL(): LandoGL {
  window.landoGL = {
    reveal: 1,
    lenis: { velocity: 0, instance: null },
    bounds: { helmetScroll: { width: 0, height: 0, left: 0, top: 0 } },
    params: {
      headScene: {
        REVEAL_DURATION: 1.1,
        COLOR_OUTLINE: '#CBCBB9',
        COLOR_FOREGROUND: '#D2FF00',
        COLOR_BACKGROUND: '#F8F8F3',
        COLOR_CURSOR_FOREGROUND: '#CFD2C5',
        COLOR_CURSOR_BACKGROUND: '#E8E8DF',
        COLOR_CURSOR_OUTLINE: '#E8E8DF',
        COLOR_FILTER: '#50593F',
        SCALE: 1,
        SPEED: 0.1,
        THICKNESS: 0.000005,
        OUTLINE: true,
        SHOW_HELMET_PERMANENTLY: false,
        DISTORT_SCALE: 1,
        DISTORT_INTENSITY: 0.5,
        NOISE_DETAIL: 3,
        CURSOR_INTENSITY: 0.15,
        CURSOR_SCALE: 3,
        CURSOR_BOUNCE: -0.75,
        REVEAL_SIZE: 25,
        IS_WIREFRAME_ANIMATING: true,
        VARIANT: 'Lime',
      },
      backgroundScene: {
        THICKNESS: 0.000005,
        OUTLINE: true,
        COLOR_BACKGROUND: '#282C20',
        COLOR_FOREGROUND: '#363B25',
        COLOR_CURSOR_BACKGROUND: '#b2c73a',
        COLOR_CURSOR_FOREGROUND: '#b2c73a',
      },
      carouselScene: {
        TEXT_TOP: 'WE DID IT AT HOME WE DID IT AT HOME',
        TEXT_BOTTOM: 'A BRITISH GP WEEKEND I WILL REMEMBER FOREVER',
        COLOR_TOP: '#b2c73a',
        COLOR_BOTTOM: '#dde1d2',
      },
      tracksScene: { CURRENT: 'austin', TRANSITION_DURATION: 2, AUTOROTATE_SPEED: 0.2 },
      helmetScrollScene: { VARIANT: 'Lime', PROGRESS: 0, REVEAL_OUT_PROGRESS: 0 },
      notFoundScene: { VARIANT: 'Lime', HELMET_AUTOROTATE_SPEED: 1, HELMET_ANGLE: -21 },
    },
    assets: buildAssets(),
  };
  return window.landoGL;
}
