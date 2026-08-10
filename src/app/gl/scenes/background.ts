/** Background scene — w9 33072-33174, GLSL verbatim. Consumes world backgroundNoise RT. */
import { Mesh, PlaneGeometry, ShaderMaterial, Uniform, Color } from 'three';
import type { GL } from '../core/app';
import type { RenderPlane } from './head';

export class BackgroundScene {
  id = 'background';
  isRendering = true;
  gl: GL;
  previous: { backgroundColor: string; foregroundColor: string };
  renderPlane: RenderPlane;
  renderTarget?: never;
  scene?: never;

  constructor(gl: GL, _settings: { dom: HTMLElement }) {
    this.gl = gl;
    const p = window.landoGL!.params.backgroundScene;
    this.previous = {
      backgroundColor: p.COLOR_BACKGROUND as string,
      foregroundColor: p.COLOR_FOREGROUND as string,
    };
    this.renderPlane = {
      mesh: new Mesh(
        new PlaneGeometry(1, 1),
        new ShaderMaterial({
          transparent: true,
          uniforms: {
            tBackgroundNoise: new Uniform(null),
            tDiffuse: new Uniform(null),
            uReveal: new Uniform(window.landoGL!.reveal),
            OUTLINE: new Uniform(p.OUTLINE),
            THICKNESS: new Uniform(p.THICKNESS),
            COLOR_BACKGROUND: new Uniform(new Color(p.COLOR_BACKGROUND as string).convertLinearToSRGB()),
            COLOR_FOREGROUND: new Uniform(new Color(p.COLOR_FOREGROUND as string).convertLinearToSRGB()),
          },
          vertexShader: `
            varying vec2 vUv;

            void main() {
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

              vUv = uv;
            }
          `,
          fragmentShader: `


            varying vec2 vUv;

            uniform float uReveal;

            uniform sampler2D tBackgroundNoise;

            uniform bool OUTLINE;
            uniform float THICKNESS;
            uniform vec3 COLOR_BACKGROUND;
            uniform vec3 COLOR_FOREGROUND;

            void main() {

              vec4 textureBackgroundNoise = texture2D(tBackgroundNoise, vUv);

              /*
                Outline
              */
              float noiseBase = textureBackgroundNoise.r;

              vec3 background = mix(
                COLOR_BACKGROUND,
                mix(COLOR_BACKGROUND, COLOR_FOREGROUND, uReveal),
                noiseBase
              );

              if (OUTLINE) {
                float edge = 0.0;

                // Offsets for neighboring pixels
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
                  mix(COLOR_BACKGROUND, COLOR_FOREGROUND, uReveal),
                  edge
                );
              }

              gl_FragColor = vec4(background, 1.0);
            }
          `,
        })
      ),
      bounds: { top: 0, left: 0, width: this.gl.sizes.width, height: this.gl.sizes.height },
    };
    this.setScenePlaneDimensions();
  }

  resize() {
    this.setScenePlaneDimensions();
  }

  setScenePlaneDimensions() {
    this.renderPlane.mesh.position.set(
      this.renderPlane.bounds.left - this.gl.sizes.width / 2 + this.gl.sizes.width / 2,
      -this.renderPlane.bounds.top + this.gl.sizes.height / 2 - this.gl.sizes.height / 2,
      0
    );
    this.renderPlane.mesh.scale.set(this.gl.sizes.width, this.gl.sizes.height, 1);
  }

  renderPipeline() {}

  update() {
    const p = window.landoGL!.params.backgroundScene;
    const u = this.renderPlane.mesh.material.uniforms;
    u.tBackgroundNoise.value = this.gl.world!.backgroundNoise.renderTarget.texture;
    if (p.COLOR_BACKGROUND !== this.previous.backgroundColor)
      u.COLOR_BACKGROUND.value = new Color(p.COLOR_BACKGROUND as string).convertLinearToSRGB();
    if (p.COLOR_FOREGROUND !== this.previous.foregroundColor)
      u.COLOR_FOREGROUND.value = new Color(p.COLOR_FOREGROUND as string).convertLinearToSRGB();
    this.previous.backgroundColor = p.COLOR_BACKGROUND as string;
    this.previous.foregroundColor = p.COLOR_FOREGROUND as string;
  }
}
