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
        positions.push(a[0], 0.15, a[1], b[0], 0.15, b[1]);
      }
    }
    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const mat = new LineBasicMaterial({ color: '#7dd3fc', transparent: true, opacity: 0.75 });
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#0a1210" />
      </mesh>
      <gridHelper args={[400, 40, '#1e3a2f', '#13241c']} position={[0, 0.01, 0]} />
    </group>
  );
}
