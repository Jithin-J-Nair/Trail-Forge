import { useEffect, useState } from 'react';
import { getToken, me } from '../api.js';

export function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const authed = Boolean(getToken());

  useEffect(() => {
    if (!authed) return;
    me().then((r) => setUser(r.user)).catch(() => {});
    fetch('/api/profile', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('Failed to load profile')))
      .then((r) => setProfile(r.profile))
      .catch((e) => setMsg((e as Error).message));
  }, [authed]);

  async function save() {
    setMsg(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ interests: profile?.interests ?? [], preferredThemes: profile?.preferredThemes ?? [], languages: profile?.languages ?? ['en'] }),
      });
      if (!res.ok) throw new Error('Save failed');
      setMsg('Profile saved');
    } catch (e) { setMsg((e as Error).message); }
  }

  return (
    <div className="min-h-screen bg-trail-bg text-trail-fog px-6 pt-24 pb-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-semibold">Profile & settings</h1>
        {!authed ? <div className="glass-panel p-6 mt-6 text-trail-muted">Log in to manage your profile.</div> : (
          <div className="glass-panel p-6 mt-6 grid gap-4">
            <div><div className="text-xs text-trail-muted">Email</div><div>{user?.email ?? '—'}</div></div>
            <label className="grid gap-1 text-sm">Interests (comma separated)
              <input className="glass-input" value={(profile?.interests ?? []).join(', ')} onChange={(e) => setProfile({ ...profile, interests: e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean) })} />
            </label>
            <label className="grid gap-1 text-sm">Preferred themes (comma separated)
              <input className="glass-input" value={(profile?.preferredThemes ?? []).join(', ')} onChange={(e) => setProfile({ ...profile, preferredThemes: e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean) })} />
            </label>
            <label className="grid gap-1 text-sm">Languages (comma separated)
              <input className="glass-input" value={(profile?.languages ?? ['en']).join(', ')} onChange={(e) => setProfile({ ...profile, languages: e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean) })} />
            </label>
            <div className="flex gap-2 items-center"><button className="glass-btn-primary px-4 py-2" onClick={save}>Save profile</button>{msg ? <span className="text-xs text-trail-muted">{msg}</span> : null}</div>
          </div>
        )}
      </div>
    </div>
  );
}
