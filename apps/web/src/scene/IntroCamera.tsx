import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

export function IntroCamera() {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    camera.position.set(0, reduceMotion ? 80 : 180, reduceMotion ? 120 : 220);
    camera.lookAt(0, 0, 0);
    if (reduceMotion) return;
    let raf = 0;
    const start = performance.now();
    const from = { y: 180, z: 220 };
    const to = { y: 80, z: 120 };
    const tick = (t: number) => {
      const u = Math.min(1, (t - start) / 1600);
      const e = 1 - Math.pow(1 - u, 3);
      camera.position.y = from.y + (to.y - from.y) * e;
      camera.position.z = from.z + (to.z - from.z) * e;
      camera.lookAt(0, 0, 0);
      controls.current?.update();
      if (u < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [camera, reduceMotion]);

  return (
    <OrbitControls
      ref={controls}
      enableDamping
      dampingFactor={0.08}
      minDistance={40}
      maxDistance={280}
      maxPolarAngle={Math.PI / 2.05}
      minPolarAngle={0.2}
      enablePan
      // keep camera above ground
      onChange={() => {
        if (camera.position.y < 5) camera.position.y = 5;
      }}
    />
  );
}
