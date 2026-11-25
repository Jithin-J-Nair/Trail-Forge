import { useEffect, useState } from 'react';
import type { WebGLRenderer } from 'three';

export function DebugStats({ enabled, gl }: { enabled: boolean; gl: WebGLRenderer | null }) {
  const [info, setInfo] = useState({ fps: 0, calls: 0 });

  useEffect(() => {
    if (!enabled || !gl) return;
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const tick = () => {
      frames += 1;
      const now = performance.now();
      if (now - last >= 500) {
        setInfo({
          fps: Math.round((frames * 1000) / (now - last)),
          calls: gl.info.render.calls,
        });
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, gl]);

  if (!enabled) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 20,
        padding: '6px 8px',
        fontSize: 12,
        fontFamily: 'monospace',
        background: 'rgba(0,0,0,0.65)',
        color: '#a7f3d0',
      }}
    >
      {info.fps} fps · {info.calls} draws
    </div>
  );
}
