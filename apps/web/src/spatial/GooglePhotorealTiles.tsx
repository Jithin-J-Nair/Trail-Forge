import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Group } from 'three';
import { TilesRenderer } from '3d-tiles-renderer/three';
import { ReorientationPlugin } from '3d-tiles-renderer/plugins';
import { preprocessGoogleTilesUrl } from './google-tiles-url.js';

type Props = {
  rootUrl: string;
  lat: number;
  lon: number;
  onLoad: () => void;
  onError: (reason: string) => void;
};

/** Plugin hook — TilesRenderer invokes preprocessURL on registered plugins. */
class GoogleTilesProxyPlugin {
  name = 'GOOGLE_TILES_PROXY_PLUGIN';
  preprocessURL(uri: string) {
    return preprocessGoogleTilesUrl(uri);
  }
}

/**
 * R3F Google Photorealistic 3D Tiles via 3d-tiles-renderer.
 * Loads through the API proxy (rootUrl); key never touches the browser.
 */
export function GooglePhotorealTiles({ rootUrl, lat, lon, onLoad, onError }: Props) {
  const groupRef = useRef<Group>(null);
  const tilesRef = useRef<TilesRenderer | null>(null);
  const settled = useRef(false);
  const { camera, gl } = useThree();

  useEffect(() => {
    settled.current = false;
    const tiles = new TilesRenderer(rootUrl);
    tiles.registerPlugin(new GoogleTilesProxyPlugin());
    // Reorientation defaults to X=west / Z=north; +π aligns to TrailForge +X east / +Z south.
    tiles.registerPlugin(
      new ReorientationPlugin({
        lat: (lat * Math.PI) / 180,
        lon: (lon * Math.PI) / 180,
        height: 0,
        recenter: true,
        azimuth: Math.PI,
      }),
    );
    tiles.errorTarget = 12;
    tiles.addEventListener('load-root-tileset', () => {
      if (settled.current) return;
      settled.current = true;
      onLoad();
    });
    tiles.addEventListener('load-error', (event) => {
      if (settled.current) return;
      settled.current = true;
      const message = event.error instanceof Error ? event.error.message : 'load-error';
      onError(message);
    });

    const group = groupRef.current;
    group?.add(tiles.group);
    tilesRef.current = tiles;

    const failSafe = window.setTimeout(() => {
      if (settled.current) return;
      settled.current = true;
      onError('tiles load timeout');
    }, 45_000);

    return () => {
      window.clearTimeout(failSafe);
      group?.remove(tiles.group);
      tiles.dispose();
      tilesRef.current = null;
    };
  }, [rootUrl, lat, lon, onLoad, onError]);

  useFrame(() => {
    const tiles = tilesRef.current;
    if (!tiles) return;
    camera.updateMatrixWorld();
    tiles.setCamera(camera);
    tiles.setResolutionFromRenderer(camera, gl);
    tiles.update();
  });

  return <group ref={groupRef} />;
}
