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
      className="fixed bottom-4 right-4 z-50 max-w-sm border border-white/15 bg-trail-surface px-4 py-3 text-sm shadow-lg"
    >
      <p>{message}</p>
      <div className="mt-2 flex gap-2">
        {onRetry ? (
          <button type="button" className="text-trail-accent underline" onClick={onRetry}>
            Retry
          </button>
        ) : null}
        <button type="button" className="underline" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
