/**
 * Helmet-scroll scene — y9 34185-34413. Driven externally via
 * landoGL.bounds.helmetScroll + helmetScrollScene.PROGRESS (heroflip DOM module).
 * GLSL verbatim; horizontal wipe (±0.0425, no sine bend).
 */
import {
  Scene,
  Group,
  Mesh,
  PlaneGeometry,
  PerspectiveCamera,
  MeshStandardMaterial,
  MeshMatcapMaterial,
  ShaderMaterial,
  Uniform,
  WebGLRenderTarget,
  DoubleSide,
  type Texture,
  type IUniform,
} from 'three';
import { gsap as m, ScrollTrigger as TA } from '../../gsap';
import type { GL } from '../core/app';
import { DiscoController, randomGoogleVariant } from './head';

export class HelmetScrollScene {
  id = 'helmet-scroll';
  gl: GL;
  settings: { dom: HTMLElement };
  isRendering = false;
  scene = new Scene();
  renderPlane: { mesh: Mesh<PlaneGeometry, ShaderMaterial>; bounds: null };
  renderTarget: WebGLRenderTarget;
  camera: PerspectiveCamera;
  helmet: Group;
  helmetGroup = new Group();
  uniforms: Record<string, IUniform>;
  helmetMaterial: MeshStandardMaterial;
  glassMaterial: MeshStandardMaterial;
  plasticMaterial: MeshMatcapMaterial;
  disco: DiscoController;
  timeline!: gsap.core.Timeline;

  constructor(gl: GL, settings: { dom: HTMLElement }) {
    this.gl = gl;
    this.settings = settings;
    this.renderPlane = {
      mesh: new Mesh(
        new PlaneGeometry(1, 1),
        new ShaderMaterial({
          transparent: true,
          side: DoubleSide,
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

              gl_FragColor = textureDiffuse;
              gl_FragColor.a *= smoothstep(0.5, 0.4, abs(vUv.x - 0.5));
              gl_FragColor.a *= smoothstep(0.5, 0.4, abs(vUv.y - 0.5));

              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }
          `,
        })
      ),
      bounds: null,
    };
    this.renderPlane.mesh.renderOrder = 2;
    this.renderTarget = new WebGLRenderTarget(
      this.gl.sizes.width * this.gl.sizes.pixelRatio,
      this.gl.sizes.height * this.gl.sizes.pixelRatio,
      { samples: 1 }
    );
    this.camera = new PerspectiveCamera(20, this.gl.sizes.width / this.gl.sizes.height, 0.1, 1000);
    this.camera.position.z = 2;
    this.helmet = this.gl.assets.models.helmet!.scene.clone();
    this.helmet.scale.set(6, 6, 6);
    this.scene.add(this.helmetGroup);
    this.helmetGroup.add(this.helmet);
    const assets = this.gl.assets;
    this.uniforms = {
      uTime: new Uniform(0),
      tMask: new Uniform((assets.textures.helmet as unknown as { mask?: Texture }).mask),
      uHoverReveal: new Uniform(1),
      uDarkEdges: new Uniform(0),
      uHelmetTransition: new Uniform(0),
      tCurrentTexture: new Uniform(assets.textures.helmet.diffuseLime),
      tNextTexture: new Uniform(assets.textures.helmet.diffuseDisco),
    };
    this.helmetMaterial = new MeshStandardMaterial({
      normalMap: assets.textures.helmet.normal,
      metalness: 1,
      roughness: 0.05,
      envMap: assets.hdri.light,
      envMapIntensity: 1.5,
      side: DoubleSide,
    });
    this.glassMaterial = new MeshStandardMaterial({
      map: assets.textures.glass.base,
      roughnessMap: assets.textures.glass.roughness,
      normalMap: assets.textures.glass.normal,
      metalnessMap: assets.textures.helmet.metallic,
      envMap: assets.hdri.faded,
      envMapIntensity: 1.5,
    });
    this.plasticMaterial = new MeshMatcapMaterial({
      transparent: true,
      opacity: 0.25,
      matcap: assets.textures.plastic.matcap,
      side: DoubleSide,
    });
    this.helmet.children.forEach((child) => {
      const meshChild = child as Mesh;
      if (child.name === 'helmet') {
        meshChild.material = this.helmetMaterial;
        this.helmetMaterial.onBeforeCompile = (shader) => {
          shader.vertexShader = shader.vertexShader.replace(
            'varying vec3 vViewPosition;',
            `
              varying vec3 vViewPosition;
              varying vec3 vLocalPosition;
              varying vec3 vWorldPosition;
              varying vec2 vUv;
            `
          );
          shader.vertexShader = shader.vertexShader.replace(
            '#include <fog_vertex>',
            `
              vLocalPosition = position.xyz;
              vWorldPosition = worldPosition.xyz;
              vUv = uv;
            `
          );
          shader.uniforms.uTime = this.uniforms.uTime;
          shader.uniforms.tMask = this.uniforms.tMask;
          shader.uniforms.uHoverReveal = this.uniforms.uHoverReveal;
          shader.uniforms.uDarkEdges = this.uniforms.uDarkEdges;
          shader.uniforms.uHelmetTransition = this.uniforms.uHelmetTransition;
          shader.uniforms.tCurrentTexture = this.uniforms.tCurrentTexture;
          shader.uniforms.tNextTexture = this.uniforms.tNextTexture;
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <common>',
            `
              const float PI = 3.141592;
              varying vec3 vWorldPosition;
              varying vec3 vLocalPosition;
              varying vec2 vUv;

              uniform float uDarkEdges;
              uniform float uHelmetTransition;

              uniform sampler2D tCurrentTexture;
              uniform sampler2D tNextTexture;

              #include <common>
            `
          );
          shader.fragmentShader = shader.fragmentShader.replace(
            'vec4 diffuseColor = vec4( diffuse, opacity );',
            `
              vec4 diffuseColor = vec4(vec3(0.0), 1.0);

              vec4 textureCurrent = texture2D(tCurrentTexture, vUv);
              vec4 textureNext = texture2D(tNextTexture, vUv);

              float transition = vLocalPosition.y;

              vec3 color = mix(textureNext.rgb, textureCurrent.rgb, step(transition, mix(0.0425, -0.0425, uHelmetTransition)));

              if (gl_FrontFacing) {
                diffuseColor = vec4(color, opacity);
              }
            `
          );
        };
      }
      if (child.name === 'glass') {
        meshChild.material = this.glassMaterial;
        this.glassMaterial.onBeforeCompile = (shader) => {
          shader.vertexShader = shader.vertexShader.replace(
            'varying vec3 vViewPosition;',
            `
                  varying vec3 vViewPosition;
                  varying vec3 vLocalPosition;
                  varying vec3 vWorldPosition;
                  varying vec2 vUv;
                `
          );
          shader.vertexShader = shader.vertexShader.replace(
            '#include <fog_vertex>',
            `
                  vLocalPosition = position.xyz;
                  vWorldPosition = worldPosition.xyz;
                  vUv = uv;
                `
          );
          shader.uniforms.uHoverReveal = this.uniforms.uHoverReveal;
          shader.uniforms.uDarkEdges = this.uniforms.uDarkEdges;
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <common>',
            `
                  varying vec3 vWorldPosition;
                  varying vec3 vLocalPosition;
                  varying vec2 vUv;

                  uniform float uDarkEdges;

                  #include <common>
                `
          );
          shader.fragmentShader = shader.fragmentShader.replace(
            'vec4 diffuseColor = vec4( diffuse, opacity );',
            `
                  float darkEdges = clamp(1.0 - abs(vLocalPosition.x) * 30., 0.2, 1.0);

                  vec4 diffuseColor = vec4(vec3(diffuse * mix(1.0, darkEdges, uDarkEdges)), opacity);
                `
          );
        };
      }
      if (child.name === 'plastic') {
        meshChild.renderOrder = 1;
        meshChild.material = this.plasticMaterial;
      }
    });
    this.disco = new DiscoController(this.gl, this.helmet);
    document.addEventListener('disco', (e) => {
      this.animateInDisco((e as CustomEvent<{ direction: number }>).detail.direction);
    });
    window.landoGL!.params.headScene.VARIANT = randomGoogleVariant
      ? 'Google'
      : this.gl.time.getVariantAccordingToTime();
    this.setTimeline();
    this.setIsRendering();
    this.setVariant(window.landoGL!.params.headScene.VARIANT as string);
  }

  setIsRendering() {
    TA.create({
      trigger: '[data-heroflip="track"]',
      start: () => `top-=${this.gl.sizes.height / 2} bottom`,
      end: () => `bottom+=${this.gl.sizes.height / 2} top`,
      invalidateOnRefresh: true,
      refreshPriority: -99,
      onRefresh: () => (this.isRendering = true),
      onEnter: () => (this.isRendering = true),
      onEnterBack: () => (this.isRendering = true),
      onLeave: () => (this.isRendering = false),
      onLeaveBack: () => (this.isRendering = false),
    });
  }

  setTimeline() {
    this.timeline = m.timeline({ paused: true });
    this.timeline.fromTo(this.helmetGroup.rotation, { y: Math.PI / 2.2 }, { y: Math.PI * 4, duration: 1, ease: 'power1.inOut' }, 0);
    this.timeline.fromTo(this.helmet.rotation, { x: Math.PI / 12 }, { x: -Math.PI / 10, duration: 0.5, ease: 'power1.in' }, 0);
    this.timeline.fromTo(this.helmet.rotation, { x: -Math.PI / 10 }, { x: Math.PI / 20, duration: 0.5, ease: 'power1.out' }, 0.5);
  }

  setVariant(variant: string) {
    const tex = this.gl.assets.textures.helmet;
    type Irid = MeshStandardMaterial & { iridescence: number };
    if (variant === 'Lime') {
      this.uniforms.tCurrentTexture.value = tex.diffuseLime;
      this.helmetMaterial.envMapIntensity = 1.5;
    } else if (variant === 'Dark') {
      this.uniforms.tCurrentTexture.value = tex.diffuseDark;
      this.helmetMaterial.envMapIntensity = 1.5;
    } else if (variant === 'Disco') {
      this.uniforms.tCurrentTexture.value = tex.diffuseDisco;
      this.helmetMaterial.envMapIntensity = 1.5;
    } else if (variant === 'Grid') {
      this.uniforms.tCurrentTexture.value = tex.diffuseGrid;
      this.helmetMaterial.envMapIntensity = 1;
    } else if (variant === 'Google') {
      this.uniforms.tCurrentTexture.value = tex.diffuseGoogle;
      this.helmetMaterial.envMapIntensity = 0.75;
    }
    (this.helmetMaterial as Irid).iridescence = 0;
    this.helmetMaterial.needsUpdate = true;
  }

  resize() {
    this.renderTarget.setSize(
      this.gl.sizes.width * this.gl.sizes.pixelRatio,
      this.gl.sizes.height * this.gl.sizes.pixelRatio
    );
    this.setScenePlaneDimensions();
  }

  setScenePlaneDimensions() {
    const b = window.landoGL!.bounds.helmetScroll;
    this.renderPlane.mesh.position.set(
      b.left - this.gl.sizes.width / 2,
      -b.top + window.lenis!.scroll + this.gl.sizes.height / 2,
      0
    );
    this.renderPlane.mesh.scale.set(b.width, b.width, 1);
    this.camera.aspect = b.width / b.width;
    this.camera.updateProjectionMatrix();
  }

  renderPipeline() {
    if (!this.isRendering) return;
    this.gl.renderer.instance.setRenderTarget(this.renderTarget);
    this.gl.renderer.instance.render(this.scene, this.camera);
    this.renderPlane.mesh.material.uniforms.tDiffuse.value = this.renderTarget.texture;
  }

  animateInDisco(direction: number) {
    if (direction === 1) m.to(this.uniforms.uHelmetTransition, { value: 1, duration: 2, ease: 'expo.inOut' });
    else m.to(this.uniforms.uHelmetTransition, { value: 0, duration: 2, ease: 'expo.inOut' });
  }

  update() {
    if (!this.isRendering) return;
    this.timeline.progress((window.landoGL!.params.helmetScrollScene.PROGRESS as number) + 0.001);
    this.setScenePlaneDimensions();
  }
}
