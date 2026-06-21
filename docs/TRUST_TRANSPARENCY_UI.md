# Trust and Transparency UI

Swim Sight 3D treats AI output as draft evidence. AI suggestions do not become report content until a coach reviews them and decides to approve, edit, or reject them.

## Coach review

- AI-generated cards are labelled **AI-assisted draft** and **Coach review required**.
- Confidence is shown as low, medium, high, or unknown. It is a review aid, not a guarantee that a finding is correct.
- The evidence panel may show safe frame numbers and phase context to help the coach inspect the source clip.
- Missing evidence is stated clearly and should lead to manual video review.
- Review states are Draft, Edited, Approved, and Rejected.

## Shared report boundary

Only approved findings and annotations explicitly marked for public report inclusion may cross the shared-report boundary. Public and printable report data is rebuilt from a field allowlist rather than passing database or worker objects through directly.

Shared reports must not include:

- raw landmarks, pose results, frame arrays, or raw AI payloads
- signed or private video URLs, storage paths, local paths, or callback URLs
- rejected or pending findings
- calibration or estimated-drag internals
- swimmer height or mass
- guardian or contact details
- private coach notes or rejection notes

Coach Draw and key-moment annotations require both `include_in_report = true` and `is_public = true`. Drawing JSON is converted into a constrained SVG before display; raw drawing data is not sent to shared-report UI.

## Local QA

Run the synthetic public-report boundary check with:

```bash
node scripts/check_public_report_safety.mjs
```

The fixtures contain no real swimmer data. One clean fixture confirms normal output, while one deliberately unsafe synthetic fixture confirms that private fields and rejected content are removed.

## Product rule

AI suggests. Coaches decide. Evidence frames support review only, and every shared report remains coach-approved.
