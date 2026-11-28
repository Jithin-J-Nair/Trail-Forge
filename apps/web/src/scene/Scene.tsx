import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { GenerateResponse } from '@trailforge/shared';
import type { WebGLRenderer } from 'three';
import { Buildings } from './Buildings.js';
import { DayNightLights } from './DayNightLights.js';
import { DebugStats } from './DebugStats.js';
import { FppWalkController } from './FppWalk.js';
import { IntroCamera } from './IntroCamera.js';
import { KeyboardNav } from './KeyboardNav.js';
import { Pins } from './Pins.js';
import { dprForQuality, probeQuality } from './quality.js';
import { Roads } from './Roads.js';
import { RouteLine } from './RouteLine.js';
import { CoverageBadge, resolveSpatialLayer, spatialEnvFromImportMeta } from '../spatial/index.js';
import { SelectFlyTo } from './SelectFlyTo.js';
import { getSolarState } from './solar.js';
import { WebGlFallback } from './WebGlFallback.js';

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
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
  const initialSolar = useMemo(
    () => getSolarState(data.center.lat, data.center.lon),
    [data.center.lat, data.center.lon],
  );
  const [timeLabel, setTimeLabel] = useState(initialSolar.localTimeLabel);
  const [isDay, setIsDay] = useState(initialSolar.isDay);
  const [dayFactor, setDayFactor] = useState(initialSolar.dayFactor);
  const spatial = useMemo(() => resolveSpatialLayer(spatialEnvFromImportMeta()), []);

  const onSolar = useCallback((label: string, day: boolean, factor: number) => {
    setTimeLabel(label);
    setIsDay(day);
    setDayFactor(factor);
  }, []);

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
          <DayNightLights lat={data.center.lat} lon={data.center.lon} onSolar={onSolar} />
          <IntroCamera enabled={!playing} />
          <Roads roads={data.scene.roads} />
          <Buildings buildings={data.scene.buildings} dayFactor={dayFactor} />
          <RouteLine pois={data.pois} orderedPoiIds={data.route.orderedPoiIds} />
          <Pins pois={data.pois} content={data.content} />
          {!playing ? <SelectFlyTo pois={data.pois} /> : null}
          <FppWalkController
            pois={data.pois}
            orderedPoiIds={data.route.orderedPoiIds}
            playing={playing}
            onStop={() => onPlayStop?.()}
          />
          <KeyboardNav data={data} />
          {quality !== 'low' && !reduceMotion && dayFactor < 0.45 ? (
            <EffectComposer multisampling={0}>
              <Bloom
                intensity={0.22}
                luminanceThreshold={0.75}
                luminanceSmoothing={0.4}
                mipmapBlur
              />
            </EffectComposer>
          ) : null}
        </Suspense>
      </Canvas>
      <p
        className="pointer-events-none absolute bottom-[4.5rem] left-1/2 z-20 -translate-x-1/2 rounded-md border border-trail-border bg-black/40 px-3 py-1 text-[10px] tracking-wide text-trail-muted backdrop-blur-md md:bottom-24"
        role="status"
      >
        Local {timeLabel} · {isDay ? 'Day' : 'Night'}
      </p>
      <CoverageBadge status={spatial} />
      <DebugStats enabled={debug} gl={gl} />
    </div>
  );
}
