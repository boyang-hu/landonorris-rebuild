/**
 * Tracks scene — V9 TrackPoint 32502-32515, z9 Tracks 32516-32848,
 * UN/GN shaders 32849-32944, k9 TracksScene 32945-33061. GLSL verbatim.
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
  Vector2,
  Vector3,
  WebGLRenderTarget,
  Object3D,
  DoubleSide,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { gsap as m, ScrollTrigger as TA } from '../../gsap';
import type { GL } from '../core/app';
import type { RenderPlane } from './head';

const trackVert = `
  varying vec2 vUv;
  varying vec2 vN;

  attribute vec3 aTargetPositions;
  // uniform float uProgress;
  uniform float uThickness;

  void main()
  {

    // vec3 mixed = mix(position + normal * uThickness, aTargetPositions + normal * uThickness, uProgress);

    vec4 p = vec4( position + normal * uThickness, 1. );

    vec3 e = normalize( vec3( modelViewMatrix * p ) );
    vec3 n = normalize( normalMatrix * normal );

    vec3 r = reflect( e, n );
    float m = 2. * sqrt(
      pow( r.x, 2. ) +
      pow( r.y, 2. ) +
      pow( r.z + 1., 2. )
    );
    vN = r.xy / m + .5;

    gl_Position = projectionMatrix * modelViewMatrix * p;

    // gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * uThickness, 1.0);

    vUv = uv;
  }
`;

const trackFrag = `
  uniform sampler2D uTextureMatcap;
  uniform float uTime;
  uniform float uProgress;
  uniform float uReverse;
  uniform float uRaceDirection;

  varying vec2 vUv;
  varying vec2 vN;

  void main() {
    // Color 
    vec3 cYellow = vec3(0.824, 1.0, 0.0);
    vec3 cBackground = vec3(0.09, 0.098, 0.063);

    // Animation
    float animation = 0.5 + tan(vUv.x * 10.0 - uTime * uRaceDirection * 2.) * 0.5;
    // float animation = fract(vUv.x * 10.0 - uTime);

    float animationFract = pow(fract(vUv.x * 5.0 - uTime * uRaceDirection), 2.) * 10. - 5.0;

    // Outline
    // vec3 upperOutline = vec3(step(vUv.y, 0.05));
    vec3 upperOutline = vec3(smoothstep(0.075, 0.025, vUv.y));
    upperOutline -= animationFract * upperOutline * 0.3;

    vec3 bottomOutline = vec3(step(0.975, vUv.y));
    // bottomOutline += animation * bottomOutline;
    bottomOutline *= 0.25;

    // Transition
    float transition = smoothstep(uProgress * 1.2, uProgress * 1.2 - 0.2, abs(uReverse - fract(vUv.x * 8.)));
    
    // float transition = animation;

    // Matcap
    vec3 matcap = texture2D( uTextureMatcap, vN ).rgb;

    // Alpha
    float alpha = 0.35;
    alpha += upperOutline.r;
    alpha += bottomOutline.r;
    alpha = clamp(alpha, 0.0, 1.0);
    alpha -= transition;

    // Color
    vec3 color = vec3(0.1, 0.15, 0.05);
    color += matcap;
    color += cYellow * upperOutline;
    color += cYellow * bottomOutline;

    gl_FragColor = vec4(color, alpha );
    // gl_FragColor = vec4(vec3(animation), 1.0);
    // gl_FragColor = vec4(vec3(animationFract), 1.0);
    // gl_FragColor = vec4(vUv.x, vUv.y, 0.0, 1.0);
  }
`;

const START_SVG = `
            <div class="lando-gl__point__content lando-gl__point__start">
              <svg width="24" height="14" viewBox="0 0 24 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_125_13388)">
                  <path d="M4.66627 9.33276H0V13.999H4.66627V9.33276Z" fill="white" />
                  <path d="M4.66627 4.6665H0V9.33277H4.66627V4.6665Z" fill="#111718" />
                  <path d="M9.28346 9.33276H4.61719V13.999H9.28346V9.33276Z" fill="#111718" />
                  <path d="M4.66627 0.000244141H0V4.66651H4.66627V0.000244141Z" fill="white" />
                  <path d="M9.28346 4.6665H4.61719V9.33277H9.28346V4.6665Z" fill="white" />
                  <path d="M9.28346 0.000244141H4.61719V4.66651H9.28346V0.000244141Z" fill="#111718" />
                </g>
                <path d="M13.9495 9.33276H9.2832V13.999H13.9495V9.33276Z" fill="white" />
                <path d="M13.9495 4.6665H9.2832V9.33277H13.9495V4.6665Z" fill="#111718" />
                <path d="M13.9495 0.000244141H9.2832V4.66651H13.9495V0.000244141Z" fill="white" />
                <g clip-path="url(#clip1_125_13388)">
                  <path d="M13.9495 9.33276H9.2832V13.999H13.9495V9.33276Z" fill="white" />
                  <path d="M13.9495 4.6665H9.2832V9.33277H13.9495V4.6665Z" fill="#111718" />
                  <path d="M18.5667 9.33276H13.9004V13.999H18.5667V9.33276Z" fill="#111718" />
                  <path d="M13.9495 0.000244141H9.2832V4.66651H13.9495V0.000244141Z" fill="white" />
                  <path d="M18.5667 4.6665H13.9004V9.33277H18.5667V4.6665Z" fill="white" />
                  <path d="M18.5667 0.000244141H13.9004V4.66651H18.5667V0.000244141Z" fill="#111718" />
                </g>
                <path d="M23.2327 9.33276H18.5664V13.999H23.2327V9.33276Z" fill="white" />
                <path d="M23.2327 4.6665H18.5664V9.33277H23.2327V4.6665Z" fill="#111718" />
                <path d="M23.2327 0.000244141H18.5664V4.66651H23.2327V0.000244141Z" fill="white" />
                <defs>
                  <clipPath id="clip0_125_13388">
                    <rect width="9.28352" height="14" fill="white" transform="translate(0 0.000244141)" />
                  </clipPath>
                  <clipPath id="clip1_125_13388">
                    <rect width="9.28352" height="14" fill="white" transform="translate(9.2832 0.000244141)" />
                  </clipPath>
                </defs>
              </svg>
            </div>
          `;

/** V9 32502 */
class TrackPoint {
  object = new Object3D();
  dom!: HTMLElement;
  htmlTarget: Element;

  constructor(settings: { htmlTarget: string }) {
    this.htmlTarget = document.querySelector(settings.htmlTarget)!;
    this.addHTML();
  }

  addHTML() {
    const point = document.createElement('div');
    point.classList.add('lando-gl__point');
    const content = document.createElement('div');
    content.classList.add('lando-gl__point__content');
    point.appendChild(content);
    this.htmlTarget.appendChild(point);
    this.dom = point;
  }
}

type TrackMesh = Mesh<PlaneGeometry, ShaderMaterial>;
interface TrackData {
  name: string;
  index: number;
  meshes: TrackMesh[];
  points: Object3D;
}

/** z9 32516 */
export class Tracks {
  options: { camera: PerspectiveCamera };
  gl: GL;
  instance = new Group();
  height = 0.1;
  tracksPositions: Record<string, Float32Array> = {};
  data: TrackData[] = [];
  current: number;
  previousCurrent: string;
  isTransitioning = false;
  params = { progress: 0, duration: 1 };
  pointsGroup = new Group();
  points: TrackPoint[] = [];
  inner!: TrackMesh;
  outer!: TrackMesh;

  constructor(gl: GL, options: { camera: PerspectiveCamera }) {
    this.gl = gl;
    this.options = { camera: options.camera };
    this.matchVertices();
    this.generateData();
    this.current = this.getTrackIndex(window.landoGL!.params.tracksScene.CURRENT);
    this.previousCurrent = window.landoGL!.params.tracksScene.CURRENT;
    this.instance.add(this.pointsGroup);
    this.createPoints();
    this.setPoints(this.current);
    this.addTracks();
  }

  generateData() {
    this.gl.assets.models.tracks!.scene.children.forEach((child, i) => {
      const points = child.children.find((c) => c.userData.group === 'points')!;
      this.data.push({ name: child.name, index: i, meshes: this.generateTrack(child), points });
    });
  }

  matchVertices() {
    for (const i in this.gl.assets.models.tracks!.scene.children) {
      const child = this.gl.assets.models.tracks!.scene.children[i];
      const name = child.name;
      const mesh = child.children.find((c) => c.userData.group === 'mesh') as Mesh;
      const posAttr = mesh.geometry.attributes.position;
      this.tracksPositions[name] = new Float32Array(posAttr.count * 3);
      for (let v = 0; v < posAttr.count; v++) {
        const o = v * 3;
        if (v < posAttr.count - 1) {
          this.tracksPositions[name][o] = (posAttr.array as Float32Array)[o];
          this.tracksPositions[name][o + 1] = (posAttr.array as Float32Array)[o + 1];
          this.tracksPositions[name][o + 2] = (posAttr.array as Float32Array)[o + 2];
        } else {
          this.tracksPositions[name][o] = (posAttr.array as Float32Array)[0];
          this.tracksPositions[name][o + 1] = (posAttr.array as Float32Array)[1];
          this.tracksPositions[name][o + 2] = (posAttr.array as Float32Array)[2];
        }
      }
    }
  }

  generateTrack(trackGroup: Object3D): TrackMesh[] {
    const makeMaterial = () =>
      new ShaderMaterial({
        fragmentShader: trackFrag,
        vertexShader: trackVert,
        side: DoubleSide,
        uniforms: {
          uThickness: new Uniform(0),
          uTextureMatcap: new Uniform(this.gl.assets.textures.matcaps.track),
          uTime: new Uniform(0),
          uProgress: new Uniform(0),
          uReverse: new Uniform(1),
          uRaceDirection: trackGroup.userData.raceDirection === 'left' ? new Uniform(1) : new Uniform(-1),
        },
        transparent: true,
        visible: false,
      });
    const innerMaterial = makeMaterial();
    const outerMaterial = makeMaterial();
    const source = this.gl.assets.models.tracks!.scene
      .getObjectByName(trackGroup.name)!
      .children.find((c) => c.userData.group === 'mesh') as Mesh;
    const count = source.geometry.attributes.position.count;
    const geometry = new PlaneGeometry(1, 1, count - 1, 1);
    const pos = geometry.getAttribute('position');
    for (let v = 0; v < count; v++) {
      const o = v * 3;
      pos.setXYZ(v, this.tracksPositions[trackGroup.name][o], 0, this.tracksPositions[trackGroup.name][o + 2]);
      pos.setXYZ(
        count + v,
        this.tracksPositions[trackGroup.name][o],
        this.height,
        this.tracksPositions[trackGroup.name][o + 2]
      );
    }
    geometry.computeVertexNormals();
    this.inner = new Mesh(geometry, innerMaterial);
    this.outer = new Mesh(geometry, outerMaterial);
    if (trackGroup.userData.side === 'inner') this.outer.material.uniforms.uThickness.value = 0.035;
    else if (trackGroup.userData.side === 'outer') this.outer.material.uniforms.uThickness.value = -0.035;
    else if (trackGroup.userData.side === 'center') {
      this.inner.material.uniforms.uThickness.value = -0.0175;
      this.outer.material.uniforms.uThickness.value = 0.0175;
    }
    return [this.inner, this.outer];
  }

  addTracks() {
    for (const i in this.data)
      this.data[i].meshes.forEach((mesh) => {
        this.instance.add(mesh);
        if (this.current === Number(i)) mesh.material.visible = true;
      });
  }

  createPoints() {
    let max = 0;
    this.data.forEach((d) => {
      if (d.points.children.length > max) max = d.points.children.length;
    });
    for (let i = 0; i < max; i++) this.points.push(new TrackPoint({ htmlTarget: '[data-gl="tracks"]' }));
    this.points.forEach((p) => this.pointsGroup.add(p.object));
  }

  setPoints(index: number) {
    let cornerNum = 1;
    let drsNum = 1;
    this.points.forEach((point, i) => {
      const src = this.data[index].points.children[i];
      if (src) {
        point.object.position.copy(new Vector3(src.position.x, this.height, src.position.z));
        if (src.userData.type === 'start') {
          point.dom.innerHTML = START_SVG;
          const svg = point.dom.querySelector('svg')!;
          svg.style.height = 'auto';
        } else if (src.userData.type === 'corner') {
          point.dom.innerHTML = `
            <div class="lando-gl__point__content">
              <p class="lando-gl__point__text--top">${cornerNum.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })}</p>
              <p class="lando-gl__point__text--bottom"></p>
            </div>
          `;
          cornerNum++;
        } else if (src.userData.type === 'drs') {
          point.dom.innerHTML = `
            <div class="lando-gl__point__content lando-gl__point__content--drs">
              <p class="lando-gl__point__text--top">DRS</p>
              <p class="lando-gl__point__text--bottom">${drsNum.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })}</p>
            </div>
          `;
          drsNum++;
        }
        point.dom.style.visibility = 'visible';
      } else point.dom.style.visibility = 'hidden';
    });
  }

  getTrackIndex(name: string) {
    return this.data.findIndex((d) => d.name === name);
  }

  translate(index: number, direction: 'forward' | 'backward') {
    return new Promise<void>((resolve) => {
      void (async () => {
        if (this.isTransitioning) return;
        document.documentElement.classList.add('gl-tracks-isTransitioning');
        await this.translateOut(index, direction);
        await this.translateIn(index, direction);
        document.documentElement.classList.remove('gl-tracks-isTransitioning');
        resolve();
      })();
    });
  }

  translateOut(index: number, direction: 'forward' | 'backward') {
    return new Promise<void>((resolve) => {
      const D = window.landoGL!.params.tracksScene.TRANSITION_DURATION;
      const tl = m.timeline({
        onStart: () => {
          this.isTransitioning = true;
        },
        onComplete: () => {
          this.data[this.current].meshes.forEach((mesh) => {
            mesh.material.uniforms.uReverse.value = 1;
            mesh.material.visible = false;
          });
          this.data[index].meshes.forEach((mesh) => {
            mesh.material.visible = true;
          });
          this.current = index;
          this.setPoints(this.current);
          resolve();
        },
      });
      tl.fromTo(
        this.params,
        { progress: 0 },
        {
          progress: 1,
          duration: D / 2,
          ease: 'expo.in',
          onUpdate: () => {
            this.data[this.current].meshes.forEach((mesh) => {
              mesh.material.uniforms.uProgress.value = this.params.progress;
            });
          },
          onComplete: () => {},
        },
        0
      );
      this.data[this.current].meshes.forEach((mesh) => {
        tl.fromTo(mesh.rotation, { y: 0 }, { y: direction === 'forward' ? -Math.PI / 4 : Math.PI / 4, duration: D / 2, ease: 'expo.in' }, 0);
        tl.fromTo(mesh.rotation, { y: 0 }, { y: direction === 'forward' ? -Math.PI / 4 : Math.PI / 4, duration: D / 2, ease: 'expo.in' }, 0);
      });
      tl.fromTo(
        this.pointsGroup.rotation,
        { y: 0 },
        { y: direction === 'forward' ? -Math.PI / 4 : Math.PI / 4, duration: D / 2, ease: 'expo.in' },
        0
      );
      this.points.forEach((point, i) => {
        tl.fromTo(
          point.dom.querySelector('.lando-gl__point__content'),
          { yPercent: 0, opacity: 1 },
          { yPercent: -25, opacity: 0, duration: D / 4, delay: i * 0.015, ease: 'expo.in' },
          0
        );
      });
    });
  }

  translateIn(index: number, direction: 'forward' | 'backward') {
    return new Promise<void>((resolve) => {
      const D = window.landoGL!.params.tracksScene.TRANSITION_DURATION;
      const tl = m.timeline({
        onComplete: () => {
          this.isTransitioning = false;
          resolve();
        },
      });
      tl.fromTo(
        this.params,
        { progress: 1 },
        {
          progress: 0,
          duration: D / 2,
          ease: 'expo.out',
          onUpdate: () => {
            this.data[index].meshes.forEach((mesh) => {
              mesh.material.uniforms.uProgress.value = this.params.progress;
            });
          },
          onComplete: () => {
            this.data[index].meshes.forEach((mesh) => {
              mesh.material.uniforms.uReverse.value = 0;
            });
          },
        },
        0
      );
      this.data[index].meshes.forEach((mesh) => {
        tl.fromTo(mesh.rotation, { y: direction === 'forward' ? Math.PI / 4 : -Math.PI / 4 }, { y: 0, duration: D / 2, ease: 'expo.out' }, 0);
        tl.fromTo(mesh.rotation, { y: direction === 'forward' ? Math.PI / 4 : -Math.PI / 4 }, { y: 0, duration: D / 2, ease: 'expo.out' }, 0);
      });
      tl.fromTo(
        this.pointsGroup.rotation,
        { y: direction === 'forward' ? Math.PI / 4 : -Math.PI / 4 },
        { y: 0, duration: D / 2, ease: 'expo.out' },
        0
      );
      this.points.forEach((point, i) => {
        tl.fromTo(
          point.dom.querySelector('.lando-gl__point__content'),
          { yPercent: -25, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: D / 4, delay: i * 0.015, ease: 'expo.out' },
          0
        );
      });
    });
  }

  nextTrack() {
    const next = this.current + 1 > this.data.length - 1 ? 0 : this.current + 1;
    this.translate(next, 'forward');
  }

  prevTrack() {
    const prev = this.current - 1 < 0 ? this.data.length - 1 : this.current - 1;
    this.translate(prev, 'backward');
  }

  resize() {}

  update(bounds: { width: number; height: number }) {
    this.data[this.current].meshes.forEach((mesh) => {
      mesh.material.uniforms.uTime.value = this.gl.time.elapsed;
    });
    if (window.landoGL!.params.tracksScene.CURRENT !== this.previousCurrent) {
      const index = this.getTrackIndex(window.landoGL!.params.tracksScene.CURRENT);
      this.translate(index, 'forward');
    }
    this.previousCurrent = window.landoGL!.params.tracksScene.CURRENT;
    this.points.forEach((_p, i) => {
      if (this.data[this.current].points.children[i])
        this.points.forEach((point) => {
          const world = new Vector3();
          point.object.getWorldPosition(world);
          world.project(this.options.camera);
          const x = world.x * bounds.width * 0.5;
          const y = -world.y * bounds.height * 0.5;
          point.dom.style.transform = `translateX(${x}px) translateY(${y}px)`;
        });
    });
  }
}

/** k9 32945 */
export class TracksScene {
  id = 'tracks';
  settings: { dom: HTMLElement };
  isRendering = false;
  gl: GL;
  easedMouse: { normalized: ReturnType<GL['mouse']['createEasedNormalized']> };
  scene = new Scene();
  renderPlane: RenderPlane;
  renderTarget: WebGLRenderTarget;
  camera: PerspectiveCamera;
  tracks: Tracks;
  renderPass: RenderPass;
  bloomPass: UnrealBloomPass;
  composer: EffectComposer;
  controls!: OrbitControls;

  constructor(gl: GL, settings: { dom: HTMLElement }) {
    this.gl = gl;
    this.settings = settings;
    this.easedMouse = { normalized: this.gl.mouse.createEasedNormalized(0.05) };
    this.scene.background = new Color(1184274).convertLinearToSRGB();
    this.renderPlane = {
      mesh: new Mesh(
        new PlaneGeometry(1, 1),
        new ShaderMaterial({
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
            }
          `,
          transparent: true,
          uniforms: { tDiffuse: new Uniform(null) },
        })
      ),
      bounds: { top: 0, left: 0, width: this.gl.sizes.width, height: this.gl.sizes.height },
    };
    this.renderTarget = new WebGLRenderTarget(
      this.gl.sizes.width * this.gl.sizes.pixelRatio,
      this.gl.sizes.height * this.gl.sizes.pixelRatio,
      { samples: 2 }
    );
    this.camera = new PerspectiveCamera(1, this.gl.sizes.width / this.gl.sizes.height, 0.1, 1000);
    this.camera.position.x = 87.5;
    this.camera.position.y = 70;
    this.camera.position.z = 175;
    this.tracks = new Tracks(this.gl, { camera: this.camera });
    this.scene.add(this.tracks.instance);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.bloomPass = new UnrealBloomPass(new Vector2(this.gl.sizes.width, this.gl.sizes.height), 1.5, 0.5, 0.25);
    this.composer = new EffectComposer(this.gl.renderer.instance, this.renderTarget);
    this.composer.setSize(this.gl.sizes.width, this.gl.sizes.height);
    this.composer.setPixelRatio(this.gl.sizes.pixelRatio);
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);
    this.composer.renderToScreen = false;
    this.setOrbitControls();
    this.setIsRendering();
    this.getBounds();
    this.setScroll();
  }

  setOrbitControls() {
    this.controls = new OrbitControls(this.camera, this.settings.dom);
    this.controls.enableDamping = true;
    this.controls.enableZoom = false;
    this.controls.minPolarAngle = Math.PI / 2.5;
    this.controls.maxPolarAngle = Math.PI / 2.5;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = window.landoGL!.params.tracksScene.AUTOROTATE_SPEED;
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
          start: () => `center-=${this.gl.sizes.height} top+=${this.gl.sizes.height / 2}`,
          end: () => `center+=${this.gl.sizes.height} top+=${this.gl.sizes.height / 2}`,
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

  setIsRendering() {
    TA.create({
      trigger: this.settings.dom,
      start: () => `top-=${this.gl.sizes.height / 2} bottom`,
      end: () => `bottom+=${this.gl.sizes.height / 2} top`,
      invalidateOnRefresh: true,
      refreshPriority: -99,
      onEnter: () => {
        this.isRendering = true;
      },
      onEnterBack: () => {
        this.isRendering = true;
      },
      onLeave: () => {
        this.isRendering = false;
      },
      onLeaveBack: () => {
        this.isRendering = false;
      },
    });
  }

  resize() {
    this.renderTarget.setSize(
      this.gl.sizes.width * this.gl.sizes.pixelRatio,
      this.gl.sizes.height * this.gl.sizes.pixelRatio
    );
    this.composer.setPixelRatio(this.gl.sizes.pixelRatio);
    this.composer.setSize(this.gl.sizes.width, this.gl.sizes.height);
    this.tracks.resize();
    this.getBounds();
    this.setScenePlaneDimensions();
  }

  setScenePlaneDimensions() {
    this.renderPlane.mesh.position.set(
      this.renderPlane.bounds.left - this.gl.sizes.width / 2 + this.renderPlane.bounds.width / 2,
      -this.renderPlane.bounds.top,
      0
    );
    this.renderPlane.mesh.scale.set(this.renderPlane.bounds.width, this.renderPlane.bounds.height, 1);
    const aspect = this.renderPlane.bounds.width / this.renderPlane.bounds.height;
    const base = 1 * (Math.PI / 180);
    const fov = 2 * Math.atan(Math.tan(base / 2) / aspect) * (180 / Math.PI);
    this.camera.fov = fov;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  renderPipeline() {
    if (!this.isRendering) return;
    this.composer.render();
    this.renderPlane.mesh.material.uniforms.tDiffuse.value = (this.composer as EffectComposer & { readBuffer: WebGLRenderTarget }).readBuffer.texture;
  }

  update() {
    if (!this.isRendering) return;
    if (this.renderPlane.bounds) this.tracks.update(this.renderPlane.bounds);
    this.controls.update();
  }
}
