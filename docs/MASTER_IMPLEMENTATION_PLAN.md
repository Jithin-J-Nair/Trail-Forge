# TrailForge master implementation plan (phases 0–9)

**Companion:** `docs/PRODUCT_AUDIT.md`  
**Track:** TF-33 (Phase 0) → TF-35 (Phase 1) …  
**Rule:** Karpathy — surgical, verifiable, no speculative mega-rewrite. Preserve OSM → generate → grounding → R3F → export.

## Global success gates (every phase PR)

1. `npm run typecheck` · `npm run lint` · `npm test` pass.
2. Five-line plain-English summary appended to `docs/PHASES.md`.
3. No silent SAMPLE/fake data on production paths; DEMO/LOCAL_DEV labeled.
4. One PR per phase (or tightly stacked); ready for review unless noted.

## PR hygiene before / during reconstruction

| PR                               | Action                                                               |
| -------------------------------- | -------------------------------------------------------------------- |
| #16 DEMO opt-in + quieter dusk   | **Merge first** (CI green, clean)                                    |
| #17 solar + FPP (stacked on #16) | **Merge after #16**, or rebase onto latest main/Phase 1 if conflicts |
| #19 curated `.cursor/skills/`    | **Merged** @ `4f32032` — use in-repo skills for Phase 1+             |

---

## Phase 0 — Audit + master plan

**Track:** TF-33  
**Branch:** `cursor/recon-phase-0-audit-9c79`

### Deliverables

- [x] `docs/PRODUCT_AUDIT.md`
- [x] `docs/MASTER_IMPLEMENTATION_PLAN.md`
- [x] `docs/AGENT_SKILLS.md` (skills inventory; synced with #19 intent)
- [x] Mirror copies under Project Context `docs/`
- [x] PHASES.md Phase 0 reconstruction summary

### Success checks

- Audit names concrete paths, open-PR verdicts (#16/#17/#19), keep/replace deps, architecture decision (R3F primary).
- Plan lists phases 0–9 with deliverables + success checks (this doc).
- Docs-only: typecheck/lint/test unchanged green.

---

## Phase 1 — Product & design system + cinematic discovery landing

**Track:** TF-35  
**Branch:** `cursor/recon-phase-1-design-*`

### Deliverables

- CSS variable design tokens (cartographic dusk: charcoal slate, warm amber, soft teal — **not** cyan/violet neon glow).
- Expressive display + JP-capable body fonts (drop Inter on brand surfaces).
- Shared UI primitives used by landing + app shell (button, chip, panel) via tokens — no new component library package.
- Cinematic discovery **landing** (`/`): one composition — hero brand **TrailForge**, one headline, one supporting sentence, one CTA group, full-bleed visual plane (CSS/SVG city-map atmosphere; no inset card hero).
- 2–3 intentional motions (entrance / CTA / ambient) with `prefers-reduced-motion` respect.
- Keyboard focus, mobile layout; OSM attribution remains visible.
- Wire tokens into existing glass HUD classes without breaking `/app` generate flow.
- Use `.cursor/skills/` from #19 when available (frontend-design, ui-ux-pro-max, gsap-*, animate, web-design-guidelines).

### Success checks

- Brand test: removing nav, first viewport still reads as TrailForge.
- `/` and `/app` load; generate API path untouched.
- typecheck / lint / test green; PHASES.md Phase 1 reconstruction summary.

### Assumptions

- Landing visual is atmospheric (gradient + cartographic pattern + optional soft 3D preview link), not photoreal tiles.
- Do not wait on #19 merge; vendor skills + Prettier ignore onto Phase 1 if still open.
- Do not duplicate #16 DEMO fix here unless Phase 2 is delayed and honesty remains broken on main.

---

## Phase 2 — Core app / map / POI / persistence

**Track:** TF-36  
**Branch:** `cursor/recon-phase-2-core-9c79`

### Deliverables

- Ensure #16 behavior on main: empty `/app` until Generate or explicit `?demo=1`.
- Honest empty-state copy + CTA; DEMO badge placement below nav.
- Persistence UX: save itinerary when auth/DB available; clear offline/error toasts without painting fake cities (except labeled DEMO).
- POI list / selection sync hygiene; remove any remaining silent fixture paths.
- Optional: light MapLibre **minimap** behind or beside scene (read-only OSM attribution) — only if it does not regress R3F budget. **Deferred** (Karpathy: not required for honesty gates).

### Success checks

- Manual: `/app` empty; `/app?demo=1` badge + fixture; Generate with live API shows live provenance.
- Tests cover demo gate + generate happy path fixtures.
- No SAMPLE on error unless `isDemoMode()`.

---

## Phase 3 — Spatial (additive)

**Track:** TF-37  
**Branch:** `cursor/recon-phase-3-spatial-9c79`

### Deliverables

- Provider interface for optional terrain / 3D tiles / MapLibre style with `coverage` enum.
- `.env.example` keys (MapTiler / Cesium ion / etc.) — no hardcoded secrets.
- UI: coverage-aware fallback message when keys missing; extrusions remain default.
- Do **not** delete R3F scene.

### Success checks

- Without keys: app identical in behavior to Phase 2 (extrusions).
- With mock adapter in tests: coverage `none` → fallback path unit-tested.
- Docs state honest coverage limitations.

---

## Phase 4 — Cinematic FPP

### Deliverables

- Eye-height route walk along ordered POIs (adopt/rebase #17 `FppWalk` + GSAP MotionPath if not already merged).
- Esc / Stop ends walk; orbit idle disabled while walking; reduced-motion snap.
- Play control copy: Walk route / 徒歩で歩く.

### Success checks

- Demo walk selects nearest POI along path; no per-frame Vector3 alloc storms beyond existing patterns.
- typecheck/lint/test + solar/FPP unit tests green.

---

## Phase 5 — Solar / weather

### Deliverables

- Solar elevation → dayFactor lighting (adopt #17 `solar.ts` / `DayNightLights` if not merged).
- Optional weather: real API adapter **or** explicit “weather unavailable” — never fake rain/snow silently.
- Building window `uDay` (or equivalent) tied to solar factor.

### Success checks

- Tokyo noon vs midnight unit tests for elevation/dayFactor.
- Badge/status shows local time + Day/Night from coordinates.
- Weather path labeled when stubbed.

---

## Phase 6 — Route intelligence

### Deliverables

- Improve deterministic planner (time budget, theme weighting, optional walkability scores from OSM tags only).
- Still **no** LLM route ordering.
- Surface route stats honestly (distance, stops, trimmed count).

### Success checks

- Route tests: trim under duration; stable order for fixed POI set.
- Grounding unchanged; invented shortcuts impossible.

---

## Phase 7 — Polish

### Deliverables

- Motion polish across landing + HUD; remove leftover neon tokens.
- Adaptive quality pass after GSAP/tiles; update `docs/PERFORMANCE.md` measurements.
- A11y: focus order, aria-live, contrast on new tokens.

### Success checks

- Bundle notes updated; reduced-motion verified.
- No unused FlyThrough/dead CSS.

---

## Phase 8 — QA

### Deliverables

- Expand Mock eval scenarios; keep `docs/EVAL.md` generator.
- Integration tests for demo gate, generate errors, auth-optional save.
- Optional Playwright smoke (landing → app → demo) if CI time allows — skip if flaky headless WebGL.

### Success checks

- CI job stays green; eval script deterministic under Mock.

---

## Phase 9 — Production readiness

### Deliverables

- Deploy docs refresh; secret checklist; `/api/ready` semantics.
- Fail-fast when auth enabled without `JWT_SECRET` / `DATABASE_URL`.
- Final honest limitations section in README (tiles keys, OSM egress, Mock default).
- Scorecard update in audit or PHASES.

### Success checks

- Docker compose health; CI audit note; README limitations match reality.

---

## Out of scope (explicit)

- Replacing Express with a different backend framework.
- Claiming photoreal city coverage without provider keys.
- Silent SAMPLE fallbacks “for UX.”
- Arena-style speculative multi-package scaffold reintroduction.
