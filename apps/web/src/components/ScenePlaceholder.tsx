import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useState } from 'react';

function GroundMarker() {
  return (
    <mesh position={[0, 0.5, 0]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#3d5c45" />
    </mesh>
  );
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

export function ScenePlaceholder() {
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    setWebglOk(supportsWebGL());
  }, []);

  if (!webglOk) {
    return (
      <div
        role="status"
        className="flex h-64 items-center justify-center rounded-sm border border-trail-moss/20 bg-trail-mist/60 px-6 text-center text-sm text-trail-ink"
      >
        WebGL is unavailable in this browser. The 3D city scene cannot be shown.
      </div>
    );
  }

  return (
    <div className="h-64 overflow-hidden rounded-sm border border-trail-moss/20 bg-trail-ink/90">
      <Canvas camera={{ position: [3, 3, 3], fov: 45 }} aria-label="Placeholder 3D scene">
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 6, 2]} intensity={1.1} />
        <GroundMarker />
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
}
