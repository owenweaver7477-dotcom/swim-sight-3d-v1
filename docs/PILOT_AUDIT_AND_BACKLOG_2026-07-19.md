# Swim Sight 3D — Pilot Audit & Backlog (2026-07-19)

Consolidated from a four-stream audit (app-shell visual consistency · public a11y/SEO/perf ·
tech-debt/hygiene · pilot-readiness/unfinished). This is the living "what's left before a real
coach pilot" checklist. Companion to `ROADMAP_PILOT_V1.md` and `PILOT_C6_DEAD_CONTROL_AUDIT.md`.

**State of play:** ~85–90% pilot-ready. Codebase is clean (one TODO marker, no dead-end empty
states). The true launch gate is **owner/external verification**, not engineering.

Legend — Owner = only Owen can do (dashboards/prod); Me = Claude can implement.
Severity: 🔴 blocker · 🟠 high · 🟡 med · 🟢 low. Effort: S/M/L.

---

## 0. Launch blockers — OWNER ONLY (gate everything)

- [ ] **C1** Retire old `swim-sight-3d.vercel.app` (old Next.js serving unprotected legacy/diagnostic pages) — 🔴 Owner · S
- [ ] **C2** Verify prod env vars: Supabase keys, `AI_WEBHOOK_SECRET`, `REQUIRE_CONSENT=true`, `FOOTAGE_RETENTION_DAYS`, `CRON_SECRET`, `VITE_ENABLE_AI_REVIEW` unset/false — 🔴 Owner · S
- [ ] **C3** Confirm prod DB migrations 001–024 applied — esp **008 (flagged unapplied)** and **023 (swimmer/parent RLS — the isolation boundary)** — 🔴 Owner · M
- [ ] **C4** Confirm `private-videos` bucket private + storage RLS live (club-folder scoped) — 🔴 Owner · S
- [ ] **C5** End-to-end coach-workflow smoke test on prod + incognito share-link check — 🔴 Owner · M

---

## 1. Finish the flat redesign where it's most seen — Me

The public site is flat/modernist now; the logged-in app still wears the old futuristic skin.

- [x] **SharedReportPage.jsx** (`/shared-report/:token`) — dark → flat light, className-only (protected invariant verified), public-report-safety green. *Done — commit `833b5a0`.*
- [x] **TeamDashboard.jsx** — gradients/radial/cyan/glow removed + **fully tokenised** (0 hardcoded light colors → dark mode now works). *Done — commit `833b5a0`.*
- [x] **PrintableReport.jsx** — gradient print button/score block + cyan pill → flat; card de-glowed. *Done — commit `833b5a0`.*
- [ ] **CoachDrawStudio.jsx** — `cyan-400` systemic accent (34 refs) → sky-700. Studio stays dark; just the accent. — 🟡 M
- [ ] Smaller leftovers: `PageNotFound` (dark + cyan pills), `AIInTestingCard`, `Sidebar` avatar gradient, `AICreditIndicator`. — 🟢 S each

## 2. Dark mode — decide (Me, pending Owner call)

App exposes a light/dark toggle but only ~4 files implement `dark:`; `TeamDashboard` + `SwimmerTrends` break in dark.
- [ ] **Decision:** finish dark theming on those pages, OR hide the toggle until post-pilot (recommended for pilot). — 🟡 M

## 3. Live dead / misleading controls (C6 audit — 25 findings, none fixed) — Me

Fix before a coach touches the manual path. ⚠️ **Guard tension:** `check_phase3_coach_polish.mjs`
pins the literals `"AI-assisted draft review"` and `"Elite Studio"/"preview"` — softening that AI
copy will trip it. **Repoint the guard, never delete the assertion.**

- [ ] **C6-001** `FindingCard.jsx:37 → Analyse.jsx:1007` — "Coach Mode" button → `/coach-mode` redirects to `/ai-reviews`, context lost. Live manual path. — 🟠 S
- [ ] **C6-002** `CoachDrawStudio.jsx:1852` — "Review AI-suggested findings" on manual reports, **not gated by `AI_PILOT_LOCKED`** — AI wording leaks through the manual-first lock. — 🟠 S
- [ ] **C6-004** `ClubSettings.jsx:569` — "Reset Stuck Videos" cites "Admin Tools on any video card" that don't exist. — 🟠 S
- [ ] **C6-003** `CoachDrawStudio.jsx:2514 / AIReportPage.jsx:983` — "Re-share updated report" wording on first finalise (no link yet). **Protected share flow — APPROVE-gated / Owner.** — 🟠 S
- [ ] **C6-005** `PerformanceHub.jsx:24` — "Team Leaderboard" card lands on Analytics tab, not a leaderboard. — 🟡 S
- [ ] **C6-006/007** Email options that save a preference but send nothing (no provider) — Owner decision (wire provider vs honest copy). — 🟡 S
- [ ] **C6-008** `AIFindingCard.jsx:147,359` — "Why reject this AI draft?" copy not gated by the lock. — 🟡 S
- [ ] **C6-009/010/011/012** Honest-but-unfinished copy (premium teaser, "email not connected yet", duplicate "Invite Coach"). — 🟢 S

## 4. Roadmap H-items (first-impression shapers) — Me

- [x] **H2** Authenticated `/` now redirects to `/dashboard` (HomeRoute wrapper; logged-out visitors still see the marketing page instantly). *Done.*
- [x] **H1** Wire first-run onboarding: `OnboardingChecklist` now mounts on the dashboard with real completion state (club→swimmer→video→finding→report→share) + per-club dismiss. *Done — commit `1d… (#4)`.*
- [x] **H3** Dashboard trimmed to 3 questions (What needs review / What are you working on / What have you finished); KPI/quick-actions/workflow/tech-focus cut; all data logic preserved. *Done — commit `#4`.*
- [ ] **H4** Report polish (`PrintableReport.jsx`). — 🟠 M–L
- [ ] **M1** Drill taxonomy: add Dryland tab + Mobility category (Dryland drills exist in `defaultDrills.js` but unsurfaced); delete obsolete `DrillPackModal.jsx`. — 🟡 S–M
- [ ] **M2** Demo Mode (pre-loaded coach-reviewed example report). — 🟡 M–L

## 5. Public site polish (a11y / SEO / perf) — Me

- [ ] Social unfurls broken: no SSR/prerender → every subpage unfurls as the homepage on Slack/iMessage/LinkedIn. — 🟠 L
- [ ] Render-blocking Google Fonts `@import` (8 weights, 2 unused: 300/800) → trim + `preconnect`. — 🟠 M
- [x] ~~No `focus-visible` rings~~ — **fixed** in the quiet-motion commit (global `:where()` ring).
- [ ] Nav breakpoint at `xl` (1280px) hides links behind a hamburger on tablets/small laptops → lower to `lg`. — 🟡 S
- [ ] `slate-500` body text marginal contrast (fails AA on `bg-sky-50`) → `slate-600`. — 🟡 S
- [ ] Delete unused `public/hero/hero-desktop.jpg` (251KB, zero refs after redesign). — 🟢 S
- [ ] Minor: redundant logo `alt`, decorative icons need `aria-hidden`, `theme-color` meta still dark navy, stale `<noscript>` links. — 🟢 S

## 6. Correctness — verify (not cosmetic) — Me

- [ ] **Toast wiring**: radix `<Toaster>` mounted but never called; `sonner.toast()` is called (safeguarding/share actions) but its `<Toaster>` is **never mounted** → user feedback may silently not render. Browser-confirm. — 🟡 M
- [ ] **`dangerouslySetInnerHTML`** on the share path (`SharedReportPage`, `PrintableReport` render `rendered_svg`): confirm the SVG serializer (`lib/annotationRender.js`) can only emit structured coach-draw markup, not attacker input. Protected surface — verify, don't assume. — 🟡 M

## 7. Dead-code & hygiene — Me (with Owner call on "parked" bits)

~300KB / 77 unreachable files. Some is **intentionally parked** (base44, 3D) — confirm before deleting.
- [ ] Safe now: drop `next-themes` + `react-hot-toast` deps (0 refs). — 🟢 S
- [ ] Delete merged branch `feature/coach-studio-3-step`; fix broken git ref `.git/refs/heads/simplify-remove-elite-lab 2` (space in name, warns on every git op); prune 12 stale merged branches. — 🟢 S
- [ ] Confirm-then-delete: base44 island (10 unreachable files; keep the live `FeedbackButton`→`FeedbackModal`, which does NOT use base44); `three` + `@react-three/fiber` (~600KB, only dead 3D/HUD); 36/49 dead `ui/` components; `VideoAnnotator.jsx` (dead near-dup of live `CoachDrawStudio`). — 🟡 M
- [ ] **Elite Studio is a phantom** (no route/page; alive only via a guard pin). Remove + repoint the guard. — 🟢 S

## Guard-suite notes (for whoever touches the above)

- `check_phase3_coach_polish.mjs` pins `"AI-assisted draft review"` + `"Elite Studio"/"preview"` — C6 copy fixes or removing Elite Studio will trip it. **Repoint, don't delete.**
- `check_production_surface.mjs` guards routes + nav leaks only, **not in-page controls** — the C6 dead controls are unguarded. Roadmap wants this extended from nav → in-page controls.
- `check_production_surface.mjs` pins `/reference-library` as a live coach route; it now redirects to `/dashboard`. Low.
- `check_analyse_route_runtime_safety.mjs` still scans orphaned `AnalysisSetup.jsx` (existsSync-guarded, soft). Low.
- Stale doc: CLAUDE.md §10 cites `PublicReportView.jsx` as the live share template — it's dead; the real one is `SharedReportPage`.

---

### Recommended sequence (hardest → easiest)
1. §1 redesign completion (SharedReportPage + TeamDashboard + PrintableReport) — biggest visible win.
2. §4 onboarding + 3-question dashboard (H1/H3).
3. §3 live dead-controls (C6) — small but high-trust.
4. §7 dead-code + dep cleanup.
5. §5 public polish.
6. §6 toast + SVG verification.
7. §0 owner launch gate (parallel, Owen).
