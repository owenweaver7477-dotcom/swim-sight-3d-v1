import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Eye,
  LockKeyhole,
} from 'lucide-react';
import CoachWorkflowChecklist from './CoachWorkflowChecklist';
import { AI_PILOT_LOCKED } from '@/lib/aiPilotLock';

const FINAL_REPORT_STATUSES = new Set(['coach_approved', 'finalised', 'published', 'shared']);
const ACTIVE_AI_STATUSES = new Set([
  'queued', 'accepted', 'running', 'downloading_video', 'extracting_frames',
  'running_pose_detection', 'analysing_stroke', 'generating_outputs', 'callback_sending',
]);
const FAILED_AI_STATUSES = new Set(['error', 'failed', 'timed_out', 'cancelled', 'retry_available']);

const STATUS_STYLES = {
  'Not started': 'border-slate-200 bg-slate-50 text-slate-600',
  'In progress': 'border-cyan-200 bg-cyan-50 text-cyan-800',
  Complete: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Blocked: 'border-amber-200 bg-amber-50 text-amber-800',
  'Preview-only': 'border-violet-200 bg-violet-50 text-violet-700',
};

function statusIcon(status) {
  if (status === 'Complete') return CheckCircle2;
  if (status === 'Blocked') return LockKeyhole;
  if (status === 'Preview-only') return Eye;
  if (status === 'In progress') return AlertTriangle;
  return Circle;
}

function hasCoachDecision(finding) {
  return ['approved', 'rejected', 'edited'].includes(finding?.approval_status);
}

export default function CoachStudioWorkflowPanel({
  video,
  report,
  findings = [],
  annotations = [],
  aiJob,
  sharedLinks = [],
  consentState = 'unknown',
}) {
  const focusAreas = report?.review_context?.analysis_focus_areas || [];
  const aiFindings = findings.filter(finding => finding.source === 'ai');
  const manualFindings = findings.filter(finding => finding.source !== 'ai');
  const pendingFindings = findings.filter(finding => !hasCoachDecision(finding));
  const approvedFindings = findings.filter(finding => finding.approval_status === 'approved');
  const hasDrill = approvedFindings.some(finding => finding.drill || finding.linked_drill_id || finding.linked_drill_title);
  const reportFinal = FINAL_REPORT_STATUSES.has(report?.status);
  const activeShare = sharedLinks.some(link => link.status === 'active');
  const aiStatus = String(aiJob?.status || aiJob?.queue_status || '').toLowerCase();
  const aiActive = ACTIVE_AI_STATUSES.has(aiStatus);
  const aiUnavailable = FAILED_AI_STATUSES.has(aiStatus) || report?.analysis_mode === 'manual_review' || report?.analysis_mode === 'error';
  const consentReady = consentState === 'ready';

  const sections = [
    {
      title: 'Session setup',
      status: video && report ? 'Complete' : 'Blocked',
      purpose: 'Confirm the swimmer, stroke, permissions, and review context before analysis.',
      action: video && report ? 'Check the selected swimmer and stroke.' : 'Select an uploaded video and create a review.',
      unlocks: 'Video review and focus selection.',
      checks: [
        { label: 'Review report created', done: Boolean(report) },
        { label: 'Private video selected', done: Boolean(video) },
        { label: 'Consent status checked for this pilot', done: consentReady },
      ],
    },
    {
      title: 'Video and angle review',
      status: video ? 'Complete' : 'Blocked',
      purpose: 'Confirm the clip is playable and the camera angle supports the intended review.',
      action: 'Play, pause, seek, and confirm the swimmer remains visible.',
      unlocks: 'Timestamp notes, key moments, and Coach Draw.',
      checks: [
        { label: 'Private video is available', done: Boolean(video) },
        { label: 'Camera angle recorded', done: Boolean(video?.camera_angle || report?.camera_angle) },
      ],
    },
    {
      title: 'Focus checklist',
      status: focusAreas.length ? 'Complete' : 'In progress',
      purpose: 'Set the coaching questions for body line, kick, pull, timing, starts, turns, or race skills.',
      action: focusAreas.length ? 'Confirm the selected focus still matches the clip.' : 'Choose at least one focus area or continue with manual review.',
      unlocks: 'A more focused coach review and AI instruction payload.',
      checks: [
        { label: 'Focus area selected', done: focusAreas.length > 0 },
        { label: 'Custom coach focus reviewed', done: Boolean(report?.review_context?.custom_coach_focus) },
      ],
    },
    {
      title: 'Manual annotation',
      status: annotations.length || manualFindings.length ? 'Complete' : 'In progress',
      purpose: 'Capture coach-controlled timestamps, key moments, drawings, and manual observations.',
      action: 'Add a timestamp note or annotation; drawing is optional.',
      unlocks: 'Evidence that can be linked to a coach finding.',
      checks: [
        { label: 'Manual timestamp or finding started', done: manualFindings.length > 0 },
        { label: 'Coach annotation saved or intentionally skipped', done: annotations.length > 0 },
      ],
    },
    {
      title: 'AI-assisted draft review',
      status: aiActive ? 'In progress' : aiUnavailable && !aiFindings.length ? 'Blocked' : aiFindings.length && aiFindings.every(hasCoachDecision) ? 'Complete' : aiFindings.length ? 'In progress' : 'Not started',
      purpose: 'Treat AI output as draft evidence that must be approved, edited, or rejected by a coach.',
      action: aiUnavailable ? 'Continue manual coach review; AI is not required to complete the report.' : 'Record a coach decision for every AI-assisted draft.',
      unlocks: 'Coach-owned findings for the report.',
      checks: [
        { label: 'AI status understood', done: Boolean(aiStatus) || aiUnavailable },
        { label: 'Every AI draft has a coach decision', done: aiFindings.length > 0 && aiFindings.every(hasCoachDecision) },
        { label: 'Manual review available if AI is unavailable', done: true },
      ],
    },
    {
      title: 'Drills and next focus',
      status: hasDrill ? 'Complete' : approvedFindings.length ? 'In progress' : 'Not started',
      purpose: 'Turn the observation into a practical cue, drill, and next review target.',
      action: hasDrill ? 'Confirm volume and cue are suitable for this swimmer.' : 'Assign a drill or write a coach-selected alternative.',
      unlocks: 'A useful swimmer improvement plan.',
      checks: [
        { label: 'At least one coach-approved finding', done: approvedFindings.length > 0 },
        { label: 'Drill assigned or intentionally skipped', done: hasDrill },
        { label: 'Next focus recorded', done: Boolean(report?.next_focus || approvedFindings.some(finding => finding.next_focus)) },
      ],
    },
    {
      title: 'Report approval',
      status: reportFinal ? 'Complete' : findings.length && pendingFindings.length === 0 ? 'In progress' : findings.length ? 'In progress' : 'Not started',
      purpose: 'Check every included item before the report becomes shareable.',
      action: reportFinal ? 'Report is coach-approved.' : 'Review findings, severity, privacy, drills, and summary before finalising.',
      unlocks: 'Secure share and print/export actions.',
      checks: [
        { label: 'Findings reviewed', done: findings.length > 0 && pendingFindings.length === 0 },
        { label: 'Unsafe or private information excluded', done: reportFinal },
        { label: 'Severity and drill checked', done: approvedFindings.length > 0 && hasDrill },
        { label: 'Coach decision recorded', done: findings.length > 0 && pendingFindings.length === 0 },
      ],
    },
    {
      title: 'Share / export',
      status: activeShare ? 'Complete' : reportFinal ? 'In progress' : 'Blocked',
      purpose: 'Share only coach-approved, privacy-filtered report content.',
      action: reportFinal ? 'Create and test the secure shared link, or print the approved report.' : 'Finalise the coach-approved report first.',
      unlocks: 'A swimmer- and parent-readable improvement plan.',
      checks: [
        { label: 'Report coach-approved', done: reportFinal },
        { label: 'Secure shared link created if needed', done: activeShare },
        { label: 'Public output checked while logged out', done: false },
      ],
    },
  ];

  // Manual-first pilot: drop the AI-assisted draft step and the AI status row so
  // the workflow guide reads as a pure manual coach-review checklist.
  const visibleSections = AI_PILOT_LOCKED
    ? sections.filter(section => section.title !== 'AI-assisted draft review')
    : sections;

  const readiness = [
    ['Video ready', Boolean(video)],
    ['Consent ready', consentReady],
    ['Focus selected', focusAreas.length > 0],
    ['Manual notes started', manualFindings.length > 0 || annotations.length > 0],
    ['AI status clear', Boolean(aiStatus) || aiUnavailable],
    ['Coach decisions complete', findings.length > 0 && pendingFindings.length === 0],
    ['Report approved', reportFinal],
    ['Share / export checked', activeShare],
  ].filter(([label]) => !AI_PILOT_LOCKED || label !== 'AI status clear');

  const quickSteps = [
    {
      title: 'Watch',
      status: video ? 'Complete' : 'Blocked',
      action: 'Play, pause, slow down, and find the key moment.',
    },
    {
      title: 'Draw',
      status: annotations.length ? 'Complete' : 'In progress',
      action: 'Open Coach Draw only when the frame needs a visual mark.',
    },
    {
      title: 'Tag Fault',
      status: findings.length ? 'Complete' : 'In progress',
      action: 'Tag the main fault or create a short coach finding.',
    },
    {
      title: 'Add Cue',
      status: hasDrill || approvedFindings.some(finding => finding.correction_cue || finding.cue || finding.next_focus) ? 'Complete' : 'In progress',
      action: 'Add the correction cue, drill, and next focus.',
    },
    {
      title: 'Save Report',
      status: reportFinal ? 'Complete' : findings.length && pendingFindings.length === 0 ? 'In progress' : 'Not started',
      action: 'Approve coach-safe content before sharing or exporting.',
    },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4" aria-labelledby="coach-workflow-title">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">Coach Studio workflow</div>
          <h2 id="coach-workflow-title" className="mt-1 text-base font-bold text-slate-900">Watch. Draw. Tag. Cue. Save.</h2>
        </div>
        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[10px] font-semibold text-cyan-800">
          Manual review available if AI is unavailable
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-5">
        {quickSteps.map((step, index) => {
          const Icon = statusIcon(step.status);
          return (
            <div key={step.title} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-md border ${STATUS_STYLES[step.status]}`}>
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{index + 1}</span>
              </div>
              <div className="mt-2 text-sm font-bold text-slate-900">{step.title}</div>
              <p className="mt-1 text-[10px] leading-4 text-slate-600">{step.action}</p>
              <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold ${STATUS_STYLES[step.status]}`}>
                {step.status}
              </span>
            </div>
          );
        })}
      </div>

      <details className="mt-3 rounded-lg border border-slate-200 bg-white">
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-slate-700">
          <span>More readiness checks</span>
          <span className="text-[10px] font-medium text-slate-500">Local pilot checklist</span>
        </summary>
        <div className="border-t border-slate-200 p-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {readiness.map(([label, done]) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px]">
                <span className="text-slate-600">{label}</span>
                <span className={done ? 'font-semibold text-emerald-700' : 'font-medium text-slate-400'}>{done ? 'Ready' : 'Check'}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {visibleSections.map((section, index) => {
              const Icon = statusIcon(section.status);
              return (
                <div key={section.title} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex min-h-10 items-start gap-3">
                  <div className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border ${STATUS_STYLES[section.status]}`}>
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Stage {index + 1}</div>
                    <div className="text-xs font-bold text-slate-900">{section.title}</div>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${STATUS_STYLES[section.status]}`}>{section.status}</span>
                  </div>
                  <div className="mt-3"><CoachWorkflowChecklist items={section.checks} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </details>
    </section>
  );
}
