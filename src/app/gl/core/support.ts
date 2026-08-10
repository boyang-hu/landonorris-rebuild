/**
 * Time (s9 35856), Sizes (o9 35879), Mouse (e9 38021), ShaderChunks (AZ 38117),
 * WebGL capability check (tR 10281) — verbatim ports.
 */
import { Clock, Vector2, MathUtils, ShaderChunk } from 'three';
import { EventEmitter } from './EventEmitter';

export class Time extends EventEmitter {
  clock = new Clock();
  elapsed = 0;
  delta = 0;

  constructor() {
    super();
    window.requestAnimationFrame(() => this.tick());
  }

  tick() {
    this.delta = Math.min(this.clock.getDelta(), 1 / 30) * 100;
    this.elapsed = this.clock.getElapsedTime();
    this.trigger('tick');
    window.requestAnimationFrame(() => this.tick());
  }

  getVariantAccordingToTime() {
    const h = new Date().getHours();
    return h >= 6 && h < 18 ? 'Lime' : 'Dark';
  }
}

export class Sizes extends EventEmitter {
  width = window.innerWidth;
  height = window.innerHeight;
  pixelRatio: number;

  constructor() {
    super();
    this.pixelRatio =
      this.width > 768 ? Math.min(window.devicePixelRatio, 1.25) : Math.min(window.devicePixelRatio, 2);
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.pixelRatio =
        this.width > 768 ? Math.min(window.devicePixelRatio, 1.25) : Math.min(window.devicePixelRatio, 2);
      this.trigger('resize');
    });
  }
}

interface SizesLike {
  sizes: { width: number; height: number };
}

export class Mouse {
  gl: SizesLike;
  dom: Document | HTMLElement;
  isMouseHolding = false;
  isMouseMoved = false;
  default = new Vector2();
  normalized = { current: new Vector2(), previous: new Vector2() };
  direction = new Vector2();
  pace = { default: 0, separated: new Vector2() };
  drag = {
    start: new Vector2(),
    distance: 0,
    side: 'left' as 'left' | 'right',
    pace: { default: 0, separated: new Vector2() },
  };

  constructor(gl: SizesLike, dom: Document | HTMLElement) {
    this.gl = gl;
    this.dom = dom;
    this.dom.addEventListener('mousemove', this.mousemove.bind(this) as EventListener);
    this.dom.addEventListener('touchmove', this.touchmove.bind(this) as EventListener);
    this.dom.addEventListener('mousedown', this.down.bind(this) as EventListener);
    this.dom.addEventListener('touchstart', this.down.bind(this) as EventListener);
    this.dom.addEventListener('mouseup', this.up.bind(this) as EventListener);
    this.dom.addEventListener('touchend', this.up.bind(this) as EventListener);
  }

  mousemove(e: MouseEvent) {
    this.isMouseMoved = true;
    this.default.x = e.clientX;
    this.default.y = e.clientY;
    this.normalized.current.x = (e.clientX / this.gl.sizes.width) * 2 - 1;
    this.normalized.current.y = -(e.clientY / this.gl.sizes.height) * 2 + 1;
    if (this.isMouseHolding) {
      this.drag.distance = this.drag.start.distanceTo(this.default);
      if (this.drag.start.x < this.default.x) this.drag.side = 'right';
      else this.drag.side = 'left';
    }
  }

  touchmove(e: TouchEvent) {
    if (e.touches) {
      this.isMouseMoved = true;
      this.normalized.current.x = (e.touches[0].pageX / this.gl.sizes.width) * 2 - 1;
      this.normalized.current.y = -(e.touches[0].pageY / this.gl.sizes.height) * 2 + 1;
    }
  }

  down(e: MouseEvent | TouchEvent) {
    this.isMouseHolding = true;
    this.drag.start.copy(this.default);
    if ((e as TouchEvent).touches) {
      const t = (e as TouchEvent).touches[0];
      this.normalized.current.x = (t.pageX / this.gl.sizes.width) * 2 - 1;
      this.normalized.current.y = -(t.pageY / this.gl.sizes.height) * 2 + 1;
    }
  }

  up() {
    this.isMouseHolding = false;
  }

  update() {
    this.pace.default = this.normalized.current.distanceTo(this.normalized.previous);
    this.pace.separated.x = this.normalized.current.x - this.normalized.previous.x;
    this.pace.separated.y = this.normalized.current.y - this.normalized.previous.y;
    this.direction.subVectors(this.normalized.current, this.normalized.previous).normalize();
    if (this.isMouseHolding) {
      this.drag.pace.default = this.normalized.current.distanceTo(this.normalized.previous);
      this.drag.pace.separated.x = this.normalized.current.x - this.normalized.previous.x;
      this.drag.pace.separated.y = this.normalized.current.y - this.normalized.previous.y;
    } else {
      this.drag.pace.default = 0;
      this.drag.pace.separated.x = 0;
      this.drag.pace.separated.y = 0;
    }
    this.normalized.previous.copy(this.normalized.current);
  }

  createEasedMovement(lambda: number) {
    const value = new Vector2();
    return {
      value,
      update: (delta: number) => {
        value.x = MathUtils.damp(value.x, this.default.x, lambda, delta);
        value.y = MathUtils.damp(value.y, this.default.y, lambda, delta);
      },
    };
  }

  createEasedNormalized(lambda: number) {
    const value = new Vector2();
    return {
      value,
      update: (delta: number) => {
        value.x = MathUtils.damp(value.x, this.normalized.current.x, lambda, delta);
        value.y = MathUtils.damp(value.y, this.normalized.current.y, lambda, delta);
      },
    };
  }

  createEasedDirection(lambda: number) {
    const value = new Vector2();
    return {
      value,
      update: (delta: number) => {
        value.x = MathUtils.damp(value.x, this.direction.x, lambda, delta);
        value.y = MathUtils.damp(value.y, this.direction.y, lambda, delta);
      },
    };
  }

  createEasedPace(lambda: number) {
    const value = { default: 0, separated: new Vector2() };
    return {
      value,
      update: (delta: number) => {
        value.default = MathUtils.damp(value.default, this.pace.default, lambda, delta);
        value.separated.x = MathUtils.damp(value.separated.x, this.pace.separated.x, lambda, delta);
        value.separated.y = MathUtils.damp(value.separated.y, this.pace.separated.y, lambda, delta);
      },
    };
  }

  createEasedDrag(lambda: number) {
    const value = { distance: 0, pace: { default: 0, separated: new Vector2() } };
    return {
      value,
      update: (delta: number) => {
        value.distance = MathUtils.damp(value.distance, this.drag.distance, lambda, delta);
        value.pace.default = MathUtils.damp(value.pace.default, this.drag.pace.default, lambda, delta);
        value.pace.separated.x = MathUtils.damp(value.pace.separated.x, this.drag.pace.separated.x, lambda, delta);
        value.pace.separated.y = MathUtils.damp(value.pace.separated.y, this.drag.pace.separated.y, lambda, delta);
      },
    };
  }
}

/** AZ 38117 */
export class ShaderChunks {
  constructor() {
    (ShaderChunk as unknown as Record<string, string>).rotateUV = `
      vec2 rotateUV(vec2 uv, float rotation) {
        mat2 m = mat2(cos(rotation), -sin(rotation), sin(rotation), cos(rotation));
        return m * uv;
      }
    `;
  }
}

/** tR 10281 */
export class WebGLSupport {
  static isWebGL2Available() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
    } catch {
      return false;
    }
  }
}
