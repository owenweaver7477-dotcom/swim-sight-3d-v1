# Swim Sight 3D Plan Gates Notes

This document describes the Phase 13 paid-AI architecture foundation. It prepares the product language and front-end states for future paid plans without activating billing.

## Plan Model

- `free_demo`: public exploration, sample report preview, and future trial access.
- `coach_studio`: manual Coach Studio review, key moments, Coach Draw, manual findings, drill suggestions, and shared reports.
- `ai_assist`: AI draft findings, AI review credits, quality gates, fallback messaging, and coach approval workflow.
- `club_pro`: squads, swimmer profiles, multi-coach roles, club workflow, progress history, and higher future AI allowance.
- `elite_lab`: future premium reference comparison, multi-angle review, priority AI, and premium export controls.

## AI Credits

- Manual Coach Studio review uses `0` AI credits.
- A standard AI Review is planned to use `1` AI credit.
- Longer, high-resolution, multi-angle, and Elite Lab workflows may use different future credit rules.
- Current pilot credit messaging is informational unless a real server-side entitlement system is added.

## Security Boundary

Front-end feature gates are for user experience only. They are not security.

Before real billing or paid AI launch, Swim Sight 3D must enforce entitlements server-side before:

- dispatching paid AI jobs
- changing AI queue priority
- creating paid/premium exports
- exposing premium routes
- applying credit balances
- updating subscription state

## Future Billing Work

Stripe, checkout, subscriptions, invoices, billing portal access, webhook handling, and credit ledger enforcement are separate future phases. Phase 13 intentionally does not collect payments or create checkout flows.

## Product Safety

Elite Lab language should remain future-facing until the underlying product is real. Avoid claims about automatic truth, live measurement, or coach replacement. AI Assist should stay positioned as draft evidence that coaches review, edit, approve, or reject.
