export function Toast({
  message,
  onRetry,
  onDismiss,
}: {
  message: string;
  onRetry?: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      className="glass-panel fixed bottom-24 right-4 z-50 max-w-sm px-4 py-3 text-sm shadow-glass md:bottom-8"
    >
      <p className="text-trail-fog">{message}</p>
      <div className="mt-2 flex gap-3">
        {onRetry ? (
          <button
            type="button"
            className="text-trail-cyan underline-offset-2 hover:underline"
            onClick={onRetry}
          >
            Retry
          </button>
        ) : null}
        <button
          type="button"
          className="text-trail-muted underline-offset-2 hover:underline"
          onClick={onDismiss}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
