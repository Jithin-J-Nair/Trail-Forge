import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { GeneratePage } from './pages/GeneratePage.js';
import { LandingPage } from './pages/LandingPage.js';
import { SavedPage } from './pages/SavedPage.js';
import { ProfilePage } from './pages/ProfilePage.js';

function Nav() {
  const link = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 text-xs rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-trail-amber ${isActive ? 'bg-trail-amber/20 text-trail-amber' : 'text-trail-muted hover:text-trail-fog'}`;
  return (
    <nav
      className="fixed top-3 left-1/2 z-50 flex -translate-x-1/2 gap-1 rounded-xl border border-trail-border bg-trail-surface/90 px-2 py-1 backdrop-blur-glass"
      aria-label="Primary"
    >
      <NavLink to="/" className={link} end>
        Home
      </NavLink>
      <NavLink to="/app" className={link}>
        Generate
      </NavLink>
      <NavLink to="/saved" className={link}>
        Saved
      </NavLink>
      <NavLink to="/profile" className={link}>
        Profile
      </NavLink>
    </nav>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Nav />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<GeneratePage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
