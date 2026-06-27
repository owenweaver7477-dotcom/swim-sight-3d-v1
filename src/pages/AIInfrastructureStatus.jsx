import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ClipboardCheck, Server, ShieldAlert } from 'lucide-react';
import { FeatureReadinessCard } from '@/components/admin/FeatureReadinessCard';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import useDiagnosticsVisible from '@/lib/useDiagnosticsVisible';

const SECTIONS = [
  {
    title: 'Deployed and safe',
    description: 'Capabilities currently present in the production worker and safe for internal coach workflows.',
    items: [
      {
        title: 'Production worker health', status: 'live_safe', category: 'Worker',
        description: 'Last verified healthy on Render using engine pose-mvp-0.5. The production endpoint remains /process-video.',
        prerequisite: 'Authenticated app trigger and callback secret', safe_now: true, blocked_by: null,
        visible_to_coach: true, visible_to_shared_report: false, next_action: 'Recheck worker health after every deployment.',
      },
      {
        title: 'Manual review fallback', status: 'live_safe', category: 'Coach safety',
        description: 'Weak or unsuitable evidence becomes Coach Studio review with zero invented findings.',
        prerequisite: 'Uploaded video remains available', safe_now: true, blocked_by: null,
        visible_to_coach: true, visible_to_shared_report: false, next_action: 'Keep manual review available for every AI outcome.',
      },
      {
        title: 'Staged processing pipeline', status: 'internal_only', category: 'Telemetry',
        description: 'Metadata, frames, pose, stroke phases, findings, and callback stages support internal diagnosis.',
        prerequisite: 'Worker callback data', safe_now: true, blocked_by: null,
        visible_to_coach: true, visible_to_shared_report: false, next_action: 'Use coach-safe stage labels in AI Job Monitor.',
      },
      {
        title: 'Labelled clip evaluation tooling', status: 'internal_only', category: 'Evaluation',
        description: 'Local scripts compare expected coach labels with draft findings without publishing private footage.',
        prerequisite: 'Permissioned local clips and local label manifest', safe_now: true, blocked_by: null,
        visible_to_coach: false, visible_to_shared_report: false, next_action: 'Collect representative clips before tuning flags.',
      },
      {
        title: 'Telemetry foundations', status: 'internal_only', category: 'Telemetry',
        description: 'Frames analysed, pose coverage, average keypoints, fallback state, processing tier, and quality flags are safe internal signals.',
        prerequisite: 'Fields present on the stored AI job', safe_now: true, blocked_by: null,
        visible_to_coach: true, visible_to_shared_report: false, next_action: 'Use telemetry to diagnose reliability, not to claim performance outcomes.',
      },
    ],
  },
  {
    title: 'Deployed but inactive',
    description: 'Code exists, but production flags remain disabled until each prerequisite is validated.',
    items: [
      {
        title: 'Durable Redis queue', status: 'pilot_disabled', category: 'Infrastructure',
        description: 'Redis Streams recovery code is deployed but direct processing remains active.',
        prerequisite: 'Private Redis and restart recovery test', safe_now: false, blocked_by: 'No real Redis staging recovery evidence',
        visible_to_coach: false, visible_to_shared_report: false, next_action: 'Test interruption, reclaim, deduplication, and failed-job recovery in staging.',
      },
      {
        title: 'Robust findings', status: 'pilot_disabled', category: 'AI quality',
        description: 'Persistent-signal filtering can reject isolated pose spikes but is not enabled in production.',
        prerequisite: 'Labelled clip comparison', safe_now: false, blocked_by: 'False-positive and missed-fault review',
        visible_to_coach: false, visible_to_shared_report: false, next_action: 'Compare one flag at a time against coach labels.',
      },
      {
        title: 'CLAHE, pose smoothing, and complexity', status: 'pilot_disabled', category: 'Pose quality',
        description: 'Optional image and pose upgrades remain default-off because they can change processing cost and evidence quality.',
        prerequisite: 'Representative baseline clips', safe_now: false, blocked_by: 'No validated before/after evidence',
        visible_to_coach: false, visible_to_shared_report: false, next_action: 'Measure pose coverage, fallbacks, findings, and processing time separately.',
      },
      {
        title: 'Sequential frame reading', status: 'pilot_disabled', category: 'Video processing',
        description: 'Alternative frame decoding is available but remains disabled until real codec comparisons are complete.',
        prerequisite: 'Representative MP4 and MOV clips', safe_now: false, blocked_by: 'Decode reliability comparison',
        visible_to_coach: false, visible_to_shared_report: false, next_action: 'Compare speed and failed-frame counts on local clips.',
      },
      {
        title: 'Estimated drag pilot', status: 'do_not_display', category: 'Internal prototype',
        description: 'An internal estimate prototype exists but is disabled and is not a live measurement tool.',
        prerequisite: 'Separate scientific validation and product approval', safe_now: false, blocked_by: 'Single-camera evidence cannot establish measured force',
        visible_to_coach: false, visible_to_shared_report: false, next_action: 'Keep ENABLE_ESTIMATED_DRAG=false.',
      },
    ],
  },
  {
    title: 'Needs real swim clips',
    description: 'The next quality decision must come from representative footage, not synthetic tests.',
    items: [
      {
        title: 'Flag comparison', status: 'needs_clips', category: 'Evaluation',
        description: 'Compare default behavior with each optional flag using the same permissioned clips.',
        prerequisite: '3-5 baseline clips minimum', safe_now: false, blocked_by: 'No local baseline set',
        visible_to_coach: false, visible_to_shared_report: false, next_action: 'Use the Footage Collection Checklist.',
      },
      {
        title: 'Baseline and finding review', status: 'needs_clips', category: 'Coach review',
        description: 'Pose coverage, fallback rate, processing time, false positives, and missed faults need video review.',
        prerequisite: 'Coach-observed footage', safe_now: false, blocked_by: 'No real comparison evidence',
        visible_to_coach: false, visible_to_shared_report: false, next_action: 'Record expected faults before looking at AI output.',
      },
    ],
  },
  {
    title: 'Needs labelled data',
    description: 'Custom training and dependable tuning require labels that are independent from the worker output.',
    items: [
      {
        title: 'Underwater pose dataset', status: 'needs_labels', category: 'Model research',
        description: 'Frames need joint labels through splash, bubbles, glare, and occlusion across all four strokes.',
        prerequisite: 'Training, validation, and holdout data', safe_now: false, blocked_by: 'No labelled underwater dataset',
        visible_to_coach: false, visible_to_shared_report: false, next_action: 'Define annotation rules and consent before collecting training data.',
      },
    ],
  },
  {
    title: 'Needs calibration hardware',
    description: 'Physical camera geometry must be measured before coordinate correction or comparison.',
    items: [
      {
        title: 'Calibration profiles and refraction correction', status: 'needs_calibration', category: 'Camera system',
        description: 'Future calibrated comparison requires the actual lens, housing, mounting geometry, and pool reference points.',
        prerequisite: 'Known geometry and validation footage', safe_now: false, blocked_by: 'No measured camera or housing profile',
        visible_to_coach: false, visible_to_shared_report: false, next_action: 'Capture a calibration board or known pool geometry with the real setup.',
      },
    ],
  },
  {
    title: 'Needs multi-camera setup',
    description: 'Three-dimensional reconstruction cannot be inferred safely from one uncalibrated view.',
    items: [
      {
        title: 'Synchronization and triangulation', status: 'future_lab', category: 'Future Analysis',
        description: 'Future calibrated multi-view reconstruction needs synchronized feeds, camera profiles, and reprojection QA.',
        prerequisite: 'Two or more calibrated synchronized views', safe_now: false, blocked_by: 'No synchronized capture set',
        visible_to_coach: false, visible_to_shared_report: false, next_action: 'Define capture synchronization and measurable rejection thresholds.',
      },
      {
        title: 'SMPL and mesh fitting', status: 'future_lab', category: 'Future Analysis',
        description: 'A prototype 3D reference visualisation may be explored only after reliable calibrated keypoints exist.',
        prerequisite: 'Validated multi-view keypoints and suitable model licence', safe_now: false, blocked_by: 'No validated reconstruction input',
        visible_to_coach: false, visible_to_shared_report: false, next_action: 'Treat future meshes as coach-reviewed reference visuals only.',
      },
    ],
  },
  {
    title: 'Needs GPU and autoscaling evidence',
    description: 'Compute infrastructure should follow measured workload rather than precede it.',
    items: [
      {
        title: 'GPU workers and autoscaling', status: 'future_lab', category: 'Scale',
        description: 'GPU capacity may support a validated future model or higher queue volume.',
        prerequisite: 'Queue depth, processing cost, latency, and budget evidence', safe_now: false, blocked_by: 'Current workload does not justify the architecture',
        visible_to_coach: false, visible_to_shared_report: false, next_action: 'Measure pilot queue depth and cost per completed review.',
      },
    ],
  },
  {
    title: 'Never shown in shared reports',
    description: 'These values remain private implementation details regardless of feature readiness.',
    items: [
      {
        title: 'Private worker and model data', status: 'do_not_display', category: 'Privacy boundary',
        description: 'Raw landmarks, callback payloads, rejected findings, private URLs, profile measurements, calibration internals, and debug objects remain private.',
        prerequisite: 'None', safe_now: false, blocked_by: 'Public disclosure would violate the product trust boundary',
        visible_to_coach: false, visible_to_shared_report: false, next_action: 'Keep public report sanitization explicit and field allowlisted.',
      },
    ],
  },
];

function ReadinessSection({ title, description, items }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {items.map((item) => <FeatureReadinessCard key={item.title} {...item} />)}
      </div>
    </section>
  );
}
export default function AIInfrastructureStatus() {
  const canView = useDiagnosticsVisible();

  if (!canView) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <div className="text-sm font-medium text-foreground">Owner or admin access required</div>
        <p className="mt-1 text-xs text-muted-foreground">Infrastructure readiness is an internal operational view.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <PageHeader
        eyebrow="Internal operations"
        title="AI Infrastructure Status"
        subtitle="What is safe now, what remains disabled, and what evidence is required before advanced capabilities can be activated."
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline" className="h-8 text-xs">
              <Link to="/ai-jobs"><Activity className="mr-1.5 h-3.5 w-3.5" />AI Jobs</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8 text-xs">
              <Link to="/footage-checklist"><ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />Footage Checklist</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8 text-xs">

            </Button>
          </div>
        }
      />

      <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-xs leading-relaxed text-cyan-900">
        <strong>AI suggests. Coaches decide.</strong> Deployed code is not the same as an activated or validated capability. Coach approval and manual review remain required.
      </div>

      {SECTIONS.map((section) => <ReadinessSection key={section.title} {...section} />)}
    </div>
  );
}
