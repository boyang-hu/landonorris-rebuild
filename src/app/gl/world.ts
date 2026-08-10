/**
 * World — l9 35706-35779. Scene factory keyed by [data-gl], plus the shared
 * fluid cursor / idle state / background noise subsystems.
 */
import type { Mesh, ShaderMaterial, WebGLRenderTarget, Material, Texture } from 'three';
import type { GL } from './core/app';
import { FluidCursor, IdleState } from './fluid';
import { BackgroundNoise, registerSimplexChunk } from './noise';
import { HeadScene } from './scenes/head';
import { TracksScene } from './scenes/tracks';
import { BackgroundScene } from './scenes/background';
import { CarouselScene } from './scenes/carousel';
import { HelmetScrollScene } from './scenes/helmetScroll';
import { NotFoundScene } from './scenes/notFound';

export interface GlScene {
  id: string;
  isRendering: boolean;
  renderPlane: { mesh: Mesh; bounds: unknown };
  renderTarget?: WebGLRenderTarget;
  scene?: import('three').Scene;
  renderPipeline(): void;
  update(): void;
  resize(): void;
  setScenePlaneDimensions(): void;
}

export class World {
  gl: GL;
  fluidCursor: FluidCursor;
  idleState: IdleState;
  backgroundNoise: BackgroundNoise;
  selectors: NodeListOf<HTMLElement> | HTMLElement[] = [];
  scenes: GlScene[] = [];

  constructor(gl: GL) {
    this.gl = gl;
    registerSimplexChunk();
    this.idleState = new IdleState(gl);
    const getIdle = () => this.idleState;
    this.fluidCursor = new FluidCursor(gl, getIdle);
    this.backgroundNoise = new BackgroundNoise(gl);
  }

  add() {
    this.selectors = document.querySelectorAll<HTMLElement>('[data-gl]');
    this.selectors.forEach((el) => {
      if (el.dataset.gl === 'head') this.scenes.push(new HeadScene(this.gl, { dom: el }) as unknown as GlScene);
      else if (el.dataset.gl === 'tracks') this.scenes.push(new TracksScene(this.gl, { dom: el }) as unknown as GlScene);
      else if (el.dataset.gl === 'background')
        this.scenes.push(new BackgroundScene(this.gl, { dom: el }) as unknown as GlScene);
      else if (el.dataset.gl === 'carousel')
        this.scenes.push(new CarouselScene(this.gl, { dom: el }) as unknown as GlScene);
      else if (el.dataset.gl === 'helmet-scroll')
        this.scenes.push(new HelmetScrollScene(this.gl, { dom: el }) as unknown as GlScene);
      else if (el.dataset.gl === 'not-found') {
        console.log(el);
        this.scenes.push(new NotFoundScene(this.gl, { dom: el }) as unknown as GlScene);
      }
    });
    for (const i in this.scenes) this.gl.scene.add(this.scenes[i].renderPlane.mesh);
  }

  destroy() {
    for (const i in this.scenes) {
      this.gl.scene.remove(this.scenes[i].renderPlane.mesh);
      if (this.scenes[i].renderTarget) this.scenes[i].renderTarget!.dispose();
      this.scenes[i].renderPlane.mesh.geometry.dispose();
      (this.scenes[i].renderPlane.mesh.material as ShaderMaterial).dispose();
      if (this.scenes[i].scene)
        this.scenes[i].scene!.traverse((obj) => {
          this.scenes[i].scene!.remove(obj);
          const mesh = obj as Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry.dispose();
          if ((mesh.material as Material).isMaterial) this.cleanMaterial(mesh.material as Material);
          else for (const mat of mesh.material as Material[]) this.cleanMaterial(mat);
        });
    }
    this.selectors = [];
    this.scenes = [];
    this.gl.renderer.instance.setRenderTarget(null);
    this.gl.renderer.instance.clear();
  }

  cleanMaterial(material: Material) {
    material.dispose();
    for (const key of Object.keys(material)) {
      const value = (material as unknown as Record<string, unknown>)[key];
      if (value && typeof value === 'object' && 'minFilter' in (value as Texture)) (value as Texture).dispose();
    }
  }

  setScenePlanesDimensions() {
    (this.selectors as NodeListOf<HTMLElement>).forEach((el, i) => {
      if (!this.scenes[i].isRendering) return;
      if (el.dataset.gl !== 'helmet-scroll') {
        const rect = el.getBoundingClientRect();
        this.scenes[i].renderPlane.bounds = rect;
      }
      this.scenes[i].setScenePlaneDimensions();
    });
  }

  resize() {
    this.fluidCursor.resize();
    this.backgroundNoise.resize();
    for (const i in this.scenes) this.scenes[i].resize();
  }

  update() {
    this.backgroundNoise.update();
    this.idleState.update();
    this.fluidCursor.update();
    for (const i in this.scenes) this.scenes[i].update();
  }
}
