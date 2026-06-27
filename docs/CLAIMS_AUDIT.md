# Claims Audit

Audit date: 2026-06-20

Scope: user-facing and operational text searched for `accurate`, `measured`,
`AI detected`, `true 3D`, `biomechanically validated`, and `replaces the coach`.
This is a product-copy audit, not legal advice or scientific validation.

## Changed in this pass

- `COACH_TESTING_PLAN.md:45` — replaced “approve if accurate” with approval only
  when video evidence supports the finding and the coach agrees.
- `src/pages/public/CoachApprovedAIPage.jsx:64` — replaced “what is accurate”
  with “what is supported by the video”.
- `src/pages/public/FAQPage.jsx:13` — replaced “what is accurate” with “what is
  supported by the video”.

## Remaining user-facing hits reviewed as safe context

- `COACH_PILOT_SCRIPT.md:4,58` — explicitly says the workflow pilot is not an
  accuracy test and lists over-confident phrases under “Avoid”.
- `src/pages/AIReportPage.jsx:203` — explicitly says resistance cues are not a
  lab value.
- `src/components/drag/DragRiskReportSection.jsx:114` — explicitly says the
  overlay is an estimate and not a lab force value.
- `src/components/drag/DragRiskSummary.jsx:58` — explicitly says the display is
  not a lab value.
- `src/components/ai-report/PlaceholderWarningBanner.jsx:62` — warns that
  placeholder findings are not derived from pose evidence and must not be
  shared as real analysis.
- `src/pages/Roadmap.jsx:75` — describes future resistance cues as estimates,
  not force measurements.
  measurements, workload evidence, or future calibration and says the preview
  is not a live measurement tool.
- `src/pages/AIInfrastructureStatus.jsx:79,116,121,146` — blocks advanced work
  until physical calibration or workload evidence exists; it does not claim
  athlete measurements.

## Non-user-facing or operational hits

- `AI_ACTIVATION_CHECKLIST.md:42,45,50` — requires future hardware geometry,
  reprojection error, and synchronization drift to be quantified before use.
- `base44/entities/DragAnalysis.jsonc:62,93` — schema descriptions explicitly
  reject force/coefficient measurement claims.
- `COACH_STUDIO_NOTES.md:74` — says browser frame stepping is approximate.
- `src/index.css:164` — print-colour implementation comment.
- `src/pages/Swimmers.jsx:74` — implementation comment about report counters.

## Required framing

Future copy should use “AI-assisted”, “coach-approved”, “draft finding”,
“supported by the video”, and “estimate”. Public or coach-facing copy should not
present single-camera output as laboratory measurement or automatic coaching.
