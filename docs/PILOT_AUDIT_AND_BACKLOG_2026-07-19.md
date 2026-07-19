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

- [x] **C6-001** "Coach Mode" dead-end button removed from FindingCard (+ handler/import cleanup in Analyse). *Done.*
- [x] **C6-002** "Review AI-suggested findings" button now gated behind `!AI_PILOT_LOCKED` (+ cyan→sky). *Done.*
- [x] **C6-004** "Reset Stuck Videos" copy fixed to the real action (delete + re-upload). *Done.*
- [ ] **C6-003** "Re-share updated report" wording on first finalise. **Protected share flow — left for Owner (APPROVE-gated).**
- [x] **C6-005** "Team Leaderboard" now deep-links `?tab=leaderboard` (added query-param tab support to ClubProgress). *Done.*
- [x] **C6-006/007** Email options relabelled honestly ("Email (not yet available)" / "invites are shared by link") — non-destructive interim; wiring a provider is still an Owner call. *Done (interim).*
- [x] **C6-008** "Why reject this AI draft?" → "Why reject this finding?" (neutral). *Done.*
- [x] **C6-009/010/011** Honest copy reworded as intentional (share-by-link, PDF-from-browser). *Done.* · [ ] **C6-012** duplicate "Invite Coach" dest — keep (deep-link post-pilot).

## 4. Roadmap H-items (first-impression shapers) — Me

- [x] **H2** Authenticated `/` now redirects to `/dashboard` (HomeRoute wrapper; logged-out visitors still see the marketing page instantly). *Done.*
- [x] **H1** Wire first-run onboarding: `OnboardingChecklist` now mounts on the dashboard with real completion state (club→swimmer→video→finding→report→share) + per-club dismiss. *Done — commit `1d… (#4)`.*
- [x] **H3** Dashboard trimmed to 3 questions (What needs review / What are you working on / What have you finished); KPI/quick-actions/workflow/tech-focus cut; all data logic preserved. *Done — commit `#4`.*
- [ ] **H4** Report polish (`PrintableReport.jsx`). — 🟠 M–L
- [ ] **M1** Drill taxonomy: add Dryland tab + Mobility category (Dryland drills exist in `defaultDrills.js` but unsurfaced); delete obsolete `DrillPackModal.jsx`. — 🟡 S–M
- [ ] **M2** Demo Mode (pre-loaded coach-reviewed example report). — 🟡 M–L

## 5. Public site polish (a11y / SEO / perf) — Me

- [ ] Social unfurls broken: no SSR/prerender → every subpage unfurls as the homepage on Slack/iMessage/LinkedIn. — 🟠 L
- [x] Google Fonts moved off the render-blocking CSS `@import` to `<link>` + `preconnect`; dropped the unused 800 weight. *Done.*
- [x] ~~No `focus-visible` rings~~ — **fixed** in the quiet-motion commit (global `:where()` ring).
- [x] Nav breakpoint lowered `xl`→`lg` — links now show on tablets/small laptops (browser-verified at 1150px). *Done.*
- [x] `slate-500` "Pilot lane" label on `bg-sky-50` → `slate-600` (AA). *Done.*
- [x] Deleted unused `public/hero/hero-desktop.jpg` (251KB). *Done.*
- [x] `theme-color` now light/dark per `prefers-color-scheme`; redundant logo `alt` → `alt=""` (decorative). *Done.* · [ ] remaining minor: decorative icons `aria-hidden`, stale `<noscript>` links.

## 6. Correctness — verify (not cosmetic) — Me

- [x] **Toast wiring FIXED**: App mounted the callerless radix `<Toaster>`; live code calls `sonner.toast()`. Swapped the mount to sonner's Toaster (browser-confirmed its live region now mounts) → safeguarding + share feedback renders. Radix toast is now fully dead (folds into #7). *Done.*
- [x] **`dangerouslySetInnerHTML` VERIFIED SAFE**: `lib/annotationRender.js` escapes the only free-text field (`shape.text`), validates colors (`safeColor`+`esc`), and clamps/`toFixed` all numerics — no attacker-controllable markup; input is coach-authored. No change needed. *Verified.*

## 7. Dead-code & hygiene — Me (with Owner call on "parked" bits)

~300KB / 77 unreachable files. Some is **intentionally parked** (base44, 3D) — confirm before deleting.
- [x] **Deleted 11 confirmed-dead files (1,572 lines)**: radix toast (`ui/toaster`+`ui/use-toast`, superseded by sonner), `VideoAnnotator`+`AnnotationsPanel` (dead dup of live CoachDrawStudio), `WorkflowGuide` (superseded by the wired OnboardingChecklist), and the C6 "Remove" orphans (`Footer`, `AnalysisSetup`, `SideBySideComparison`, `ModelAssetStatusPanel`, `ShareClipButton`, `DrillPackModal`). Build + 18 guards green. *Done.*
- [x] Removed the broken git ref `.git/refs/heads/simplify-remove-elite-lab 2` (space in name, warned on every git op). *Done.*
- [x] **Deferred-pass DONE**: deleted the **base44 island** (H7 — 9 files incl. client, + removed the `@base44/vite-plugin` from vite.config and re-added the `@/`→`src/` alias it was silently providing), the **3D/HUD cluster** (`three`+`@react-three/fiber`), and **33 dead `ui/` scaffolding** components — **58 files / ~6.1k lines**. Pruned **12 unused deps** via `npm uninstall` (base44 ×2, three, @react-three/fiber, next-themes, react-hot-toast, embla, vaul, cmdk, input-otp, react-day-picker, react-resizable-panels). Repointed `phase3-coach-polish` off the deleted BugReportModal. Build + lint + 18 guards green. *Done.*
- [ ] **Elite Studio phantom** (no route/page; alive only via a guard pin). Remove + repoint the guard. — 🟢 S
- [ ] Delete merged branch `feature/coach-studio-3-step` + prune 12 stale local branches. — 🟢 S (git hygiene, not on the deploy path)

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
