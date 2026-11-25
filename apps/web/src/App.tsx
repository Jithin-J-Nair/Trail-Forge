import type { GenerateResponse } from '@trailforge/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Footer } from './components/Footer.js';
import { Header } from './components/Header.js';
import { SAMPLE_RESPONSE } from './fixtures/sample-response.js';
import { detectLang, t, type UiLang } from './i18n/messages.js';
import { Scene } from './scene/Scene.js';
import { useTourSceneStore } from './scene/tour-scene-store.js';
import { useTourStore } from './store/tour-store.js';
import type { ApprovedContent } from './ui/export.js';
import { ResultPanel } from './ui/ResultPanel.js';
import { SearchPanel } from './ui/SearchPanel.js';
import { Toast } from './ui/Toast.js';

type Stage = 'locating' | 'fetching' | 'writing' | 'building';

export function App() {
  const { draft } = useTourStore();
  const { response, setResponse, setUiLanguage, setStatus } = useTourSceneStore();
  const [lang, setLang] = useState<UiLang>(() => detectLang());
  const [stage, setStage] = useState<Stage | null>(null);
  const [content, setContent] = useState<ApprovedContent[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const debug = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('debug') === '1';
  }, []);

  useEffect(() => {
    setUiLanguage(lang);
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url);
  }, [lang, setUiLanguage]);

  useEffect(() => {
    // Demo fixture until first generate
    setResponse(SAMPLE_RESPONSE);
    setContent(SAMPLE_RESPONSE.content.map((c) => ({ ...c })));
  }, [setResponse]);

  const runGenerate = useCallback(async () => {
    if (!navigator.onLine) {
      setToast(t(lang, 'offline'));
      return;
    }
    if (!draft.query || !draft.theme) {
      setToast(t(lang, 'errorRetry'));
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('loading');
    setStage('locating');
    const timers = [
      window.setTimeout(() => setStage('fetching'), 400),
      window.setTimeout(() => setStage('writing'), 900),
      window.setTimeout(() => setStage('building'), 1400),
    ];
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          query: draft.query,
          theme: draft.theme,
          durationMinutes: draft.durationMinutes,
          radiusMeters: draft.radiusMeters,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as GenerateResponse;
      setResponse(data.pois.length ? data : SAMPLE_RESPONSE);
      setContent((data.pois.length ? data : SAMPLE_RESPONSE).content.map((c) => ({ ...c })));
      setStatus('ready');
      setSheetOpen(true);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setStatus('error', (err as Error).message);
      setToast(t(lang, 'errorRetry'));
      // Keep fixture scene usable offline / when OSM is blocked
      setResponse(SAMPLE_RESPONSE);
      setContent(SAMPLE_RESPONSE.content.map((c) => ({ ...c })));
    } finally {
      timers.forEach(clearTimeout);
      setStage(null);
    }
  }, [draft, lang, setResponse, setStatus]);

  return (
    <div className="flex min-h-screen flex-col bg-trail-bg text-trail-fog">
      <Header />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:flex-row md:px-6">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h1 className="font-display text-4xl font-bold tracking-tight">TrailForge</h1>
              <label className="text-xs">
                {t(lang, 'language')}
                <select
                  className="ml-2 border border-white/15 bg-trail-surface px-2 py-1"
                  value={lang}
                  onChange={(e) => setLang(e.target.value as UiLang)}
                >
                  <option value="en">EN</option>
                  <option value="ja">JA</option>
                </select>
              </label>
            </div>
            <p className="max-w-xl text-base text-trail-muted">{t(lang, 'appTagline')}</p>
          </section>

          <div className="hidden md:block">
            <SearchPanel
              lang={lang}
              loadingStage={stage}
              onGenerate={() => void runGenerate()}
              onCancel={() => abortRef.current?.abort()}
            />
          </div>

          <section aria-labelledby="scene-heading">
            <h2 id="scene-heading" className="mb-3 font-display text-xl font-semibold">
              Scene
            </h2>
            {response ? <Scene data={response} debug={debug} /> : null}
          </section>
        </div>

        <div
          className={`md:w-96 md:shrink-0 ${
            sheetOpen
              ? 'fixed inset-x-0 bottom-0 z-30 max-h-[55vh] overflow-auto rounded-t-lg border-t border-white/15 bg-trail-bg p-4 md:static md:max-h-none md:rounded-none md:border-0 md:bg-transparent md:p-0'
              : 'hidden md:block'
          }`}
        >
          <button
            type="button"
            className="mb-2 w-full text-center text-xs text-trail-muted md:hidden"
            onClick={() => setSheetOpen(false)}
          >
            Close panel
          </button>
          <div className="mb-4 md:hidden">
            <SearchPanel
              lang={lang}
              loadingStage={stage}
              onGenerate={() => void runGenerate()}
              onCancel={() => abortRef.current?.abort()}
            />
          </div>
          {response ? (
            <ResultPanel
              lang={lang}
              response={response}
              content={content}
              onContentChange={setContent}
            />
          ) : null}
        </div>
      </div>

      {!sheetOpen ? (
        <button
          type="button"
          className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 bg-trail-accent px-4 py-2 text-sm text-white md:hidden"
          onClick={() => setSheetOpen(true)}
        >
          Open panel
        </button>
      ) : null}

      <Footer />
      {toast ? (
        <Toast
          message={toast}
          onRetry={() => {
            setToast(null);
            void runGenerate();
          }}
          onDismiss={() => setToast(null)}
        />
      ) : null}
    </div>
  );
}
