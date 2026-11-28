import { Link } from 'react-router-dom';
import { t, type UiLang } from '../i18n/messages.js';

/** Honest empty /app canvas until Generate or labeled DEMO. */
export function EmptyCanvas({ lang }: { lang: UiLang }) {
  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center bg-trail-bg px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      data-testid="empty-canvas"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-trail-fog sm:text-4xl">
          {t(lang, 'emptyTitle')}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-trail-muted sm:text-base">
          {t(lang, 'emptyBody')}
        </p>
        <p className="mt-6 text-xs text-trail-muted/80">{t(lang, 'emptyHint')}</p>
        <p className="mt-8 text-xs text-trail-muted">
          <Link to="/app?demo=1" className="text-trail-amber underline-offset-2 hover:underline">
            {t(lang, 'openDemo')}
          </Link>
        </p>
      </div>
    </div>
  );
}
