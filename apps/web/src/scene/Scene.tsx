import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { Suspense, useEffect, useMemo, useState } from 'react';
import type { GenerateResponse } from '@trailforge/shared';
import type { WebGLRenderer } from 'three';
import { Buildings } from './Buildings.js';
import { DebugStats } from './DebugStats.js';
import { FlyThroughController } from './FlyThrough.js';
import { IntroCamera } from './IntroCamera.js';
import { KeyboardNav } from './KeyboardNav.js';
import { Pins } from './Pins.js';
import { dprForQuality, probeQuality } from './quality.js';
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
      <color attach="background" args={['#07090F']} />
      <fog attach="fog" args={['#07090F', 100, 400]} />
      <hemisphereLight args={['#2a3348', '#07090F', 0.55]} />
      <directionalLight position={[40, 100, 20]} intensity={0.5} color="#c8d0e0" />
      <pointLight position={[-50, 35, -30]} intensity={0.35} color="#9eb0c8" distance={220} />
      <pointLight position={[60, 28, 50]} intensity={0.25} color="#b8a890" distance={200} />
    </>
  );
}

export function Scene({
  data,
  debug = false,
  playing = false,
  onPlayStop,
}: {
  data: GenerateResponse;
  debug?: boolean;
  playing?: boolean;
  onPlayStop?: () => void;
}) {
  const [webglOk, setWebglOk] = useState(true);
  const [gl, setGl] = useState<WebGLRenderer | null>(null);
  const quality = useMemo(() => probeQuality(), []);
  const dpr = dprForQuality(quality);
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    setWebglOk(supportsWebGL());
  }, []);

  if (!webglOk) return <WebGlFallback />;

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden bg-trail-bg">
      <Canvas
        dpr={dpr}
        gl={{ antialias: quality !== 'low', powerPreference: 'high-performance', alpha: false }}
        camera={{ position: [0, 180, 220], fov: 42, near: 1, far: 900 }}
        shadows={false}
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
            onStop={() => onPlayStop?.()}
          />
          <KeyboardNav data={data} />
          {quality !== 'low' && !reduceMotion ? (
            <EffectComposer multisampling={0}>
              <Bloom
                intensity={0.28}
                luminanceThreshold={0.72}
                luminanceSmoothing={0.4}
                mipmapBlur
              />
            </EffectComposer>
          ) : null}
        </Suspense>
      </Canvas>
      <DebugStats enabled={debug} gl={gl} />
    </div>
  );
}
