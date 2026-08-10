/**
 * Not-found (404) scene — x9 34421-34753. Orbit-locked helmet + two lime "4"
 * planes; env map rotation follows accumulated azimuth. GLSL verbatim.
 */
import {
  Scene,
  Group,
  Mesh,
  PlaneGeometry,
  PerspectiveCamera,
  MeshStandardMaterial,
  MeshMatcapMaterial,
  MeshBasicMaterial,
  ShaderMaterial,
  Uniform,
  Vector3,
  MathUtils,
  WebGLRenderTarget,
  DoubleSide,
  type Texture,
  type IUniform,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap as m, ScrollTrigger as TA } from '../../gsap';
import type { GL } from '../core/app';
import { DiscoController } from './head';
import type { RenderPlane } from './head';

export class NotFoundScene {
  id = 'not-found';
  settings: { dom: HTMLElement };
  gl: GL;
  previousVariant: string;
  isTransitioning = false;
  isRendering = false;
  autoRotateValue = 0;
  scene = new Scene();
  easedMouse: { normalized: ReturnType<GL['mouse']['createEasedNormalized']> };
  renderPlane: RenderPlane;
  renderTarget: WebGLRenderTarget;
  cameraData = { previousAzimuthalAngle: 0, totalAzimuthalAngle: 0 };
  camera: PerspectiveCamera;
  helmet: Group;
  helmetGroup = new Group();
  helmetWorldRotation = new Vector3(0, 0, 0);
  uniforms: Record<string, IUniform>;
  helmetMaterial: MeshStandardMaterial;
  glassMaterial: MeshStandardMaterial;
  plasticMaterial: MeshMatcapMaterial;
  disco: DiscoController;
  foursGroup = new Group();
  fourMeshRight: Mesh;
  fourMeshLeft: Mesh;
  controls!: OrbitControls;

  constructor(gl: GL, settings: { dom: HTMLElement }) {
    this.gl = gl;
    this.settings = settings;
    this.previousVariant = window.landoGL!.params.notFoundScene.VARIANT;
    this.easedMouse = { normalized: this.gl.mouse.createEasedNormalized(0.025) };
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
              gl_FragColor.a *= smoothstep(0.5, 0.4, abs(vUv.y - 0.5));

              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }
          `,
        })
      ),
      bounds: { top: 0, left: 0, width: this.gl.sizes.width, height: this.gl.sizes.height },
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
    this.helmetGroup.scale.set(6, 6, 6);
    this.scene.add(this.helmetGroup);
    this.helmetGroup.add(this.helmet);
    const assets = this.gl.assets;
    this.uniforms = {
      tMask: new Uniform((assets.textures.helmet as unknown as { mask?: Texture }).mask),
      tDiscoMatcap: new Uniform(assets.textures.disco.matcap),
      tDiscoMask: new Uniform(assets.textures.disco.mask),
      uTime: new Uniform(0),
      uHoverReveal: new Uniform(1),
      uDarkEdges: new Uniform(0),
      uHelmetTransition: new Uniform(0),
      tCurrentTexture: new Uniform(null),
      tNextTexture: new Uniform(null),
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

              float transition = vLocalPosition.y - sin(vLocalPosition.x * PI) * sin(uHelmetTransition * PI) * 0.1;

              vec4 color = mix(textureNext, textureCurrent, step(transition, mix(0.05, -0.05, uHelmetTransition)));

              if (gl_FrontFacing) {
                diffuseColor = vec4(color.rgb, opacity);
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
              vec4 diffuseColor = vec4(diffuse, opacity);
            `
          );
        };
      }
      if (child.name === 'plastic') {
        meshChild.renderOrder = 1;
        meshChild.material = this.plasticMaterial;
      }
    });
    this.disco = new DiscoController(this.gl, this.helmet, true);
    document.addEventListener('disco', (e) => {
      const detail = (e as CustomEvent<{ direction: number }>).detail;
      if (detail.direction === 1) this.translate('Disco');
      else this.translate('Lime');
    });
    this.scene.add(this.foursGroup);
    this.fourMeshRight = new Mesh(
      new PlaneGeometry(0.305, 0.305),
      new MeshBasicMaterial({ color: 13827840, alphaMap: this.gl.assets.textures.notFound.diffuse, transparent: true })
    );
    this.foursGroup.add(this.fourMeshRight);
    this.fourMeshLeft = new Mesh(
      new PlaneGeometry(0.305, 0.305),
      new MeshBasicMaterial({ color: 13827840, alphaMap: this.gl.assets.textures.notFound.diffuse, transparent: true })
    );
    this.foursGroup.add(this.fourMeshLeft);
    this.setOrbitControls();
    this.setDefaultVariant();
    this.getBounds();
    this.setScroll();
    this.setIsRendering();
    this.setFoursDimensions();
  }

  getBounds() {
    const rect = this.settings.dom.getBoundingClientRect();
    this.renderPlane.bounds.left = rect.left;
    this.renderPlane.bounds.width = rect.width;
    this.renderPlane.bounds.height = rect.height;
  }

  setScroll() {
    m.fromTo(
      this.renderPlane.bounds,
      { top: () => this.gl.sizes.height },
      {
        top: () => -this.gl.sizes.height,
        ease: 'none',
        scrollTrigger: {
          invalidateOnRefresh: true,
          scrub: true,
          trigger: this.settings.dom,
          start: () => `center-=${this.gl.sizes.height} center`,
          end: () => `center+=${this.gl.sizes.height} center`,
          refreshPriority: -99,
          onRefresh: () => {
            this.getBounds();
            this.setScenePlaneDimensions();
          },
        },
        onUpdate: () => {
          this.setScenePlaneDimensions();
        },
      }
    );
  }

  setFoursDimensions() {
    if (this.gl.sizes.width > 479) {
      this.fourMeshRight.position.x = 0.3275;
      this.fourMeshLeft.position.x = -0.3275;
      this.fourMeshRight.scale.set(1, 1, 1);
      this.fourMeshLeft.scale.set(1, 1, 1);
    } else {
      this.fourMeshRight.position.x = 0.245;
      this.fourMeshLeft.position.x = -0.245;
      this.fourMeshRight.scale.set(1.75, 1.75, 1.75);
      this.fourMeshLeft.scale.set(1.75, 1.75, 1.75);
    }
  }

  setIsRendering() {
    TA.create({
      trigger: this.settings.dom.parentElement,
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

  translate(variant: string) {
    return new Promise<void>((resolve) => {
      if (this.isTransitioning) return;
      document.documentElement.classList.add('gl-not-found-isTransitioning');
      const tex = this.gl.assets.textures.helmet;
      if (variant === 'Lime') {
        this.uniforms.tNextTexture.value = tex.diffuseLime;
        m.to(this.helmetMaterial, { envMapIntensity: 1.5, duration: 2 });
        (this.disco.transition as (d: number, x?: boolean) => void)(-1, true);
        this.disco.direction = -1;
      } else if (variant === 'Dark') {
        this.uniforms.tNextTexture.value = tex.diffuseDark;
        m.to(this.helmetMaterial, { envMapIntensity: 1.5, duration: 2 });
        (this.disco.transition as (d: number, x?: boolean) => void)(-1, true);
        this.disco.direction = -1;
      } else if (variant === 'Grid') {
        this.uniforms.tNextTexture.value = tex.diffuseGrid;
        m.to(this.helmetMaterial, { envMapIntensity: 1, duration: 2 });
        (this.disco.transition as (d: number, x?: boolean) => void)(-1, true);
        this.disco.direction = -1;
      } else if (variant === 'Disco') {
        this.uniforms.tNextTexture.value = tex.diffuseDisco;
        m.to(this.helmetMaterial, { envMapIntensity: 1, duration: 2 });
      } else if (variant === 'Google') {
        this.uniforms.tNextTexture.value = tex.diffuseGoogle;
        m.to(this.helmetMaterial, { envMapIntensity: 0.75, duration: 2 });
        (this.disco.transition as (d: number, x?: boolean) => void)(-1, true);
        this.disco.direction = -1;
      }
      m.to(this.uniforms.uHelmetTransition, {
        value: 1,
        duration: 2,
        ease: 'expo.inOut',
        onStart: () => {
          this.isTransitioning = true;
        },
        onComplete: () => {
          this.uniforms.tCurrentTexture.value = this.uniforms.tNextTexture.value;
          this.uniforms.uHelmetTransition.value = 0;
          this.isTransitioning = false;
          document.documentElement.classList.remove('gl-not-found-isTransitioning');
          resolve();
        },
      });
      m.to(this.helmet.rotation, {
        y: Math.PI * 2 + this.controls.getAzimuthalAngle(),
        ease: 'back.inOut',
        duration: 2,
        onComplete: () => {
          this.helmet.rotation.y = 0 + this.controls.getAzimuthalAngle();
        },
      });
      m.to(this, { autoRotateValue: 0, duration: 2, ease: 'back.inOut' });
    });
  }

  setDefaultVariant() {
    const tex = this.gl.assets.textures.helmet;
    const v = window.landoGL!.params.notFoundScene.VARIANT;
    if (v === 'Lime') this.uniforms.tCurrentTexture.value = tex.diffuseLime;
    else if (v === 'Dark') this.uniforms.tCurrentTexture.value = tex.diffuseDark;
    else if (v === 'Grid') this.uniforms.tCurrentTexture.value = tex.diffuseGrid;
    else if (v === 'Disco') this.uniforms.tCurrentTexture.value = tex.diffuseDisco;
    else if (v === 'Google') this.uniforms.tCurrentTexture.value = tex.diffuseGoogle;
  }

  setOrbitControls() {
    this.controls = new OrbitControls(this.camera, document.querySelector('.gl-wrap') as HTMLElement);
    this.controls.enableDamping = true;
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.minPolarAngle = Math.PI / 2;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.addEventListener('change', () => {
      const azimuthal = this.controls.getAzimuthalAngle();
      let delta = azimuthal - this.cameraData.previousAzimuthalAngle;
      if (delta > Math.PI) delta -= 2 * Math.PI;
      else if (delta < -Math.PI) delta += 2 * Math.PI;
      this.cameraData.totalAzimuthalAngle += delta;
      this.cameraData.previousAzimuthalAngle = azimuthal;
      this.helmetMaterial.envMapRotation.y = this.cameraData.totalAzimuthalAngle;
      this.glassMaterial.envMapRotation.y = this.cameraData.totalAzimuthalAngle;
      this.foursGroup.lookAt(this.camera.position);
    });
  }

  resize() {
    this.renderTarget.setSize(
      this.gl.sizes.width * this.gl.sizes.pixelRatio,
      this.gl.sizes.height * this.gl.sizes.pixelRatio
    );
    this.getBounds();
    this.setScenePlaneDimensions();
    this.setFoursDimensions();
  }

  setScenePlaneDimensions() {
    this.renderPlane.mesh.position.set(
      this.renderPlane.bounds.left - this.gl.sizes.width / 2 + this.renderPlane.bounds.width / 2,
      -this.renderPlane.bounds.top + this.renderPlane.bounds.width / 2 - this.renderPlane.bounds.height / 2,
      0
    );
    this.renderPlane.mesh.scale.set(this.gl.sizes.width, this.renderPlane.bounds.height, 1);
    this.camera.aspect = this.gl.sizes.width / this.renderPlane.bounds.height;
    this.camera.updateProjectionMatrix();
  }

  renderPipeline() {
    if (!this.isRendering) return;
    this.gl.renderer.instance.setRenderTarget(this.renderTarget);
    this.gl.renderer.instance.render(this.scene, this.camera);
    this.renderPlane.mesh.material.uniforms.tDiffuse.value = this.renderTarget.texture;
  }

  update() {
    if (!this.isRendering) return;
    this.controls.update();
    this.helmet.rotation.x =
      -this.easedMouse.normalized.value.y * MathUtils.degToRad(window.landoGL!.params.notFoundScene.HELMET_ANGLE);
    this.helmetGroup.rotation.y =
      Math.PI / 2.5 +
      this.easedMouse.normalized.value.x * (MathUtils.degToRad(window.landoGL!.params.notFoundScene.HELMET_ANGLE) * 0.5);
    if (!this.isTransitioning)
      this.autoRotateValue +=
        this.gl.time.delta * 0.0025 * window.landoGL!.params.notFoundScene.HELMET_AUTOROTATE_SPEED;
    this.autoRotateValue = this.autoRotateValue % (Math.PI * 2);
    this.helmetGroup.rotation.y += this.autoRotateValue;
    this.easedMouse.normalized.update(this.gl.time.delta);
    if (window.landoGL!.params.notFoundScene.VARIANT !== this.previousVariant)
      this.translate(window.landoGL!.params.notFoundScene.VARIANT);
    this.previousVariant = window.landoGL!.params.notFoundScene.VARIANT;
  }
}
