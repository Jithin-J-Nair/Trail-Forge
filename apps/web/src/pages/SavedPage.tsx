import { useEffect, useState } from 'react';
import { getToken, listItineraries, type SavedItinerary } from '../api.js';

export function SavedPage() {
  const [items, setItems] = useState<SavedItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authed = Boolean(getToken());

  useEffect(() => {
    if (!authed) {
      setLoading(false);
      return;
    }
    listItineraries()
      .then((r) => setItems(r.itineraries ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, [authed]);

  return (
    <div className="min-h-screen bg-trail-bg text-trail-fog px-6 pt-24 pb-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-3xl font-semibold">Saved itineraries</h1>
        <p className="mt-2 text-sm text-trail-muted">Requires login (Profile).</p>
        {!authed ? (
          <div className="glass-panel p-6 mt-6 text-trail-muted">
            Log in on Profile to view saved itineraries.
          </div>
        ) : null}
        {loading ? <div className="glass-panel p-6 mt-6 text-trail-muted">Loading...</div> : null}
        {error ? <div className="glass-panel p-6 mt-6 text-red-400">{error}</div> : null}
        {authed && !loading && !error && items.length === 0 ? (
          <div className="glass-panel p-6 mt-6 text-trail-muted">No saved itineraries yet.</div>
        ) : null}
        <div className="mt-6 grid gap-3">
          {items.map((it) => (
            <div key={it.id} className="glass-panel p-4">
              <div className="flex justify-between gap-3">
                <div>
                  <div className="font-medium">{it.query}</div>
                  <div className="text-xs text-trail-muted mt-1">
                    {it.theme} · {it.durationMinutes} min ·{' '}
                    {new Date(it.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-xs text-trail-teal">
                  {it.verificationSummary?.verified ?? 0} verified
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
