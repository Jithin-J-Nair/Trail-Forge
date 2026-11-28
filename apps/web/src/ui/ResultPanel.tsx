import type { Claim, GenerateResponse } from '@trailforge/shared';
import { useMemo, useState } from 'react';
import { t, type UiLang } from '../i18n/messages.js';
import { useTourSceneStore } from '../scene/tour-scene-store.js';
import type { ApprovedContent } from './export.js';

export function ResultPanel({
  lang,
  response,
  content,
  onContentChange,
  canSave,
  onSave,
}: {
  lang: UiLang;
  response: GenerateResponse;
  content: ApprovedContent[];
  onContentChange: (next: ApprovedContent[]) => void;
  canSave?: boolean;
  onSave?: () => Promise<void>;
}) {
  const selected = useTourSceneStore((s) => s.selectedPoiId);
  const setSelected = useTourSceneStore((s) => s.setSelectedPoiId);
  const selectedContent = content.find((c) => c.poiId === selected);
  const selectedPoi = response.pois.find((p) => p.id === selected);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const bar = useMemo(
    () =>
      t(lang, 'verifiedBar', {
        verified: response.verification.verified,
        needsReview: response.verification.needsReview,
      }),
    [lang, response.verification],
  );

  const verifiedPct =
    (response.verification.verified / Math.max(1, response.verification.total)) * 100;

  return (
    <aside className="glass-panel flex max-h-[70vh] flex-col gap-4 overflow-auto p-4 md:max-h-[min(78vh,720px)] md:p-5">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-trail-fog">
          {lang === 'ja' ? response.route.titleJa : response.route.titleEn}
        </h2>
        <p className="mt-1 text-sm text-trail-muted">
          {response.route.orderedPoiIds.length} {t(lang, 'stops')} ·{' '}
          {(response.route.totalMeters / 1000).toFixed(1)} {t(lang, 'km')} ·{' '}
          {response.route.estimatedMinutes} {t(lang, 'minutes')}
        </p>
        {response.route.routing ? (
          <p className="mt-1 text-[11px] text-trail-muted/90" title={response.route.routing.reason}>
            {response.route.routing.label}
          </p>
        ) : null}
        {response.route.scoring ? (
          <p className="mt-0.5 text-[11px] text-trail-muted/80">
            {t(lang, 'routeScoring')}
            {response.route.scoring.trimmedCount > 0
              ? ` · ${t(lang, 'routeTrimmed', { trimmed: response.route.scoring.trimmedCount })}`
              : null}
          </p>
        ) : null}
        <div
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10"
          role="meter"
          aria-valuetext={bar}
        >
          <div
            className="h-full rounded-full bg-trail-verified transition-all"
            style={{ width: `${verifiedPct}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-trail-muted">{bar}</p>
        {response.trustScore ? (
          <div className="mt-2 rounded-lg border border-trail-border/60 bg-black/20 px-3 py-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-trail-muted">Trust Score</span>
              <span className="font-semibold text-trail-fog">{response.trustScore.score}/100</span>
            </div>
            <div className="mt-1 text-[11px] text-trail-muted">
              Coverage {(response.trustScore.verificationCoverage * 100).toFixed(0)}% · Source{' '}
              {(response.trustScore.sourceQuality * 100).toFixed(0)}% · Unsupported{' '}
              {response.trustScore.unsupportedClaims}
            </div>
          </div>
        ) : null}
        {canSave && onSave ? (
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              className="glass-btn-ghost px-3 py-1.5 text-xs"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                setSaveMsg(null);
                try {
                  await onSave();
                  setSaveMsg(t(lang, 'saved'));
                } catch (e) {
                  setSaveMsg((e as Error).message || t(lang, 'saveFailed'));
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? 'Saving...' : 'Save itinerary'}
            </button>
            {saveMsg ? <span className="text-xs text-trail-muted">{saveMsg}</span> : null}
          </div>
        ) : (
          <p className="mt-2 text-xs text-trail-muted">{t(lang, 'saveNeedSignIn')}</p>
        )}
      </div>

      <ul className="grid gap-1.5">
        {response.pois.map((poi) => {
          const c = content.find((x) => x.poiId === poi.id);
          if (c?.status === 'rejected') return null;
          const tone =
            c?.status === 'verified'
              ? 'text-trail-verified'
              : c?.status === 'needs_review'
                ? 'text-trail-review'
                : 'text-trail-muted';
          return (
            <li key={poi.id}>
              <button
                type="button"
                className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                  selected === poi.id
                    ? 'border-trail-cyan/40 bg-trail-cyan/10'
                    : 'border-transparent bg-white/[0.03] hover:border-trail-border'
                }`}
                onClick={() => setSelected(poi.id)}
              >
                <span className="font-medium text-trail-fog">{poi.name}</span>
                <span className={`ml-2 text-[10px] uppercase tracking-wide ${tone}`}>
                  {c?.status?.replace('_', ' ')}
                </span>
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
    <div className="rounded-xl border border-trail-border bg-black/25 p-3 text-sm">
      <h3 className="font-display font-semibold text-trail-fog">{name}</h3>
      <ul className="mt-2 grid gap-2">
        {claims.map((claim, i) => (
          <ClaimRow key={`${i}-${claim.text}`} claim={claim} lang={lang} />
        ))}
      </ul>
      {content.status === 'needs_review' ? (
        <div className="mt-3 grid gap-2">
          <textarea
            className="glass-input min-h-20"
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
              className="glass-btn rounded-lg bg-trail-verified/20 px-3 py-1.5 text-xs text-trail-verified"
              onClick={() =>
                onChange({ ...content, status: 'verified', humanReviewed: true, issues: [] })
              }
            >
              {t(lang, 'approve')}
            </button>
            <button
              type="button"
              className="glass-btn-ghost px-3 py-1.5 text-xs"
              onClick={() => onChange({ ...content, status: 'rejected', ja: [], en: [] })}
            >
              {t(lang, 'remove')}
            </button>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        className="mt-3 text-xs text-trail-cyan underline-offset-2 hover:underline"
        onClick={() => setOpen((v) => !v)}
      >
        {t(lang, 'whyTrusted')}
      </button>
      {open ? (
        <pre className="mt-2 overflow-auto rounded-lg bg-black/40 p-2 text-[10px] text-trail-muted">
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
    <li className="text-trail-fog/90" title={claim.sourceTags.map((s) => `${s.key}`).join(', ')}>
      {claim.text}
      <span className="ml-2 text-[10px] text-trail-muted">
        [{claim.sourceTags.length} {lang === 'ja' ? 'タグ' : 'tags'}]
      </span>
    </li>
  );
}
