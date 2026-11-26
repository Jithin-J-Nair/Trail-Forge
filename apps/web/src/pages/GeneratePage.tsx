import type { GenerateResponse } from '@trailforge/shared';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getToken, login, me, register, saveItinerary, setToken, type AuthUser } from '../api.js';
import { Footer } from '../components/Footer.js';
import { detectLang, t, type UiLang } from '../i18n/messages.js';
import { useTourSceneStore } from '../scene/tour-scene-store.js';
import { useTourStore } from '../store/tour-store.js';
import type { ApprovedContent } from '../ui/export.js';
import { ResultPanel } from '../ui/ResultPanel.js';
import { RouteBar } from '../ui/RouteBar.js';
import { SearchPanel } from '../ui/SearchPanel.js';
import { Toast } from '../ui/Toast.js';

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
    if (!getToken()) return;
    me().then((r) => setUser(r.user)).catch(() => setToken(null));
  }, []);

  const handleLogin = useCallback(async (email: string, password: string) => {
    const r = await login(email, password);
    setToken(r.token);
    setUser(r.user);
  }, []);
  const handleRegister = useCallback(async (email: string, password: string, displayName?: string) => {
    const r = await register(email, password, displayName);
    setToken(r.token);
    setUser(r.user);
  }, []);
  const handleLogout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);
  const handleSave = useCallback(async () => {
    if (!response) return;
    await saveItinerary({ query: draft.query, theme: draft.theme, durationMinutes: draft.durationMinutes, radiusMeters: draft.radiusMeters, response });
    setToast('Itinerary saved');
  }, [draft, response]);

  const reportError = useCallback((reason?: string) => {
    if (reason) setToast(reason);
  }, []);

  const runGenerate = useCallback(async () => {
    if (!navigator.onLine) {
      reportError(t(lang, 'offline'));
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
      setDemoActive(Boolean(data.demo));
      setStatus('ready');
      setMobileSheet('results');
      if (data.message) setToast(data.message);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const message = (err as Error).message || t(lang, 'errorRetry');
      setStatus('error', message);
      reportError(message);
    } finally {
      timers.forEach(clearTimeout);
      setStage(null);
    }
  }, [draft, lang, reportError, setResponse, setStatus]);

  const searchPanel = (
    <SearchPanel
      lang={lang}
      onLangChange={setLang}
      loadingStage={stage}
      onGenerate={() => void runGenerate()}
      onCancel={() => abortRef.current?.abort()}
      user={user}
      onLogin={handleLogin}
      onRegister={handleRegister}
      onLogout={handleLogout}
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

      {/* Desktop floating panels */}
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

      {/* Mobile bottom sheets */}
      <div className="absolute inset-x-0 bottom-0 z-30 md:hidden">
        <div className="mb-2 flex justify-center gap-2 px-3">
          <button
            type="button"
            className="glass-btn-ghost px-3 py-1.5 text-xs"
            onClick={() => setMobileSheet('search')}
          >
            Search
          </button>
          {response ? (
            <button
              type="button"
              className="glass-btn-ghost px-3 py-1.5 text-xs"
              onClick={() => setMobileSheet('results')}
            >
              Results
            </button>
          ) : null}
        </div>
        {mobileSheet ? (
          <div className="max-h-[58vh] overflow-auto rounded-t-glass border border-trail-border bg-trail-surface p-3 backdrop-blur-glass">
            <button
              type="button"
              className="mb-2 w-full text-center text-xs text-trail-muted"
              onClick={() => setMobileSheet(null)}
            >
              Close
            </button>
            {mobileSheet === 'search' ? searchPanel : null}
            {mobileSheet === 'results' && response ? (
              <>
                <ResultPanel
                  lang={lang}
                  response={response}
                  content={content}
                  onContentChange={setContent}
                  canSave={Boolean(user)}
                  onSave={handleSave}
                />
                <div className="mt-3">
                  <RouteBar
                    lang={lang}
                    response={response}
                    content={content}
                    playing={playing}
                    onTogglePlay={() => setPlaying((p) => !p)}
                  />
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

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
