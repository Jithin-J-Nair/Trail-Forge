const inflight = new Map<string, Promise<unknown>>();

export async function dedupeInflight<T>(key: string, work: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const promise = work().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}
