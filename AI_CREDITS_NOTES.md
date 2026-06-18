# Swim Sight 3D AI Credits Notes

Phase 15A prepares a pilot-safe AI credit foundation. It does not add Stripe, checkout, subscriptions, or payment collection.

## Current Credit Rule

- Manual Coach Studio review uses `0` AI credits.
- Standard AI Review is prepared to use `1` AI credit.
- Longer, high-resolution, multi-angle, priority queue, and Elite Lab workflows remain future credit rules.

## Backend Entitlement Fields

`017_v1_ai_entitlements_credit_ledger.sql` adds nullable AI entitlement fields to `clubs`:

- `plan_key`
- `ai_enabled`
- `ai_pilot_access`
- `ai_credit_mode`
- `ai_entitlements_updated_at`
- `ai_entitlements_updated_by`

Null/missing entitlement data keeps current pilot AI access working. This avoids breaking Owen's live testing while the SQL and product model are being rolled out.

## Credit Modes

- `pilot_unlimited`: AI Review can run without consuming ledger credits.
- `credit_limited`: AI Review requires a positive `ai_credit_ledger` balance and consumes `-1` on a new queued AI job.
- `blocked`: AI Review is blocked server-side; Coach Studio/manual review remains available.

## Ledger Pattern

`ai_credit_ledger` uses positive and negative entries:

- `+10` with reason `pilot_grant`
- `-1` with reason `standard_ai_review`
- `+1` with reason `admin_adjustment`

Credits are consumed only for a newly created AI job. Duplicate clicks that return an existing active AI job do not consume another credit.

## Future Stripe Work

Real billing still needs a separate phase:

- Stripe products/prices
- checkout
- subscription webhooks
- billing portal
- paid credit grants
- admin adjustment tools
- server-side entitlement updates from trusted webhook events

Frontend gates remain helpful UX, but the server-side `/api/ai/trigger` entitlement check is the boundary that matters for paid AI.
