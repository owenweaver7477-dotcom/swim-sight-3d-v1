# Meridian Design Audit — Delivery Tracker

**Source:** *Swim Sight 3D — Confidential Design Audit*, Meridian Product Design Review,
25 July 2026. 47 pages · 13 sections · 16 screens scored · 45 captures reviewed.

**Baseline scores:** Overall **5.8** · Marketing **6.8** · Coach app **5.4** ·
Enterprise-readiness **4.4** · AI integration **3.4** · **17 critical/high issues**.

**Their verdict:** *"a 5.8 today with the DNA of an 8, and a credible path to a 9…
what remains is the most fixable kind of work: discipline, removal, finish, and one
great core surface."* Six of the seven systemic issues are **discipline, not design talent**.

> **This file is the working checklist.** Every item is ticked here when it ships, with the
> commit SHA and date, and a line in the Delivery log at the bottom. Items are only marked
> done when: implemented → verified (lint + build + guards) → pushed.

---

## Target arc

| Phase | Work | Target |
|---|---|---|
| **Month 0–1 · Harden** | The discipline pass — kill instability signalling, seed real data, copy-edit, branded email, contrast + focus, theme guard | **5.8 → 7.0** *(almost no new design)* |
| **Month 1–3 · Core** | Dashboard (Concept 3), Coach Studio entry, AI-finding component (Concept 1), design-system v1 | **7.0 → 8.0** |
| **Month 3–6 · World-class** | Review room as a pro instrument (Concept 2), signature interaction, motion system, compliance | **8.0 → 9.0+** |

---

## P0 — the hardening pass (days of work, "very high" impact)

- [x] **P0-1 · Remove all instability signalling from the app** — 🔴 S1 · impact Very high · effort Low — **DONE 2026-07-25 · `b5aeaea`**
  "Pilot recovery mode" banner removed from all three coach workflow screens (Analyse, AI review, reviews list); now renders only on the internal `PilotLaunchPage` (not in the coach nav) — the audit's "keep status behind an admin page" fix. "AI evidence was weak, filtered, or unavailable" → positive routing copy. Guard `test:pilot-recovery` repointed from banner-presence to the recovery **behaviour** (every failure path still hands the coach a manual-review route). Verified: 18/18 guards, lint + build clean; grep confirms zero instability strings reachable in the coach workflow.
- [ ] **P0-2 · Ship a believable seeded club; block junk names** — 🔴 S2 · Very high · Med
  8–12 realistic swimmers, mixed strokes, varied drill doses/types. Validate names on entry (min length, no single characters). Kill the swimmer named "o".
- [ ] **P0-3 · Translate internal language into coach language** — 🟠 S3 · High · Low — *partially done*
  ✅ "Quality gate failed — manual review recommended" → **"Best reviewed by you"**.
  ⬜ Remaining: delete "V1 COACH FLOW"; hide "AI credit" until billing exists; remove "backend-assisted"; status vocabulary ("queued for AI, processing, needs retry").
- [ ] **P0-4 · Copy-edit every authenticated string; reconcile counts** — 🟡 S4 · Med · Low — *partially done*
  ✅ All three dashboard defects fixed: "1 report **need**…" grammar; the "1 report awaiting review / 0 findings need approval" contradiction (findings line now only shows when findings are actually pending — it was always 0 under the AI lock); the pipeline count now binds to the items actually rendered (it summed 4 categories while the list renders up to 6).
  ⬜ Remaining: full half-day sweep of every other authenticated string.
- [ ] **P0-5 · Branded domain email; make "Powered by" removable** — 🟠 S5 · Med · Low
  ✅ *"Powered by" is removable* — now a per-tier boolean computed server-side (`showsReportAttribution`), so a share link never discloses the club's commercial tier.
  ⚠️ *Branded address attempted and rolled back.* `SUPPORT_EMAIL` was switched to `support@swimsight3d.com` on the launch-hardening branch with "create the mailbox first" written as a merge prerequisite. The branch merged and deployed anyway, so live support links bounced silently. **Reverted to `swimsight3d.support@gmail.com` on 2026-07-26.**
  ⬜ Remaining *(Owner: domain/DNS + provider)*: create the mailbox or a forward, then set `VITE_SUPPORT_EMAIL` in Vercel — **no code change**. The hardcoded default stays on a real inbox permanently.

## P1 — the core redesigns

- [ ] **P1-6 · Contrast pass + focus rings + theme contrast guard** — §7 · High · Med
  Lift every text/bg pair to ≥4.5:1 (≥3:1 large/UI). **Gate the 16 themes behind an automatic contrast guard**, applying custom colour only to safe roles (accents, chips) — never body text or button labels. *(Focus rings already shipped — see log.)*
- [ ] **P1-7 · Dashboard → one clear next action (Concept 3)** — A1 · High · Med
  Real athlete + time estimate ("Review Maya R. — Breaststroke kick setup · 3 findings · ~4 min"), a quiet "also waiting" list, proof of momentum (last shared report, weekly wins).
- [ ] **P1-8 · Coach Studio entry as a work-first queue** — A3 · High · Med
  Lead with the review queue; merge duplicate "Continue"/"Recommended" entries; delete the one-line explainer box.
- [ ] **P1-9 · The AI-suggested-finding component (Concept 1)** — §9 · Very high · Med
  Confidence bar (not prose hedging), explainable "why — jump to frame", one-gesture Approve/Edit/Reject, "Nothing reaches the swimmer until you approve." *Build behind the AI lock; switch on when AI unlocks.*
- [ ] **P1-10 · Fix cold-start: sample data + one action per empty hub; guided first-run** — S6 · High · Med
- [ ] **P1-11 · Resolve the "3D" name (make it true, or evolve it)** — S5 · High · **Strategic (Owner)**
- [ ] **P1-12 · Populate/diversify the Drill Library; per-stroke icons** — A8 · Med · Med
- [ ] **P1-13 · Design-system pass** — §5 · High · Med
  One card spec; kill card-in-card nesting; persist nav state; unify buttons/badges/icons; retire the "brain" and "flask" metaphors.
- [ ] **P1-14 · Build the Coach Studio review room as a pro surface (Concept 2)** — §9 · Very high · High
  Canvas + draw toolbar + marker timeline (press M) + findings rail. *Prototype already explored — see Delivery log.*

## P2 — enterprise & polish

- [ ] **P2-15 · Security/compliance proof + real status page** — M4 · High (enterprise) · Med
- [ ] **P2-16 · Swimmers at scale: table view, columns, import, bulk actions** — A4 · Med · Med
- [ ] **P2-17 · Consolidate Performance Hub + Club Progress + Trends into one hub** — A5 · Med · Med
- [ ] **P2-18 · Motion system: skeletons, hover/focus, transitions, success/error** — §10 · Med · Med
  Their spec: one easing curve, two durations (≈120ms micro, ≈220ms transitions). **Coach Draw ink latency is 🔴 CRITICAL** — "where 'pro instrument' is won or lost."

---

## Dead-end sweep — 2026-07-26

Read-only audit of every outbound contact/support path, run after the support-address
hotfix. Four independent lenses (mailto/addresses · links & routes · env-gated silent
no-ops · promises made in copy), each candidate adversarially refuted before counting.
9 confirmed → **6 distinct defects** after dedup. A "dead end" = *the user takes a visible
action that appears to work, nothing reaches a human, and they are never told.*

- [x] **DE-1 · Password reset reported success even when nothing was sent** — 🔴 High — **DONE 2026-07-26 · `e23f8b7`**
  `ForgotPassword.jsx` caught every error, surfaced only ones containing `VITE_SUPABASE_`, and ran `setSent(true)` anyway under the comment *"Always show success regardless"*. The anti-enumeration defence does not hold: `resetPasswordForEmail` resolves for unknown emails, so that catch never fired for the case it appeared to protect — it only ever fired on real failures. Compounded by all four auth screens having **zero** support/contact/help strings, so a locked-out coach had no route in and no route to a human. Fixed: surface every error, `console.error` for operator visibility, `setSent(true)` only on genuine success, enumeration-safe wording unchanged, and `AuthLayout` now renders a support address on all four screens. **Demonstrated, not asserted** — forced a non-config error and confirmed the false success is gone; forced a success and confirmed the enumeration-safe wording is intact.
- [ ] **DE-2 · Swimmer/parent portal "connect account" dead end** — 🟠 Med — **scheduled: own build, straight after the finding composer**
  `club_members.linked_swimmer_id` is written in exactly one place — `api/clubs/join-invite.js:76`, at the instant of joining. The portal tells the user *"your coach can connect it from their swimmer list"*; **no such control exists**. Recovery is closed too: re-inviting returns `already_member` before the insert, and member removal is "not yet available". Permanent state, fixable only by a direct DB edit. Needs a real "connect account" control — a feature, not a patch. **Do not let this drift.**
- [ ] **DE-3 · "Find Matching Drills" opens an empty library** — 🟡 Med — *fold into the composer branch*
  Passes `phase`; `DrillLibrary` reads only `stroke` and `faults`, so the advertised phase filter silently does not happen. `faults` seeds a substring search with a full sentence, which can never match short keyword tags → reliable "No drills here yet".
- [ ] **DE-4 · "Back to review" is a permanent no-op** — 🟢 Low — *fold into the composer branch*
  Renders only in the `finalise` step; its scroll target renders only in the `findings` step, so the target is never in the DOM while the button is visible. `?.` swallows the miss.
- [ ] **DE-5 · "View Source Video" ignores `video_id`** — 🟢 Low — *fold into the composer branch*
  `Analyse.jsx` never reads that param; the coach lands on step 0 of the upload wizard instead of their clip.
- [ ] **DE-6 · "Update Display Name" hangs on "Saving…" forever** — 🟢 Low — *bundle anywhere*
  No try/catch, unlike every other save in the app; a failed write leaves the button disabled permanently.

---

## Decisions required from Owen

| # | Decision | Why it's blocked on you |
|---|---|---|
| D1 | **The "3D" name** — ⚠️ *the audit's premise was wrong and Owen has corrected it.* The name is **not** a phantom claim: a real 3D viewer existed (`ModelViewer3D`, `Technical3DViewer` + telemetry HUD) and was **deliberately parked post-pilot**. So: **keep the name if you intend to revive the viewer; rename only if it is gone for good.** Note the code was removed in the dead-code sweep (`ead8384`) and now lives only in git history — recoverable, see FINAL_SUMMARY. | Strategic/brand, not code |
| D2 | **Themes** — audit says cut 16 → 4–6; you asked for the wider range | Recommended resolution: **keep 16 + auto-contrast guard + safe roles only** |
| D3 | **AI concepts vs the manual-first lock** | Adopt "fail silently and usefully" now; build Concept 1 dormant behind the lock |
| D4 | **Domain email + provider** (P0-5) | Needs DNS + account creation |
| D5 | **Compliance content** (P2-15) — hosting region, encryption, retention, sub-processors | Needs real answers, not invented ones |

---

## Already shipped before this audit landed

Some audit items were fixed after their 25 July captures and are already stale in our favour:

- Global `:focus-visible` ring (§7 "no focus-ring treatment observable") — commit `1d00a31`
- Hover states / micro-interactions (§10 "no hover affordance is evident") — `1d00a31`, `19b8ef0`
- Nav breakpoint `xl`→`lg`, font loading, contrast fix, dead 251KB asset — `ee4cd36`
- Coach Studio accent unified cyan→sky; ALL-CAPS labels → sentence case — `673a28d`, `f858b2f`
- Toast wiring fixed (success/error feedback rendered nothing before) — `36f2af9`
- PDF screenshots no longer overlap the page break — `aa394b7`
- Dashboard three-question model (which the audit praises) — `f0ee67c`

---

## Delivery log

| Date | Item | Commit | Verification |
|---|---|---|---|
| 2026-07-25 | **P0-1** instability signalling removed from the coach workflow (+ part of P0-3, P0-4) | `b5aeaea` | 18/18 guards · lint + build clean · grep sweep clean |
| 2026-07-26 | **Launch-hardening batch merged to `main`** — AI purge, demo squad, drill-default fix, per-tier attribution, consent/upload fix, a11y + trust work (16 commits, PR #9) | `448d1d0` | Vercel production **READY** on the merge commit · swimsight3d.com HTTP 200 |
| 2026-07-26 | **Hotfix — support address reverted to a live inbox** (partial revert of P0-5; the branded default bounced in production) | `bd20a12` | lint + build · 18/18 guards · confirmed against the deployed bundle: prod served `support@swimsight3d.com`, `VITE_SUPPORT_EMAIL` proven unset |
| 2026-07-26 | **DE-1** password reset no longer reports false success; support route added to all four auth screens | `e23f8b7` | lint + build · 18/18 guards · failure + success paths demonstrated in-browser, probe reverted and verified absent |
