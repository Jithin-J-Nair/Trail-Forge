import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import type { PoiLocal } from '@trailforge/shared';
import { useTourSceneStore } from './tour-scene-store.js';

export function FlyThroughController({
  pois,
  orderedPoiIds,
  playing,
  onStop,
}: {
  pois: PoiLocal[];
  orderedPoiIds: string[];
  playing: boolean;
  onStop: () => void;
}) {
  const { camera } = useThree();
  const setSelected = useTourSceneStore((s) => s.setSelectedPoiId);
  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;
    if (!playing) return;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const byId = new Map(pois.map((p) => [p.id, p]));
    const stops = orderedPoiIds.map((id) => byId.get(id)).filter((p): p is PoiLocal => Boolean(p));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelRef.current = true;
        onStop();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onStop, { once: true });

    const run = async () => {
      for (const stop of stops) {
        if (cancelRef.current) break;
        setSelected(stop.id);
        const target = new Vector3(stop.x, 40, stop.z + 50);
        const look = new Vector3(stop.x, 0, stop.z);
        if (reduce) {
          camera.position.copy(target);
          camera.lookAt(look);
        } else {
          await easeCamera(camera.position, target, look, camera, 900, () => cancelRef.current);
        }
        await wait(1500, () => cancelRef.current);
      }
      onStop();
    };
    void run();

    return () => {
      cancelRef.current = true;
      window.removeEventListener('keydown', onKey);
    };
  }, [playing, pois, orderedPoiIds, camera, onStop, setSelected]);

  return null;
}

function wait(ms: number, cancelled: () => boolean) {
  return new Promise<void>((resolve) => {
    const start = performance.now();
    const tick = () => {
      if (cancelled() || performance.now() - start >= ms) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function easeCamera(
  from: Vector3,
  to: Vector3,
  look: Vector3,
  camera: { position: Vector3; lookAt: (v: Vector3) => void },
  ms: number,
  cancelled: () => boolean,
) {
  const start = from.clone();
  return new Promise<void>((resolve) => {
    const t0 = performance.now();
    const tick = (now: number) => {
      if (cancelled()) {
        resolve();
        return;
      }
      const u = Math.min(1, (now - t0) / ms);
      const e = u * u * (3 - 2 * u);
      camera.position.lerpVectors(start, to, e);
      camera.lookAt(look);
      if (u < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}
