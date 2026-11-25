import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Mesh } from 'three';
import type { PoiContent, PoiLocal } from '@trailforge/shared';
import { useTourSceneStore } from './tour-scene-store.js';

type PinPoi = PoiLocal & { status: Exclude<PoiContent['status'], 'rejected'> };

export function Pins({ pois, content }: { pois: PoiLocal[]; content: PoiContent[] }) {
  const statusById = useMemo(() => {
    const map = new Map<string, PoiContent['status']>();
    for (const c of content) map.set(c.poiId, c.status);
    return map;
  }, [content]);

  const visible = useMemo(() => {
    const list: PinPoi[] = [];
    for (const p of pois) {
      const status = statusById.get(p.id) ?? 'needs_review';
      if (status === 'rejected') continue;
      list.push({ ...p, status });
    }
    return list;
  }, [pois, statusById]);

  return (
    <group>
      {visible.map((poi) => (
        <Pin key={poi.id} poi={poi} />
      ))}
    </group>
  );
}

function Pin({ poi }: { poi: PinPoi }) {
  const ring = useRef<Mesh>(null);
  const selected = useTourSceneStore((s) => s.selectedPoiId === poi.id);
  const hovered = useTourSceneStore((s) => s.hoveredPoiId === poi.id);
  const setSelected = useTourSceneStore((s) => s.setSelectedPoiId);
  const setHovered = useTourSceneStore((s) => s.setHoveredPoiId);
  const color = poi.status === 'verified' ? '#4FE3A3' : '#FFB547';

  useFrame(({ clock }) => {
    if (!ring.current) return;
    const t = clock.elapsedTime;
    const s = 1 + Math.sin(t * 3) * 0.12;
    ring.current.scale.set(s, s, s);
  });

  return (
    <group position={[poi.x, 0, poi.z]}>
      <mesh position={[0, 9, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 18, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} toneMapped={false} />
      </mesh>
      <mesh
        ref={ring}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.25, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(poi.id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(null);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelected(poi.id);
        }}
        scale={selected || hovered ? 1.35 : 1}
      >
        <ringGeometry args={[2.4, 3.4, 28]} />
        <meshBasicMaterial color={color} transparent opacity={0.92} toneMapped={false} />
      </mesh>
      <Html distanceFactor={55} position={[0, 20, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            color,
            fontSize: 12,
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            textShadow: '0 0 10px rgba(0,0,0,0.85)',
            opacity: hovered || selected ? 1 : 0.8,
          }}
        >
          {poi.name}
        </div>
      </Html>
    </group>
  );
}
