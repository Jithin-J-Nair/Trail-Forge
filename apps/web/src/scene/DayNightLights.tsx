import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { DirectionalLight, Fog, HemisphereLight } from 'three';
import { Color } from 'three';
import { getSolarState, solarElevationDeg } from './solar.js';

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mixHex(a: string, b: string, t: number): string {
  const parse = (h: string) =>
    [
      Number.parseInt(h.slice(1, 3), 16),
      Number.parseInt(h.slice(3, 5), 16),
      Number.parseInt(h.slice(5, 7), 16),
    ] as const;
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const bch = Math.round(lerp(ab, bb, t));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bch.toString(16).padStart(2, '0')}`;
}

/** Approximate solar azimuth (rad from south, +west) from lon + elevation. */
function sunDir(lat: number, lon: number, now: Date): { x: number; y: number; z: number } {
  const elev = (solarElevationDeg(lat, lon, now) * Math.PI) / 180;
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  const hourAngle = ((utcHours + lon / 15 - 12) * 15 * Math.PI) / 180;
  const dist = 180;
  return {
    x: Math.cos(elev) * Math.sin(hourAngle) * dist,
    y: Math.max(4, Math.sin(elev) * dist),
    z: Math.cos(elev) * Math.cos(hourAngle) * dist,
  };
}

export function DayNightLights({
  lat,
  lon,
  onSolar,
}: {
  lat: number;
  lon: number;
  onSolar?: (label: string, isDay: boolean, dayFactor: number) => void;
}) {
  const sun = useRef<DirectionalLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const fog = useRef<Fog>(null);
  const bg = useRef<Color>(null);
  const ground = useRef<Color>(new Color());
  const lastKey = useRef('');

  const initial = useMemo(() => getSolarState(lat, lon), [lat, lon]);

  useFrame(() => {
    const now = new Date();
    const s = getSolarState(lat, lon, now);
    const d = s.dayFactor;
    const dir = sunDir(lat, lon, now);
    if (sun.current) {
      sun.current.position.set(dir.x, dir.y, dir.z);
      sun.current.intensity = lerp(0.05, 1.15, d);
      sun.current.color.set(mixHex('#8a9bb8', '#fff4e0', d));
    }
    if (hemi.current) {
      hemi.current.intensity = lerp(0.25, 0.75, d);
      hemi.current.color.set(mixHex('#1a2233', '#b8c8e0', d));
      hemi.current.groundColor.set(mixHex('#05070D', '#3a4038', d));
    }
    const sky = mixHex('#05070D', '#87a0c0', d);
    if (bg.current) bg.current.set(sky);
    if (fog.current) {
      fog.current.color.set(sky);
      fog.current.near = lerp(70, 140, d);
      fog.current.far = lerp(280, 520, d);
    }
    ground.current.set(mixHex('#0a0c12', '#2c332c', d));

    const key = `${s.localTimeLabel}|${s.isDay}|${d.toFixed(2)}`;
    if (onSolar && key !== lastKey.current) {
      lastKey.current = key;
      onSolar(s.localTimeLabel, s.isDay, s.dayFactor);
    }
  });

  const d0 = initial.dayFactor;
  const sky0 = mixHex('#05070D', '#87a0c0', d0);
  ground.current.set(mixHex('#0a0c12', '#2c332c', d0));

  return (
    <>
      <color ref={bg} attach="background" args={[sky0]} />
      <fog ref={fog} attach="fog" args={[sky0, lerp(70, 140, d0), lerp(280, 520, d0)]} />
      <hemisphereLight
        ref={hemi}
        args={[
          mixHex('#1a2233', '#b8c8e0', d0),
          mixHex('#05070D', '#3a4038', d0),
          lerp(0.25, 0.75, d0),
        ]}
      />
      <directionalLight
        ref={sun}
        position={[40, 100, 20]}
        intensity={lerp(0.05, 1.15, d0)}
        color={mixHex('#8a9bb8', '#fff4e0', d0)}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow={false}>
        <planeGeometry args={[800, 800]} />
        <meshStandardMaterial color={ground.current} roughness={0.95} metalness={0} />
      </mesh>
    </>
  );
}
