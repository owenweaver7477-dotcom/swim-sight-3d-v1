import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { CheckCircle2, Clock, FlaskConical, Microscope, XCircle, Star, Wrench } from 'lucide-react';

const SECTIONS = [
  {
    icon: CheckCircle2,
    status: 'Live',
    color: 'text-green-600',
    dot: 'bg-green-500',
    border: 'border-green-500/30',
    bg: 'bg-green-50/40',
    items: [
      { item: 'Login, register, password reset, email OTP verification' },
      { item: 'Club workspace creation and invite-code onboarding' },
      { item: 'Role-based access (owner, admin, coach, assistant_coach, swimmer)' },
      { item: 'Swimmer profiles with squad, coach notes, stroke list, notification preferences' },
      { item: 'Squad creation and management' },
      { item: 'Video upload with private file storage and signed URL access' },
      { item: 'Video Library — uploaded videos per club and swimmer' },
      { item: 'Core coach workflow: upload → analyse → review → report → share' },
      { item: 'Send to AI Review — triggers pose analysis pipeline' },
      { item: 'AI Review queue — all AI reports with status and filter' },
      { item: 'AI Report page — finding approval, rejection, coach editing' },
      { item: 'Original AI suggestion preservation — coach edits never overwrite AI data' },
      { item: 'Report finalisation — locked findings, approval workflow' },
      { item: 'PDF export via browser print layout' },
      { item: 'Shared report link — public secure token, expiry, revocation' },
      { item: 'Swimmer profiles — score trends, fault frequency, phase charts' },
      { item: 'Club Progress dashboard — filtered by squad, stroke, status' },
      { item: 'Corrective Drill Library — fault-based packs, search, assign to findings' },
      { item: 'Reference Library — stroke profiles and reference assets' },
      { item: 'In-app notifications and email delivery to swimmer and parent' },
      { item: 'Notify Swimmer CTA on finalised reports' },
      { item: 'Team Leaderboard — improvement, consistency, severity reduction' },
      { item: 'Club settings, branding, member management' },
    ],
  },
  {
    icon: Star,
    status: 'Live MVP',
    color: 'text-blue-600',
    dot: 'bg-blue-500',
    border: 'border-blue-400/30',
    bg: 'bg-blue-50/40',
    items: [
      { item: 'Pose-assisted AI analysis via external Python server', note: 'Real pose confirmed only when frame count and keypoint confidence both pass threshold' },
      { item: 'AI-generated findings from pose data', note: 'Created as pending — coach approval required before any report inclusion' },
      { item: 'Real-pose technique score and phase breakdown', note: 'Only set when analysis_mode === real_pose and real_pose_detected confirmed' },
      { item: 'Placeholder warning banners', note: 'Reports with unreliable pose are labelled visually; no fake findings created on weak detection' },
      { item: 'Drag risk visualisation', note: 'Coach creates and reviews hydrodynamic risk overlays. Estimate only — not measured drag force' },
      { item: 'Multi-angle upload workflow', note: 'Multiple camera angles per session; AI processes primary angle only' },
      { item: 'Coach annotation tools', note: 'Lines, arrows, angle markers, circles, freehand, body-line helpers. Coach-created only' },
      { item: 'Technical Standards', note: 'Clubs define stroke-phase standards, link to findings and reports. Default reference library included' },
      { item: 'AI Job engine (AIProcessingJob)', note: 'Full lifecycle tracking: queued → extracting → pose detection → analysing → completed/error' },
      { item: 'Swimmer Trends — score and drag-risk over time' },
      { item: '3D model viewer (.glb / .gltf)', note: 'Functional; current assets are shared base rig references, not swimmer-specific models' },
    ],
  },
  {
    icon: Wrench,
    status: 'In Progress',
    color: 'text-primary',
    dot: 'bg-primary',
    border: 'border-primary/20',
    bg: 'bg-primary/5',
    items: [
      { item: 'Coach Review Assistant — guided review setup on Analyse page, contextual coach prompts and stroke-specific checklists on AI Review page, review context summary at finalisation', note: 'Phase 16' },
      { item: 'Professional product shell and visual redesign — unified layout, calmer colour system, simplified navigation, and coach-first workflow presentation', note: 'Phase 15' },
      { item: 'Coach Testing Pack — structured coach trial checklist, in-app feedback capture, bug tracking, and readiness summary for early V1 testing', note: 'Phase 14' },
      { item: 'Guided coach onboarding — first-use checklist, workflow guide, empty states, and report quality gate', note: 'Phase 13' },
      { item: 'Finalisation quality gate — pre-publish checklist with swimmer, stroke, findings, cue, drill, and summary checks', note: 'Phase 13' },
      { item: 'Review workflow checklist on AI Report page', note: 'Phase 13' },
      { item: 'AI reliability guidance on reports and review list — real_pose, partial, unreliable, error states', note: 'Phase 13' },
      { item: 'Public report disclaimer and coach-approval labelling', note: 'Phase 13' },
      { item: 'AI Job Monitor', note: 'Admin page to debug pose pipeline, track job status, errors, and callback flow' },
      { item: 'Annotation export to shared public report', note: 'Coordinates stored; surfacing on public share link in progress' },
      { item: '3D model asset uploads via Reference Library', note: 'Upload form exists; full pipeline in progress' },
      { item: 'Shared annotation export in PDF report', note: 'Coach-reviewed annotations marked for report inclusion; PDF rendering in progress' },
    ],
  },
  {
    icon: FlaskConical,
    status: 'Beta / Testing',
    color: 'text-yellow-600',
    dot: 'bg-yellow-500',
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-50/40',
    items: [
      { item: 'Admin test callback helper (runTestAICallback)', note: 'Owner/admin tool to simulate AI callbacks without a real video' },
      { item: 'resetStuckVideos backend function', note: 'Admin utility to reset videos stuck in pending_ai state' },
      { item: 'Coach Mode quick-review page', note: 'Lightweight pool-deck review mode; functional but not polished' },
      { item: 'AI fault-tag suggester', note: 'Suggests findings from stroke/fault metadata without pose data; draft only, coach review required' },
    ],
  },
  {
    icon: Microscope,
    status: 'Future / Research',
    color: 'text-purple-600',
    dot: 'bg-purple-500',
    border: 'border-purple-500/30',
    bg: 'bg-purple-50/40',
    items: [
      { item: 'True multi-angle pose fusion', note: 'AI server upgrade to combine synchronised camera angles into one pose model' },
      { item: 'Calibrated 3D reconstruction from multi-angle rigs', note: 'Requires stereo or multi-angle camera setup; not feasible with single-angle footage' },
      { item: 'Automatic AI-generated annotations', note: 'AI server suggests annotation markers based on pose data; coach creates all annotations currently' },
      { item: 'Exact drag coefficient modelling', note: 'Current system is a coaching estimate only. Real drag measurement requires flume testing or CFD simulation' },
      { item: 'Direct SwimPro camera integration', note: 'Supports exported SwimPro footage currently; direct camera control not planned' },
      { item: 'Swimmer-specific 3D biomechanics avatar', note: 'Pose data exists; swimmer-specific 3D rendering requires dedicated model pipeline' },
      { item: 'Club benchmark comparisons against squad or national norms' },
      { item: 'Automated session planning from approved findings and drills' },
      { item: 'Advanced biomechanics scoring — stroke rate, DPS, efficiency index' },
      { item: 'Swimmer/parent portal with direct authenticated report access' },
      { item: 'Underwater refraction-corrected biomechanical measurements', note: 'Research-stage optical correction problem' },
      { item: 'AI-assisted technical standard matching', note: 'Future: AI suggests which standard applies to a finding. Coach confirms any link' },
      { item: 'Licensed reference athlete asset partnerships', note: 'Subject to rights agreements with national federations or professional swimmers' },
    ],
  },
  {
    icon: XCircle,
    status: 'Not Planned',
    color: 'text-muted-foreground',
    dot: 'bg-muted-foreground/40',
    border: 'border-border',
    bg: 'bg-secondary/20',
    items: [
      { item: 'Fully automated AI coaching without coach oversight', note: 'All AI output requires coach review and approval' },
      { item: 'Automatically published scores without coach sign-off' },
      { item: 'Medical, clinical, or sports medicine performance claims' },
      { item: 'Guaranteed biomechanical accuracy from single-angle consumer video', note: 'Pose estimates are directional coaching aids, not certified measurements' },
      { item: 'Subscription billing or payment processing' },
      { item: 'Multi-sport or non-swimming use cases (Phase 1 scope: swimming only)' },
    ],
  },
];

export default function Roadmap() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <PageHeader
        eyebrow="Admin"
        title="Product Roadmap"
        subtitle="Code-verified status of what is live, in progress, and planned."
      />

      <div className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground/80 leading-relaxed">
        <strong className="text-foreground block mb-1">Coach-led AI platform</strong>
        Swim Sight 3D is a coach-led analysis platform. AI and pose-assisted tools support review but do not replace coach judgement.
        All findings, phase markers, scores, and report content require coach approval before being shared with swimmers or parents.
        Unreliable pose results are labelled clearly and never converted into fake findings.
      </div>

      <div className="space-y-4">
        {SECTIONS.map(phase => (
          <div key={phase.status} className={`p-5 rounded-xl border ${phase.border} ${phase.bg}`}>
            <div className="flex items-center gap-2 mb-4">
              <phase.icon className={`w-4 h-4 ${phase.color}`} />
              <h3 className="text-sm font-semibold text-foreground">{phase.status}</h3>
              <span className="text-[10px] text-muted-foreground ml-auto">{phase.items.length} items</span>
            </div>
            <div className="space-y-2">
              {phase.items.map((entry, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${phase.dot}`} />
                  <div>
                    <span className="text-xs text-foreground/90 font-medium">{entry.item}</span>
                    {entry.note && (
                      <span className="text-[10px] text-muted-foreground ml-1.5">— {entry.note}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 rounded-lg bg-secondary border border-border text-[10px] text-muted-foreground leading-relaxed">
        <strong className="text-foreground text-xs">Accuracy note:</strong> This roadmap reflects the codebase as of{' '}
        <span className="font-medium text-foreground">June 2026 (Phase 15)</span>. Status categories are based on implemented routes, entities, backend functions, and UI components — not planned or speculative work.
      </div>
    </div>
  );
}