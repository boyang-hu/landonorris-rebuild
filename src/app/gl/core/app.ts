/**
 * GL application root — RQ (41447), Renderer $9 (30156), Camera Y9 (30144),
 * Debug t9 (38004). Singleton semantics identical to the source (`new RQ()`
 * everywhere == getGL() here).
 */
import { Scene, PerspectiveCamera, WebGLRenderer, ColorManagement } from 'three';
import { gsap as m, ScrollTrigger as TA } from '../../gsap';
import { Time, Sizes, Mouse, ShaderChunks } from './support';
import { Assets } from './Assets';
import type { World } from '../world';

export class Camera {
  gl: GL;
  instance: PerspectiveCamera;

  constructor(gl: GL) {
    this.gl = gl;
    this.instance = new PerspectiveCamera(0, this.gl.sizes.width / this.gl.sizes.height, 0.1, 10);
    this.instance.position.z = 10;
    this.instance.aspect = this.gl.sizes.width / this.gl.sizes.height;
    this.instance.fov = 2 * Math.atan(this.gl.sizes.height / 2 / this.instance.position.z) * (180 / Math.PI);
    this.instance.updateProjectionMatrix();
  }

  resize() {
    this.instance.aspect = this.gl.sizes.width / this.gl.sizes.height;
    this.instance.fov = 2 * Math.atan(this.gl.sizes.height / 2 / this.instance.position.z) * (180 / Math.PI);
    this.instance.updateProjectionMatrix();
  }
}

export class Renderer {
  gl: GL;
  instance: WebGLRenderer;

  constructor(gl: GL) {
    ColorManagement.enabled = true;
    this.gl = gl;
    this.instance = new WebGLRenderer({ powerPreference: 'high-performance', alpha: true, precision: 'lowp' });
    this.instance.autoClear = false;
    this.instance.setPixelRatio(this.gl.sizes.pixelRatio);
    this.instance.setSize(this.gl.sizes.width, this.gl.sizes.height);
  }

  add() {
    const wrap = document.querySelector('.gl-wrap');
    if (wrap) (wrap.appendChild(this.instance.domElement) as HTMLElement).classList.add('gl');
  }

  update() {
    for (const i in this.gl.world!.scenes) {
      this.gl.world!.scenes[i].renderPipeline();
      this.instance.clear();
    }
    this.instance.setRenderTarget(null);
    this.instance.render(this.gl.scene, this.gl.camera.instance);
  }

  resize() {
    this.instance.setPixelRatio(this.gl.sizes.pixelRatio);
    this.instance.setSize(this.gl.sizes.width, this.gl.sizes.height);
  }
}

class Debug {
  gui: import('lil-gui').GUI;
  stats: { update: () => void; init: (r: WebGLRenderer) => void; dom: HTMLElement };

  constructor(gl: GL) {
    // lazy import kept simple: debug is ?debug-gated and non-essential
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const GUI = (window as never as { lil?: { GUI: new (o: { width: number }) => import('lil-gui').GUI } }).lil?.GUI;
    this.gui = GUI ? new GUI({ width: 300 }) : (null as never);
    this.stats = { update: () => {}, init: () => {}, dom: document.createElement('div') };
    void gl;
  }
  update() {
    this.stats.update();
  }
}

let singleton: GL | null = null; // G$

export class GL {
  urlParams = new URLSearchParams(window.location.search);
  isLoaded = false;
  isDebug!: boolean;
  canvas: null = null;
  time!: Time;
  sizes!: Sizes;
  mouse!: Mouse;
  shaderChunks!: ShaderChunks;
  scene!: Scene;
  camera!: Camera;
  renderer!: Renderer;
  assets!: Assets;
  world: World | null = null;
  debug: Debug | null = null;

  constructor() {
    if (singleton) return singleton;
    singleton = this;
    this.isDebug = this.urlParams.has('debug');
    this.time = new Time();
    this.sizes = new Sizes();
    this.mouse = new Mouse(this, document as never);
    this.shaderChunks = new ShaderChunks();
    this.scene = new Scene();
    this.camera = new Camera(this);
    this.renderer = new Renderer(this);
    this.assets = new Assets(this.renderer.instance, this.isDebug);
    this.sizes.on('resize', () => {
      this.resize();
    });
  }

  load(): Promise<void> {
    return new Promise((resolve) => {
      Promise.all([this.loadDOM(), this.assets.load()]).then(() => resolve());
    });
  }

  async init(createWorld: (gl: GL) => World) {
    this.renderer.add();
    if (this.isDebug) this.debug = new Debug(this);
    this.world = createWorld(this);
    m.ticker.add(this.update.bind(this), false, true);
    this.world.add();
    this.isLoaded = true;
    setTimeout(() => {
      TA.refresh();
      this.resize();
      console.log('resize issue prevention');
    }, 1000);
  }

  loadDOM(): Promise<void> {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', () => resolve());
    });
  }

  update() {
    if (this.isLoaded) {
      this.renderer.update();
      this.world!.update();
      this.mouse.update();
      if (this.isDebug && this.debug) this.debug.update();
    }
  }

  resize() {
    if (this.isLoaded) {
      this.camera.resize();
      this.renderer.resize();
      this.world!.resize();
    }
  }
}

export const getGL = () => {
  if (!singleton) throw new Error('GL app not constructed yet');
  return singleton;
};
export const hasGL = () => !!singleton;
