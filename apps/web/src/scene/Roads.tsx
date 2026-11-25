import { useEffect, useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments } from 'three';
import type { Road } from '@trailforge/shared';

export function Roads({ roads }: { roads: Road[] }) {
  const { object, dispose } = useMemo(() => {
    const positions: number[] = [];
    for (const road of roads) {
      for (let i = 0; i < road.points.length - 1; i++) {
        const a = road.points[i];
        const b = road.points[i + 1];
        if (!a || !b) continue;
        positions.push(a[0], 0.2, a[1], b[0], 0.2, b[1]);
      }
    }
    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const mat = new LineBasicMaterial({
      color: '#4FE3FF',
      transparent: true,
      opacity: 0.85,
      toneMapped: false,
    });
    const lines = new LineSegments(geom, mat);
    return {
      object: lines,
      dispose: () => {
        geom.dispose();
        mat.dispose();
      },
    };
  }, [roads]);

  useEffect(() => dispose, [dispose]);

  return (
    <group>
      <primitive object={object} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[520, 520]} />
        <meshStandardMaterial color="#060912" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}
