import { useEffect, useState } from 'react';
import { getToken, login, me, register, setToken, type AuthUser } from '../api.js';

type Profile = {
  interests?: string[];
  preferredThemes?: string[];
  languages?: string[];
};

export function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const authed = Boolean(getToken());

  useEffect(() => {
    if (!authed) return;
    me()
      .then((r) => setUser(r.user))
      .catch(() => setToken(null));
    fetch('/api/profile', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load profile'))))
      .then((r: { profile: Profile }) => setProfile(r.profile))
      .catch((e: unknown) => setMsg(e instanceof Error ? e.message : 'Error'));
  }, [authed]);

  async function save() {
    setMsg(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          interests: profile?.interests ?? [],
          preferredThemes: profile?.preferredThemes ?? [],
          languages: profile?.languages ?? ['en'],
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setMsg('Profile saved');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Save failed');
    }
  }

  async function handleAuth(mode: 'login' | 'register') {
    setMsg(null);
    try {
      const r = mode === 'login' ? await login(email, password) : await register(email, password);
      setToken(r.token);
      setUser(r.user);
      setPassword('');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Auth failed');
    }
  }

  return (
    <div className="min-h-screen bg-trail-bg text-trail-fog px-6 pt-24 pb-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-semibold">Profile</h1>
        {!authed || !user ? (
          <div className="glass-panel p-6 mt-6 grid gap-3 max-w-md">
            <p className="text-sm text-trail-muted">Log in to manage profile and saved tours.</p>
            <input
              className="glass-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="glass-input"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="glass-btn-primary px-4 py-2"
                onClick={() => void handleAuth('login')}
              >
                Login
              </button>
              <button
                type="button"
                className="glass-btn-ghost px-4 py-2"
                onClick={() => void handleAuth('register')}
              >
                Register
              </button>
            </div>
            {msg ? <span className="text-xs text-trail-muted">{msg}</span> : null}
          </div>
        ) : (
          <div className="glass-panel p-6 mt-6 grid gap-4">
            <div>
              <div className="text-xs text-trail-muted">Email</div>
              <div>{user.email}</div>
            </div>
            <label className="grid gap-1 text-sm">
              Interests (comma separated)
              <input
                className="glass-input"
                value={(profile?.interests ?? []).join(', ')}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    interests: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                className="glass-btn-primary px-4 py-2"
                onClick={() => void save()}
              >
                Save profile
              </button>
              <button
                type="button"
                className="glass-btn-ghost px-4 py-2"
                onClick={() => {
                  setToken(null);
                  setUser(null);
                }}
              >
                Logout
              </button>
              {msg ? <span className="text-xs text-trail-muted">{msg}</span> : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
