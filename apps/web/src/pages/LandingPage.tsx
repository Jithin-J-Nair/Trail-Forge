import { Link } from 'react-router-dom';

function MapAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(63,168,148,0.18),transparent_55%),radial-gradient(ellipse_at_80%_70%,rgba(201,149,90,0.14),transparent_50%),linear-gradient(165deg,#0C1418_0%,#122028_48%,#0A1014_100%)]" />
      <svg
        className="absolute inset-[-8%] h-[116%] w-[116%] animate-tf-drift text-trail-fog/10"
        viewBox="0 0 1200 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="currentColor" strokeWidth="1">
          {Array.from({ length: 24 }, (_, i) => (
            <line key={`v-${i}`} x1={50 + i * 50} y1="0" x2={50 + i * 50} y2="800" />
          ))}
          {Array.from({ length: 16 }, (_, i) => (
            <line key={`h-${i}`} x1="0" y1={50 + i * 50} x2="1200" y2={50 + i * 50} />
          ))}
        </g>
        <path
          d="M80 520 C220 480, 280 620, 420 560 S650 420, 780 480 S980 620, 1120 540"
          stroke="rgba(63,168,148,0.45)"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M140 280 C260 320, 340 240, 460 300 S680 380, 820 300 S980 180, 1100 240"
          stroke="rgba(201,149,90,0.35)"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="420" cy="560" r="5" fill="rgba(201,149,90,0.85)" className="animate-tf-glow" />
        <circle cx="780" cy="480" r="4" fill="rgba(63,168,148,0.8)" className="animate-tf-glow" />
        <circle cx="820" cy="300" r="4" fill="rgba(201,149,90,0.7)" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0C1418] to-transparent" />
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="relative isolate min-h-screen overflow-y-auto text-trail-fog">
      <MapAtmosphere />
      <main className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col justify-end px-6 pb-16 pt-28 sm:justify-center sm:pb-24 sm:pt-24">
        <p className="font-display animate-tf-rise text-6xl font-semibold tracking-tight text-trail-fog sm:text-7xl md:text-8xl">
          TrailForge
        </p>
        <h1
          className="animate-tf-rise mt-5 max-w-xl font-display text-2xl font-medium leading-snug text-trail-fog/95 sm:text-3xl"
          style={{ animationDelay: '120ms' }}
        >
          Walk a real city, grounded in OpenStreetMap.
        </h1>
        <p
          className="animate-tf-rise mt-4 max-w-md text-base leading-relaxed text-trail-muted sm:text-lg"
          style={{ animationDelay: '220ms' }}
        >
          Generate bilingual place notes from OSM facts only—then preview the route in dusk 3D.
        </p>
        <div
          className="animate-tf-rise mt-9 flex flex-wrap items-center gap-3"
          style={{ animationDelay: '320ms' }}
        >
          <Link to="/app" className="glass-btn-primary px-6 py-3 text-base">
            Generate a tour
          </Link>
          <Link to="/app" className="glass-btn-ghost px-5 py-3 text-base">
            Open the city HUD
          </Link>
        </div>
        <p
          className="animate-tf-rise mt-14 text-xs text-trail-muted/80"
          style={{ animationDelay: '420ms' }}
        >
          © OpenStreetMap contributors
        </p>
      </main>
    </div>
  );
}
