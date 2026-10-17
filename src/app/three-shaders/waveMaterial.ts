import { shaderMaterial } from "@react-three/drei";
import { extend, type ThreeElement } from "@react-three/fiber";
import { Color } from "three";

// A custom material: two small GLSL programs that run on the GPU.
// The vertex shader runs once per vertex and moves it; the fragment shader
// runs once per pixel and colours it. Uniforms are the values JavaScript
// passes in each frame.

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAmplitude;
  uniform float uFrequency;
  varying float vHeight;

  void main() {
    vec3 p = position;
    // Two crossing sine waves, drifting with time.
    float h = sin(p.x * uFrequency + uTime) * cos(p.y * uFrequency + uTime * 0.8);
    p.z += h * uAmplitude;
    vHeight = h; // -1 … 1, handed to the fragment shader
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vHeight;

  void main() {
    // Low points get colour A, peaks colour B.
    gl_FragColor = vec4(mix(uColorA, uColorB, vHeight * 0.5 + 0.5), 1.0);
    #include <colorspace_fragment>
  }
`;

export const WaveMaterial = shaderMaterial(
  { uTime: 0, uAmplitude: 0.35, uFrequency: 2.5, uColorA: new Color("#2b2370"), uColorB: new Color("#ff7aa2") },
  vertexShader,
  fragmentShader,
);

// Makes <waveMaterial /> available in JSX, with typed props.
extend({ WaveMaterial });
declare module "@react-three/fiber" {
  interface ThreeElements {
    waveMaterial: ThreeElement<typeof WaveMaterial>;
  }
}
