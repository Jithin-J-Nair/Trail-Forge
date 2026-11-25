import type { Claim, GenerateResponse } from '@trailforge/shared';
import { useMemo, useState } from 'react';
import { t, type UiLang } from '../i18n/messages.js';
import { useTourSceneStore } from '../scene/tour-scene-store.js';
import {
  buildCsv,
  buildGeoJson,
  downloadText,
  exportFilename,
  type ApprovedContent,
} from './export.js';

export function ResultPanel({
  lang,
  response,
  content,
  onContentChange,
}: {
  lang: UiLang;
  response: GenerateResponse;
  content: ApprovedContent[];
  onContentChange: (next: ApprovedContent[]) => void;
}) {
  const selected = useTourSceneStore((s) => s.selectedPoiId);
  const setSelected = useTourSceneStore((s) => s.setSelectedPoiId);
  const selectedContent = content.find((c) => c.poiId === selected);
  const selectedPoi = response.pois.find((p) => p.id === selected);

  const bar = useMemo(
    () =>
      t(lang, 'verifiedBar', {
        verified: response.verification.verified,
        needsReview: response.verification.needsReview,
      }),
    [lang, response.verification],
  );

  return (
    <aside className="flex max-h-[70vh] flex-col gap-4 overflow-auto border border-white/10 bg-trail-surface/80 p-4 md:max-h-none">
      <div>
        <h2 className="font-display text-xl font-semibold">
          {lang === 'ja' ? response.route.titleJa : response.route.titleEn}
        </h2>
        <p className="mt-1 text-sm text-trail-muted">
          {response.route.orderedPoiIds.length} {t(lang, 'stops')} ·{' '}
          {(response.route.totalMeters / 1000).toFixed(1)} {t(lang, 'km')} ·{' '}
          {response.route.estimatedMinutes} {t(lang, 'minutes')}
        </p>
        <div
          className="mt-3 h-2 w-full overflow-hidden bg-black/40"
          role="meter"
          aria-valuetext={bar}
        >
          <div
            className="h-full bg-cyan-400 transition-all"
            style={{
              width: `${
                (response.verification.verified / Math.max(1, response.verification.total)) * 100
              }%`,
            }}
          />
        </div>
        <p className="mt-1 text-xs text-trail-muted">{bar}</p>
      </div>

      <ul className="grid gap-1">
        {response.pois.map((poi) => {
          const c = content.find((x) => x.poiId === poi.id);
          return (
            <li key={poi.id}>
              <button
                type="button"
                className={`w-full border px-2 py-2 text-left text-sm ${
                  selected === poi.id ? 'border-trail-accent' : 'border-white/10'
                }`}
                onClick={() => setSelected(poi.id)}
              >
                {poi.name}
                <span className="ml-2 text-xs text-trail-muted">{c?.status}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {selectedPoi && selectedContent ? (
        <DetailCard
          lang={lang}
          name={selectedPoi.name}
          content={selectedContent}
          onChange={(next) =>
            onContentChange(content.map((c) => (c.poiId === next.poiId ? next : c)))
          }
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="border border-white/20 px-3 py-1.5 text-xs"
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
          className="border border-white/20 px-3 py-1.5 text-xs"
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
    </aside>
  );
}

function DetailCard({
  lang,
  name,
  content,
  onChange,
}: {
  lang: UiLang;
  name: string;
  content: ApprovedContent;
  onChange: (c: ApprovedContent) => void;
}) {
  const claims = lang === 'ja' ? content.ja : content.en;
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-white/10 p-3 text-sm">
      <h3 className="font-semibold">{name}</h3>
      <ul className="mt-2 grid gap-2">
        {claims.map((claim, i) => (
          <ClaimRow key={`${i}-${claim.text}`} claim={claim} lang={lang} />
        ))}
      </ul>
      {content.status === 'needs_review' ? (
        <div className="mt-3 grid gap-2">
          <textarea
            className="min-h-20 w-full border border-white/15 bg-black/30 p-2"
            value={(lang === 'ja' ? content.ja[0]?.text : content.en[0]?.text) ?? ''}
            onChange={(e) => {
              const text = e.target.value;
              if (lang === 'ja') {
                onChange({
                  ...content,
                  ja: [{ text, sourceTags: content.ja[0]?.sourceTags ?? [] }],
                });
              } else {
                onChange({
                  ...content,
                  en: [{ text, sourceTags: content.en[0]?.sourceTags ?? [] }],
                });
              }
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="bg-cyan-700 px-2 py-1 text-xs"
              onClick={() =>
                onChange({ ...content, status: 'verified', humanReviewed: true, issues: [] })
              }
            >
              {t(lang, 'approve')}
            </button>
            <button
              type="button"
              className="border border-white/20 px-2 py-1 text-xs"
              onClick={() => onChange({ ...content, status: 'rejected', ja: [], en: [] })}
            >
              {t(lang, 'remove')}
            </button>
          </div>
        </div>
      ) : null}
      <button type="button" className="mt-2 text-xs underline" onClick={() => setOpen((v) => !v)}>
        {t(lang, 'whyTrusted')}
      </button>
      {open ? (
        <pre className="mt-2 overflow-auto text-[10px] text-trail-muted">
          {JSON.stringify(
            claims.flatMap((c) => c.sourceTags),
            null,
            2,
          )}
        </pre>
      ) : null}
    </div>
  );
}

function ClaimRow({ claim, lang }: { claim: Claim; lang: UiLang }) {
  return (
    <li title={claim.sourceTags.map((s) => `${s.key}`).join(', ')}>
      {claim.text}
      <span className="ml-2 text-[10px] text-trail-muted">
        [{claim.sourceTags.length} {lang === 'ja' ? 'タグ' : 'tags'}]
      </span>
    </li>
  );
}
