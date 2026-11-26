import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-trail-bg text-trail-fog px-6 pt-24 pb-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight text-trail-fog">
          TrailForge
        </h1>
        <p className="mt-5 text-lg text-trail-muted max-w-xl mx-auto">
          Real OpenStreetMap places, grounded Japanese/English blurbs, and a dusk 3D city preview —
          no invented locations.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/app" className="glass-btn-primary px-5 py-3">
            Generate a tour
          </Link>
        </div>
        <p className="mt-16 text-xs text-trail-muted/80">© OpenStreetMap contributors</p>
      </div>
    </div>
  );
}
