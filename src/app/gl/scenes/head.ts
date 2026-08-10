/**
 * Head scene group — sources:
 * W9 HeadDefault 30715-30811; o5 lensFlare 30947-31011; i5 disco mat 31016-31091;
 * I8 DiscoController 31097-31158; F9 Helmet 31165-31373; N9 Lights 31382-31387;
 * R9 random-Google flag 30939-30942; O9 HeadScene 31392-32001.
 * All GLSL verbatim.
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
  Color,
  Vector3,
  WebGLRenderTarget,
  InstancedMesh,
  InstancedBufferAttribute,
  Object3D,
  HemisphereLight,
  PointLight,
  DoubleSide,
  AdditiveBlending,
  type Texture,
  type IUniform,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { gsap as m, ScrollTrigger as TA } from '../../gsap';
import type { GL } from '../core/app';

/** R9 30939-30942 — 50% chance the variant boots as "Google" */
export const randomGoogleVariant = Math.random() > 0.5;

/* ---------------- W9 HeadDefault ---------------- */
export class HeadDefault {
  gl: GL;
  settings: { camera: PerspectiveCamera };
  params = { movement: { intensity: 0.075, ease: 0.025 } };
  mouse: { normalized: ReturnType<GL['mouse']['createEasedNormalized']> };
  geometry: PlaneGeometry;
  material: MeshStandardMaterial;
  uniforms: Record<string, IUniform>;
  instance: Mesh;

  constructor(gl: GL, settings: { camera: PerspectiveCamera }) {
    this.gl = gl;
    this.settings = settings;
    this.mouse = { normalized: this.gl.mouse.createEasedNormalized(this.params.movement.ease) };
    this.geometry = new PlaneGeometry(1, 1, 128, 128);
    const tex = this.gl.assets.textures;
    this.material = new MeshStandardMaterial({
      displacementMap: tex.head.depth,
      displacementScale: 0.25,
      alphaMap: tex.head.alpha,
      transparent: true,
      normalMap: tex.head.normal,
      roughnessMap: tex.head.roughness,
      metalnessMap: tex.head.roughness,
    });
    this.uniforms = {
      uProjectorMatrix: new Uniform(this.settings.camera.projectionMatrix),
      uProjectorViewMatrix: new Uniform(this.settings.camera.matrixWorldInverse),
      uHelmetHover: new Uniform(0),
      tCursorEffect: new Uniform(null),
      tDefaultDiffuse: new Uniform(tex.head.diffuse),
      tShadowDiffuse: new Uniform(tex.head.shadow.softerEdit),
    };
    this.material.onBeforeCompile = (shader) => {
      shader.defines!.USE_UV = '';
      shader.uniforms.uProjectorMatrix = this.uniforms.uProjectorMatrix;
      shader.uniforms.uProjectorViewMatrix = this.uniforms.uProjectorViewMatrix;
      shader.uniforms.uHelmetHover = this.uniforms.uHelmetHover;
      shader.uniforms.tCursorEffect = this.uniforms.tCursorEffect;
      shader.uniforms.tDefaultDiffuse = this.uniforms.tDefaultDiffuse;
      shader.uniforms.tShadowDiffuse = this.uniforms.tShadowDiffuse;
      shader.vertexShader = shader.vertexShader.replace(
        'varying vec3 vViewPosition;',
        `
          uniform mat4 uProjectorMatrix;
          uniform mat4 uProjectorViewMatrix;

          varying vec3 vViewPosition;
          varying vec4 vTexCoords;
          varying vec3 worldPosition;
        `
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <fog_vertex>',
        `
          #include <fog_vertex>

          vTexCoords = projectionMatrix * mvPosition;
        `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
          #include <common>
          varying vec4 vTexCoords;

          uniform float uHelmetHover;

          uniform sampler2D tCursorEffect;
          uniform sampler2D tDefaultDiffuse;
          uniform sampler2D tShadowDiffuse;


        `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        `

          /*
            UVs
          */
          vec2 cameraUv = vTexCoords.xy / vTexCoords.w; // Convert to screen space
          cameraUv = cameraUv * 0.5 + 0.5; // Transform to [0,1] range

          /*
            Helmet Hover
          */
          float hoverTransition = cameraUv.y + sin(cameraUv.x * PI) * sin(uHelmetHover * PI) * 0.2;

          /*
            Texture Cursor Effect
          */
          vec4 textureCursorEffect = texture2D(tCursorEffect, vec2(cameraUv.x, 0.025 + cameraUv.y * 0.95)); // Gap fix on bottom and top
          textureCursorEffect.rgb = 1.0 - textureCursorEffect.rgb;

          float cursorEffect = step(0.1, textureCursorEffect.r);

          /*
            Texture Shadow Diffuse
          */
          vec4 textureDefaultDiffuse = texture2D(tDefaultDiffuse, vUv);
          vec4 textureShadowDiffuse = texture2D(tShadowDiffuse, vUv);

          /*
            Color
          */
          vec3 color = mix(textureDefaultDiffuse.rgb, textureShadowDiffuse.rgb, min(cursorEffect + step(1.0 - hoverTransition, uHelmetHover), 1.0));

          vec4 diffuseColor = vec4( color, opacity );

        `
      );
    };
    this.instance = new Mesh(this.geometry, this.material);
  }

  resize() {}

  update(helmetReveal: number, scrollProgress: number) {
    this.mouse.normalized.update(this.gl.time.delta);
    this.instance.rotation.y = this.mouse.normalized.value.x * this.params.movement.intensity * helmetReveal;
    if (this.gl.sizes.width > 768)
      this.instance.rotation.x =
        this.mouse.normalized.value.y * -1 * this.params.movement.intensity * helmetReveal * (1 - scrollProgress);
    this.uniforms.tCursorEffect.value = this.gl.world!.fluidCursor.sourceTarget.texture;
  }
}

/* ---------------- o5 lens flare material ---------------- */
export function createLensFlareMaterial(gl: GL) {
  const material = new ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    transparent: true,
    blending: AdditiveBlending,
    uniforms: {
      uHelmetRotation: new Uniform(new Vector3(0, 0, 0)),
      uCameraRotation: new Uniform(new Vector3(0, 0, 0)),
      uTransition: new Uniform(0),
      tLensFlare: new Uniform(gl.assets.textures.disco.lensFlare),
    },
    vertexShader: `
      attribute float aRandom;

      varying vec2 vUv;
      varying float vDot;
      varying vec3 vNormal;

      uniform vec3 uHelmetRotation;
      uniform vec3 uCameraRotation;


      void main() {
        vec3 n = normalize(normalMatrix * mat3(instanceMatrix) * normal);

        // Scale instance Matrix
        mat4 scaleMatrix = mat4(
          vec4(1.0, 0.0, 0.0, 0.0),
          vec4(0.0, 1.0, 0.0, 0.0),
          vec4(0.0, 0.0, 1.0, 0.0),
          vec4(0.0, 0.0, 0.0, 1.0)
        );

        scaleMatrix[0][0] = aRandom;

        gl_Position = projectionMatrix * (modelViewMatrix * instanceMatrix * mat4(0.5 + aRandom * 0.5) * vec4(0.0, 0.0, 0.0, 1.0) + vec4(position.x, position.y, 0.0, 0.0));


        vNormal = n;
        vDot = smoothstep(0.9, 0.95, dot(n, vec3(0.0, 0.0, 1.0)));
        vUv = uv;
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vDot;
      varying vec3 vNormal;

      uniform sampler2D tLensFlare;
      uniform float uTransition;

      void main() {
        vec4 textureLensFlare = texture2D(tLensFlare, vUv);

        gl_FragColor = vec4(textureLensFlare.rgb, vDot * textureLensFlare.a * 0.95 * uTransition);
      }
    `,
  });
  material.customProgramCacheKey = () => Math.random().toString();
  return material;
}

/* ---------------- i5 disco ball material ---------------- */
export function createDiscoMaterial(gl: GL, opts: { envMapIntensity?: number; matcapIntensity?: number; brightness?: number } = {}) {
  const material = new MeshStandardMaterial({
    color: new Color(0xffffff),
    envMap: gl.assets.hdri.light,
    envMapIntensity: opts.envMapIntensity != null ? opts.envMapIntensity : 1.5,
    roughness: 0,
    metalness: 0.9,
    transparent: true,
  });
  const uniforms = {
    tDiscoMask: new Uniform(gl.assets.textures.disco.mask),
    tDiscoMatcap: new Uniform(gl.assets.textures.disco.matcap),
    uTime: new Uniform(0),
    uMatcapIntensity: new Uniform(opts.matcapIntensity != null ? opts.matcapIntensity : 0.5),
    uTransitionIn: new Uniform(0),
    uTransitionOut: new Uniform(0),
    uBrightness: new Uniform(opts.brightness),
  };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.tDiscoMask = uniforms.tDiscoMask;
    shader.uniforms.tDiscoMatcap = uniforms.tDiscoMatcap;
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uMatcapIntensity = uniforms.uMatcapIntensity;
    shader.uniforms.uTransitionIn = uniforms.uTransitionIn;
    shader.uniforms.uTransitionOut = uniforms.uTransitionOut;
    shader.uniforms.uBrightness = uniforms.uBrightness;
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
        #include <fog_vertex>

        vLocalPosition = position.xyz;
        vWorldPosition = worldPosition.xyz;
        vUv = uv;
      `
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `
        #include <common>
        #include <rotateUV>

        uniform sampler2D tDiscoMask;
        uniform sampler2D tDiscoMatcap;

        uniform float uMatcapIntensity;
        uniform float uTime;
        uniform float uTransitionIn;
        uniform float uTransitionOut;
        uniform float uBrightness;

        varying vec2 vUv;
        varying vec3 vLocalPosition;
        varying vec3 vWorldPosition;
      `
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
        #include <dithering_fragment>

        /*
          Matcap
        */
        vec3 viewDirection = normalize(vViewPosition);
        vec3 x = normalize( vec3( viewDirection.z, 0.0, -viewDirection.x ) );
        vec3 y = cross( viewDirection, x );
        vec2 matcapUV = vec2( dot( x, vNormal ), dot( y, vNormal ) ) * 0.495 + 0.5;

        float mask = texture2D(tDiscoMask, vUv).r;
        vec3 matcapTexture = texture2D(tDiscoMatcap, matcapUV).rgb;

        /*
          Transition
        */
        float transition = vLocalPosition.y;

        /*
          Color
        */
        vec3 color = mix(max(matcapTexture, vec3(0.0, 0.114, 0.144)) * outgoingLight * uBrightness, vec3(1.0), mask);

        gl_FragColor = vec4(color, step(mix(0.0425, -0.0425, uTransitionIn), transition) - step(mix(0.0425, -0.0425, uTransitionOut), transition));
      `
    );
  };
  material.customProgramCacheKey = () => Math.random().toString();
  (material as MeshStandardMaterial & { uniforms: typeof uniforms }).uniforms = uniforms;
  return material as MeshStandardMaterial & { uniforms: typeof uniforms };
}

/* ---------------- I8 disco easter egg ---------------- */
export class DiscoController {
  gl: GL;
  instance = new Group();
  direction = -1;
  invertOut: boolean;
  discoMesh: Mesh & { material: ReturnType<typeof createDiscoMaterial> };
  lensFlareMaterial: ShaderMaterial;
  lensFlaresEmpties: Object3D[];
  lensFlareInstancedMesh: InstancedMesh;
  lensFlareDummy = new Object3D();
  targetWord = 'disco';
  typedChars = '';
  lastTypedTime = 0;
  timeout = 5000;

  constructor(gl: GL, parent: Object3D, invertOut = false, brightness = 1) {
    this.gl = gl;
    parent.add(this.instance);
    this.invertOut = invertOut;
    this.discoMesh = this.gl.assets.models.disco!.scene.children[0].clone() as Mesh & {
      material: ReturnType<typeof createDiscoMaterial>;
    };
    this.discoMesh.visible = false;
    this.discoMesh.material = createDiscoMaterial(this.gl, { brightness });
    this.instance.add(this.discoMesh);
    this.lensFlareMaterial = createLensFlareMaterial(this.gl);
    this.lensFlaresEmpties = this.discoMesh.children;
    this.lensFlareInstancedMesh = new InstancedMesh(
      new PlaneGeometry(0.5, 0.5),
      this.lensFlareMaterial,
      this.lensFlaresEmpties.length
    );
    this.lensFlareInstancedMesh.renderOrder = 99;
    this.lensFlareInstancedMesh.visible = false;
    const randoms = new Float32Array(this.lensFlaresEmpties.length);
    for (let i = 0; i < this.lensFlaresEmpties.length; i++) randoms[i] = Math.random();
    this.lensFlareInstancedMesh.geometry.setAttribute('aRandom', new InstancedBufferAttribute(randoms, 1));
    this.lensFlaresEmpties.forEach((empty, i) => {
      this.lensFlareDummy.rotation.copy(empty.rotation);
      this.lensFlareDummy.position.copy(empty.position);
      const s = 0.01;
      this.lensFlareDummy.scale.set(s, s, s);
      this.lensFlareDummy.updateMatrix();
      this.lensFlareInstancedMesh.setMatrixAt(i, this.lensFlareDummy.matrix);
    });
    this.instance.add(this.lensFlareInstancedMesh);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.startListening();
  }

  startListening() {
    document.addEventListener('keypress', this.handleKeyPress);
  }
  stopListening() {
    document.removeEventListener('keypress', this.handleKeyPress);
  }

  handleKeyPress(e: KeyboardEvent) {
    const now = Date.now();
    if (now - this.lastTypedTime > this.timeout) this.typedChars = '';
    this.lastTypedTime = now;
    this.typedChars += e.key.toLowerCase();
    if (this.typedChars.length > this.targetWord.length)
      this.typedChars = this.typedChars.slice(-this.targetWord.length);
    if (this.typedChars === this.targetWord) {
      this.direction = this.direction === -1 ? 1 : -1;
      this.transition(this.direction);
      document.dispatchEvent(new CustomEvent('disco', { detail: { direction: this.direction } }));
      this.typedChars = '';
    }
  }

  transition(direction: number) {
    if (direction === 1) {
      document.documentElement.classList.add('gl__is-disco');
      this.discoMesh.visible = true;
      this.lensFlareInstancedMesh.visible = true;
      m.to(this.discoMesh.material.uniforms.uTransitionIn, { value: 1, duration: 2, ease: 'expo.inOut' });
      m.to(this.lensFlareMaterial.uniforms.uTransition, { value: 1, duration: 2, ease: 'expo.inOut' });
    } else {
      document.documentElement.classList.remove('gl__is-disco');
      if (this.invertOut)
        m.to(this.discoMesh.material.uniforms.uTransitionOut, {
          value: 1,
          duration: 2,
          ease: 'expo.inOut',
          onComplete: () => {
            this.discoMesh.visible = false;
            this.lensFlareInstancedMesh.visible = false;
            this.discoMesh.material.uniforms.uTransitionIn.value = 0;
            this.discoMesh.material.uniforms.uTransitionOut.value = 0;
          },
        });
      else m.to(this.discoMesh.material.uniforms.uTransitionIn, { value: 0, duration: 2, ease: 'expo.inOut' });
      m.to(this.lensFlareMaterial.uniforms.uTransition, { value: 0, duration: 2, ease: 'expo.inOut' });
    }
  }
}

/* ---------------- F9 helmet ---------------- */
export class Helmet {
  gl: GL;
  settings: { scene: Scene; camera: PerspectiveCamera };
  instance: Group;
  uniforms: Record<string, IUniform>;
  helmetMaterial: MeshStandardMaterial;
  glassMaterial: MeshStandardMaterial;
  plasticMaterial: MeshMatcapMaterial;
  helmetMesh?: Mesh;
  glassMesh?: Mesh;
  plasticMesh?: Mesh;
  scene = new Scene();
  renderTarget: WebGLRenderTarget;
  wireframeMeshMaterial: ShaderMaterial;
  wireframeMesh: Mesh;
  disco: DiscoController;

  constructor(gl: GL, settings: { scene: Scene; camera: PerspectiveCamera }) {
    this.gl = gl;
    this.settings = settings;
    const assets = this.gl.assets;
    this.instance = assets.models.helmet!.scene.clone();
    this.instance.scale.set(6.9, 6.9, 7.1);
    this.uniforms = {
      // tMask references a manifest key that doesn't exist (source quirk -> undefined)
      tMask: new Uniform((assets.textures.helmet as unknown as { mask?: Texture }).mask),
      uTime: new Uniform(0),
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
      envMapIntensity: 3,
    });
    this.glassMaterial = new MeshStandardMaterial({
      map: assets.textures.glass.base,
      roughnessMap: assets.textures.glass.roughness,
      normalMap: assets.textures.glass.normal,
      metalnessMap: assets.textures.helmet.metallic,
      envMap: assets.hdri.light,
      envMapIntensity: 1.5,
    });
    this.plasticMaterial = new MeshMatcapMaterial({
      transparent: true,
      opacity: 0.25,
      matcap: assets.textures.plastic.matcap,
      side: DoubleSide,
    });
    this.instance.children.forEach((child) => {
      const meshChild = child as Mesh;
      if (child.name === 'helmet') {
        this.helmetMesh = meshChild;
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

              vec3 color = mix(textureNext.rgb, textureCurrent.rgb, step(transition, mix(0.05, -0.05, uHelmetTransition)));

              if (gl_FrontFacing) {
                diffuseColor = vec4(color, opacity);
              }
            `
          );
        };
      }
      if (child.name === 'glass') {
        this.glassMesh = meshChild;
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
        this.plasticMesh = meshChild;
        meshChild.renderOrder = 1;
        meshChild.material = this.plasticMaterial;
      }
    });
    this.scene.add(this.instance);
    this.renderTarget = new WebGLRenderTarget(
      this.gl.sizes.width * this.gl.sizes.pixelRatio,
      this.gl.sizes.height * this.gl.sizes.pixelRatio,
      { samples: 2 }
    );
    this.wireframeMeshMaterial = new ShaderMaterial({
      wireframe: true,
      transparent: true,
      uniforms: {
        uTime: new Uniform(0),
        uIsWireframeAnimating: new Uniform(window.landoGL!.params.headScene.IS_WIREFRAME_ANIMATING),
        uOpacity: new Uniform(1),
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;

        void main()
        {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

          vUv = uv;
          vPosition = position;
        }
      `,
      fragmentShader: `
        #include <simplex>

        varying vec2 vUv;
        varying vec3 vPosition;

        uniform float uTime;
        uniform float uOpacity;
        uniform bool uIsWireframeAnimating;

        void main() {
          float scanEffect = 0.1;

          if (uIsWireframeAnimating) {
            scanEffect = pow(fract(-vPosition.y * 10. - uTime), 4.) * 0.1;
          }

          gl_FragColor = vec4(vec3(0.0), scanEffect * uOpacity);
        }
      `,
    });
    const wireframeGeometries: PlaneGeometry[] = [];
    assets.models.helmet!.scene.clone().children.forEach((child) => {
      wireframeGeometries.push((child as Mesh).geometry as PlaneGeometry);
    });
    const merged = mergeGeometries(wireframeGeometries);
    this.wireframeMesh = new Mesh(merged, this.wireframeMeshMaterial);
    this.wireframeMesh.position.copy(this.instance.position);
    this.wireframeMesh.scale.copy(this.instance.scale);
    this.settings.scene.add(this.wireframeMesh);
    this.disco = new DiscoController(this.gl, this.instance, false, 1);
    document.addEventListener('disco', (e) => {
      this.animateInDisco((e as CustomEvent<{ direction: number }>).detail.direction);
    });
    window.landoGL!.params.headScene.VARIANT = randomGoogleVariant
      ? 'Google'
      : this.gl.time.getVariantAccordingToTime();
    this.setVariant(window.landoGL!.params.headScene.VARIANT as string);
  }

  animateInDisco(direction: number) {
    if (direction === 1) m.to(this.uniforms.uHelmetTransition, { value: 1, duration: 2, ease: 'expo.inOut' });
    else m.to(this.uniforms.uHelmetTransition, { value: 0, duration: 2, ease: 'expo.inOut' });
  }

  setVariant(variant: string) {
    const tex = this.gl.assets.textures.helmet;
    type Irid = MeshStandardMaterial & { iridescence: number };
    if (variant === 'Lime') {
      this.uniforms.tCurrentTexture.value = tex.diffuseLime;
      this.helmetMaterial.envMapIntensity = 3;
      (this.helmetMaterial as Irid).iridescence = 0;
      this.helmetMaterial.needsUpdate = true;
    } else if (variant === 'Dark') {
      this.uniforms.tCurrentTexture.value = tex.diffuseDark;
      this.helmetMaterial.envMapIntensity = 3;
      (this.helmetMaterial as Irid).iridescence = 0;
      this.helmetMaterial.needsUpdate = true;
    } else if (variant === 'Disco') {
      this.uniforms.tCurrentTexture.value = tex.diffuseDisco;
      this.helmetMaterial.envMapIntensity = 1.5;
      (this.helmetMaterial as Irid).iridescence = 0;
      this.helmetMaterial.needsUpdate = true;
    } else if (variant === 'Grid') {
      this.uniforms.tCurrentTexture.value = tex.diffuseGrid;
      this.helmetMaterial.envMapIntensity = 3;
      (this.helmetMaterial as Irid).iridescence = 0;
      this.helmetMaterial.needsUpdate = true;
    } else if (variant === 'Google') {
      this.uniforms.tCurrentTexture.value = tex.diffuseGoogle;
      this.helmetMaterial.envMapIntensity = 3;
      (this.helmetMaterial as Irid).iridescence = 0;
      this.helmetMaterial.needsUpdate = true;
    }
  }

  setHDRI(variant: string) {
    if (variant === 'Light') {
      this.helmetMaterial.envMap = this.gl.assets.hdri.light;
      this.helmetMaterial.needsUpdate = true;
      this.glassMaterial.envMap = this.gl.assets.hdri.light;
      this.glassMaterial.needsUpdate = true;
    } else if (variant === 'Dark') {
      this.helmetMaterial.envMap = this.gl.assets.hdri.dark;
      this.helmetMaterial.needsUpdate = true;
      this.glassMaterial.envMap = this.gl.assets.hdri.dark;
      this.glassMaterial.needsUpdate = true;
    }
  }

  resize() {
    this.renderTarget.setSize(
      this.gl.sizes.width * this.gl.sizes.pixelRatio,
      this.gl.sizes.height * this.gl.sizes.pixelRatio
    );
  }

  update() {
    this.gl.renderer.instance.setRenderTarget(this.renderTarget);
    this.gl.renderer.instance.render(this.scene, this.settings.camera);
    this.gl.renderer.instance.clear();
    this.uniforms.uTime.value = this.gl.time.elapsed;
    this.wireframeMeshMaterial.uniforms.uTime.value = this.gl.time.elapsed;
    this.wireframeMesh.rotation.copy(this.instance.rotation);
  }
}

/* ---------------- N9 lights ---------------- */
export class LightingDefault {
  gl: GL;
  instance = new Group();
  hemisphereLight = new HemisphereLight(0xffffff, 0x000000, 2.5);
  pointLight = new PointLight(0xffffff, 2.5);

  constructor(gl: GL) {
    this.gl = gl;
    this.instance.add(this.hemisphereLight);
    this.pointLight.position.x = -0.75;
    this.pointLight.position.y = 0.2;
    this.pointLight.position.z = 0.4;
    this.instance.add(this.pointLight);
  }
  update() {}
}

/* ---------------- O9 head scene ---------------- */
export interface RenderPlane {
  mesh: Mesh<PlaneGeometry, ShaderMaterial>;
  bounds: { top: number; left: number; width: number; height: number };
}

export class HeadScene {
  id = 'head';
  isRendering = false;
  isDisco = false;
  scrollProgress = 0;
  helmetRevealValue = 1;
  target = document.querySelector<HTMLElement>('[data-sticky-hero="target"]')!;
  gl: GL;
  settings: { dom: HTMLElement };
  easedMouse: {
    normalized: ReturnType<GL['mouse']['createEasedNormalized']>;
    pace: ReturnType<GL['mouse']['createEasedPace']>;
  };
  params = { movement: { intensity: 0.075, ease: 0.025 } };
  defaultScene = new Scene();
  renderPlane: RenderPlane;
  defaultRenderTarget: WebGLRenderTarget;
  cameraTransformGroup = new Group();
  camera: PerspectiveCamera;
  headDefault: HeadDefault;
  helmet: Helmet;
  lightingDefault: LightingDefault;
  scene?: Scene;
  renderTarget?: WebGLRenderTarget;

  constructor(gl: GL, settings: { dom: HTMLElement }) {
    this.gl = gl;
    this.settings = settings;
    this.easedMouse = {
      normalized: this.gl.mouse.createEasedNormalized(0.025),
      pace: this.gl.mouse.createEasedPace(0.01),
    };
    const p = window.landoGL!.params.headScene;
    this.renderPlane = {
      mesh: new Mesh(
        new PlaneGeometry(1, 1),
        new ShaderMaterial({
          uniforms: {
            uAspect: new Uniform(this.gl.sizes.width / this.gl.sizes.height),
            uTime: new Uniform(0),
            uReveal: new Uniform(window.landoGL!.reveal),
            uColorHover: new Uniform(new Color(0)),
            uHover: new Uniform(0),
            uHelmetHover: new Uniform(0),
            uFilter: new Uniform(0),
            uCursorIntensity: new Uniform(0),
            tFluid: new Uniform(null),
            tDefaultDiffuse: new Uniform(null),
            tHelmet: new Uniform(null),
            tCursorEffect: new Uniform(null),
            tBackgroundNoise: new Uniform(null),
            tNoise: new Uniform(this.gl.assets.textures.noise.texture),
            OUTLINE: new Uniform(p.OUTLINE),
            SHOW_HELMET_PERMANENTLY: new Uniform(p.SHOW_HELMET_PERMANENTLY),
            THICKNESS: new Uniform(p.THICKNESS),
            COLOR_OUTLINE: new Uniform(new Color(p.COLOR_OUTLINE as string).convertLinearToSRGB()),
            COLOR_FOREGROUND: new Uniform(new Color(p.COLOR_FOREGROUND as string).convertLinearToSRGB()),
            COLOR_BACKGROUND: new Uniform(new Color(p.COLOR_BACKGROUND as string).convertLinearToSRGB()),
            COLOR_CURSOR_FOREGROUND: new Uniform(new Color(p.COLOR_CURSOR_FOREGROUND as string).convertLinearToSRGB()),
            COLOR_CURSOR_BACKGROUND: new Uniform(new Color(p.COLOR_CURSOR_BACKGROUND as string).convertLinearToSRGB()),
            COLOR_CURSOR_OUTLINE: new Uniform(new Color(p.COLOR_CURSOR_OUTLINE as string).convertLinearToSRGB()),
            COLOR_FILTER: new Uniform(new Color(p.COLOR_FILTER as string).convertLinearToSRGB()),
            SCALE: new Uniform(p.SCALE),
            SPEED: new Uniform(p.SPEED),
            DISTORT_SCALE: new Uniform(p.DISTORT_SCALE),
            DISTORT_INTENSITY: new Uniform(p.DISTORT_INTENSITY),
            NOISE_DETAIL: new Uniform(p.NOISE_DETAIL),
            CURSOR_INTENSITY: new Uniform(p.CURSOR_INTENSITY),
            CURSOR_SCALE: new Uniform(p.CURSOR_SCALE),
            CURSOR_BOUNCE: new Uniform(p.CURSOR_BOUNCE),
            REVEAL_SIZE: new Uniform(p.REVEAL_SIZE),
          },
          vertexShader: `
            varying vec2 vUv;

            void main() {
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

              vUv = uv;
            }
          `,
          fragmentShader: HEAD_COMPOSITE_FRAG,
          transparent: true,
        })
      ),
      bounds: { top: 0, left: 0, width: this.gl.sizes.width, height: this.gl.sizes.height },
    };
    this.renderPlane.mesh.renderOrder = 3;
    this.defaultRenderTarget = new WebGLRenderTarget(
      this.gl.sizes.width * this.gl.sizes.pixelRatio,
      this.gl.sizes.height * this.gl.sizes.pixelRatio,
      { samples: 1 }
    );
    this.camera = new PerspectiveCamera(15, this.gl.sizes.width / this.gl.sizes.height, 0.1, 1000);
    this.cameraTransformGroup.add(this.camera);
    this.defaultScene.add(this.cameraTransformGroup);
    this.headDefault = new HeadDefault(this.gl, { camera: this.camera });
    this.defaultScene.add(this.headDefault.instance);
    this.helmet = new Helmet(this.gl, { scene: this.defaultScene, camera: this.camera });
    document.addEventListener('disco', (e) => {
      const detail = (e as CustomEvent<{ direction: number }>).detail;
      this.hoverAnimation(detail.direction);
      if (detail.direction === 1) this.isDisco = true;
      else this.isDisco = false;
    });
    this.lightingDefault = new LightingDefault(this.gl);
    this.defaultScene.add(this.lightingDefault.instance);
    this.hover();
    this.helmetHover();
    this.responsive();
    this.transition();
    this.setScroll();
    this.setIsRendering();
  }

  setIsRendering() {
    TA.create({
      trigger: '[data-gl-track="head"]',
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

  hover() {
    const els = document.querySelectorAll<HTMLElement>('[data-gl-hover]');
    if (els.length > 0)
      els.forEach((el) => {
        el.addEventListener('mouseenter', () => {
          this.animateColor(
            this.renderPlane.mesh.material.uniforms.uColorHover.value as Color,
            new Color(el.dataset.glHover).convertLinearToSRGB(),
            0.25,
            undefined,
            (c: Color) => {
              this.renderPlane.mesh.material.uniforms.uColorHover.value = c;
            }
          );
          m.to(this.renderPlane.mesh.material.uniforms.uHover, { value: 1, duration: 0.5, ease: 'power4.inOut' });
        });
        el.addEventListener('mouseleave', () => {
          m.to(this.renderPlane.mesh.material.uniforms.uHover, { value: 0, duration: 0.5, ease: 'power4.inOut' });
        });
      });
  }

  animateColor(
    from: Color,
    to: Color,
    duration = 0.25,
    ease: string | undefined,
    onUpdate: (c: Color) => void
  ) {
    const proxy = { value: 0 };
    const scratch = new Color();
    m.fromTo(
      proxy,
      { value: 0 },
      {
        value: 1,
        ease,
        duration,
        onUpdate: () => {
          onUpdate(scratch.lerpColors(from, to, proxy.value));
        },
      }
    );
  }

  helmetHover() {
    this.helmetRevealValue = 1;
    const els = document.querySelectorAll('[data-gl-helmet="hover"]');
    if (els.length > 0)
      els.forEach((el) => {
        el.addEventListener('mouseenter', () => {
          if (this.isDisco) return;
          this.hoverAnimation(1, true);
        });
        el.addEventListener('mouseleave', () => {
          if (this.isDisco) return;
          this.hoverAnimation(0);
        });
      });
  }

  hoverAnimation(direction: number, freezeReveal = false) {
    if (direction === 1) {
      m.to(this.renderPlane.mesh.material.uniforms.uHelmetHover, {
        value: 1,
        duration: 1.5,
        ease: 'expo.inOut',
        overwrite: true,
        onUpdate: () => {
          this.headDefault.uniforms.uHelmetHover.value = this.renderPlane.mesh.material.uniforms.uHelmetHover.value;
        },
      });
      if (freezeReveal)
        m.to(this, { helmetRevealValue: 0, duration: 1.5, ease: 'power1.inOut', overwrite: true });
    } else {
      m.to(this.renderPlane.mesh.material.uniforms.uHelmetHover, {
        value: 0,
        duration: 1,
        ease: 'expo.inOut',
        overwrite: true,
        onUpdate: () => {
          this.headDefault.uniforms.uHelmetHover.value = this.renderPlane.mesh.material.uniforms.uHelmetHover.value;
        },
      });
      m.to(this, { helmetRevealValue: 1, duration: 1, ease: 'power1.inOut', overwrite: true });
    }
  }

  responsive() {
    if (this.gl.sizes.width > 768) {
      this.camera.position.z = 3;
      this.headDefault.instance.position.y = 0;
      this.helmet.instance.position.y = 0.05;
      this.helmet.wireframeMesh.position.y = 0.05;
    } else {
      this.camera.position.z = 3.75;
      this.headDefault.instance.position.y = -0.05;
      this.helmet.instance.position.y = 0;
      this.helmet.wireframeMesh.position.y = 0;
    }
  }

  transition() {
    m.registerPlugin(TA);
    m.fromTo(
      this.cameraTransformGroup.position,
      { z: 0 },
      {
        z: -1,
        ease: 'power1.inOut',
        scrollTrigger: {
          trigger: '[data-gl-track="head"]',
          scrub: true,
          start: () => 'top top',
          end: () => `top+=${this.gl.sizes.height} top`,
        },
      }
    );
    m.fromTo(
      this.renderPlane.mesh.material.uniforms.uFilter,
      { value: 0 },
      {
        value: 1,
        duration: 0.25,
        ease: 'power1.inOut',
        scrollTrigger: {
          trigger: '[data-gl-track="head"]',
          scrub: true,
          start: () => 'top top',
          end: () => `top+=${this.gl.sizes.height} top`,
        },
      }
    );
    m.fromTo(
      this.cameraTransformGroup.position,
      { y: 0 },
      {
        y: 0.1,
        ease: 'power1.inOut',
        scrollTrigger: {
          trigger: '[data-gl-track="head"]',
          scrub: true,
          start: () => 'bottom bottom',
          end: () => `bottom+=${this.gl.sizes.height} bottom`,
        },
      }
    );
    m.fromTo(
      this.renderPlane.mesh.material.uniforms.uCursorIntensity,
      { value: 1 },
      {
        value: 0,
        duration: 0.25,
        ease: 'power1.inOut',
        scrollTrigger: {
          trigger: '[data-gl-track="head"]',
          toggleActions: 'play none none reverse',
          start: () => `top+=${this.gl.sizes.height / 2.25} top`,
          end: () => `top+=${this.gl.sizes.height / 2.25} top`,
        },
      }
    );
    m.fromTo(
      this.helmet.wireframeMeshMaterial.uniforms.uOpacity,
      { value: 1 },
      {
        value: 0,
        duration: 0.25,
        ease: 'power1.inOut',
        scrollTrigger: {
          trigger: '[data-gl-track="head"]',
          toggleActions: 'play none none reverse',
          start: () => `top+=${this.gl.sizes.height / 2.25} top`,
          end: () => `top+=${this.gl.sizes.height / 2.25} top`,
        },
      }
    );
    m.fromTo(
      this.renderPlane.bounds,
      { width: () => this.gl.sizes.width, height: () => this.gl.sizes.height },
      {
        width: () => this.target.offsetWidth,
        height: () => this.target.offsetHeight,
        ease: 'power1.inOut',
        scrollTrigger: {
          trigger: '[data-gl-track="head"]',
          scrub: true,
          invalidateOnRefresh: true,
          start: () => 'top top',
          end: () => `top+=${this.gl.sizes.height} top`,
          onUpdate: (self) => {
            this.scrollProgress = self.progress;
            this.setScenePlaneDimensions();
          },
        },
      }
    );
  }

  resize() {
    this.defaultRenderTarget.setSize(
      this.gl.sizes.width * this.gl.sizes.pixelRatio,
      this.gl.sizes.height * this.gl.sizes.pixelRatio
    );
    this.headDefault.resize();
    this.responsive();
    this.setScenePlaneDimensions();
  }

  setScenePlaneDimensions() {
    this.renderPlane.mesh.position.set(
      this.renderPlane.bounds.left - this.gl.sizes.width / 2 + this.gl.sizes.width / 2,
      -this.renderPlane.bounds.top + this.gl.sizes.height / 2 - this.gl.sizes.height / 2,
      0
    );
    this.renderPlane.mesh.scale.set(this.renderPlane.bounds.width, this.renderPlane.bounds.height, 1);
    this.camera.aspect = this.renderPlane.bounds.width / this.renderPlane.bounds.height;
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
    this.gl.renderer.instance.setRenderTarget(this.defaultRenderTarget);
    this.gl.renderer.instance.render(this.defaultScene, this.camera);
    this.renderPlane.mesh.material.uniforms.tDefaultDiffuse.value = this.defaultRenderTarget.texture;
  }

  update() {
    if (!this.isRendering) return;
    this.headDefault.update(this.helmetRevealValue, this.scrollProgress);
    this.helmet.update();
    this.easedMouse.normalized.update(this.gl.time.delta);
    this.easedMouse.pace.update(this.gl.time.delta);
    this.helmet.instance.rotation.copy(this.headDefault.instance.rotation);
    this.helmet.instance.rotation.y = this.helmet.instance.rotation.y / 1.5;
    this.helmet.instance.rotation.x = this.helmet.instance.rotation.x / 1.5;
    this.helmet.instance.rotation.x += Math.PI * 0.06;
    if (!this.gl.isDebug) {
      this.camera.position.x = this.easedMouse.normalized.value.x * 0.02 * this.helmetRevealValue;
      if (this.gl.sizes.width > 768)
        this.camera.position.y =
          this.easedMouse.normalized.value.y * -1 * 0.02 * this.helmetRevealValue * (1 - this.scrollProgress);
    }
    const u = this.renderPlane.mesh.material.uniforms;
    u.uTime.value = this.gl.time.elapsed;
    u.uReveal.value = window.landoGL!.reveal;
    u.tHelmet.value = this.helmet.renderTarget.texture;
    u.tCursorEffect.value = this.gl.world!.fluidCursor.sourceTarget.texture;
    u.tBackgroundNoise.value = this.gl.world!.backgroundNoise.renderTarget.texture;
  }
}

/** O9 composite fragment shader (31448-31701, verbatim minus commented lines kept) */
const HEAD_COMPOSITE_FRAG = `


            // Includes
            #include <tonemapping_pars_fragment>

            const float PI = 3.141592;

            // Functions
            vec3 toGrayscale(vec3 color) {
              float gray = dot(color, vec3(0.299, 0.587, 0.114)); // Standard grayscale weights
              return vec3(gray);
            }

            vec3 adjustContrast(vec3 color, float contrast) {
              return (color - 0.5) * contrast + 0.5;
            }

            float blendScreen(float base, float blend) {
              return 1.0-((1.0-base)*(1.0-blend));
            }

            vec3 blendScreen(vec3 base, vec3 blend) {
              return vec3(blendScreen(base.r,blend.r),blendScreen(base.g,blend.g),blendScreen(base.b,blend.b));
            }

            float blendOverlay(float base, float blend) {
              return base<0.5?(2.0*base*blend):(1.0-2.0*(1.0-base)*(1.0-blend));
            }

            vec3 blendOverlay(vec3 base, vec3 blend) {
              return vec3(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b));
            }

            vec3 blendHardLight(vec3 base, vec3 blend) {
              return blendOverlay(blend,base);
            }

            // Uniforms & Varyings
            uniform float uAspect;
            uniform float uTime;
            uniform float uReveal;
            uniform float uHover;
            uniform float uHelmetHover;
            uniform float uFilter;
            uniform float uCursorIntensity;
            uniform vec3 uColorHover;

            uniform sampler2D tDefaultDiffuse;
            uniform sampler2D tHelmet;
            uniform sampler2D tCursorEffect;
            uniform sampler2D tBackgroundNoise;
            uniform sampler2D tNoise;

            uniform bool OUTLINE;
            uniform bool SHOW_HELMET_PERMANENTLY;
            uniform float THICKNESS;
            uniform vec3 COLOR_OUTLINE;
            uniform vec3 COLOR_FOREGROUND;
            uniform vec3 COLOR_BACKGROUND;
            uniform vec3 COLOR_CURSOR_FOREGROUND;
            uniform vec3 COLOR_CURSOR_BACKGROUND;
            uniform vec3 COLOR_CURSOR_OUTLINE;
            uniform vec3 COLOR_FILTER;
            uniform float SCALE;
            uniform float SPEED;
            uniform float DISTORT_SCALE;
            uniform float DISTORT_INTENSITY;
            uniform float NOISE_DETAIL;
            uniform float CURSOR_INTENSITY;
            uniform float CURSOR_SCALE;
            uniform float CURSOR_BOUNCE;
            uniform float REVEAL_SIZE;

            varying vec2 vUv;

            void main() {
              /*
                UVs
              */
              vec2 uv = vUv;
              uv.x *= uAspect;
              uv.y += (REVEAL_SIZE + REVEAL_SIZE / 3.) * (1.0 - uReveal);
              uv.y /= 1.0 + (REVEAL_SIZE) * (1.0 - uReveal);

              /*
                Noise
              */
              vec4 textureBackgroundNoise = texture2D(tBackgroundNoise, vUv);

              /*
                Noise Texture
              */
              vec4 textureNoise = texture2D(tNoise, uv * 2.0);

              /*
                Cursor Effect
              */
              vec4 textureCursorEffect = texture2D(tCursorEffect, vec2(0.025 + vUv.x * 0.95, 0.025 + vUv.y * 0.95)); // Gap fix on bottom and top
              textureCursorEffect.rgb = 1.0 - textureCursorEffect.rgb;

              float cursorEffect = step(0.1, textureCursorEffect.r);

              /*
                Outline
              */
              float noiseBase = textureBackgroundNoise.r;

              vec3 background = mix(
                COLOR_BACKGROUND,
                mix(COLOR_BACKGROUND, COLOR_FOREGROUND, uReveal),
                noiseBase
              );

              /*
                Cursor Overlay
              */
              vec3 cursorBackground = mix(COLOR_CURSOR_BACKGROUND, COLOR_CURSOR_FOREGROUND, noiseBase);


              if (OUTLINE) {
                float edge = 0.0;

                // Check neighboring pixels for edge detection
                vec4 sampledRight = texture2D(tBackgroundNoise, vUv + vec2(THICKNESS, 0.0));
                vec4 sampledLeft = texture2D(tBackgroundNoise, vUv + vec2(-THICKNESS, 0.0));
                vec4 sampledUp = texture2D(tBackgroundNoise, vUv + vec2(0.0, THICKNESS));
                vec4 sampledDown = texture2D(tBackgroundNoise, vUv + vec2(0.0, -THICKNESS));

                if (sampledRight.r != textureBackgroundNoise.r ||
                    sampledLeft.r != textureBackgroundNoise.r ||
                    sampledUp.r != textureBackgroundNoise.r ||
                    sampledDown.r != textureBackgroundNoise.r) {
                  edge = 1.0;
                }

                background = mix(
                  COLOR_BACKGROUND,
                  mix(COLOR_BACKGROUND, COLOR_OUTLINE, uReveal),
                  edge
                );

                cursorBackground = mix(
                  cursorBackground,
                  COLOR_CURSOR_OUTLINE,
                  edge
                );
              }

              /*
                Hover
              */
              background = mix(
                background,
                uColorHover,
                step(textureBackgroundNoise.g, -0.1 + uHover * 1.1)
              );



              background = mix(
                background,
                cursorBackground,
                cursorEffect * uCursorIntensity
              );

              /*
                Diffuse
              */
              vec4 textureDefaultDiffuse = texture2D(tDefaultDiffuse, vUv);

              /*
                Helmet
              */
              vec4 textureHelmet = texture2D(tHelmet, vUv);

              /*
                Hover on helmet
              */
              float hoverTransition = vUv.y + sin(vUv.x * PI) * sin(uHelmetHover * PI) * 0.2;

              cursorEffect += step(1.0 - hoverTransition, uHelmetHover);
              cursorEffect = clamp(cursorEffect * uCursorIntensity, 0.0, 1.0);

              background = mix(background, cursorBackground, step(1.0 - hoverTransition, uHelmetHover));

              vec3 base = mix(background, textureDefaultDiffuse.rgb, textureDefaultDiffuse.a);

              vec3 final = mix(base, textureHelmet.rgb, cursorEffect * textureHelmet.a);

              if (SHOW_HELMET_PERMANENTLY) {
                final = mix(base, textureHelmet.rgb, textureHelmet.a);
              }

              /*
                Transition
              */
              vec3 end = mix(textureDefaultDiffuse.rgb, vec3(0.05), 1.0 - textureDefaultDiffuse.a);
              end = toGrayscale(end);
              end = adjustContrast(end, 0.8);
              end *= 0.75;
              end = blendHardLight(end, COLOR_FILTER);

              vec3 transition = mix(final, end, uFilter);

              gl_FragColor = vec4(transition, 1.0);

              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }
          `;
