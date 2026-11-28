import { useEffect } from 'react';
import type { GenerateResponse } from '@trailforge/shared';
import { useTourSceneStore } from './tour-scene-store.js';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
}

/**
 * Scene POI keyboard nav — ArrowLeft/Right along the route, Escape clears.
 * Does not hijack Tab (forms/panels keep normal focus order).
 */
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
      if (isTypingTarget(e.target)) return;
      if (e.key === 'Escape') {
        setSelected(null);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        if (routeIds.length === 0) return;
        e.preventDefault();
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
