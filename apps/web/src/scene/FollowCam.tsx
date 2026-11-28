import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { useEffect, useRef } from 'react';
import { CatmullRomCurve3, PerspectiveCamera, Vector3 } from 'three';
import type { PoiLocal } from '@trailforge/shared';
import { densifyPath, nearestStopId, orderedStops } from './route-path.js';
import { useTourSceneStore } from './tour-scene-store.js';

gsap.registerPlugin(MotionPathPlugin);

const FOLLOW_Y = 42;
const LOOK_AHEAD_M = 28;

/** Elevated chase along the ordered route — polish on top of FPP, not a rewrite. */
export function FollowCamController({
  pois,
  orderedPoiIds,
  active,
  onStop,
}: {
  pois: PoiLocal[];
  orderedPoiIds: string[];
  active: boolean;
  onStop: () => void;
}) {
  const { camera } = useThree();
  const setSelected = useTourSceneStore((s) => s.setSelectedPoiId);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    tweenRef.current?.kill();
    tweenRef.current = null;
    if (!active) return;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stops = orderedStops(pois, orderedPoiIds);
    const path = densifyPath(stops, FOLLOW_Y);
    if (path.length < 2) {
      onStop();
      return;
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onStop();
    };
    window.addEventListener('keydown', onKey);

    const persp = camera as PerspectiveCamera;
    persp.fov = 48;
    persp.near = 1;
    persp.far = 900;
    persp.updateProjectionMatrix();

    if (reduce) {
      const mid = path[Math.floor(path.length / 2)]!;
      camera.position.set(mid.x, FOLLOW_Y, mid.z + 20);
      camera.lookAt(mid.x, 8, mid.z);
      onStop();
      return () => window.removeEventListener('keydown', onKey);
    }

    const start = path[0]!;
    const proxy = { x: start.x, y: FOLLOW_Y, z: start.z };
    camera.position.set(start.x, FOLLOW_Y, start.z);
    const curvePts = path.map((p) => new Vector3(p.x, p.y, p.z));
    const curve = new CatmullRomCurve3(curvePts, false, 'catmullrom', 0.35);
    const distance = Math.max(1, curve.getLength());
    const duration = Math.min(70, Math.max(18, distance / 12));

    let lastId: string | null = null;
    const tween = gsap.to(proxy, {
      duration,
      ease: 'none',
      motionPath: { path, curviness: 1.1, autoRotate: false },
      onUpdate() {
        camera.position.set(proxy.x, FOLLOW_Y, proxy.z);
        const t = this.progress();
        const ahead = Math.min(1, t + LOOK_AHEAD_M / distance);
        const look = curve.getPoint(ahead);
        camera.lookAt(look.x, 6, look.z);
        const id = nearestStopId(stops, proxy.x, proxy.z);
        if (id && id !== lastId) {
          lastId = id;
          setSelected(id);
        }
      },
      onComplete: () => onStop(),
    });
    tweenRef.current = tween;

    return () => {
      tween.kill();
      tweenRef.current = null;
      window.removeEventListener('keydown', onKey);
      const restore = camera as PerspectiveCamera;
      restore.fov = 42;
      restore.updateProjectionMatrix();
    };
  }, [active, pois, orderedPoiIds, camera, onStop, setSelected]);

  return null;
}
