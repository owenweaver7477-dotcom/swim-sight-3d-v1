# Pilot C6 — Dead-Control Audit

> **Permanent record. Documentation only — no application code, config, or deployment changed by this file.**
> Purpose: enumerate every unfinished / dead / misleading / hidden UI control on the coach-facing
> surface so no "mystery unfinished feature" survives into the pilot.
> Companion to [`ROADMAP_PILOT_V1.md`](./ROADMAP_PILOT_V1.md) (roadmap item **C6**).
> Method: 4 parallel read-only inspectors traced handlers, `disabled`/`readOnly` gates, redirects,
> and import graphs across the coach surface. Pilot is **manual-first** (`VITE_ENABLE_AI_REVIEW` off →
> `AI_PILOT_LOCKED = true`), so AI controls are intentionally hidden — that is correct design, not a defect.
> Date: 2026-07-19. Line numbers are point-in-time; re-verify before editing.

---

## 1. Executive summary

The coach-facing surface is **healthy**: nearly every button, card, and nav link routes to a real,
data-backed destination, and the analytics pages gate their charts behind honest data thresholds
(no fabricated numbers, no fake charts). The residual risk is a **small, well-bounded set** of:

- a few **live controls that mislead** (a dead-end button, wrong-tab links, copy pointing at features that don't exist);
- **AI-worded strings leaking through the manual-first lock** — a coach-led-brand consistency issue, not a functional bug;
- **honest disclosure copy that reads as "broken"** even though the underlying manual flow is complete;
- **dead/orphaned components** that never render today (hygiene, not live risk).

**No finding weakens a protected system's behaviour.** The only protected-path item (C6-003) is a
*label* change on the share flow and is therefore `APPROVE:`-gated. **~90% of fixes are single-session
copy/label/gate edits.** Estimated total remediation: **~1–1.5 engineer-days** + 1 owner decision (email).

## 2. Metrics

| Metric | Count |
|---|---|
| Coach-facing screens inspected | 15 |
| Interactive controls reviewed (est.) | ~130 (every non-working control adjudicated individually; plainly-working controls verified by handler, not exhaustively counted) |
| **Findings logged** | **25** |
| — Live misleading / dead-end controls | 6 |
| — AI-copy leaks through the manual-first lock | 2 |
| — Honest copy that reads as unfinished | 4 |
| — Dead / orphaned components (never rendered) | 9 |
| — Hidden-by-design (correct — keep) | 4 |
| Findings touching a protected system (label only) | 1 (C6-003) |
| Findings requiring an owner decision | 2 (C6-006, C6-007) |

**Dead controls total:** 9 orphaned components + 1 live dead-end button (C6-001) = **10**.
**Misleading controls total:** **6**. **Hidden features (intentional):** **4** (plus the whole AI trigger branch).

---

## 3. Complete findings inventory

Recommended action vocabulary: **Remove** · **Hide** · **Disable** · **Rename** · **Coming Soon** · **Keep**.
Risk: 🟢 low · 🟡 medium · 🔴 protected system. Effort: S <½d · M ½–2d · L 2–5d. Priority: pilot urgency.

### 3a. Live misleading / dead-end controls

| ID | Page | Component | Control | Behaviour | Why it exists | Action | Risk | Effort | Priority |
|---|---|---|---|---|---|---|---|---|---|
| C6-001 | Analyse (Step 3) | `analysis/FindingCard.jsx:37` → `Analyse.jsx:776` | **Coach Mode** button | Stores finding, navigates `/coach-mode` → **redirects to `/ai-reviews`**; context lost, coach dumped on the list | Leftover from the removed coach-mode page (`App.jsx:207` redirect) | **Remove** (or repoint to the report) | 🟡 | S | **High** |
| C6-003 | Coach Studio (fullscreen) | `annotations/CoachDrawStudio.jsx:2514` → `AIReportPage.jsx:983` | **"Re-share updated report"** (first finalise) | Actually **creates the first** share link, but wording implies a link already existed | Label doesn't branch on whether a link exists | **Rename** (conditional: "Create share link" vs "Re-share") | 🔴 (label on share flow) | S | **High** |
| C6-004 | Club Settings (Admin) | `ClubSettings.jsx:569`; cards `analysis/VideoLibrary.jsx:636` | **"Reset Stuck Videos"** link | Navigates `/analyse`; copy cites "Admin Tools on any video card" — **no such control exists** (cards only Delete) | Recovery feature described but never built on cards | **Rename** (fix copy to real action) or **Hide** | 🟡 | S | **High** |
| C6-005 | Performance Hub | `PerformanceHub.jsx:24` → `ClubProgress.jsx:58` | **"Team Leaderboard"** card | Navigates `/club-progress` which **defaults to the Analytics tab**, not leaderboard; also duplicates the "Club Progress" card | No tab deep-link; two cards share one destination | **Rename**/repoint (`?tab=leaderboard`) or merge | 🟡 | S | Medium |
| C6-006 | Swimmers (Add/Edit) | `Swimmers.jsx:128` | **"Email when connected"** delivery option | Saves preference; **no email provider wired**, so nothing sends (copy hedges) | Email delivery deferred | **Disable** for pilot (or **Keep** w/ hint) — *owner decision* | 🟡 | S | Medium |
| C6-007 | Club Settings (Invites) | `club/ClubInviteManager.jsx:147` | **"Email (optional)"** field | Tags the invite row; **no email is sent** (invites still shared by code/link) | Email invites deferred; "coming soon" banner is elsewhere (`:117`) | **Rename**/inline hint (or **Coming Soon**) — *owner decision* | 🟡 | S | Medium |

### 3b. AI-copy leaks through the manual-first lock

| ID | Page | Component | Control | Behaviour | Why it exists | Action | Risk | Effort | Priority |
|---|---|---|---|---|---|---|---|---|---|
| C6-002 | Coach Studio (marking) | `annotations/CoachDrawStudio.jsx:1852`; `reviewMode` at `AIReportPage.jsx:1002` | **"Review AI-suggested findings (coach approval required)"** button | Surfaces on manual reports (`reviewMode='ai'` when `analysis_mode` null); **not gated by `AI_PILOT_LOCKED`** | Pre-rebrand AI wording, ungated | **Rename** + gate on `!AI_PILOT_LOCKED` | 🟡 | S | **High** |
| C6-008 | Coach Studio (finding) | `ai-report/AIFindingCard.jsx:147,359` | Copy: **"Why reject this AI draft?" / "draft observation"** | Not gated by the lock; shows if the reject flow appears | Pre-rebrand copy | **Rename** (copy pass) | 🟢 | S | Medium |

### 3c. Honest copy that reads as unfinished

| ID | Page | Component | Control | Behaviour | Why it exists | Action | Risk | Effort | Priority |
|---|---|---|---|---|---|---|---|---|---|
| C6-009 | Report share section | `ai-report/ShareReportSection.jsx:297` | **"Email delivery is not connected yet"** caption | Copy-message / mark-prepared buttons **work**; caption reads unfinished | Honest disclosure of manual-only delivery | **Rename** (reword as intentional) | 🟢 | S | Medium |
| C6-010 | Approved report | `AIReportPage.jsx:1894` | **"Premium export controls will be part of future plan settings"** note | Informational beside Download PDF (which works via print) | Roadmap teaser copy | **Hide** (or **Rename**) for free pilot | 🟢 | S | Medium |
| C6-011 | Nav shell (top-right) | `AppLayout.jsx:50`; `notifications/NotificationPanel.jsx:128` | **Notification bell → Delivery Log** | Works; footer: "Email sending is not connected yet. Manual delivery only." | Manual delivery only; bell implies push/email | **Keep** (soften caption) | 🟡 | S | Low |
| C6-012 | Nav shell (club dropdown) | `layout/Sidebar.jsx:162` | **"Invite Coach"** menu item | Navigates `/club-settings` — **identical destination** to "Club Settings" directly above | No deep-link to the invites section | **Keep** (deep-link post-pilot) | 🟢 | S | Low |

### 3d. Dead / orphaned components (never rendered — hygiene)

| ID | Page | Component | Control | Behaviour | Why it exists | Action | Risk | Effort | Priority |
|---|---|---|---|---|---|---|---|---|---|
| C6-013 | Reports | `ai-report/ShareClipButton.jsx` | **Export Shareable Clip** | **Never mounted**; handler `exportShareableClip` **does not exist** in `lib/data/functions.js`; flag `VITE_ENABLE_SHARE_CLIP` off | Share-clip feature deferred | **Remove** (or wire handler before ever mounting) | 🟡 (latent) | S | Medium |
| C6-014 | Reports (finding) | `ai-report/AIFindingCard.jsx:318` | **Load 3D Reference** | `onLoad3D` never passed → button never renders | 3D deferred | **Remove** dead branch | 🟢 | S | Low |
| C6-015 | Reference | `reference/ModelAssetStatusPanel.jsx:31` | **"Upload Dedicated 3D Model — Soon"** | `disabled`, no handler; component **imported nowhere** | 3D upload deferred | **Remove** orphaned file (confirm unmounted) | 🟢 | S | Low |
| C6-016 | Drill Library | `drills/DrillPackModal.jsx` | **Drill-pack modal** (Assign / Full Detail / faults) | Fully built, **imported nowhere**; obsolete "pack" concept | Superseded by the flat drill taxonomy | **Remove** (fold into roadmap **M1**) | 🟢 | S | Medium |
| C6-017 | Layout | `layout/Footer.jsx` | Static footer | **Never rendered anywhere** | Superseded by public chrome | **Remove** | 🟢 | S | Low |
| C6-018 | Analyse | `analysis/AnalysisSetup.jsx` | Setup panel | **Imported nowhere** | Superseded by inline Analyse setup | **Remove** | 🟢 | S | Low |
| C6-019 | Analyse | `analysis/SideBySideComparison.jsx` | Comparison view | **Imported nowhere** | Stroke comparison deferred (post-pilot) | **Remove** | 🟢 | S | Low |
| C6-020 | Onboarding | `onboarding/WorkflowGuide.jsx` | Guided workflow | **Imported nowhere**; `ClubOnboarding.jsx` does not render it | Built but never wired in | **Keep** → wire in **H1** (or Remove if H1 rebuilds) | 🟢 | M | **High** (H1 dep) |
| C6-021 | Onboarding | `onboarding/OnboardingChecklist.jsx` | First-run checklist | **Imported nowhere** | Built but never wired in | **Keep** → wire in **H1** (or Remove if H1 rebuilds) | 🟢 | M | **High** (H1 dep) |

> **H1 note:** the roadmap assumed onboarding "already has a foundation." True at the *component* level,
> but C6-020/021 show those components are **not wired into any route**. H1 = wire-up/integrate (or
> rebuild), not just polish — revise H1 effort slightly upward.

### 3e. Hidden-by-design — correct, keep (listed for completeness)

| ID | Page | Component | Control | Behaviour | Why it exists | Action | Risk | Effort | Priority |
|---|---|---|---|---|---|---|---|---|---|
| C6-022 | Analyse (Step 2) | `Analyse.jsx:1411`; `lib/aiPilotLock.js` | **AI trigger branch** (Send for AI Review, output selector, credit indicator, focus checklist) | Gated behind `!AI_PILOT_LOCKED` → not rendered; `AIInTestingCard` → "Open Coach Studio" shown instead | Manual-first pilot lock | **Keep** (hidden) | 🔴 | — | N/A |
| C6-023 | Coach Studio | `AIReportPage.jsx:1249,378` | **AI status cards / auto-retry / cancel AI** | All inside `!AI_PILOT_LOCKED` blocks; cannot surface while locked | Manual-first pilot lock | **Keep** (hidden) | 🔴 | — | N/A |
| C6-024 | Analyse | `SessionModeSelector.jsx:48`; `CameraGuidancePanel.jsx:55` | **Multi-Angle Review** mode | Uploads store extra angles; AI uses primary only; copy discloses "future capability" | Multi-view fusion deferred | **Keep** (honest copy) | 🟢 | — | Low |
| C6-025 | Drill detail | `drills/DrillDetailModal.jsx:180`; caller `DrillLibrary.jsx:316` | **"Assign This Drill"** CTA | Only renders when `assignMode` true; library passes `false`, so correctly suppressed | Context-dependent control | **Keep** (correct) | 🟢 | — | N/A |

---

## 4. Recommended implementation order (batches)

| Batch | Theme | Findings | Risk | Effort | Gate |
|---|---|---|---|---|---|
| **A** | Coach-led copy pass — strip AI wording leaking through the lock | C6-002, C6-008 | 🟡/🟢 | S | Proceed (🟡 medium) |
| **B** | Fix misleading navigation controls | C6-001, C6-004, C6-005 | 🟡 | S | Proceed (🟡 medium) |
| **C** | Share/finalise label fix (protected flow) | C6-003 | 🔴 | S | **`APPROVE:` required** (draft only) |
| **D** | Soften honest copy that reads as "broken" | C6-009, C6-010, C6-011, C6-012 | 🟢 | S | Proceed (low) |
| **E** | Email-expectation decision, then apply | C6-006, C6-007 | 🟡 | S–M | **Owner decision** (hide vs keep-with-hint) |
| **F** | Dead-code hygiene — confirm unmounted, then delete | C6-013, C6-014, C6-015, C6-016, C6-017, C6-018, C6-019 | 🟢 | M | Proceed; C6-016 folds into **M1** |
| **G** | Onboarding wiring | C6-020, C6-021 | 🟢 | M | Deferred into roadmap **H1** |
| — | No action — hidden by design | C6-022, C6-023, C6-024, C6-025 | 🔴/🟢 | — | **Keep; do not touch** |

Suggested execution: **A → B → D** (fast, high-perception, all 🟢/🟡) → **C** (after `APPROVE:`) →
**E** (after owner decision) → **F** (hygiene sweep) → **G** (as part of H1).

---

## 5. Controls that must NOT be touched (protected systems)

Verified working and correctly gated — flagged so no C6 fix weakens them:

- **Coach approval:** Approve / Reject / Edit cue / Edit note / Assign drill (`AIFindingCard.jsx:399,407,253,279,203` → `AIReportPage.jsx:469`). Approval status changes only via these, never auto-set.
- **Finalise gate:** `FinaliseQualityGate` blocks while `pendingCount > 0` (`FinaliseQualityGate.jsx:59` → `AIReportPage.jsx:861`).
- **Share links:** Create / Disable / Copy / Open (`ShareReportSection.jsx:127`), Reopen / Reshare (`AIReportPage.jsx:969`); gated `isCoachApproved && pendingCount === 0`. *C6-003 is a label-only change on this path → `APPROVE:`-gated.*
- **Private upload & signed URLs:** Upload to Private Storage + retry/delete (`Analyse.jsx:1341`), signed-URL video preview (`analysis/VideoLibrary.jsx:270`), club-branding logo upload (`ClubSettings.jsx:161`). Disabled states ("Uploading…", "AI Review unavailable until upload completes") are **intentional gates, not dead controls**.
- **AI trigger/callback:** the entire lock-hidden AI branch (C6-022, C6-023) — leave hidden.

---

## 6. Position in the pilot roadmap

1. ✅ Roadmap (`ROADMAP_PILOT_V1.md`)
2. ✅ C6 Dead-Control Audit (this document)
3. H1 — Onboarding (wire up C6-020/021 or rebuild)
4. H4 — Report polish
5. M1 — Drill Library cleanup (includes C6-016 removal)
6. Theme polish (M3)
7. Pilot testing (C5 end-to-end + C7 guards)
8. Stripe & paid plans — **after** the pilot

This audit exists so unfinished elements are visible and deliberate before coaches test the product.
Update the metrics and mark findings resolved as batches are completed.
