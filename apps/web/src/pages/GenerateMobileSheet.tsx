import type { GenerateResponse } from '@trailforge/shared';
import type { ReactNode } from 'react';
import type { UiLang } from '../i18n/messages.js';
import type { ApprovedContent } from '../ui/export.js';
import { ResultPanel } from '../ui/ResultPanel.js';
import { RouteBar } from '../ui/RouteBar.js';

export function GenerateMobileSheet({
  mobileSheet,
  setMobileSheet,
  searchPanel,
  response,
  lang,
  content,
  setContent,
  canSave,
  onSave,
  playing,
  onTogglePlay,
}: {
  mobileSheet: 'search' | 'results' | null;
  setMobileSheet: (v: 'search' | 'results' | null) => void;
  searchPanel: ReactNode;
  response: GenerateResponse | null;
  lang: UiLang;
  content: ApprovedContent[];
  setContent: (c: ApprovedContent[]) => void;
  canSave: boolean;
  onSave: () => Promise<void>;
  playing: boolean;
  onTogglePlay: () => void;
}) {
  return (
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
                canSave={canSave}
                onSave={onSave}
              />
              <div className="mt-3">
                <RouteBar
                  lang={lang}
                  response={response}
                  content={content}
                  playing={playing}
                  onTogglePlay={onTogglePlay}
                />
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
