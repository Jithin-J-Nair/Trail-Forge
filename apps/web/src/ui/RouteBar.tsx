import type { GenerateResponse } from '@trailforge/shared';
import type { CameraMode } from '../scene/camera-mode.js';
import { t, type UiLang } from '../i18n/messages.js';
import { useTourSceneStore } from '../scene/tour-scene-store.js';
import {
  buildCsv,
  buildGeoJson,
  downloadText,
  exportFilename,
  type ApprovedContent,
} from './export.js';

export function RouteBar({
  lang,
  response,
  content,
  cameraMode,
  onCameraModeChange,
}: {
  lang: UiLang;
  response: GenerateResponse;
  content: ApprovedContent[];
  cameraMode: CameraMode;
  onCameraModeChange: (mode: CameraMode) => void;
}) {
  const selected = useTourSceneStore((s) => s.selectedPoiId);
  const setSelected = useTourSceneStore((s) => s.setSelectedPoiId);
  const ordered = response.route.orderedPoiIds
    .map((id) => response.pois.find((p) => p.id === id))
    .filter(Boolean);
  const walking = cameraMode === 'fpp';

  return (
    <div className="glass-panel flex w-full max-w-3xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:gap-4">
      <div className="flex shrink-0 flex-wrap gap-1.5" role="group" aria-label="Camera mode">
        <button
          type="button"
          className={`glass-btn px-3 py-2 text-xs ${cameraMode === 'aerial' ? 'glass-btn-primary' : 'glass-btn-ghost'}`}
          aria-pressed={cameraMode === 'aerial'}
          onClick={() => onCameraModeChange('aerial')}
        >
          {t(lang, 'camAerial')}
        </button>
        <button
          type="button"
          className={`glass-btn px-3 py-2 text-xs ${cameraMode === 'follow' ? 'glass-btn-primary' : 'glass-btn-ghost'}`}
          aria-pressed={cameraMode === 'follow'}
          onClick={() => onCameraModeChange('follow')}
        >
          {t(lang, 'camFollow')}
        </button>
        <button
          type="button"
          className={`glass-btn px-3 py-2 text-xs ${walking ? 'glass-btn-primary' : 'glass-btn-ghost'}`}
          aria-pressed={walking}
          onClick={() => onCameraModeChange(walking ? 'aerial' : 'fpp')}
        >
          {walking ? t(lang, 'pause') : t(lang, 'play')}
        </button>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-1">
        {ordered.map((poi) => {
          if (!poi) return null;
          const active = selected === poi.id;
          return (
            <button
              key={poi.id}
              type="button"
              title={poi.name}
              aria-label={poi.name}
              className={`h-2.5 w-2.5 shrink-0 rounded-md transition ${
                active ? 'scale-125 bg-trail-amber' : 'bg-trail-teal/70 hover:bg-trail-teal'
              }`}
              onClick={() => setSelected(poi.id)}
            />
          );
        })}
      </div>

      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          className="glass-btn-ghost px-3 py-2 text-xs"
          onClick={() =>
            downloadText(
              exportFilename(response.route.titleEn, 'geojson'),
              buildGeoJson(response, content, response.route.titleEn),
              'application/geo+json',
            )
          }
        >
          {t(lang, 'exportGeojson')}
        </button>
        <button
          type="button"
          className="glass-btn-ghost px-3 py-2 text-xs"
          onClick={() =>
            downloadText(
              exportFilename(response.route.titleEn, 'csv'),
              buildCsv(response, content, response.route.titleEn),
              'text/csv;charset=utf-8',
            )
          }
        >
          {t(lang, 'exportCsv')}
        </button>
      </div>
    </div>
  );
}
