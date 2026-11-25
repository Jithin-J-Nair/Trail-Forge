import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  BufferGeometry,
  CatmullRomCurve3,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  Vector3,
} from 'three';
import type { PoiLocal } from '@trailforge/shared';

export function RouteLine({ pois, orderedPoiIds }: { pois: PoiLocal[]; orderedPoiIds: string[] }) {
  const lineRef = useRef<Line | null>(null);
  const byId = useMemo(() => new Map(pois.map((p) => [p.id, p])), [pois]);
  const ordered = useMemo(
    () => orderedPoiIds.map((id) => byId.get(id)).filter((p): p is PoiLocal => Boolean(p)),
    [byId, orderedPoiIds],
  );

  const { line, markers, dispose } = useMemo(() => {
    if (ordered.length < 2) {
      return {
        line: null as Line | null,
        markers: [] as PoiLocal[],
        dispose: () => undefined,
      };
    }
    const pts = ordered.map((p) => new Vector3(p.x, 1.4, p.z));
    const curve = new CatmullRomCurve3(pts, false, 'catmullrom', 0.35);
    const samples = curve.getPoints(72);
    const positions = new Float32Array(samples.length * 3);
    for (let i = 0; i < samples.length; i++) {
      const p = samples[i]!;
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    }
    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const mat = new LineBasicMaterial({
      color: '#8B7BFF',
      transparent: true,
      opacity: 0.9,
      toneMapped: false,
    });
    const obj = new Line(geom, mat);
    return {
      line: obj,
      markers: ordered,
      dispose: () => {
        geom.dispose();
        mat.dispose();
      },
    };
  }, [ordered]);

  useEffect(() => {
    lineRef.current = line;
    return dispose;
  }, [line, dispose]);

  useFrame(({ clock }) => {
    const mat = lineRef.current?.material;
    if (mat && !Array.isArray(mat) && 'opacity' in mat) {
      mat.opacity = 0.6 + Math.sin(clock.elapsedTime * 3.5) * 0.25;
    }
  });

  return (
    <group>
      {line ? <primitive object={line} /> : null}
      {markers.map((p, i) => (
        <mesh key={p.id} position={[p.x, 2.8, p.z]}>
          <sphereGeometry args={[1.05, 14, 14]} />
          <meshBasicMaterial color={i === 0 ? '#4FE3FF' : '#8B7BFF'} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
