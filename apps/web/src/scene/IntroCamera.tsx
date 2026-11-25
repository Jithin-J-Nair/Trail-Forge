import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

export function IntroCamera() {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, gl } = useThree();
  const idle = useRef(true);
  const angle = useRef(0);
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    camera.position.set(0, reduceMotion ? 80 : 180, reduceMotion ? 120 : 220);
    camera.lookAt(0, 0, 0);
    if (reduceMotion) return;
    let raf = 0;
    const start = performance.now();
    const from = { y: 180, z: 220 };
    const to = { y: 110, z: 210 };
    const tick = (t: number) => {
      const u = Math.min(1, (t - start) / 1800);
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

  useEffect(() => {
    const el = gl.domElement;
    const stopIdle = () => {
      idle.current = false;
    };
    el.addEventListener('pointerdown', stopIdle);
    el.addEventListener('wheel', stopIdle, { passive: true });
    return () => {
      el.removeEventListener('pointerdown', stopIdle);
      el.removeEventListener('wheel', stopIdle);
    };
  }, [gl]);

  useFrame((_, dt) => {
    if (reduceMotion || !idle.current || !controls.current) return;
    angle.current += dt * 0.08;
    const r = 210;
    camera.position.x = Math.sin(angle.current) * r;
    camera.position.z = Math.cos(angle.current) * r;
    camera.position.y = 110;
    controls.current.target.set(0, 12, 0);
    controls.current.update();
  });

  return (
    <OrbitControls
      ref={controls}
      enableDamping
      dampingFactor={0.08}
      minDistance={40}
      maxDistance={300}
      maxPolarAngle={Math.PI / 2.05}
      minPolarAngle={0.2}
      enablePan
      onStart={() => {
        idle.current = false;
      }}
      onChange={() => {
        if (camera.position.y < 5) camera.position.y = 5;
      }}
    />
  );
}
