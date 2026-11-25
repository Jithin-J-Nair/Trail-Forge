import { ThemeSchema, type Theme } from '@trailforge/shared';
import { useEffect, useMemo } from 'react';
import { Footer } from './components/Footer.js';
import { Header } from './components/Header.js';
import { SAMPLE_RESPONSE } from './fixtures/sample-response.js';
import { Scene } from './scene/Scene.js';
import { useTourSceneStore } from './scene/tour-scene-store.js';
import { useTourStore } from './store/tour-store.js';

const THEMES = ThemeSchema.options;

export function App() {
  const { draft, setDraft } = useTourStore();
  const { response, setResponse } = useTourSceneStore();
  const debug = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('debug') === '1';
  }, []);

  useEffect(() => {
    setResponse(SAMPLE_RESPONSE);
  }, [setResponse]);

  return (
    <div className="flex min-h-screen flex-col bg-trail-bg text-trail-fog">
      <Header />

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
        <section className="mb-10">
          <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">TrailForge</h1>
          <p className="mt-3 max-w-xl text-base text-trail-muted">
            Plan a themed walking tour from real OpenStreetMap places — Phase 6 3D scene.
          </p>
        </section>

        <main className="flex flex-1 flex-col gap-8">
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <label className="grid gap-1 text-sm font-semibold">
              Area query
              <input
                className="rounded-sm border border-white/15 bg-trail-surface px-3 py-2 font-normal text-trail-fog"
                value={draft.query}
                onChange={(event) => setDraft({ query: event.target.value })}
                placeholder="e.g. Kyoto, Japan"
                autoComplete="off"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Theme
              <select
                className="rounded-sm border border-white/15 bg-trail-surface px-3 py-2 font-normal text-trail-fog"
                value={draft.theme}
                onChange={(event) => setDraft({ theme: (event.target.value || '') as Theme | '' })}
              >
                <option value="">Select a theme</option>
                {THEMES.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Duration (minutes)
              <input
                type="number"
                min={30}
                max={240}
                className="rounded-sm border border-white/15 bg-trail-surface px-3 py-2 font-normal text-trail-fog"
                value={draft.durationMinutes}
                onChange={(event) =>
                  setDraft({ durationMinutes: Number(event.target.value) || 90 })
                }
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Radius (meters)
              <input
                type="number"
                min={300}
                max={800}
                className="rounded-sm border border-white/15 bg-trail-surface px-3 py-2 font-normal text-trail-fog"
                value={draft.radiusMeters}
                onChange={(event) => setDraft({ radiusMeters: Number(event.target.value) || 500 })}
              />
            </label>
            <button
              type="submit"
              className="justify-self-start bg-trail-accent px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
            >
              Generate tour (coming soon)
            </button>
          </form>

          <section aria-labelledby="scene-heading">
            <h2 id="scene-heading" className="mb-3 font-display text-xl font-semibold">
              Scene preview
            </h2>
            {response ? <Scene data={response} debug={debug} /> : null}
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
