import { useEffect, useMemo } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  ExtrudeGeometry,
  ShaderMaterial,
  Shape,
  type BufferGeometry as BufGeo,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Building } from '@trailforge/shared';

const vertexShader = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vNormalW;
  varying float vHeight;
  attribute float aHeight;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPos = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vHeight = aHeight;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vNormalW;
  varying float vHeight;
  uniform float uTime;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    float t = clamp(vHeight / 45.0, 0.0, 1.0);
    // Soft dusk facade — keep atmosphere without neon-sign intensity.
    vec3 base = mix(vec3(0.06, 0.07, 0.12), vec3(0.14, 0.15, 0.22), t);
    float up = abs(vNormalW.y);
    float side = 1.0 - smoothstep(0.55, 0.95, up);

    vec2 grid = floor(vWorldPos.xz * 0.55);
    float floorY = floor(vWorldPos.y * 0.42);
    float lit = step(0.72, hash(grid + floorY));
    float flicker = 0.92 + 0.08 * sin(uTime * (0.6 + hash(grid) * 1.2) + hash(grid) * 4.0);
    vec3 windowCol = vec3(0.55, 0.62, 0.78) * lit * side * flicker * 0.55;
    vec3 warm = vec3(0.42, 0.36, 0.28) * lit * side * 0.18;

    vec3 color = base + windowCol + warm;
    float emissive = length(windowCol) * 0.35;
    gl_FragColor = vec4(color, 1.0);
    gl_FragColor.rgb += vec3(emissive * 0.06);
  }
`;

function buildingGeometry(b: Building): ExtrudeGeometry {
  const shape = new Shape();
  const first = b.footprint[0];
  if (!first) return new ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
  shape.moveTo(first[0], -first[1]);
  for (let i = 1; i < b.footprint.length; i++) {
    const p = b.footprint[i];
    if (p) shape.lineTo(p[0], -p[1]);
  }
  shape.closePath();
  const geom = new ExtrudeGeometry(shape, {
    depth: b.heightMeters,
    bevelEnabled: false,
  });
  geom.rotateX(-Math.PI / 2);
  const count = geom.attributes.position!.count;
  const heights = new Float32Array(count);
  heights.fill(b.heightMeters);
  geom.setAttribute('aHeight', new BufferAttribute(heights, 1));
  return geom;
}

export function Buildings({ buildings }: { buildings: Building[] }) {
  const { geometry, material } = useMemo(() => {
    const geos: BufGeo[] = [];
    for (const b of buildings) {
      if (b.footprint.length < 3) continue;
      geos.push(buildingGeometry(b));
    }
    const merged = geos.length > 0 ? mergeGeometries(geos, false) : new BufferGeometry();
    for (const g of geos) g.dispose();
    const mat = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: { uTime: { value: 0 } },
    });
    // Keep a height-tinted fallback color attribute unused by shader but harmless if merged empty
    if (merged && !merged.getAttribute('color')) {
      const n = merged.attributes.position?.count ?? 0;
      const colors = new Float32Array(n * 3);
      const c = new Color('#0e1428');
      for (let i = 0; i < n; i++) {
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }
      merged.setAttribute('color', new BufferAttribute(colors, 3));
    }
    return { geometry: merged ?? new BufferGeometry(), material: mat };
  }, [buildings]);

  useEffect(() => {
    let raf = 0;
    const tick = (t: number) => {
      const u = material.uniforms['uTime'];
      if (u) u.value = t * 0.001;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <mesh geometry={geometry} material={material} />;
}
