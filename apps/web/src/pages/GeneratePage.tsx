import type { GenerateResponse } from '@trailforge/shared';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getToken, me, saveItinerary, setToken, type AuthUser } from '../api.js';
import { Footer } from '../components/Footer.js';
import { asDemoFixture, isDemoMode } from '../demo.js';
import { SAMPLE_RESPONSE } from '../fixtures/sample-response.js';
import { detectLang, t, type UiLang } from '../i18n/messages.js';
import { useTourSceneStore } from '../scene/tour-scene-store.js';
import { useTourStore } from '../store/tour-store.js';
import type { ApprovedContent } from '../ui/export.js';
import { ResultPanel } from '../ui/ResultPanel.js';
import { RouteBar } from '../ui/RouteBar.js';
import { SearchPanel } from '../ui/SearchPanel.js';
import { Toast } from '../ui/Toast.js';
import { GenerateMobileSheet } from './GenerateMobileSheet.js';

const Scene = lazy(async () => {
  const mod = await import('../scene/Scene.js');
  return { default: mod.Scene };
});

type Stage = 'locating' | 'fetching' | 'writing' | 'building';

export function GeneratePage() {
  const { draft } = useTourStore();
  const { response, setResponse, setUiLanguage, setStatus } = useTourSceneStore();
  const [lang, setLang] = useState<UiLang>(() => detectLang());
  const [stage, setStage] = useState<Stage | null>(null);
  const [content, setContent] = useState<ApprovedContent[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [mobileSheet, setMobileSheet] = useState<'search' | 'results' | null>('search');
  const [demoActive, setDemoActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
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
    const demo = asDemoFixture(SAMPLE_RESPONSE);
    setResponse(demo);
    setContent(demo.content.map((c) => ({ ...c })));
    setDemoActive(true);
  }, [setResponse]);

  useEffect(() => {
    if (!getToken()) return;
    me()
      .then((r) => setUser(r.user))
      .catch(() => setToken(null));
  }, []);

  const applyFixture = useCallback(
    (reason?: string) => {
      const demo = asDemoFixture(SAMPLE_RESPONSE);
      setResponse(demo);
      setContent(demo.content.map((c) => ({ ...c })));
      setDemoActive(true);
      if (reason) setToast(reason);
    },
    [setResponse],
  );

  const handleSave = useCallback(async () => {
    if (!response) return;
    await saveItinerary({
      query: draft.query,
      theme: draft.theme,
      durationMinutes: draft.durationMinutes,
      radiusMeters: draft.radiusMeters,
      response,
    });
    setToast('Itinerary saved');
  }, [draft, response]);

  const runGenerate = useCallback(async () => {
    if (!navigator.onLine) {
      applyFixture(t(lang, 'offline'));
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
    setPlaying(false);
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
      setResponse(data);
      setContent(data.content.map((c) => ({ ...c })));
      setDemoActive(Boolean(data.demo || data.devMode));
      setStatus('ready');
      setMobileSheet('results');
      if (data.message) setToast(data.message);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const message = (err as Error).message || t(lang, 'errorRetry');
      setStatus('error', message);
      if (isDemoMode()) {
        applyFixture(message);
      } else {
        setToast(message);
      }
    } finally {
      timers.forEach(clearTimeout);
      setStage(null);
    }
  }, [applyFixture, draft, lang, setResponse, setStatus]);

  const searchPanel = (
    <SearchPanel
      lang={lang}
      onLangChange={setLang}
      loadingStage={stage}
      onGenerate={() => void runGenerate()}
      onCancel={() => abortRef.current?.abort()}
    />
  );

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-trail-bg text-trail-fog">
      {response ? (
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center bg-trail-bg text-sm text-trail-muted">
              Loading 3D scene…
            </div>
          }
        >
          <Scene
            data={response}
            debug={debug}
            playing={playing}
            onPlayStop={() => setPlaying(false)}
          />
        </Suspense>
      ) : null}

      {(demoActive || response?.demo || response?.devMode) && (
        <p
          className="absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full border border-trail-review/50 bg-trail-review/15 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-trail-review"
          role="status"
        >
          {response?.devMode ? 'DEV MODE' : 'DEMO DATA'}
        </p>
      )}

      <div className="pointer-events-none absolute inset-0 z-20 hidden md:block">
        <div className="pointer-events-auto absolute left-5 top-5 w-[340px]">{searchPanel}</div>
        {response ? (
          <div className="pointer-events-auto absolute right-5 top-5 w-[360px]">
            <ResultPanel
              lang={lang}
              response={response}
              content={content}
              onContentChange={setContent}
              canSave={Boolean(user)}
              onSave={handleSave}
            />
          </div>
        ) : null}
        {response ? (
          <div className="pointer-events-auto absolute bottom-6 left-1/2 w-[min(720px,calc(100vw-2rem))] -translate-x-1/2">
            <RouteBar
              lang={lang}
              response={response}
              content={content}
              playing={playing}
              onTogglePlay={() => setPlaying((p) => !p)}
            />
          </div>
        ) : null}
      </div>

      <GenerateMobileSheet
        mobileSheet={mobileSheet}
        setMobileSheet={setMobileSheet}
        searchPanel={searchPanel}
        response={response}
        lang={lang}
        content={content}
        setContent={setContent}
        canSave={Boolean(user)}
        onSave={handleSave}
        playing={playing}
        onTogglePlay={() => setPlaying((p) => !p)}
      />

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
