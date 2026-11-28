/** Persistence/auth needs both DATABASE_URL and a strong JWT_SECRET. */
export function assertAuthEnv(source: NodeJS.ProcessEnv = process.env): void {
  const db = source['DATABASE_URL']?.trim();
  if (!db) return;
  const secret = source['JWT_SECRET']?.trim();
  if (!secret || secret.length < 16) {
    throw new Error('DATABASE_URL is set but JWT_SECRET is missing or shorter than 16 characters');
  }
}
