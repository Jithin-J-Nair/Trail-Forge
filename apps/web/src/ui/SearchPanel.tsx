import { ThemeSchema, type Theme } from '@trailforge/shared';
import { useState } from 'react';
import { t, type UiLang } from '../i18n/messages.js';
import { useTourStore } from '../store/tour-store.js';

const THEMES = ThemeSchema.options;

export function SearchPanel({
  lang,
  onLangChange,
  loadingStage,
  onGenerate,
  onCancel,
}: {
  lang: UiLang;
  onLangChange: (lang: UiLang) => void;
  loadingStage: 'locating' | 'fetching' | 'writing' | 'building' | null;
  onGenerate: () => void;
  onCancel: () => void;
}) {
  const { draft, setDraft } = useTourStore();
  const [advanced, setAdvanced] = useState(false);

  return (
    <form
      className="glass-panel flex flex-col gap-4 p-4 md:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onGenerate();
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold tracking-tight text-trail-fog">
            TrailForge
          </p>
          <p className="mt-0.5 text-xs text-trail-muted">{t(lang, 'appTagline')}</p>
        </div>
        <label className="shrink-0 text-[10px] uppercase tracking-wider text-trail-muted">
          {t(lang, 'language')}
          <select
            className="ml-1 rounded-lg border border-trail-border bg-black/40 px-1.5 py-1 text-xs text-trail-fog"
            value={lang}
            onChange={(e) => onLangChange(e.target.value as UiLang)}
            aria-label={t(lang, 'language')}
          >
            <option value="en">EN</option>
            <option value="ja">JA</option>
          </select>
        </label>
      </div>

      <label className="grid gap-1.5 text-xs font-medium text-trail-muted">
        {t(lang, 'areaQuery')}
        <input
          className="glass-input"
          value={draft.query}
          onChange={(e) => setDraft({ query: e.target.value })}
          placeholder="e.g. Asakusa, Tokyo"
        />
      </label>

      <fieldset>
        <legend className="mb-2 text-xs font-medium text-trail-muted">{t(lang, 'theme')}</legend>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((theme) => (
            <button
              key={theme}
              type="button"
              className={`glass-chip ${draft.theme === theme ? 'glass-chip-active' : 'text-trail-fog/80 hover:border-white/20'}`}
              onClick={() => setDraft({ theme: theme as Theme })}
            >
              {theme}
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        className="text-left text-xs font-medium text-trail-teal/90 hover:text-trail-teal"
        onClick={() => setAdvanced((v) => !v)}
        aria-expanded={advanced}
      >
        {advanced ? '▾' : '▸'} {t(lang, 'advanced')}
      </button>

      {advanced ? (
        <div className="grid gap-3 rounded-xl border border-trail-border/80 bg-black/20 p-3">
          <label className="grid gap-2 text-xs font-medium text-trail-muted">
            {t(lang, 'duration')}: {draft.durationMinutes}
            <input
              type="range"
              min={30}
              max={240}
              step={15}
              value={draft.durationMinutes}
              onChange={(e) => setDraft({ durationMinutes: Number(e.target.value) })}
            />
          </label>
          <label className="grid gap-2 text-xs font-medium text-trail-muted">
            {t(lang, 'radius')}: {draft.radiusMeters}
            <input
              type="range"
              min={300}
              max={800}
              step={50}
              value={draft.radiusMeters}
              onChange={(e) => setDraft({ radiusMeters: Number(e.target.value) })}
            />
          </label>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="glass-btn-primary flex-1" disabled={Boolean(loadingStage)}>
          {t(lang, 'generate')}
        </button>
        {loadingStage ? (
          <button type="button" className="glass-btn-ghost" onClick={onCancel}>
            {t(lang, 'cancel')}
          </button>
        ) : null}
      </div>
      {loadingStage ? (
        <p className="text-xs text-trail-teal" aria-live="polite">
          {t(lang, loadingStage)}
        </p>
      ) : null}
    </form>
  );
}
