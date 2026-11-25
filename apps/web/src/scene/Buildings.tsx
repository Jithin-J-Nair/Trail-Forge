import { useEffect, useMemo } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  ExtrudeGeometry,
  MeshStandardMaterial,
  Shape,
  type BufferGeometry as BufGeo,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Building } from '@trailforge/shared';

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
  return geom;
}

function colorByHeight(height: number): Color {
  const t = Math.min(1, height / 40);
  return new Color().setHSL(0.58, 0.35, 0.18 + t * 0.35);
}

export function Buildings({ buildings }: { buildings: Building[] }) {
  const { geometry, material } = useMemo(() => {
    const geos: BufGeo[] = [];
    for (const b of buildings) {
      if (b.footprint.length < 3) continue;
      const g = buildingGeometry(b);
      const color = colorByHeight(b.heightMeters);
      const colors = new Float32Array(g.attributes.position!.count * 3);
      for (let i = 0; i < colors.length; i += 3) {
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
      }
      g.setAttribute('color', new BufferAttribute(colors, 3));
      geos.push(g);
    }
    const merged = geos.length > 0 ? mergeGeometries(geos, false) : new BufferGeometry();
    for (const g of geos) g.dispose();
    const mat = new MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05,
    });
    return { geometry: merged ?? new BufferGeometry(), material: mat };
  }, [buildings]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <mesh geometry={geometry} material={material} castShadow receiveShadow />;
}
