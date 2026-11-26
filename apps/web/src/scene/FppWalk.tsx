import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { useEffect, useRef } from 'react';
import { CatmullRomCurve3, PerspectiveCamera, Vector3 } from 'three';
import type { PoiLocal } from '@trailforge/shared';
import { useTourSceneStore } from './tour-scene-store.js';

gsap.registerPlugin(MotionPathPlugin);

const EYE_Y = 1.7;
const LOOK_AHEAD_M = 12;

function densifyPath(stops: PoiLocal[]): { x: number; y: number; z: number }[] {
  if (stops.length === 0) return [];
  if (stops.length === 1) {
    const s = stops[0]!;
    return [{ x: s.x, y: EYE_Y, z: s.z }];
  }
  const pts = stops.map((s) => new Vector3(s.x, EYE_Y, s.z));
  const curve = new CatmullRomCurve3(pts, false, 'catmullrom', 0.35);
  const len = curve.getLength();
  const samples = Math.max(24, Math.min(160, Math.ceil(len / 4)));
  const out: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const p = curve.getPoint(i / samples);
    out.push({ x: p.x, y: EYE_Y, z: p.z });
  }
  return out;
}

function nearestStopId(pois: PoiLocal[], x: number, z: number): string | null {
  let best: PoiLocal | null = null;
  let bestD = Infinity;
  for (const p of pois) {
    const d = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best?.id ?? null;
}

/** Cinematic FPP walk A→B via GSAP MotionPathPlugin (eye height, look-ahead). */
export function FppWalkController({
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
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    tweenRef.current?.kill();
    tweenRef.current = null;
    if (!playing) return;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const byId = new Map(pois.map((p) => [p.id, p]));
    const stops = orderedPoiIds.map((id) => byId.get(id)).filter((p): p is PoiLocal => Boolean(p));
    const path = densifyPath(stops);
    if (path.length < 2) {
      onStop();
      return;
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onStop();
    };
    window.addEventListener('keydown', onKey);

    const persp = camera as PerspectiveCamera;
    persp.fov = 68;
    persp.near = 0.2;
    persp.far = 600;
    persp.updateProjectionMatrix();

    if (reduce) {
      const end = path[path.length - 1]!;
      const prev = path[Math.max(0, path.length - 2)]!;
      camera.position.set(end.x, EYE_Y, end.z);
      camera.lookAt(end.x + (end.x - prev.x), EYE_Y, end.z + (end.z - prev.z));
      onStop();
      return () => window.removeEventListener('keydown', onKey);
    }

    const start = path[0]!;
    const proxy = { x: start.x, y: EYE_Y, z: start.z };
    camera.position.set(start.x, EYE_Y, start.z);
    const curvePts = path.map((p) => new Vector3(p.x, p.y, p.z));
    const curve = new CatmullRomCurve3(curvePts, false, 'catmullrom', 0.35);
    const distance = Math.max(1, curve.getLength());
    const duration = Math.min(90, Math.max(28, distance / 8));

    let lastId: string | null = null;
    const tween = gsap.to(proxy, {
      duration,
      ease: 'none',
      motionPath: {
        path,
        curviness: 1.25,
        autoRotate: false,
      },
      onUpdate() {
        camera.position.set(proxy.x, EYE_Y, proxy.z);
        const t = this.progress();
        const ahead = Math.min(1, t + LOOK_AHEAD_M / distance);
        const look = curve.getPoint(ahead);
        camera.lookAt(look.x, EYE_Y * 0.92, look.z);
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
      restore.near = 1;
      restore.far = 900;
      restore.updateProjectionMatrix();
    };
  }, [playing, pois, orderedPoiIds, camera, onStop, setSelected]);

  return null;
}
