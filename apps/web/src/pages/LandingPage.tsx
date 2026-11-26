import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-trail-bg text-trail-fog px-6 pt-24 pb-16">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-xs tracking-[0.2em] text-trail-cyan uppercase">Trusted AI Geospatial Intelligence</p>
        <h1 className="mt-4 font-display text-4xl md:text-6xl font-semibold tracking-tight">Plan real-world experiences you can trust.</h1>
        <p className="mt-5 text-trail-muted max-w-2xl mx-auto">TrailForge turns natural language into verified, source-grounded itineraries. Every place is traceable to real geographic data. No hallucinated locations.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/app" className="glass-btn-primary px-5 py-3">Generate an itinerary</Link>
          <Link to="/saved" className="glass-btn-ghost px-5 py-3">View saved</Link>
        </div>
        <div className="mt-16 grid md:grid-cols-3 gap-4 text-left">
          {[['Grounded discovery','Places resolved from real OSM/Wikidata sources with provenance.'],['Deterministic routing','Routes computed by algorithms, not guessed by AI.'],['Verification & trust','Every claim scored and labeled VERIFIED / NEEDS_REVIEW.']].map(([t,d]) => (
            <div key={t} className="glass-panel p-5">
              <h3 className="font-display font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-trail-muted">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
