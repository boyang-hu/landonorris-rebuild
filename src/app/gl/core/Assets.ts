/** BZ 41231-41437 — asset manager (verbatim port incl. debug-only loads & quirks). */
import {
  TextureLoader,
  NearestFilter,
  RepeatWrapping,
  SRGBColorSpace,
  EquirectangularReflectionMapping,
  type Texture,
  type WebGLRenderer,
  type DataTexture,
} from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { FontLoader, type Font } from 'three/examples/jsm/loaders/FontLoader.js';

type Tex = Texture | null;

export class Assets {
  dracoLoader = new DRACOLoader();
  gltfLoader = new GLTFLoader();
  rgbeLoader = new RGBELoader();
  textureLoader = new TextureLoader();
  ktx2TextureLoader = new KTX2Loader();
  fontLoader = new FontLoader();
  isDebug: boolean;

  models: { head: GLTF | null; helmet: GLTF | null; tracks: GLTF | null; disco: GLTF | null } = {
    head: null,
    helmet: null,
    tracks: null,
    disco: null,
  };
  fonts = {
    brier: { atlas: null as Tex, json: null as Font | null },
    mona: { atlas: null as Tex, json: null as Font | null },
  };
  textures = {
    head: {
      diffuse: null as Tex,
      shadow: { default: null as Tex, softerEdit: null as Tex, toZipEdit: null as Tex },
      depth: null as Tex,
      alpha: null as Tex,
      normal: null as Tex,
      roughness: null as Tex,
    },
    helmet: {
      diffuseLime: null as Tex,
      diffuseDark: null as Tex,
      diffuseGrid: null as Tex,
      diffuseDisco: null as Tex,
      diffuseGoogle: null as Tex,
      roughness: null as Tex,
      metallic: null as Tex,
      normal: null as Tex,
    },
    glass: { base: null as Tex, normal: null as Tex, roughness: null as Tex, metallic: null as Tex },
    plastic: { matcap: null as Tex },
    disco: { matcap: null as Tex, mask: null as Tex, lensFlare: null as Tex },
    noise: { texture: null as Tex },
    matcaps: { track: null as Tex },
    notFound: { diffuse: null as Tex },
  };
  hdri: { dark: DataTexture | null; light: DataTexture | null; faded: DataTexture | null } = {
    dark: null,
    light: null,
    faded: null,
  };
  activeTextureLoader: (url: string, cb: (t: Texture) => void) => Promise<void>;
  promises: Promise<void>[] = [];

  constructor(renderer: WebGLRenderer, isDebug: boolean) {
    this.isDebug = isDebug;
    const assets = window.landoGL!.assets;
    this.dracoLoader.setDecoderPath(assets.draco);
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
    this.ktx2TextureLoader.setTranscoderPath(assets.ktx2);
    this.ktx2TextureLoader.detectSupport(renderer);
    this.activeTextureLoader =
      window.innerWidth > 991 ? this.customTextureLoader.bind(this) : this.customKtx2TextureLoader.bind(this);
  }

  customTextureLoader(url: string, cb: (t: Texture) => void): Promise<void> {
    return new Promise((resolve) => {
      this.textureLoader.load(
        url,
        (t) => {
          resolve();
          cb(t);
        },
        undefined,
        (e) => console.error(e)
      );
    });
  }

  customKtx2TextureLoader(url: string, cb: (t: Texture) => void): Promise<void> {
    return new Promise((resolve) => {
      this.ktx2TextureLoader.load(
        url,
        (t) => {
          resolve();
          cb(t);
        },
        undefined,
        (e) => console.error(e)
      );
    });
  }

  customModelLoader(url: string, cb: (g: GLTF) => void): Promise<void> {
    return new Promise((resolve) => {
      this.gltfLoader.load(
        url,
        (g) => {
          resolve();
          cb(g);
        },
        undefined,
        (e) => console.error(e)
      );
    });
  }

  customHdriLoader(url: string, cb: (t: DataTexture) => void): Promise<void> {
    return new Promise((resolve) => {
      this.rgbeLoader.load(
        url,
        (t) => {
          resolve();
          cb(t);
        },
        undefined,
        (e) => console.error(e)
      );
    });
  }

  customFontLoader(url: string, cb: (f: Font) => void): Promise<void> {
    return new Promise((resolve) => {
      this.fontLoader.load(
        url,
        (f) => {
          resolve();
          cb(f);
        },
        undefined,
        (e) => console.error(e)
      );
    });
  }

  setTexturesParams() {
    const t = this.textures;
    t.head.diffuse!.minFilter = NearestFilter;
    t.head.diffuse!.magFilter = NearestFilter;
    t.head.shadow.softerEdit!.minFilter = NearestFilter;
    t.head.shadow.softerEdit!.magFilter = NearestFilter;
    if (this.isDebug) {
      t.head.shadow.default!.minFilter = NearestFilter;
      t.head.shadow.default!.magFilter = NearestFilter;
      t.head.shadow.toZipEdit!.minFilter = NearestFilter;
      t.head.shadow.toZipEdit!.magFilter = NearestFilter;
    }
    t.head.depth!.colorSpace = SRGBColorSpace;
    t.head.diffuse!.colorSpace = SRGBColorSpace;
    t.head.shadow.softerEdit!.colorSpace = SRGBColorSpace;
    if (this.isDebug) {
      t.head.shadow.default!.colorSpace = SRGBColorSpace;
      t.head.shadow.toZipEdit!.colorSpace = SRGBColorSpace;
    }
    t.helmet.diffuseLime!.colorSpace = SRGBColorSpace;
    t.helmet.diffuseDark!.colorSpace = SRGBColorSpace;
    t.helmet.diffuseGrid!.colorSpace = SRGBColorSpace;
    t.helmet.diffuseDisco!.colorSpace = SRGBColorSpace;
    t.helmet.diffuseGoogle!.colorSpace = SRGBColorSpace;
    t.glass.base!.colorSpace = SRGBColorSpace;
    t.matcaps.track!.colorSpace = SRGBColorSpace;
    for (const cat in t) {
      if (cat !== 'head') {
        const group = t[cat as keyof typeof t] as Record<string, Texture>;
        for (const key in group) {
          group[key].flipY = false;
          group[key].minFilter = NearestFilter;
          group[key].magFilter = NearestFilter;
          group[key].wrapS = RepeatWrapping;
          group[key].wrapT = RepeatWrapping;
        }
      }
    }
    t.notFound.diffuse!.flipY = true;
  }

  load(): Promise<void> {
    this.promises = [];
    const a = window.landoGL!.assets;
    return new Promise((resolve) => {
      void (async () => {
        const P = this.promises;
        const tl = this.activeTextureLoader;
        P.push(tl(a.textures.head.diffuse, (t) => (this.textures.head.diffuse = t)));
        P.push(tl(a.textures.head.depth, (t) => (this.textures.head.depth = t)));
        P.push(tl(a.textures.head.alpha, (t) => (this.textures.head.alpha = t)));
        P.push(this.customTextureLoader(a.textures.head.normal, (t) => (this.textures.head.normal = t)));
        P.push(tl(a.textures.head.shadow.default, (t) => (this.textures.head.shadow.default = t)));
        if (this.isDebug)
          P.push(tl(a.textures.head.shadow.default, (t) => (this.textures.head.shadow.default = t)));
        P.push(tl(a.textures.head.shadow.softerEdit, (t) => (this.textures.head.shadow.softerEdit = t)));
        if (this.isDebug)
          P.push(tl(a.textures.head.shadow.toZipEdit, (t) => (this.textures.head.shadow.toZipEdit = t)));
        P.push(tl(a.textures.helmet.diffuseLime, (t) => (this.textures.helmet.diffuseLime = t)));
        P.push(tl(a.textures.helmet.diffuseDark, (t) => (this.textures.helmet.diffuseDark = t)));
        P.push(tl(a.textures.helmet.diffuseGrid, (t) => (this.textures.helmet.diffuseGrid = t)));
        P.push(tl(a.textures.helmet.diffuseDisco, (t) => (this.textures.helmet.diffuseDisco = t)));
        P.push(tl(a.textures.helmet.diffuseGoogle, (t) => (this.textures.helmet.diffuseGoogle = t)));
        P.push(this.customTextureLoader(a.textures.helmet.normal, (t) => (this.textures.helmet.normal = t)));
        P.push(tl(a.textures.helmet.roughness, (t) => (this.textures.helmet.roughness = t)));
        P.push(tl(a.textures.helmet.metallic, (t) => (this.textures.helmet.metallic = t)));
        P.push(this.customTextureLoader(a.textures.disco.matcap, (t) => (this.textures.disco.matcap = t)));
        P.push(tl(a.textures.disco.mask, (t) => (this.textures.disco.mask = t)));
        P.push(this.customTextureLoader(a.textures.disco.lensFlare, (t) => (this.textures.disco.lensFlare = t)));
        P.push(tl(a.textures.glass.base, (t) => (this.textures.glass.base = t)));
        P.push(this.customTextureLoader(a.textures.glass.normal, (t) => (this.textures.glass.normal = t)));
        P.push(tl(a.textures.glass.roughness, (t) => (this.textures.glass.roughness = t)));
        P.push(tl(a.textures.glass.metallic, (t) => (this.textures.glass.metallic = t)));
        P.push(this.customTextureLoader(a.textures.matcaps.track, (t) => (this.textures.matcaps.track = t)));
        P.push(this.customTextureLoader(a.textures.noise.texture, (t) => (this.textures.noise.texture = t)));
        P.push(this.customTextureLoader(a.textures.plastic.matcap, (t) => (this.textures.plastic.matcap = t)));
        P.push(this.customTextureLoader(a.textures.notFound.diffuse, (t) => (this.textures.notFound.diffuse = t)));
        P.push(this.customModelLoader(a.models.helmet, (g) => (this.models.helmet = g)));
        P.push(this.customModelLoader(a.models.disco, (g) => (this.models.disco = g)));
        P.push(this.customModelLoader(a.models.tracks, (g) => (this.models.tracks = g)));
        P.push(
          this.customHdriLoader(a.hdri.light, (t) => {
            this.hdri.light = t;
            this.hdri.light.mapping = EquirectangularReflectionMapping;
          })
        );
        P.push(
          this.customHdriLoader(a.hdri.faded, (t) => {
            this.hdri.faded = t;
            this.hdri.faded.mapping = EquirectangularReflectionMapping;
          })
        );
        if (this.isDebug)
          P.push(
            this.customHdriLoader(a.hdri.dark, (t) => {
              this.hdri.dark = t;
              this.hdri.dark.mapping = EquirectangularReflectionMapping;
            })
          );
        P.push(this.customTextureLoader(a.fonts.brier.atlas, (t) => (this.fonts.brier.atlas = t)));
        P.push(this.customTextureLoader(a.fonts.mona.atlas, (t) => (this.fonts.mona.atlas = t)));
        P.push(this.customFontLoader(a.fonts.brier.json, (f) => (this.fonts.brier.json = f)));
        P.push(this.customFontLoader(a.fonts.mona.json, (f) => (this.fonts.mona.json = f)));
        await Promise.all(P);
        resolve();
        this.setTexturesParams();
      })();
    });
  }
}
