export function WebGlFallback() {
  return (
    <div
      role="status"
      className="flex h-full min-h-64 items-center justify-center border border-white/10 bg-trail-surface px-6 text-center text-sm text-trail-muted"
    >
      WebGL is unavailable in this browser. The 3D city scene cannot be shown.
    </div>
  );
}
