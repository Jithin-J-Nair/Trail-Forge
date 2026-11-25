import { Footer } from './components/Footer.js';
import { ScenePlaceholder } from './components/ScenePlaceholder.js';
import { useTourStore } from './store/tour-store.js';

export function App() {
  const { draft, setDraft } = useTourStore();

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-10">
      <header className="mb-10">
        <p className="font-display text-4xl font-bold tracking-tight text-trail-ink md:text-5xl">
          TrailForge
        </p>
        <p className="mt-3 max-w-xl text-base text-trail-moss">
          Plan a themed walking tour from real OpenStreetMap places — Phase 1 scaffold.
        </p>
      </header>

      <main className="flex flex-1 flex-col gap-8">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <label className="grid gap-1 text-sm font-semibold text-trail-ink">
            Area
            <input
              className="rounded-sm border border-trail-moss/25 bg-white/70 px-3 py-2 font-normal"
              value={draft.area}
              onChange={(event) => setDraft({ area: event.target.value })}
              placeholder="e.g. Kyoto, Japan"
              autoComplete="off"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-trail-ink">
            Theme
            <input
              className="rounded-sm border border-trail-moss/25 bg-white/70 px-3 py-2 font-normal"
              value={draft.theme}
              onChange={(event) => setDraft({ theme: event.target.value })}
              placeholder="e.g. temples"
              autoComplete="off"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-trail-ink">
            Duration (minutes)
            <input
              type="number"
              min={15}
              max={1440}
              className="rounded-sm border border-trail-moss/25 bg-white/70 px-3 py-2 font-normal"
              value={draft.durationMinutes}
              onChange={(event) => setDraft({ durationMinutes: Number(event.target.value) || 90 })}
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
          <ScenePlaceholder />
        </section>
      </main>

      <Footer />
    </div>
  );
}
