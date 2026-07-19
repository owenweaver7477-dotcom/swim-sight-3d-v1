# Swim Sight 3D — Roadmap to v1.0 Pilot Launch

> **Single source of truth for the pilot.** Documentation only — no code, config, or deployment
> is changed by this file. Supersedes ad-hoc roadmap notes.
> Last updated: 2026-07-19. Owner: Owen. Basis: full non-editing architecture audit (2026-07-19).

---

## 0. What "v1.0 pilot launch" means (the gate)

A real club coach can, **on the correct production URL**, complete this loop end-to-end with
privacy intact and no dead buttons:

```
create account → create swimmer → upload private video →
Coach Studio review (coach annotates, adds findings) →
approve / reject → finalise → export / share safe report
```

**Confirmed pilot stance: manual-first.** AI review is **locked** (`VITE_ENABLE_AI_REVIEW` off) and
all user-facing copy stays "Coach Review". AI unlock (worker verification + hardened callback auth)
is **post-pilot** — see N0. This reaffirms the manual-first lock and the coach-led repositioning.

**Audit verdict (Owen's estimate, endorsed):**
- Core architecture: ~95% · Coach workflow: ~90% · Pilot readiness: ~85–90%
- Commercial launch: ~60–70% · Long-term platform vision: ~30–40%
- **The risk now is polish + reliability of the existing coach loop, not missing features.**

**Effort key:** S = <½ day · M = ½–2 days · L = 2–5 days · XL = 1–2 weeks.
**Tags:** 🔴 protected/APPROVE-gated · 🟡 app logic · 🟢 cosmetic/docs · 👤 owner-only (external, no code).

---

## 1. 🔴 CRITICAL — pilot cannot launch until these are done

| # | Task | Effort | Tag | Why it blocks |
|---|---|---|---|---|
| C1 | Retire obsolete `swim-sight-3d.vercel.app` (old Next.js serving unprotected legacy/diagnostic pages) | S | 👤 | Top pilot risk — a coach on the wrong URL sees an unprotected app. Vercel dashboard, no code. |
| C2 | Verify prod env vars: Supabase URL/anon key, `SUPABASE_SERVICE_ROLE_KEY` server-only, `AI_WEBHOOK_SECRET`, `REQUIRE_CONSENT=true` (minors), `FOOTAGE_RETENTION_DAYS`, `CRON_SECRET`, `VITE_ENABLE_AI_REVIEW` unset/false | S | 👤 | Wrong values silently break consent, retention, callback auth. Not inspectable from repo. |
| C3 | Confirm prod DB migrations applied — all 001–024, especially **008** (noted unapplied) and **023** (swimmer/parent read scope) | M | 🔴👤 | RLS is the isolation boundary. A missing migration = a real privacy hole. Owen runs; verification checklist can be drafted. |
| C4 | Confirm `private-videos` bucket is private + storage RLS live (club-folder-scoped) | S | 🔴👤 | Private-video guarantee depends on it; not inspectable in repo. |
| C5 | **End-to-end coach-workflow smoke test on prod** (the loop in §0; open the shared report in incognito and confirm no private/unapproved content) | M | 🟡 | The whole pilot promise. Use `docs/PILOT_VERIFICATION_RUNBOOK.md`. |
| C6 | **Hide / disable / "Coming Soon" every unfinished feature** (no dead buttons) | M | 🟡 | A broken button kills trust faster than a missing feature. Extends `test:production-surface` from nav to in-page controls. **Audit first (inspection), edits only after review.** |
| C7 | Full guard battery + `build` green on the release commit (17 `test:*` + safeguarding) | S | 🟢 | Cheap gate proving share-safety / report-safety literals still hold. Read-only. |

**Critical path:** C1–C4 are owner/external and gate C5. C5–C7 are go/no-go. Wall-clock ~1–2 days,
mostly verification rather than coding.

---

## 2. 🟠 HIGH — strongly wanted before real coaches (low risk)

| # | Task | Effort | Tag | Notes |
|---|---|---|---|---|
| H1 | **Guided first-run onboarding** (5-step: create club → add swimmer → upload video → review → export first report) | M | 🟡 | Enhancement of existing scaffolding: `components/onboarding/WorkflowGuide.jsx` + `OnboardingChecklist.jsx` + `TeamDashboard` `SetupDashboard`. First 5 minutes decide retention. |
| H2 | Authenticated `/` → `/dashboard` redirect | S | 🟡 | Logged-in coaches currently land on public HomePage. One-line re-entry fix. |
| H3 | **Dashboard = 3 questions only**: what needs my attention · who to analyse next · what's completed | M | 🟡 | Priority queue already answers most of this; trim everything else. |
| H4 | **Report polish** — professional, minimal, dark, brand colours, PDF quality | M–L | 🟡 | `components/reports/PrintableReport.jsx`. First thing a coach judges when sharing. Must keep AI-assist disclaimer + no private data. |
| H5 | Consent dry-run for minors — confirm `REQUIRE_CONSENT=true` actually blocks upload/AI without consent | M | 🟡👤 | Safeguarding is non-negotiable for a club pilot. Verify behaviour, not just presence. |
| H6 | Error-recovery walkthrough — force an upload failure + manual-review path; confirm a clear retry / "Open Coach Studio" route always exists | M | 🟡 | Backed by `test:pilot-recovery`. Recovery UX preserves trust. |
| H7 | Remove base44 legacy island (dead coach-testing behind redirect, `DragRiskPanel`, `VideoAnnotator`/`AnnotationsPanel`, `@base44/sdk`) | M | 🟡 | Shrinks bundle + confusion surface. **Prove zero live imports first.** |

Estimated total: ~3–4 engineer-days.

---

## 3. 🟡 MEDIUM — quality / polish

| # | Task | Effort | Tag | Notes |
|---|---|---|---|---|
| M1 | **Drill taxonomy finish** — add **Dryland** tab + **Mobility** category/drills, delete orphaned `DrillPackModal.jsx` | S–M | 🟡 | Live list already ~90% there (Starts/Turns/Underwaters/Freestyle/Back/Breast/Fly/IM). Dryland drills exist in `defaultDrills.js` but are unsurfaced; Mobility absent. No packs on live path. |
| M2 | **Demo Mode** — a pre-loaded **coach-reviewed example** finalised report (e.g. Peaty) + drills + PDF | M–L | 🟡 | 30-second "aha" without uploading. **No AI/3D claims** — seeded read-only report, respects the manual-first rebrand. |
| M3 | Dashboard theme-token cleanup (hardcoded slate/white → design tokens; fix light/dark) | M | 🟢 | Main screen is light-mode-hardcoded while the rest uses tokens. |
| M4 | Green the lint/typecheck baseline (~102 ESLint + tsc errors) | L | 🟡 | Not in the Vercel build path, but noise hides real regressions. |
| M5 | Public copy + report-safety re-read across 6 public pages + sample report | S | 🟢 | Manual read catches drift the `test:public-copy-safety` literals miss. |
| M6 | Docs consolidation (20+ root `.md` planning files → `docs/`; this file stays the pilot source of truth) | S | 🟢 | Reduces confusion; no code impact. |

Estimated total: ~4–6 engineer-days.

---

## 4. 🟢 NICE-TO-HAVE / POST-PILOT — the "impossible to copy" vision

Do only after coaches are proven to use the manual loop.

- **N0. Unlock AI review** (gate for the full workflow): HMAC-signed + constant-time callback auth,
  Render worker health/callback-lifecycle verification, then flip `VITE_ENABLE_AI_REVIEW`. XL · 🔴👤.
  Turns the manual pilot loop into the AI-assisted workflow.

Then, in order:
1. 3D Skeleton Viewer
2. AI Voice Coach
3. Stroke comparison
4. Progress over time
5. Club dashboards
6. Parent portal (route split — swimmer + parent currently share `/portal`)
7. Mobile app
8. Wearables
9. Competition analysis
10. Multi-camera support

---

## 5. Suggested sequence (critical path)

```
Owner/external (~1–2 days)     C1 → C2 → C3 → C4          [unblocks everything]
        ↓
Go/No-Go gate                  C5 (E2E smoke) + C6 (feature-hiding) + C7 (guards+build green)
        ↓
Pre-coach polish (~3–4 days)   H1 onboarding · H2 redirect · H3 dashboard trim · H4 report polish
                               ‖ H5 consent · H6 recovery · H7 dead-code removal
        ↓
─────────────  v1.0 PILOT LAUNCH  ─────────────
        ↓
Fast-follow (~1 week)          M1 drills · M2 demo mode · M3 theme · M5 copy → M4 lint · M6 docs
        ↓
Post-pilot backlog             N0 (AI unlock) → 3D viewer → voice coach → … → multi-camera
```

**Estimate to launch:** Critical ~1–2 days (mostly verification) + High ~4–6 days ≈ **~1.5 weeks
of focused work**, gated mainly on Owen's external items (C1–C4).

---

## 6. Agreed working order for the build phase

1. **C6 – Dead-control audit** (inspection only): find every unfinished button / menu item / page;
   recommend Hide / "Coming Soon" / Keep. No code changes until reviewed.
2. **H1 – Onboarding flow**: improve first-time coach experience. High impact, low risk.
3. **H4 – Report polish**: make exported reports look professional. First thing coaches judge.
4. **M1 – Drill library cleanup**: finish taxonomy; remove obsolete drill-pack concept if truly
   no live imports.
5. **M3 – Theme polish**: final visual consistency before pilot.

---

## 7. Protected systems — never weakened by any roadmap item

Auth & workspace isolation · private video upload · signed-URL handling · AI trigger→callback
validation · coach approval flow · report AI-vs-approved separation · share-link visibility ·
Supabase data / RLS. Any change touching these is 🔴 and requires an explicit `APPROVE:` from Owen
(per CLAUDE.md §14). All 👤 items are owner-run in the Vercel/Supabase dashboards.
