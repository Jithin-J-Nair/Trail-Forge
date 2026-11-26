export type AuthUser = { id: string; email: string; displayName: string | null };

const TOKEN_KEY = 'trailforge_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(path, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function register(email: string, password: string, displayName?: string) {
  return apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, ...(displayName ? { displayName } : {}) }) }) as Promise<{ user: AuthUser; token: string }>;
}
export async function login(email: string, password: string) {
  return apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }) as Promise<{ user: AuthUser; token: string }>;
}
export async function me() {
  return apiFetch('/api/auth/me') as Promise<{ user: AuthUser }>;
}
export async function saveItinerary(payload: any) {
  return apiFetch('/api/itineraries', { method: 'POST', body: JSON.stringify(payload) });
}
export async function listItineraries() {
  return apiFetch('/api/itineraries') as Promise<{ itineraries: any[] }>;
}
