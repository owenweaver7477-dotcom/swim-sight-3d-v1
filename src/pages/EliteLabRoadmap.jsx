import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Eye, ShieldAlert } from 'lucide-react';
import { FeatureReadinessCard } from '@/components/admin/FeatureReadinessCard';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { useClubContext } from '@/lib/useClubContext';

const ADMIN_ROLES = ['owner', 'admin'];

const ROADMAP_ITEMS = [
  {
    title: 'Custom underwater pose model', status: 'needs_labels', category: 'Future Elite Lab',
    description: 'A future model could improve joint visibility through splash, bubbles, glare, and unusual swim positions.',
    prerequisite: 'Permissioned labelled frames and a holdout benchmark', safe_now: false,
    blocked_by: 'No validated underwater training dataset', visible_to_coach: false, visible_to_shared_report: false,
    next_action: 'Build annotation rules and prove improvement over the MediaPipe baseline.',
  },
  {
    title: 'Camera calibration profiles', status: 'needs_calibration', category: 'Future calibrated comparison',
    description: 'Profiles could describe the real camera, lens, housing, mounting position, and pool geometry.',
    prerequisite: 'Actual capture hardware and measured reference geometry', safe_now: false,
    blocked_by: 'No physical profile exists', visible_to_coach: false, visible_to_shared_report: false,
    next_action: 'Capture validation footage using a calibration board or known pool dimensions.',
  },
  {
    title: 'Refraction correction', status: 'needs_calibration', category: 'Future calibrated comparison',
    description: 'A correction may be evaluated for a known underwater housing after its assumptions are measured.',
    prerequisite: 'Housing, lens, interface, and reprojection measurements', safe_now: false,
    blocked_by: 'Generic water correction would be misleading', visible_to_coach: false, visible_to_shared_report: false,
    next_action: 'Validate corrections against known points before processing athlete footage.',
  },
  {
    title: 'Multi-camera synchronization', status: 'future_lab', category: 'Future Elite Lab',
    description: 'Synchronized views could support a future coach-reviewed movement comparison across angles.',
    prerequisite: 'Timestamped feeds and repeatable synchronization', safe_now: false,
    blocked_by: 'No synchronized capture workflow', visible_to_coach: false, visible_to_shared_report: false,
    next_action: 'Define capture timing, drift limits, and failed-sync handling.',
  },
  {
    title: 'Triangulation', status: 'future_lab', category: 'Prototype visualisation',
    description: 'Calibrated views may eventually support a 3D reference visualisation with measurable reprojection error.',
    prerequisite: 'Synchronized feeds and camera profiles', safe_now: false,
    blocked_by: 'No calibrated multi-view evidence', visible_to_coach: false, visible_to_shared_report: false,
    next_action: 'Set rejection thresholds before presenting any reconstructed movement.',
  },
  {
    title: 'SMPL and mesh fitting', status: 'future_lab', category: 'Prototype visualisation',
    description: 'A future mesh may provide a coach-reviewed visual reference after reliable calibrated inputs exist.',
    prerequisite: 'Validated keypoints, suitable licence, and GPU processing', safe_now: false,
    blocked_by: 'No validated reconstruction input', visible_to_coach: false, visible_to_shared_report: false,
    next_action: 'Keep prototypes internal and label them as not a live measurement tool.',
  },
  {
    title: 'GPU workers and autoscaling', status: 'future_lab', category: 'Infrastructure',
    description: 'GPU capacity may become appropriate when a validated model or measured queue volume requires it.',
    prerequisite: 'Queue depth, latency, cost, and model benchmarks', safe_now: false,
    blocked_by: 'No measured scale requirement', visible_to_coach: false, visible_to_shared_report: false,
    next_action: 'Establish cost per review and a safe CPU/manual-review fallback first.',
  },
];

export default function EliteLabRoadmap() {
  const { club } = useClubContext();
  const canView = ADMIN_ROLES.includes(club?._memberRole);

  if (!canView) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <div className="text-sm font-medium text-foreground">Owner or admin access required</div>
        <p className="mt-1 text-xs text-muted-foreground">Elite Lab planning is an internal roadmap.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <PageHeader
        eyebrow="Internal roadmap"
        title="Elite Lab Roadmap"
        subtitle="Future calibrated and coach-reviewed movement comparison. These capabilities are not active production measurements."
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline" className="h-8 text-xs">
              <Link to="/ai-infrastructure-status"><ChevronLeft className="mr-1.5 h-3.5 w-3.5" />Infrastructure Status</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8 text-xs">
              <Link to="/biomechanics-hud"><Eye className="mr-1.5 h-3.5 w-3.5" />Prototype Preview</Link>
            </Button>
          </div>
        }
      />

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
        <strong>Coach review required.</strong> The preview is a 3D reference visualisation, not a live measurement tool. Calibrated comparison requires measured hardware and validation before use.
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-xs font-bold text-emerald-800">Current pilot</div>
          <p className="mt-1 text-xs leading-5 text-emerald-950">Private coach review, coach-approved draft findings, and public-safe reports.</p>
        </div>
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
          <div className="text-xs font-bold text-sky-800">In validation</div>
          <p className="mt-1 text-xs leading-5 text-sky-950">Pose reliability, stroke-phase context, coach feedback evaluation, and known-distance calibration.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-bold text-slate-700">Not claimed</div>
          <p className="mt-1 text-xs leading-5 text-slate-700">Automated coaching, medical diagnosis, validated 3D biomechanics, or measured hydrodynamics.</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {ROADMAP_ITEMS.map((item) => <FeatureReadinessCard key={item.title} {...item} />)}
      </div>
    </div>
  );
}
