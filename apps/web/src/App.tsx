import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { GeneratePage } from './pages/GeneratePage.js';
import { LandingPage } from './pages/LandingPage.js';
import { SavedPage } from './pages/SavedPage.js';
import { ProfilePage } from './pages/ProfilePage.js';

function Nav() {
  const link = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 text-xs rounded-lg ${isActive ? 'bg-trail-cyan/20 text-trail-cyan' : 'text-trail-muted hover:text-trail-fog'}`;
  return (
    <nav className="fixed top-3 left-1/2 z-50 -translate-x-1/2 flex gap-1 rounded-full border border-trail-border bg-trail-surface/90 px-2 py-1 backdrop-blur-glass">
      <NavLink to="/" className={link}>Home</NavLink>
      <NavLink to="/app" className={link}>Generate</NavLink>
      <NavLink to="/saved" className={link}>Saved</NavLink>
      <NavLink to="/profile" className={link}>Profile</NavLink>
    </nav>
  );
}

export function App() {
  return (
    <BrowserRouter>
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
