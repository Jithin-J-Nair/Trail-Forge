import { ThemeSchema, type Theme } from '@trailforge/shared';
import { t, type UiLang } from '../i18n/messages.js';
import { useTourStore } from '../store/tour-store.js';

const THEMES = ThemeSchema.options;

export function SearchPanel({
  lang,
  loadingStage,
  onGenerate,
  onCancel,
}: {
  lang: UiLang;
  loadingStage: 'locating' | 'fetching' | 'writing' | 'building' | null;
  onGenerate: () => void;
  onCancel: () => void;
}) {
  const { draft, setDraft } = useTourStore();

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onGenerate();
      }}
    >
      <label className="grid gap-1 text-sm font-semibold">
        {t(lang, 'areaQuery')}
        <input
          className="rounded-sm border border-white/15 bg-trail-surface px-3 py-2 font-normal"
          value={draft.query}
          onChange={(e) => setDraft({ query: e.target.value })}
          placeholder="e.g. Asakusa, Tokyo"
        />
      </label>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{t(lang, 'theme')}</legend>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((theme) => (
            <button
              key={theme}
              type="button"
              className={`border px-3 py-1 text-xs ${
                draft.theme === theme ? 'border-trail-accent bg-trail-accent/20' : 'border-white/15'
              }`}
              onClick={() => setDraft({ theme: theme as Theme })}
            >
              {theme}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="grid gap-1 text-sm font-semibold">
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
      <label className="grid gap-1 text-sm font-semibold">
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
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="bg-trail-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={Boolean(loadingStage)}
        >
          {t(lang, 'generate')}
        </button>
        {loadingStage ? (
          <button
            type="button"
            className="border border-white/20 px-3 py-2 text-sm"
            onClick={onCancel}
          >
            {t(lang, 'cancel')}
          </button>
        ) : null}
      </div>
      {loadingStage ? (
        <p className="text-sm text-trail-muted" aria-live="polite">
          {t(lang, loadingStage)}
        </p>
      ) : null}
    </form>
  );
}
