/**
 * Stable-fluids cursor simulation — source 34870-35573.
 * zE ShaderPass base (34964), b9 Advection, h9 ExternalForce, v9 Viscous,
 * g9 Divergence, u9 Poisson, d9 Pressure, wJ FluidMouse (35075),
 * p9 Simulation (35421), m9 FluidCursor output (35544).
 * All GLSL verbatim.
 */
import {
  Scene,
  Camera,
  Mesh,
  PlaneGeometry,
  RawShaderMaterial,
  BufferGeometry,
  BufferAttribute,
  LineSegments,
  Vector2,
  WebGLRenderTarget,
  RenderTarget,
  Clock,
  AdditiveBlending,
  HalfFloatType,
  FloatType,
  type IUniform,
} from 'three';
import { gsap as m } from '../gsap';
import type { GL } from './core/app';

/* ---------------- GLSL (verbatim) ---------------- */

const faceVert = `attribute vec3 position;
uniform vec2 px;
uniform vec2 boundarySpace;
varying vec2 uv;

precision highp float;

void main(){
    vec3 pos = position;
    vec2 scale = 1.0 - boundarySpace * 2.0;
    pos.xy = pos.xy * scale;
    uv = vec2(0.5)+(pos.xy)*0.5;
    gl_Position = vec4(pos, 1.0);
}
`;

const colorFrag = `precision highp float;
uniform sampler2D velocity;
varying vec2 uv;

void main(){
    vec2 vel = texture2D(velocity, uv).xy;
    float len = length(vel);
    vel = vel * 0.5 + 0.5;

    vec3 color = vec3(vel.x, vel.y, 1.0);
    color = mix(vec3(1.0), color, len);

    gl_FragColor = vec4(color,  1.0);
}
`;

const lineVert = `attribute vec3 position;
varying vec2 uv;
uniform vec2 px;


precision highp float;

void main(){
    vec3 pos = position;
    uv = 0.5 + pos.xy * 0.5;
    vec2 n = sign(pos.xy);
    pos.xy = abs(pos.xy) - px * 1.0;
    pos.xy *= n;
    gl_Position = vec4(pos, 1.0);
}`;

const advectionFrag = `precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform float dissipation;
uniform bool isBFECC;

uniform vec2 fboSize;
uniform vec2 px;
varying vec2 uv;

void main(){
    vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;

    if(isBFECC == false){
        vec2 vel = texture2D(velocity, uv).xy;
        vec2 uv2 = uv - vel * dt * ratio;
        vec2 newVel = texture2D(velocity, uv2).xy;
        gl_FragColor = vec4(newVel, 0.0, 0.0);
    } else {
        vec2 spot_new = uv;
        vec2 vel_old = texture2D(velocity, uv).xy;

        vec2 spot_old = spot_new - vel_old * dt * ratio;
        vec2 vel_new1 = texture2D(velocity, spot_old).xy;


        vec2 spot_new2 = spot_old + vel_new1 * dt * ratio;

        vec2 error = spot_new2 - spot_new;

        vec2 spot_new3 = spot_new - error / 2.0;
        vec2 vel_2 = texture2D(velocity, spot_new3).xy;


        vec2 spot_old2 = spot_new3 - vel_2 * dt * ratio;

        vec2 newVel2 = texture2D(velocity, spot_old2).xy * dissipation;
        gl_FragColor = vec4(newVel2, 0.0, 0.0);
    }
}
`;

const mouseVert = `precision highp float;

attribute vec3 position;
attribute vec2 uv;
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
varying vec2 vUv;

void main(){
    vec2 pos = position.xy * scale * 2.0 * px + center;
    vUv = uv;
    gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const mouseFrag = `precision highp float;

uniform vec2 force;
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
varying vec2 vUv;

void main(){
    vec2 circle = (vUv - 0.5) * 2.0;
    float d = 1.0-min(length(circle), 1.0);
    d *= d;
    gl_FragColor = vec4(force * d, 0, 1);
}
`;

const viscousFrag = `precision highp float;
uniform sampler2D velocity;
uniform sampler2D velocity_new;
uniform float v;
uniform vec2 px;
uniform float dt;

varying vec2 uv;

void main(){

    vec2 old = texture2D(velocity, uv).xy;
    vec2 new0 = texture2D(velocity_new, uv + vec2(px.x * 2.0, 0)).xy;
    vec2 new1 = texture2D(velocity_new, uv - vec2(px.x * 2.0, 0)).xy;
    vec2 new2 = texture2D(velocity_new, uv + vec2(0, px.y * 2.0)).xy;
    vec2 new3 = texture2D(velocity_new, uv - vec2(0, px.y * 2.0)).xy;

    vec2 new = 4.0 * old + v * dt * (new0 + new1 + new2 + new3);
    new /= 4.0 * (1.0 + v * dt);

    gl_FragColor = vec4(new, 0.0, 0.0);
}
`;

const divergenceFrag = `precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform vec2 px;
varying vec2 uv;

void main(){
    float x0 = texture2D(velocity, uv-vec2(px.x, 0)).x;
    float x1 = texture2D(velocity, uv+vec2(px.x, 0)).x;
    float y0 = texture2D(velocity, uv-vec2(0, px.y)).y;
    float y1 = texture2D(velocity, uv+vec2(0, px.y)).y;
    float divergence = (x1-x0 + y1-y0) / 2.0;

    gl_FragColor = vec4(divergence / dt);
}
`;

const poissonFrag = `precision highp float;
uniform sampler2D pressure;
uniform sampler2D divergence;
uniform float straightness;
uniform vec2 px;
varying vec2 uv;

void main(){

    float p0 = texture2D(pressure, uv+vec2(px.x * 2.0,  0)).r;
    float p1 = texture2D(pressure, uv-vec2(px.x * 2.0, 0)).r;
    float p2 = texture2D(pressure, uv+vec2(0, px.y * 2.0 )).r;
    float p3 = texture2D(pressure, uv-vec2(0, px.y * 2.0 )).r;
    float div = texture2D(divergence, uv).r;

    float newP = (p0 + p1 + p2 + p3) / (4.0 + straightness) - div;
    gl_FragColor = vec4(newP);
}
`;

const pressureFrag = `precision highp float;
uniform sampler2D pressure;
uniform sampler2D velocity;
uniform vec2 px;
uniform float dt;
varying vec2 uv;

void main(){
    float step = 1.0;

    float p0 = texture2D(pressure, uv+vec2(px.x * step, 0)).r;
    float p1 = texture2D(pressure, uv-vec2(px.x * step, 0)).r;
    float p2 = texture2D(pressure, uv+vec2(0, px.y * step)).r;
    float p3 = texture2D(pressure, uv-vec2(0, px.y * step)).r;

    vec2 v = texture2D(velocity, uv).xy;
    vec2 gradP = vec2(p0 - p1, p2 - p3) * 0.5;
    v = v - gradP * dt;
    gl_FragColor = vec4(v, 0.0, 1.0);
}
`;

/* ---------------- passes ---------------- */

type Uniforms = Record<string, IUniform>;
interface PassProps {
  material?: { vertexShader: string; fragmentShader: string; uniforms: Uniforms; blending?: import('three').Blending };
  output: WebGLRenderTarget | null;
  output0?: WebGLRenderTarget;
  output1?: WebGLRenderTarget;
}

/** zE 34964 */
class ShaderPass {
  gl: GL;
  props: PassProps;
  uniforms?: Uniforms;
  scene!: Scene;
  camera!: Camera;
  material?: RawShaderMaterial;
  geometry?: PlaneGeometry;
  plane?: Mesh;

  constructor(gl: GL, props: PassProps) {
    this.gl = gl;
    this.props = props;
    this.uniforms = this.props.material?.uniforms;
  }

  init() {
    this.scene = new Scene();
    this.camera = new Camera();
    if (this.uniforms) {
      this.material = new RawShaderMaterial(this.props.material);
      this.geometry = new PlaneGeometry(2, 2);
      this.plane = new Mesh(this.geometry, this.material);
      this.scene.add(this.plane);
    }
  }

  update(..._args: unknown[]) {
    this.gl.renderer.instance.setRenderTarget(this.props.output);
    this.gl.renderer.instance.render(this.scene, this.camera);
    this.gl.renderer.instance.setRenderTarget(null);
  }
}

/** b9 — Advection (with boundary line) */
class Advection extends ShaderPass {
  line!: LineSegments;

  constructor(gl: GL, props: {
    cellScale: Vector2;
    fboSize: Vector2;
    dt: number;
    src: WebGLRenderTarget;
    dst: WebGLRenderTarget;
    dissipation: number;
  }) {
    super(gl, {
      material: {
        vertexShader: faceVert,
        fragmentShader: advectionFrag,
        uniforms: {
          boundarySpace: { value: props.cellScale },
          px: { value: props.cellScale },
          fboSize: { value: props.fboSize },
          velocity: { value: props.src.texture },
          dt: { value: props.dt },
          isBFECC: { value: true },
          dissipation: { value: props.dissipation },
        },
      },
      output: props.dst,
    });
    this.init();
  }

  init() {
    super.init();
    this.createBoundary();
  }

  createBoundary() {
    const geometry = new BufferGeometry();
    const vertices = new Float32Array([
      -1, -1, 0, -1, 1, 0, -1, 1, 0, 1, 1, 0, 1, 1, 0, 1, -1, 0, 1, -1, 0, -1, -1, 0,
    ]);
    geometry.setAttribute('position', new BufferAttribute(vertices, 3));
    const material = new RawShaderMaterial({
      vertexShader: lineVert,
      fragmentShader: advectionFrag,
      uniforms: this.uniforms,
    });
    this.line = new LineSegments(geometry, material);
    this.scene.add(this.line);
  }

  update({ dt, isBounce, BFECC }: { dt: number; isBounce: boolean; BFECC: boolean }) {
    this.uniforms!.dt.value = dt;
    this.line.visible = isBounce;
    this.uniforms!.isBFECC.value = BFECC;
    super.update();
  }
}

/** wJ 35075 — fluid mouse (idle-aware) */
class FluidMouse {
  gl: GL;
  getIdle: () => { isMoving: boolean; idleCursor: Vector2 };
  mouseMoved = false;
  coords = new Vector2();
  coords_old = new Vector2();
  diff = new Vector2();
  timer: ReturnType<typeof setTimeout> | null = null;
  count = 0;

  constructor(gl: GL, getIdle: () => { isMoving: boolean; idleCursor: Vector2 }) {
    this.gl = gl;
    this.getIdle = getIdle;
  }

  init() {
    document.body.addEventListener('mousemove', this.onMouseMove.bind(this), false);
    document.body.addEventListener('touchstart', this.onTouchStart.bind(this), false);
    document.body.addEventListener('touchmove', this.onTouchMove.bind(this), false);
  }

  setCoords(x: number, y: number) {
    if (this.timer) clearTimeout(this.timer);
    this.coords.set(x, y);
    this.mouseMoved = true;
    this.timer = setTimeout(() => {
      this.mouseMoved = false;
    }, 100);
  }

  onMouseMove() {
    this.setCoords(this.gl.mouse.normalized.current.x, this.gl.mouse.normalized.current.y);
  }
  onTouchStart(e: TouchEvent) {
    if (e.touches.length === 1)
      this.setCoords(this.gl.mouse.normalized.current.x, this.gl.mouse.normalized.current.y);
  }
  onTouchMove(e: TouchEvent) {
    if (e.touches.length === 1)
      this.setCoords(this.gl.mouse.normalized.current.x, this.gl.mouse.normalized.current.y);
  }

  update() {
    const idle = this.getIdle();
    if (idle.isMoving) {
      this.diff.subVectors(this.coords, this.coords_old);
      this.coords_old.copy(this.coords);
      if (this.coords_old.x === 0 && this.coords_old.y === 0) this.diff.set(0, 0);
    } else {
      this.coords.copy(idle.idleCursor);
      this.diff.subVectors(this.coords, this.coords_old);
      this.coords_old.copy(this.coords);
    }
  }
}

/** h9 — ExternalForce */
class ExternalForce extends ShaderPass {
  mouse: FluidMouse;
  mouseMaterial!: RawShaderMaterial;
  mouseMesh!: Mesh;

  constructor(gl: GL, props: { cellScale: Vector2; cursor_size: number; dst: WebGLRenderTarget }, getIdle: () => { isMoving: boolean; idleCursor: Vector2 }) {
    super(gl, { output: props.dst });
    this.mouse = new FluidMouse(gl, getIdle);
    this.mouse.init();
    this.initForce(props);
  }

  initForce(props: { cellScale: Vector2; cursor_size: number }) {
    super.init();
    const geometry = new PlaneGeometry(1, 1);
    this.mouseMaterial = new RawShaderMaterial({
      vertexShader: mouseVert,
      fragmentShader: mouseFrag,
      blending: AdditiveBlending,
      uniforms: {
        px: { value: props.cellScale },
        force: { value: new Vector2(0, 0) },
        center: { value: new Vector2(0, 0) },
        scale: { value: new Vector2(props.cursor_size, props.cursor_size) },
      },
    });
    this.mouseMesh = new Mesh(geometry, this.mouseMaterial);
    this.scene.add(this.mouseMesh);
  }

  update(props: { cursor_size: number; mouse_force: number; cellScale: Vector2 }) {
    this.mouse.update();
    const fx = (this.mouse.diff.x / 2) * props.mouse_force;
    const fy = (this.mouse.diff.y / 2) * props.mouse_force;
    const cx = props.cursor_size * props.cellScale.x;
    const cy = props.cursor_size * props.cellScale.y;
    const px = Math.min(Math.max(this.mouse.coords.x, -1 + cx + props.cellScale.x * 2), 1 - cx - props.cellScale.x * 2);
    const py = Math.min(Math.max(this.mouse.coords.y, -1 + cy + props.cellScale.y * 2), 1 - cy - props.cellScale.y * 2);
    const u = (this.mouseMesh.material as RawShaderMaterial).uniforms;
    (u.force.value as Vector2).set(fx, fy);
    (u.center.value as Vector2).set(px, py);
    (u.scale.value as Vector2).set(props.cursor_size, props.cursor_size);
    super.update();
  }
}

/** v9 — Viscous (disabled by default, ported for parity) */
class Viscous extends ShaderPass {
  constructor(gl: GL, props: {
    cellScale: Vector2;
    boundarySpace: Vector2;
    viscous: number;
    src: WebGLRenderTarget;
    dst: WebGLRenderTarget;
    dst_: WebGLRenderTarget;
    dt: number;
  }) {
    super(gl, {
      material: {
        vertexShader: faceVert,
        fragmentShader: viscousFrag,
        uniforms: {
          boundarySpace: { value: props.boundarySpace },
          velocity: { value: props.src.texture },
          velocity_new: { value: props.dst_.texture },
          v: { value: props.viscous },
          px: { value: props.cellScale },
          dt: { value: props.dt },
        },
      },
      output: props.dst,
      output0: props.dst_,
      output1: props.dst,
    });
    this.init();
  }

  update({ viscous, iterations, dt }: { viscous: number; iterations: number; dt: number }) {
    let read: WebGLRenderTarget | undefined;
    let write: WebGLRenderTarget | undefined;
    this.uniforms!.v.value = viscous;
    for (let i = 0; i < iterations; i++) {
      if (i % 2 === 0) {
        read = this.props.output0;
        write = this.props.output1;
      } else {
        read = this.props.output1;
        write = this.props.output0;
      }
      this.uniforms!.velocity_new.value = read!.texture;
      this.props.output = write!;
      this.uniforms!.dt.value = dt;
      super.update();
    }
    return write;
  }
}

/** g9 — Divergence */
class Divergence extends ShaderPass {
  constructor(gl: GL, props: {
    cellScale: Vector2;
    boundarySpace: Vector2;
    src: WebGLRenderTarget;
    dst: WebGLRenderTarget;
    dt: number;
  }) {
    super(gl, {
      material: {
        vertexShader: faceVert,
        fragmentShader: divergenceFrag,
        uniforms: {
          boundarySpace: { value: props.boundarySpace },
          velocity: { value: props.src.texture },
          px: { value: props.cellScale },
          dt: { value: props.dt },
        },
      },
      output: props.dst,
    });
    this.init();
  }

  update({ vel }: { vel: WebGLRenderTarget }) {
    this.uniforms!.velocity.value = vel.texture;
    super.update();
  }
}

/** u9 — Poisson */
class Poisson extends ShaderPass {
  constructor(gl: GL, props: {
    cellScale: Vector2;
    boundarySpace: Vector2;
    straightness: number;
    src: WebGLRenderTarget;
    dst: WebGLRenderTarget;
    dst_: WebGLRenderTarget;
  }) {
    super(gl, {
      material: {
        vertexShader: faceVert,
        fragmentShader: poissonFrag,
        uniforms: {
          boundarySpace: { value: props.boundarySpace },
          pressure: { value: props.dst_.texture },
          divergence: { value: props.src.texture },
          px: { value: props.cellScale },
          straightness: { value: props.straightness },
        },
      },
      output: props.dst,
      output0: props.dst_,
      output1: props.dst,
    });
    this.init();
  }

  update({ iterations }: { iterations: number }) {
    let read: WebGLRenderTarget | undefined;
    let write: WebGLRenderTarget | undefined;
    for (let i = 0; i < iterations; i++) {
      if (i % 2 === 0) {
        read = this.props.output0;
        write = this.props.output1;
      } else {
        read = this.props.output1;
        write = this.props.output0;
      }
      this.uniforms!.pressure.value = read!.texture;
      this.props.output = write!;
      super.update();
    }
    return write;
  }
}

/** d9 — Pressure */
class Pressure extends ShaderPass {
  constructor(gl: GL, props: {
    cellScale: Vector2;
    boundarySpace: Vector2;
    src_p: WebGLRenderTarget;
    src_v: WebGLRenderTarget;
    dst: WebGLRenderTarget;
    dt: number;
  }) {
    super(gl, {
      material: {
        vertexShader: faceVert,
        fragmentShader: pressureFrag,
        uniforms: {
          boundarySpace: { value: props.boundarySpace },
          pressure: { value: props.src_p.texture },
          velocity: { value: props.src_v.texture },
          px: { value: props.cellScale },
          dt: { value: props.dt },
        },
      },
      output: props.dst,
    });
    this.init();
  }

  update({ vel, pressure }: { vel: WebGLRenderTarget; pressure: WebGLRenderTarget }) {
    this.uniforms!.velocity.value = vel.texture;
    this.uniforms!.pressure.value = pressure.texture;
    super.update();
  }
}

/** p9 35421 — simulation orchestration (options verbatim) */
export class FluidSimulation {
  gl: GL;
  fbos: Record<string, WebGLRenderTarget> = {};
  options = {
    iterations_poisson: 4,
    iterations_viscous: 4,
    dissipation: 0.96,
    mouse_force: 50,
    resolution: 0.1,
    cursor_size: 18,
    straightness: 1,
    viscous: 30,
    isBounce: false,
    dt: 0.014,
    isViscous: false,
    BFECC: true,
  };
  fboSize = new Vector2();
  cellScale = new Vector2();
  boundarySpace = new Vector2();
  advection!: Advection;
  externalForce!: ExternalForce;
  viscous!: Viscous;
  divergence!: Divergence;
  poisson!: Poisson;
  pressure!: Pressure;

  constructor(gl: GL, getIdle: () => { isMoving: boolean; idleCursor: Vector2 }) {
    this.gl = gl;
    this.calcSize();
    this.createAllFBO();
    this.createShaderPass(getIdle);
  }

  createAllFBO() {
    const type = /(iPad|iPhone|iPod)/g.test(navigator.userAgent) ? HalfFloatType : FloatType;
    for (const key of ['vel_0', 'vel_1', 'vel_viscous0', 'vel_viscous1', 'div', 'pressure_0', 'pressure_1'])
      this.fbos[key] = new WebGLRenderTarget(this.fboSize.x, this.fboSize.y, { type });
  }

  createShaderPass(getIdle: () => { isMoving: boolean; idleCursor: Vector2 }) {
    this.advection = new Advection(this.gl, {
      cellScale: this.cellScale,
      fboSize: this.fboSize,
      dt: this.options.dt,
      src: this.fbos.vel_0,
      dst: this.fbos.vel_1,
      dissipation: this.options.dissipation,
    });
    this.externalForce = new ExternalForce(
      this.gl,
      { cellScale: this.cellScale, cursor_size: this.options.cursor_size, dst: this.fbos.vel_1 },
      getIdle
    );
    this.viscous = new Viscous(this.gl, {
      cellScale: this.cellScale,
      boundarySpace: this.boundarySpace,
      viscous: this.options.viscous,
      src: this.fbos.vel_1,
      dst: this.fbos.vel_viscous1,
      dst_: this.fbos.vel_viscous0,
      dt: this.options.dt,
    });
    this.divergence = new Divergence(this.gl, {
      cellScale: this.cellScale,
      boundarySpace: this.boundarySpace,
      src: this.fbos.vel_viscous0,
      dst: this.fbos.div,
      dt: this.options.dt,
    });
    this.poisson = new Poisson(this.gl, {
      cellScale: this.cellScale,
      boundarySpace: this.boundarySpace,
      straightness: this.options.straightness,
      src: this.fbos.div,
      dst: this.fbos.pressure_1,
      dst_: this.fbos.pressure_0,
    });
    this.pressure = new Pressure(this.gl, {
      cellScale: this.cellScale,
      boundarySpace: this.boundarySpace,
      src_p: this.fbos.pressure_0,
      src_v: this.fbos.vel_viscous0,
      dst: this.fbos.vel_0,
      dt: this.options.dt,
    });
  }

  calcSize() {
    const w = Math.round(this.options.resolution * this.gl.sizes.width);
    const h = Math.round(this.options.resolution * this.gl.sizes.height);
    let px = 1 / w;
    let py = 1 / h;
    px *= w / (1100 * this.options.resolution);
    py *= w / (1100 * this.options.resolution);
    this.cellScale.set(px, py);
    this.fboSize.set(w, h);
  }

  resize() {
    this.calcSize();
    for (const key in this.fbos) this.fbos[key].setSize(this.fboSize.x, this.fboSize.y);
  }

  update() {
    if (this.options.isBounce) this.boundarySpace.set(0, 0);
    else this.boundarySpace.copy(this.cellScale);
    this.advection.update(this.options);
    this.externalForce.update({
      cursor_size: this.options.cursor_size,
      mouse_force: this.options.mouse_force,
      cellScale: this.cellScale,
    });
    let vel: WebGLRenderTarget = this.fbos.vel_1;
    if (this.options.isViscous)
      vel = this.viscous.update({
        viscous: this.options.viscous,
        iterations: this.options.iterations_viscous,
        dt: this.options.dt,
      })!;
    this.divergence.update({ vel });
    const pressure = this.poisson.update({ iterations: this.options.iterations_poisson })!;
    this.pressure.update({ vel, pressure });
  }
}

/** m9 35544 — visible fluid output (60fps throttled) */
export class FluidCursor {
  gl: GL;
  simulation: FluidSimulation;
  mouse: FluidMouse;
  scene = new Scene();
  camera = new Camera();
  output: Mesh;
  sourceTarget: RenderTarget;
  clock = new Clock();
  delta = 0;
  interval = 1 / 60;

  constructor(gl: GL, getIdle: () => { isMoving: boolean; idleCursor: Vector2 }) {
    this.gl = gl;
    this.simulation = new FluidSimulation(gl, getIdle);
    this.mouse = new FluidMouse(gl, getIdle);
    this.mouse.init();
    this.output = new Mesh(
      new PlaneGeometry(2, 2),
      new RawShaderMaterial({
        vertexShader: faceVert,
        fragmentShader: colorFrag,
        uniforms: {
          velocity: { value: this.simulation.fbos.vel_0.texture },
          boundarySpace: { value: new Vector2() },
        },
      })
    );
    this.scene.add(this.output);
    this.sourceTarget = new RenderTarget(this.gl.sizes.width, this.gl.sizes.height, { samples: 2 });
  }

  resize() {
    this.simulation.resize();
  }

  update() {
    this.delta += this.clock.getDelta();
    if (this.delta > this.interval) {
      this.mouse.update();
      this.simulation.update();
      this.gl.renderer.instance.setRenderTarget(this.sourceTarget as WebGLRenderTarget);
      this.gl.renderer.instance.render(this.scene, this.camera);
      this.delta = this.delta % this.interval;
    }
  }
}

/** c9 35576 — idle state (figure-8 fake cursor) */
export class IdleState {
  gl: GL;
  isMoving = true;
  isMovingPrevious = true;
  idleInterval: ReturnType<typeof setInterval> | null = null;
  moveTimeout: ReturnType<typeof setTimeout> | null = null;
  elapsed = 0;
  progress = new Vector2();
  idleCursor = new Vector2();
  initial: ReturnType<typeof setTimeout>;
  timeline!: gsap.core.Timeline;

  constructor(gl: GL) {
    this.gl = gl;
    this.initial = setTimeout(() => {
      this.isMoving = false;
    }, 2500);
    document.addEventListener('mousemove', this.move.bind(this));
    document.addEventListener('touchmove', this.move.bind(this));
    this.setTimeline();
  }

  setTimeline() {
    this.timeline = m.timeline({ paused: true, repeat: -1, repeatDelay: 3 });
    this.timeline.fromTo(this.progress, { y: 0 }, { y: 1, duration: 2.5, ease: 'none' }, 0);
    this.timeline.fromTo(this.progress, { x: 0 }, { x: 1, duration: 2.5, ease: 'power1.inOut' }, 0);
    this.timeline.fromTo(this.progress, { y: 1 }, { y: 0, duration: 2.5, ease: 'none' }, 4);
    this.timeline.fromTo(this.progress, { x: 1 }, { x: 0, duration: 2.5, ease: 'power1.inOut' }, 4);
  }

  move() {
    this.isMoving = true;
    clearTimeout(this.initial);
    if (this.idleInterval) clearInterval(this.idleInterval);
    if (this.moveTimeout) clearTimeout(this.moveTimeout);
    this.moveTimeout = setTimeout(() => {
      this.isMoving = false;
    }, 2000);
  }

  update() {
    if (!this.isMoving) {
      this.idleCursor.x = -Math.cos(this.progress.x * Math.PI * 4) * 0.75;
      this.idleCursor.y = Math.cos(this.progress.y * Math.PI) * 0.5;
    }
    if (this.isMoving !== this.isMovingPrevious) {
      if (!this.isMoving) {
        this.timeline.seek(0);
        this.timeline.play();
      } else this.timeline.pause();
    }
    this.isMovingPrevious = this.isMoving;
  }
}
