import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import type { GenerateResponse } from '@trailforge/shared';
import type { WebGLRenderer } from 'three';
import { Buildings } from './Buildings.js';
import { DebugStats } from './DebugStats.js';
import { FlyThroughController } from './FlyThrough.js';
import { IntroCamera } from './IntroCamera.js';
import { KeyboardNav } from './KeyboardNav.js';
import { Pins } from './Pins.js';
import { Roads } from './Roads.js';
import { RouteLine } from './RouteLine.js';
import { SelectFlyTo } from './SelectFlyTo.js';
import { WebGlFallback } from './WebGlFallback.js';

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

function Lights() {
  return (
    <>
      <color attach="background" args={['#070b0a']} />
      <fog attach="fog" args={['#070b0a', 120, 420]} />
      <hemisphereLight args={['#94a3b8', '#0f172a', 0.55]} />
      <directionalLight position={[60, 120, 40]} intensity={1.1} color="#c4b5fd" castShadow />
      <pointLight position={[-40, 40, -20]} intensity={0.6} color="#22d3ee" />
      <pointLight position={[50, 30, 40]} intensity={0.45} color="#a78bfa" />
    </>
  );
}

export function Scene({ data, debug = false }: { data: GenerateResponse; debug?: boolean }) {
  const [webglOk, setWebglOk] = useState(true);
  const [gl, setGl] = useState<WebGLRenderer | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setWebglOk(supportsWebGL());
  }, []);

  if (!webglOk) return <WebGlFallback />;

  return (
    <div className="relative h-[420px] w-full overflow-hidden border border-white/10 bg-black">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 180, 220], fov: 45, near: 1, far: 800 }}
        shadows
        onCreated={({ gl: renderer }) => setGl(renderer)}
      >
        <Suspense fallback={null}>
          <Lights />
          <IntroCamera />
          <Roads roads={data.scene.roads} />
          <Buildings buildings={data.scene.buildings} />
          <RouteLine pois={data.pois} orderedPoiIds={data.route.orderedPoiIds} />
          <Pins pois={data.pois} content={data.content} />
          <SelectFlyTo pois={data.pois} />
          <FlyThroughController
            pois={data.pois}
            orderedPoiIds={data.route.orderedPoiIds}
            playing={playing}
            onStop={() => setPlaying(false)}
          />
          <KeyboardNav data={data} />
        </Suspense>
      </Canvas>
      <DebugStats enabled={debug} gl={gl} />
      <button
        type="button"
        className="absolute bottom-3 left-3 z-20 bg-trail-accent px-3 py-1.5 text-xs font-semibold text-white"
        onClick={() => setPlaying(true)}
      >
        Play route
      </button>
    </div>
  );
}
