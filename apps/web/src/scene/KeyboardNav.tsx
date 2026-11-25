import { useEffect } from 'react';
import type { GenerateResponse } from '@trailforge/shared';
import { useTourSceneStore } from './tour-scene-store.js';

export function KeyboardNav({ data }: { data: GenerateResponse }) {
  const selected = useTourSceneStore((s) => s.selectedPoiId);
  const setSelected = useTourSceneStore((s) => s.setSelectedPoiId);

  useEffect(() => {
    const pinIds = data.content
      .filter((c) => c.status !== 'rejected')
      .map((c) => c.poiId)
      .filter((id) => data.pois.some((p) => p.id === id));
    const routeIds = data.route.orderedPoiIds.filter((id) => pinIds.includes(id));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelected(null);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        if (pinIds.length === 0) return;
        const idx = selected ? pinIds.indexOf(selected) : -1;
        const next = pinIds[(idx + 1) % pinIds.length];
        if (next) setSelected(next);
        return;
      }
      if (e.key === 'Enter' && selected) {
        setSelected(selected);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        if (routeIds.length === 0) return;
        const idx = selected ? routeIds.indexOf(selected) : -1;
        const delta = e.key === 'ArrowRight' ? 1 : -1;
        const next = routeIds[(idx + delta + routeIds.length) % routeIds.length];
        if (next) setSelected(next);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [data, selected, setSelected]);

  return null;
}
