# Wiring the two coach-attraction features

Both are **flag-gated, default OFF**, and the UI components are written. They are
**scaffolds**: presentational + trigger code that follows the app's conventions
(`import.meta.env.VITE_*` flags, `@/lib/data/functions`, shadcn `Button`,
react-query, sonner). They have NOT been run through `npm run build` here — do
that after wiring. The worker logic they depend on is already built and tested
(`app/comparison.py`, `app/clip_renderer.py`).

## Flags (Vercel env on the v1 project)
- `VITE_ENABLE_COMPARISON=true` — turns on the side-by-side feature.
- `VITE_ENABLE_SHARE_CLIP=true` — turns on the clip export.
- Leave both unset for now; nothing changes until you set them.

Matching worker flags (Render): `ENABLE_COMPARISON`, `ENABLE_SHARE_CLIP`.

---

## Feature B — Export shareable clip  (`ShareClipButton.jsx`)

**Component:** `src/components/ai-report/ShareClipButton.jsx` (done).

**1. Add a data function** in `src/lib/data/functions.js`:
```js
async exportShareableClip(reportId) {
  const response = await fetch(`/api/reports/${reportId}/share-clip`, { method: 'POST' });
  return { data: await response.json() };
}
```

**2. Add the backend endpoint** `/api/reports/[id]/share-clip` (Vercel function or
a base44 function, mirroring `createSharedReportLink`). It MUST:
- require an authenticated coach with edit rights on the report;
- require the report `coach_approved` with no pending findings;
- enforce `REQUIRE_CONSENT` (no clip for a swimmer without valid consent);
- gather ONLY approved + public findings + the per-frame landmarks;
- call the worker behind `ENABLE_SHARE_CLIP` (`app/clip_renderer.py` →
  `build_render_plan` then `render_clip`), which already strips drag/PII;
- return `{ clip_url }` (a short-lived signed URL) or `{ error }`.

**3. Mount it** inside `ShareReportSection.jsx`, e.g. just below the "Create Share
Link" card, passing the props it already has:
```jsx
import ShareClipButton from '@/components/ai-report/ShareClipButton';
// ...
<ShareClipButton reportId={reportId} isCoachApproved={isCoachApproved}
                 findings={findings} analysisMode={analysisMode} />
```

---

## Feature A — Side-by-side comparison  (`SideBySideComparison.jsx`)

**Component:** `src/components/analysis/SideBySideComparison.jsx` (done).

**1. Worker endpoint:** expose `app/comparison.py: compare_clips(...)` behind
`ENABLE_COMPARISON` (e.g. a `/compare` route, or fold it into the existing
analysis result), returning the payload shape documented in the component.

**2. Add a data function** in `src/lib/data/functions.js`:
```js
async compareClips(reportAId, reportBId) {
  const response = await fetch(`/api/compare?a=${reportAId}&b=${reportBId}`);
  return { data: await response.json() };
}
```
The backend resolves each report's clip signed URL + fps and the comparison
payload, returning `{ clipAUrl, clipBUrl, comparison, fpsA, fpsB }`.

**3. Surface a "Compare to…" action** from
`src/components/analytics/SwimmerProgressAnalytics.jsx` (and/or a swimmer's
`ReportHistoryList`): let the coach pick two of that swimmer's reports, call
`functions.compareClips`, and render:
```jsx
import SideBySideComparison from '@/components/analysis/SideBySideComparison';
// ...
<SideBySideComparison clipAUrl={clipAUrl} clipBUrl={clipBUrl}
   comparison={comparison} fpsA={fpsA} fpsB={fpsB}
   labelA="Earlier" labelB="Latest" />
```

---

## Verify
```bash
cd "Swim Sight 3D V1"
npm run lint && npm run build
```
Then set the two `VITE_ENABLE_*` flags on a preview deployment and click through
before enabling in production. Keep all wording "AI-assisted / coach-approved /
draft / estimate".
