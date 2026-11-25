import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { Vector3 } from 'three';
import type { PoiLocal } from '@trailforge/shared';
import { useTourSceneStore } from './tour-scene-store.js';

export function SelectFlyTo({ pois }: { pois: PoiLocal[] }) {
  const selected = useTourSceneStore((s) => s.selectedPoiId);
  const { camera } = useThree();

  useEffect(() => {
    if (!selected) return;
    const poi = pois.find((p) => p.id === selected);
    if (!poi) return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = new Vector3(poi.x, 45, poi.z + 55);
    const look = new Vector3(poi.x, 0, poi.z);
    if (reduce) {
      camera.position.copy(target);
      camera.lookAt(look);
      return;
    }
    const start = camera.position.clone();
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const u = Math.min(1, (now - t0) / 700);
      const e = u * u * (3 - 2 * u);
      camera.position.lerpVectors(start, target, e);
      camera.lookAt(look);
      if (u < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [selected, pois, camera]);

  return null;
}
