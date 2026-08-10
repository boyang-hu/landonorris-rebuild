/**
 * Carousel MSDF text scene — _9 34002-34177.
 * MSDF stack via three-msdf-text-utils npm (same library vendored in source;
 * deviation registered). Text content comes from landoGL.params (hardcoded).
 */
import {
  Scene,
  Group,
  Mesh,
  PlaneGeometry,
  PerspectiveCamera,
  ShaderMaterial,
  Uniform,
  Color,
  Vector3,
  Box3,
  MathUtils,
  WebGLRenderTarget,
} from 'three';
import { MSDFTextGeometry, MSDFTextMaterial } from 'three-msdf-text-utils';
import { gsap as m, ScrollTrigger as TA } from '../../gsap';
import type { GL } from '../core/app';

interface CarouselBounds {
  top: number;
  topMobile: number;
  left: number;
  width: number;
  height: number;
}

interface TextOptions {
  color: Color;
  size: number;
  shrink: number;
  verticalGap: number;
  letterSpacing: number;
  side: 'top' | 'bottom';
  direction: 'left' | 'right';
  yShift: number;
  font: 'brier' | 'mona';
  text: string;
}

export class CarouselScene {
  id = 'carousel';
  gl: GL;
  isRendering = false;
  scene = new Scene();
  renderPlane: { mesh: Mesh<PlaneGeometry, ShaderMaterial>; bounds: CarouselBounds };
  renderTarget: WebGLRenderTarget;
  camera: PerspectiveCamera;
  textTop: { mesh: Group; update: () => void };
  textBottom: { mesh: Group; update: () => void };

  constructor(gl: GL, _settings: { dom: HTMLElement }) {
    this.gl = gl;
    const params = window.landoGL!.params.carouselScene;
    this.renderPlane = {
      mesh: new Mesh(
        new PlaneGeometry(1, 1),
        new ShaderMaterial({
          transparent: true,
          uniforms: { tDiffuse: new Uniform(null) },
          vertexShader: `
            varying vec2 vUv;

            void main() {
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

              vUv = uv;
            }
          `,
          fragmentShader: `
            varying vec2 vUv;

            uniform sampler2D tDiffuse;

            void main() {
              vec4 textureDiffuse = texture2D(tDiffuse, vUv);

              gl_FragColor = vec4(textureDiffuse);
            }
          `,
        })
      ),
      bounds: { top: 0, topMobile: 0, left: 0, width: this.gl.sizes.width, height: this.gl.sizes.height },
    };
    this.renderPlane.mesh.renderOrder = 2;
    this.renderTarget = new WebGLRenderTarget(
      this.gl.sizes.width * this.gl.sizes.pixelRatio,
      this.gl.sizes.height * this.gl.sizes.pixelRatio,
      { samples: 1 }
    );
    this.camera = new PerspectiveCamera(75, this.gl.sizes.width / this.gl.sizes.height, 0.1, 1000);
    this.camera.position.z = 4.5;
    this.textTop = this.createCarouselText({
      color: new Color(params.COLOR_TOP).convertLinearToSRGB(),
      size: 0.0115,
      shrink: 1,
      verticalGap: 0,
      letterSpacing: -2,
      side: 'top',
      direction: 'left',
      yShift: 0.175,
      font: 'brier',
      text: params.TEXT_TOP + ' ',
    });
    this.scene.add(this.textTop.mesh);
    this.textBottom = this.createCarouselText({
      color: new Color(params.COLOR_BOTTOM).convertLinearToSRGB(),
      size: 0.02,
      shrink: 0.9,
      verticalGap: -0.175,
      letterSpacing: -1,
      side: 'bottom',
      direction: 'right',
      yShift: 0.175,
      font: 'mona',
      text: params.TEXT_BOTTOM + ' ',
    });
    this.scene.add(this.textBottom.mesh);
    this.setScroll();
    this.setIsRendering();
    this.responsive();
  }

  setIsRendering() {
    TA.create({
      trigger: '[data-gl-track="head"]',
      start: () => `top-=${this.gl.sizes.height / 2} bottom`,
      end: () => `bottom+=${this.gl.sizes.height / 2} top`,
      invalidateOnRefresh: true,
      refreshPriority: -99,
      onEnter: () => (this.isRendering = true),
      onEnterBack: () => (this.isRendering = true),
      onLeave: () => (this.isRendering = false),
      onLeaveBack: () => (this.isRendering = false),
    });
  }

  createCarouselText(opts: TextOptions) {
    const fonts = this.gl.assets.fonts;
    const geometry = new MSDFTextGeometry({
      text: opts.text.toUpperCase(),
      font: opts.font === 'brier' ? (fonts.brier.json as { data: unknown }).data : (fonts.mona.json as { data: unknown }).data,
      flipY: true,
      letterSpacing: opts.letterSpacing,
    });
    const material = new MSDFTextMaterial();
    material.uniforms.uMap.value = opts.font === 'brier' ? fonts.brier.atlas : fonts.mona.atlas;
    material.uniforms.uColor.value = new Color(opts.color);
    material.uniforms.uOpacity.value = 1;
    const group = new Group();
    group.scale.set(opts.shrink, 1, 1);
    const meshA = new Mesh(geometry, material);
    meshA.renderOrder = 1;
    meshA.scale.set(opts.size, opts.size, opts.size);
    meshA.rotation.x = Math.PI;
    const meshB = new Mesh(geometry, material);
    meshB.renderOrder = 1;
    meshB.scale.set(opts.size, opts.size, opts.size);
    meshB.rotation.x = Math.PI;
    const box = new Box3().setFromObject(meshA);
    const center = new Vector3();
    const gap = 0.1;
    box.getCenter(center);
    meshA.position.sub(center);
    meshB.position.add(center);
    meshA.position.x -= gap / 2;
    meshB.position.x += gap / 2;
    box.max.x += gap;
    if (opts.side === 'top') {
      meshA.position.y = box.max.y / 2 - opts.yShift + opts.verticalGap;
      meshB.position.y = box.max.y / 2 - opts.yShift + opts.verticalGap;
    } else {
      meshA.position.y = -box.max.y - opts.yShift - opts.verticalGap;
      meshB.position.y = -box.max.y - opts.yShift - opts.verticalGap;
    }
    group.add(meshA);
    group.add(meshB);
    return {
      mesh: group,
      update: () => {
        if (opts.direction === 'left') {
          group.position.x -= this.gl.time.delta * 0.01 + Math.abs(window.lenis!.velocity) * 0.001;
          if (group.position.x < -box.max.x * opts.shrink) group.position.x = 0;
        } else {
          group.position.x += this.gl.time.delta * 0.01 + Math.abs(window.lenis!.velocity) * 0.001;
          if (group.position.x > 0) group.position.x = -box.max.x * opts.shrink;
        }
      },
    };
  }

  resize() {
    this.renderTarget.setSize(
      this.gl.sizes.width * this.gl.sizes.pixelRatio,
      this.gl.sizes.height * this.gl.sizes.pixelRatio
    );
    this.responsive();
    this.setScenePlaneDimensions();
  }

  responsive() {
    if (this.gl.sizes.width > 768) {
      this.camera.position.z = 4.5;
      this.renderPlane.bounds.topMobile = 0;
    } else if (this.gl.sizes.width >= 480 && this.gl.sizes.width <= 768) {
      this.camera.position.z = MathUtils.lerp(11, 6.5, Math.max(this.gl.sizes.width - 480, 0) / 288);
      this.renderPlane.bounds.topMobile = this.gl.sizes.height * 0.35;
    } else {
      this.camera.position.z = MathUtils.lerp(14, 9.5, Math.max(this.gl.sizes.width - 320, 0) / 160);
      this.renderPlane.bounds.topMobile = this.gl.sizes.height * 0.35;
    }
  }

  setScenePlaneDimensions() {
    this.renderPlane.mesh.position.set(
      this.renderPlane.bounds.left - this.gl.sizes.width / 2 + this.gl.sizes.width / 2,
      -this.renderPlane.bounds.top + -this.renderPlane.bounds.topMobile + this.gl.sizes.height / 2 - this.gl.sizes.height / 2,
      0
    );
    this.renderPlane.mesh.scale.set(this.gl.sizes.width, this.gl.sizes.height, 1);
    this.camera.aspect = this.gl.sizes.width / this.gl.sizes.height;
    this.camera.updateProjectionMatrix();
  }

  setScroll() {
    m.fromTo(
      this.renderPlane.bounds,
      { top: () => this.gl.sizes.height },
      {
        top: 0,
        ease: 'none',
        scrollTrigger: {
          invalidateOnRefresh: true,
          scrub: true,
          trigger: '[data-gl-track="head"]',
          start: () => `top-=${this.gl.sizes.height} top`,
          end: () => 'top top',
          onRefresh: () => {
            this.setScenePlaneDimensions();
          },
          refreshPriority: -99,
        },
        onUpdate: () => {
          this.setScenePlaneDimensions();
        },
      }
    );
    m.fromTo(
      this.renderPlane.bounds,
      { top: 0 },
      {
        top: () => -this.gl.sizes.height,
        ease: 'none',
        scrollTrigger: {
          invalidateOnRefresh: true,
          scrub: true,
          trigger: '[data-gl-track="head"]',
          start: () => 'bottom bottom',
          end: () => `bottom+=${this.gl.sizes.height} bottom`,
          onRefresh: () => {
            this.setScenePlaneDimensions();
          },
          refreshPriority: -99,
        },
        onUpdate: () => {
          this.setScenePlaneDimensions();
        },
      }
    );
  }

  renderPipeline() {
    if (!this.isRendering) return;
    this.gl.renderer.instance.setRenderTarget(this.renderTarget);
    this.gl.renderer.instance.render(this.scene, this.camera);
    this.renderPlane.mesh.material.uniforms.tDiffuse.value = this.renderTarget.texture;
  }

  update() {
    if (!this.isRendering) return;
    this.textTop.update();
    this.textBottom.update();
  }
}
