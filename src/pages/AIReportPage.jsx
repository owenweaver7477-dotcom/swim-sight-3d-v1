import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import entities from '@/lib/data/entities';
import functions from '@/lib/data/functions';
import { useAuth } from '@/lib/AuthContext';
import { useClubContext } from '@/lib/useClubContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/shared/PageHeader';
import AIFindingCard from '@/components/ai-report/AIFindingCard';
import ApprovedCoachReport from '@/components/ai-report/ApprovedCoachReport';
import ShareReportSection from '@/components/ai-report/ShareReportSection';
import PrintableReport from '@/components/reports/PrintableReport';
import {
  Brain, CheckCircle2, Clock, Activity, Loader2,
  ArrowLeft, Star, Camera, Film, AlertTriangle, ClipboardCheck, Share2, Download,
  Trash2, Plus, Save
} from 'lucide-react';
import { format } from 'date-fns';
import WorkflowStepper from '@/components/ai-report/WorkflowStepper';
import ReportNavActions from '@/components/ai-report/ReportNavActions';
import PoseEvidencePanel from '@/components/ai-report/PoseEvidencePanel';
import ReviewChecklist from '@/components/ai-report/ReviewChecklist';
import FinaliseQualityGate from '@/components/ai-report/FinaliseQualityGate';
import FeedbackButton from '@/components/coach-testing/FeedbackButton';
import CoachReviewAssistantCard from '@/components/ai-report/CoachReviewAssistantCard';
import { getDefaultDrills } from '@/lib/defaultDrills';
import { drillSummary, suggestDrillsForFinding } from '@/lib/drillMatching';
import CoachDrawStudio from '@/components/annotations/CoachDrawStudio';
import AnnotationTimeline from '@/components/annotations/AnnotationTimeline';
import KeyStampGallery from '@/components/annotations/KeyStampGallery';
import { formatTimestamp } from '@/lib/annotationRender';
import AIReviewTrustSummary from '@/components/ai/AIReviewTrustSummary';
import AICreditIndicator from '@/components/credits/AICreditIndicator';
import CoachStudioWorkflowPanel from '@/components/coach-studio/CoachStudioWorkflowPanel';
import { isCoachAppRole, isPilotRole, isAdminRole } from '@/lib/permissions';
import PhaseBar from '@/components/ai-report/PhaseBar';
import HydrodynamicReviewPanel from '@/components/ai-report/HydrodynamicReviewPanel';
import CoachStudioSnapshot from '@/components/ai-report/CoachStudioSnapshot';
import { AI_PILOT_LOCKED } from '@/lib/aiPilotLock';
import AIInTestingCard from '@/components/ai/AIInTestingCard';

// Derive a display status from finding counts
function getReviewStatus(findings) {
  if (!findings.length) return 'draft';
  const approved = findings.filter(f => f.approval_status === 'approved').length;
  const pending = findings.filter(f => f.approval_status === 'pending').length;
  if (pending === 0 && approved > 0) return 'coach_approved';
  if (approved > 0 || findings.some(f => f.approval_status === 'rejected')) return 'in_review';
  return 'draft';
}

const REVIEW_STATUS_CONFIG = {
  draft:           { label: 'Draft',            color: 'text-muted-foreground bg-secondary border-border', icon: Clock },
  in_review:       { label: 'In Review',         color: 'text-yellow-400 bg-yellow-900/20 border-yellow-700/30', icon: Clock },
  coach_approved:  { label: 'Coach Approved',    color: 'text-green-400 bg-green-900/20 border-green-700/30', icon: CheckCircle2 },
};

const FINAL_REPORT_STATUSES = ['coach_approved', 'finalised', 'published', 'shared'];
const COACH_STUDIO_PHASES = {
  breaststroke: ['streamline', 'pull', 'breath', 'recovery', 'kick_setup', 'kick_drive', 'line_reset'],
  freestyle: ['entry_extension', 'catch_setup', 'pull', 'breathing', 'recovery', 'body_line'],
  backstroke: ['body_line', 'rotation', 'catch_setup', 'pull', 'recovery'],
  butterfly: ['body_wave', 'catch_setup', 'pull', 'breath', 'kick_timing', 'recovery'],
};
const DEFAULT_STUDIO_PHASES = ['streamline', 'body_line', 'catch_setup', 'pull', 'breath', 'kick_setup', 'kick_drive', 'line_reset'];
const COACH_STUDIO_FAULT_TAGS = [
  'body_line',
  'head_lift',
  'wide_knees',
  'rushed_line_reset',
  'dropped_elbow',
  'short_extension',
  'timing_break',
  'low_hips',
  'breath_timing',
  'recovery_timing',
];
const COACH_STUDIO_GUIDED_STEPS = [
  { id: 'video', label: 'Video Review', helper: 'Open fullscreen, slow the clip down, and find the key moment.' },
  { id: 'stamps', label: 'Key Moment Gallery', helper: 'Review, approve, attach, and organise saved key stamps.' },
  { id: 'draw', label: 'Coach Draw', helper: 'Mark the paused frame with coach-created annotations.' },
  { id: 'findings', label: 'Findings + Drills', helper: 'Create or approve findings, then attach cues and drills.' },
  { id: 'summary', label: 'Summary', helper: 'Write the swimmer-facing coaching summary and next focus.' },
  { id: 'finalise', label: 'Finalise + Share', helper: 'Review the report, finalise it, then create a secure share link.' },
];

function labelFromKey(value = '') {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function normaliseFlags(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map(flag => flag.trim()).filter(Boolean);
  return [];
}

function aiPayloadForFinding(finding = {}) {
  return finding?.raw_ai_payload || {};
}

function feedbackBase({ report, video, aiJob, user, finding, action, extras = {} }) {
  const raw = aiPayloadForFinding(finding);
  const rawEvidence = raw.evidence || {};
  const evidenceNote = rawEvidence.evidence_note
    || raw.measurement_summary
    || finding?.measurement_summary
    || null;

  return {
    club_id: report?.club_id,
    report_id: report?.id,
    finding_id: finding?.id || null,
    video_upload_id: report?.video_upload_id || finding?.video_upload_id || null,
    ai_job_id: report?.ai_processing_job_id || aiJob?.id || null,
    coach_id: user?.id || null,
    stroke: raw.stroke || video?.stroke_type || report?.stroke_type || null,
    phase: raw.phase || finding?.phase || finding?.stroke_phase || null,
    fault_tag: raw.fault_tag || finding?.fault_tag || null,
    ai_confidence: raw.confidence || null,
    ai_confidence_score: finding?.confidence_score ?? finding?.ai_confidence ?? raw.confidence_score ?? raw.ai_confidence ?? null,
    ai_evidence_note: evidenceNote,
    ai_finding_title: raw.finding_title || finding?.finding_name || null,
    ai_finding_description: raw.finding_description || finding?.observation || finding?.coach_sees || null,
    coach_action: action,
    quality_flags: normaliseFlags(aiJob?.quality_flags),
    ...extras,
  };
}

function asQualityFlags(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map(flag => flag.trim()).filter(Boolean);
  return [];
}

function formatDetectionRatio(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'Not provided';
  return `${Math.round(numeric * 100)}%`;
}

function qualityGateMeta(report, job) {
  const summary = job?.callback_summary || {};
  if (summary.quality_gate_passed === true || (report?.analysis_mode === 'real_pose' && report?.real_pose_detected)) {
    return {
      label: 'Coach-grade evidence',
      className: 'bg-green-50 text-green-700 border-green-200',
      detail: 'Pose evidence passed the current Swim Sight quality gate. Findings are still draft until coach-approved.',
    };
  }
  if (job?.status === 'error' || report?.analysis_mode === 'error') {
    return {
      label: 'Processing failed',
      className: 'bg-red-50 text-red-700 border-red-200',
      detail: 'No AI findings should be used. Complete a manual coach review or retry with clearer footage.',
    };
  }
  return {
    label: 'Manual review required',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    detail: 'Evidence did not meet the coach-grade threshold for draft AI findings. Add only verified coach observations.',
  };
}

function CoachStudioGuidedNav({
  activeStep,
  onStepChange,
  completion,
  onBack,
  onNext,
  canGoBack,
  canGoNext,
}) {
  const current = COACH_STUDIO_GUIDED_STEPS.find(step => step.id === activeStep) || COACH_STUDIO_GUIDED_STEPS[0];
  const completeCount = Object.values(completion).filter(Boolean).length;
  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-primary font-bold">Coach Studio workflow</div>
          <h2 className="text-base font-bold text-foreground">{current.label}</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{current.helper}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-shrink-0">
          <Button size="sm" variant="outline" className="h-11 text-xs sm:h-10" onClick={onBack} disabled={!canGoBack}>
            Back
          </Button>
          <Button size="sm" className="h-11 text-xs bg-primary text-primary-foreground sm:h-10" onClick={onNext} disabled={!canGoNext}>
            Next
          </Button>
        </div>
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 xl:grid-cols-6">
        {COACH_STUDIO_GUIDED_STEPS.map((step, index) => {
          const complete = completion[step.id];
          const active = activeStep === step.id;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepChange(step.id)}
              className={`min-w-[9.5rem] text-left p-3 rounded-lg border transition-colors md:min-w-0 ${
                active
                  ? 'bg-primary/10 border-primary/30 text-foreground'
                  : complete
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-secondary/30 border-border text-muted-foreground hover:border-primary/30'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Step {index + 1}</span>
                {complete && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
              </div>
              <div className="text-xs font-semibold mt-1 leading-5">{step.label}</div>
            </button>
          );
        })}
      </div>
      <div className="text-[10px] text-muted-foreground">
        {completeCount} of {COACH_STUDIO_GUIDED_STEPS.length} review steps have progress. Use this as a guide, not a hard gate.
      </div>
    </div>
  );
}

// Client-side capped-retry tuning for worker_acceptance_delayed jobs (Option B).
const AUTO_RETRY_MAX = 2;
const AUTO_RETRY_BACKOFF_MS = 90 * 1000;

export default function AIReportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { club, memberRole } = useClubContext();
  const { user } = useAuth();

  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get('report_id');
  const studioParam = urlParams.get('studio');

  const [finalising, setFinalising] = useState(false);
  const [showQualityGate, setShowQualityGate] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signedVideoUrl, setSignedVideoUrl] = useState('');
  const [signedVideoError, setSignedVideoError] = useState('');
  const [coachSummary, setCoachSummary] = useState('');
  const [nextFocus, setNextFocus] = useState('');
  const [manualObservation, setManualObservation] = useState('');
  const [manualPhase, setManualPhase] = useState('');
  const [manualSeverity, setManualSeverity] = useState('medium');
  const [manualWhy, setManualWhy] = useState('');
  const [manualCue, setManualCue] = useState('');
  const [manualDrill, setManualDrill] = useState('');
  const [manualNextFocus, setManualNextFocus] = useState('');
  const [manualCoachNotes, setManualCoachNotes] = useState('');
  const [manualTimestamp, setManualTimestamp] = useState(null);
  const [manualFaultTag, setManualFaultTag] = useState('');
  const [manualLinkedDrill, setManualLinkedDrill] = useState(null);
  const [coachStudioStep, setCoachStudioStep] = useState('video');
  const [pendingKeyStampLinkId, setPendingKeyStampLinkId] = useState(null);
  const [studioSeekRequest, setStudioSeekRequest] = useState(null);
  const [studioDrawRequest, setStudioDrawRequest] = useState(null);
  const [cancellingAI, setCancellingAI] = useState(false);
  const [cancelAIMessage, setCancelAIMessage] = useState('');

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Determine coach role
  const canEdit = isCoachAppRole(memberRole) || user?.role === 'admin';

  // Poll report/findings only while an AI job is actually running. During manual review
  // the coach's own mutations invalidate these queries, so background polling just churns
  // the page (and battery on iPad). The ref is synced from isAIJobActive below.
  const activeAIJobRef = useRef(false);

  const { data: reportArr = [], isLoading: loadingReport } = useQuery({
    queryKey: ['ai-report', reportId],
    queryFn: () => entities.Report.filter({ id: reportId }),
    enabled: !!reportId,
    staleTime: 15 * 1000,
    refetchInterval: () => (activeAIJobRef.current ? 15 * 1000 : false),
    // Global default is refetchOnWindowFocus:false — with idle polling off, tab-return is
    // the only refresh trigger for changes made elsewhere (other tab/device, AI re-trigger).
    refetchOnWindowFocus: true,
  });
  const report = reportArr[0];

  const { data: findings = [], isLoading: loadingFindings } = useQuery({
    queryKey: ['ai-findings', reportId],
    queryFn: () => entities.Finding.filter({ report_id: reportId }, '-created_date', 50),
    enabled: !!reportId,
    staleTime: 15 * 1000,
    refetchInterval: () => (activeAIJobRef.current ? 15 * 1000 : false),
    refetchOnWindowFocus: true,
  });

  const { data: keyFrames = [] } = useQuery({
    queryKey: ['ai-keyframes', reportId],
    queryFn: () => entities.KeyFrame.filter({ report_id: reportId }, 'timestamp_seconds', 50),
    enabled: !!reportId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: videoAnnotations = [] } = useQuery({
    queryKey: ['video-annotations', reportId, report?.video_upload_id],
    queryFn: () => entities.VideoAnnotation.filter({ report_id: reportId }, 'timestamp_seconds', 100),
    enabled: !!reportId && !!report?.video_upload_id,
    staleTime: 30 * 1000,
  });

  const { data: swimmerArr = [] } = useQuery({
    queryKey: ['swimmer-for-report', report?.swimmer_id],
    queryFn: () => entities.Swimmer.filter({ id: report.swimmer_id }),
    enabled: !!report?.swimmer_id,
    staleTime: 10 * 60 * 1000,
  });
  const swimmer = swimmerArr[0];
  const { data: consentResponse, isError: consentUnavailable } = useQuery({
    queryKey: ['consent-for-report', report?.swimmer_id],
    queryFn: () => functions.getSwimmerConsent(report.swimmer_id),
    enabled: !!report?.swimmer_id,
    retry: false,
    staleTime: 60 * 1000,
  });
  const consentRecord = consentResponse?.data?.consent_record || null;
  const consentState = consentUnavailable || !consentRecord
    ? 'unknown'
    : consentRecord.is_minor === true && consentRecord.consent_status !== 'granted'
      ? 'blocked'
      : 'ready';


  const { data: videoArr = [] } = useQuery({
    queryKey: ['video-for-report', report?.video_upload_id],
    queryFn: () => entities.VideoUpload.filter({ id: report.video_upload_id }),
    enabled: !!report?.video_upload_id,
    staleTime: 10 * 60 * 1000,
  });
  const video = videoArr[0];
  const strokeKey = String(video?.stroke_type || report?.stroke_type || '').toLowerCase();
  const studioPhases = COACH_STUDIO_PHASES[strokeKey] || DEFAULT_STUDIO_PHASES;

  const { data: jobArr = [] } = useQuery({
    queryKey: ['ai-job-for-report', report?.ai_processing_job_id],
    queryFn: () => entities.AIProcessingJob.filter({ id: report.ai_processing_job_id }),
    enabled: !!report?.ai_processing_job_id,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true, // refresh live AI job status when the coach returns to the tab
    // Fast while the job runs; slow heartbeat otherwise (job state changes only via triggers).
    refetchInterval: () => (activeAIJobRef.current ? 10 * 1000 : 60 * 1000),
  });
  const aiJob = jobArr[0] || null;
  const qualityMeta = qualityGateMeta(report, aiJob);

  // ── Client-side capped retry for worker_acceptance_delayed jobs (Option B) ──
  // When the app aborts waiting for the worker to accept (typically a Render cold
  // start), the job is requeued as worker_acceptance_delayed. While the coach is
  // on this page we re-nudge the EXISTING dispatch a bounded number of times so a
  // now-warm worker can pick it up. Bounded + backed off so it cannot spam the
  // worker; manual Coach Studio review stays available the whole time. No new
  // endpoint, no cron, no schema change — reuses functions.dispatchNextAIJob.
  const [autoRetryCount, setAutoRetryCount] = useState(0);
  const autoRetryTimerRef = useRef(null);

  const retryClubId = aiJob?.club_id || report?.club_id || club?.id || null;
  const isWorkerWakingUp =
    aiJob?.stage === 'worker_acceptance_delayed' && aiJob?.queue_status === 'queued';
  const autoRetryExhausted =
    autoRetryCount >= AUTO_RETRY_MAX
    || aiJob?.retryable === false
    || Number(aiJob?.attempt_count ?? 1) >= Number(aiJob?.max_attempts ?? 3);
  // Never re-dispatch to the Render worker while the manual-first pilot lock is on.
  const delayedRetryEligible = !AI_PILOT_LOCKED && isWorkerWakingUp && !autoRetryExhausted && !!retryClubId;

  useEffect(() => {
    if (!delayedRetryEligible) return undefined;
    if (autoRetryTimerRef.current) return undefined;
    autoRetryTimerRef.current = setTimeout(() => {
      autoRetryTimerRef.current = null;
      // Fire-and-forget: manual review stays available regardless of outcome.
      functions.dispatchNextAIJob({ club_id: retryClubId })
        .catch(() => {})
        .finally(() => {
          setAutoRetryCount((count) => count + 1);
          queryClient.invalidateQueries({
            queryKey: ['ai-job-for-report', report?.ai_processing_job_id],
          });
        });
    }, AUTO_RETRY_BACKOFF_MS);
    return () => {
      if (autoRetryTimerRef.current) {
        clearTimeout(autoRetryTimerRef.current);
        autoRetryTimerRef.current = null;
      }
    };
  }, [delayedRetryEligible, retryClubId, report?.ai_processing_job_id, queryClient, autoRetryCount]);

  const logFeedback = async (finding, action, extras = {}) => {
    if (!report?.id || !report?.club_id) return;
    try {
      await entities.AIFindingFeedback.create(feedbackBase({
        report,
        video,
        aiJob,
        user,
        finding,
        action,
        extras,
      }));
      queryClient.invalidateQueries({ queryKey: ['ai-calibration', club?.id] });
      queryClient.invalidateQueries({ queryKey: ['ai-job-feedback', club?.id] });
    } catch (error) {
      console.warn('AI calibration feedback was not saved; coach workflow continued.', error?.message || error);
    }
  };

  const { data: sharedLinks = [] } = useQuery({
    queryKey: ['shared-links', report?.id],
    queryFn: () => entities.SharedReportLink.filter({ report_id: report.id }, '-created_date', 10),
    enabled: !!report?.id,
    staleTime: 60 * 1000,
  });

  const { data: drillOptions = [] } = useQuery({
    queryKey: ['report-drill-options', club?.id],
    queryFn: async () => {
      const defaults = getDefaultDrills();
      try {
        const shared = await entities.Drill.filter({ visibility: 'shared_default', is_active: true }, 'stroke', 250);
        const clubDrills = club?.id
          ? await entities.Drill.filter({ club_id: club.id, is_active: true }, 'stroke', 100)
          : [];
        const byId = new Map(defaults.map(drill => [drill.id, drill]));
        [...shared, ...clubDrills].forEach(drill => {
          if (drill?.id) byId.set(drill.id, { ...byId.get(drill.id), ...drill });
        });
        return Array.from(byId.values()).filter(drill => drill.is_active !== false);
      } catch {
        return defaults;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
  const manualDraftFinding = {
    finding_name: manualObservation || manualFaultTag || manualPhase,
    observation: manualObservation,
    coach_sees: manualObservation,
    why_it_matters: manualWhy,
    correction_cue: manualCue,
    next_focus: manualNextFocus,
    stroke_phase: manualPhase,
    phase: manualPhase,
    fault_tag: manualFaultTag,
  };
  const manualDrillSuggestions = suggestDrillsForFinding(
    drillOptions,
    manualDraftFinding,
    video?.stroke_type || report?.stroke_type,
    4
  );

  const dragAnalysisItems = [];

  const approveFinding = useMutation({
    mutationFn: async (f) => {
      const updated = await entities.Finding.update(f.id, { approval_status: 'approved' });
      await logFeedback(updated, 'approved', {
        coach_final_observation: updated.observation || updated.coach_sees || null,
        coach_final_cue: updated.correction_cue || updated.cue || null,
        coach_final_drill: updated.drill || null,
      });
      return updated;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-findings', reportId] }),
  });

  const rejectFinding = useMutation({
    mutationFn: async ({ finding, reason, note }) => {
      const updated = await entities.Finding.update(finding.id, {
        approval_status: 'rejected',
        coach_notes: note || finding.coach_notes || null,
      });
      await logFeedback(updated, 'rejected', {
        coach_rejection_reason: reason || 'other',
        coach_edit_summary: note || null,
      });
      return updated;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-findings', reportId] }),
  });

  const updateCue = useMutation({
    mutationFn: async ({ finding, cue }) => {
      const originalCue = finding.cue || finding.correction_cue || '';
      const updated = await entities.Finding.update(finding.id, { cue });
      await logFeedback(updated, 'edited', {
        coach_edit_summary: `Correction cue changed${originalCue ? ` from "${originalCue}"` : ''}.`,
        coach_final_observation: updated.observation || updated.coach_sees || null,
        coach_final_cue: cue,
        coach_final_drill: updated.drill || null,
      });
      return updated;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-findings', reportId] }),
  });

  const updateNote = useMutation({
    mutationFn: async ({ finding, note }) => {
      const updated = await entities.Finding.update(finding.id, { next_focus: note });
      await logFeedback(updated, 'edited', {
        coach_edit_summary: 'Next focus / coach note changed.',
        coach_final_observation: updated.observation || updated.coach_sees || null,
        coach_final_cue: updated.correction_cue || updated.cue || null,
        coach_final_drill: updated.drill || null,
      });
      return updated;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-findings', reportId] }),
  });

  const assignDrill = useMutation({
    mutationFn: async ({ finding, drill }) => {
      const updated = await entities.Finding.update(finding.id, {
        drill: drill.title,
        linked_drill_id: drill.id,
        linked_drill_title: drill.title,
        linked_drill_summary: drillSummary(drill),
      });
      await logFeedback(updated, 'edited', {
        coach_edit_summary: `Drill assigned: ${drill.title}`,
        coach_final_observation: updated.observation || updated.coach_sees || null,
        coach_final_cue: updated.correction_cue || updated.cue || null,
        coach_final_drill: drill.title,
      });
      return updated;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-findings', reportId] }),
  });

  // Full finding-details editor (fullscreen Coach Studio step 2). Writes CONTENT
  // fields only — approval_status is deliberately never touched here, so the
  // coach-approval flow is unchanged. Tags live in raw_ai_payload (merged, never
  // public: the sanitizer strips the whole payload).
  const updateFindingDetails = useMutation({
    mutationFn: async ({ finding, details }) => {
      const mergedPayload = {
        ...(finding.raw_ai_payload || {}),
        ...(details.faultTags !== undefined
          ? { fault_tags: details.faultTags, fault_tag: details.faultTags?.[0] || null }
          : {}),
      };
      const updated = await entities.Finding.update(finding.id, {
        ...(details.observation !== undefined ? { observation: details.observation } : {}),
        ...(details.cue !== undefined ? { cue: details.cue } : {}),
        ...(details.severity !== undefined ? { severity: details.severity } : {}),
        ...(details.phase !== undefined ? { phase: details.phase } : {}),
        ...(details.coachNotes !== undefined ? { coach_notes: details.coachNotes } : {}),
        ...(details.nextFocus !== undefined ? { next_focus: details.nextFocus } : {}),
        ...(details.drill !== undefined ? { drill: details.drill } : {}),
        ...(details.linkedDrillId !== undefined ? { linked_drill_id: details.linkedDrillId } : {}),
        ...(details.linkedDrillTitle !== undefined ? { linked_drill_title: details.linkedDrillTitle } : {}),
        ...(details.linkedDrillSummary !== undefined ? { linked_drill_summary: details.linkedDrillSummary } : {}),
        ...(details.faultTags !== undefined || details.extraDrills !== undefined
          ? {
            raw_ai_payload: {
              ...mergedPayload,
              ...(details.extraDrills !== undefined ? { extra_drills: details.extraDrills } : {}),
            },
          }
          : {}),
      });
      await logFeedback(updated, 'edited', {
        coach_edit_summary: 'Finding details edited in Coach Studio.',
        coach_final_observation: updated.observation || updated.coach_sees || null,
        coach_final_cue: updated.correction_cue || updated.cue || null,
        coach_final_drill: updated.drill || null,
      });
      return updated;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-findings', reportId] }),
  });

  const createAnnotation = useMutation({
    mutationFn: ({
      drawingData,
      timestampSeconds,
      videoFrameTimeLabel,
      title,
      coachNote,
      includeInReport,
      videoWidth,
      videoHeight,
      findingId,
      thumbnailDataUrl,
    }) => entities.VideoAnnotation.create({
      club_id: report.club_id,
      report_id: report.id,
      video_upload_id: report.video_upload_id,
      swimmer_id: report.swimmer_id,
      finding_id: findingId || null,
      created_by: user?.id,
      annotation_type: drawingData.shapes?.some(shape => shape.tool === 'body_line') ? 'body_line' : 'coach_draw',
      timestamp_seconds: timestampSeconds,
      video_frame_time_label: videoFrameTimeLabel,
      frame_label: videoFrameTimeLabel,
      canvas_width: drawingData.canvas_width,
      canvas_height: drawingData.canvas_height,
      video_width: videoWidth,
      video_height: videoHeight,
      drawing_data: drawingData,
      thumbnail_data_url: thumbnailDataUrl || null,
      title,
      coach_note: coachNote || null,
      include_in_report: includeInReport,
      is_public: includeInReport,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['video-annotations', reportId, report?.video_upload_id] }),
  });

  const createStudioMarker = useMutation({
    mutationFn: ({ timestampSeconds, videoFrameTimeLabel, approxFrame, title, coachNote, includeInReport, thumbnailDataUrl }) => entities.VideoAnnotation.create({
      club_id: report.club_id,
      report_id: report.id,
      video_upload_id: report.video_upload_id,
      swimmer_id: report.swimmer_id,
      created_by: user?.id,
      annotation_type: 'key_frame',
      timestamp_seconds: timestampSeconds,
      video_frame_time_label: videoFrameTimeLabel,
      frame_label: approxFrame != null ? `${videoFrameTimeLabel} · Approx frame ~${approxFrame}` : videoFrameTimeLabel,
      canvas_width: 1280,
      canvas_height: 720,
      drawing_data: {
        version: 1,
        type: 'key_frame_marker',
        phase: manualPhase || null,
        approx_frame: approxFrame ?? null,
        shapes: [
          {
            tool: 'text',
            text: title || 'Key frame',
            color: '#22d3ee',
            size: 5,
            points: [{ x: 72, y: 120 }],
          },
          ...(manualPhase ? [{
            tool: 'text',
            text: labelFromKey(manualPhase),
            color: '#ffffff',
            size: 4,
            points: [{ x: 72, y: 178 }],
          }] : []),
        ],
      },
      thumbnail_data_url: thumbnailDataUrl || null,
      title: title || 'Key frame',
      coach_note: coachNote || null,
      include_in_report: includeInReport,
      is_public: includeInReport,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['video-annotations', reportId, report?.video_upload_id] }),
  });

  const updateAnnotation = useMutation({
    mutationFn: ({ annotation, patch }) => entities.VideoAnnotation.update(annotation.id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['video-annotations', reportId, report?.video_upload_id] }),
  });

  const deleteAnnotation = useMutation({
    mutationFn: (annotation) => entities.VideoAnnotation.delete(annotation.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['video-annotations', reportId, report?.video_upload_id] }),
  });

  const updateReportSummary = useMutation({
    mutationFn: () => entities.Report.update(reportId, {
      coach_summary: coachSummary,
      next_focus: nextFocus,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-report', reportId] }),
  });

  // Coach Studio step 3 (Drills & Comments) save. Swimmer Feedback = coach_summary
  // (exactly what the shared report shows). Private Notes live inside the report's
  // review_context jsonb (no schema change) — MERGED with the existing context so the
  // analysis config keys are never clobbered. The public token endpoint's column
  // allowlist excludes review_context entirely, so private notes can never leak.
  const updateReportComments = useMutation({
    mutationFn: ({ swimmerFeedback, privateNotes: notes }) => entities.Report.update(reportId, {
      ...(swimmerFeedback !== undefined ? { coach_summary: swimmerFeedback } : {}),
      review_context: {
        ...(report?.review_context || {}),
        private_coach_notes: notes ?? '',
      },
    }),
    onSuccess: (_updated, variables) => {
      // Keep the page-level summary state in sync — finalise writes coach_summary
      // from page state, so a stale value here would clobber the fullscreen save.
      if (variables?.swimmerFeedback !== undefined) setCoachSummary(variables.swimmerFeedback);
      return queryClient.invalidateQueries({ queryKey: ['ai-report', reportId] });
    },
  });

  // Accepts an optional explicit payload (used by the fullscreen workspace to save a
  // coach finding inline). With no override it reads the page form state exactly as before.
  const createManualFinding = useMutation({
    mutationFn: (override) => {
      const o = override || {};
      const linkedDrill = o.linkedDrill !== undefined ? o.linkedDrill : manualLinkedDrill;
      const drillTitle = o.drill !== undefined ? o.drill : manualDrill;
      const timestampValue = o.timestamp !== undefined ? o.timestamp : manualTimestamp;
      // Explicit title/summary let a coach-written custom drill be stored on the finding
      // (no library object). Falls back to the selected library drill when not provided.
      const linkedDrillTitle = o.linkedDrillTitle !== undefined ? o.linkedDrillTitle : (linkedDrill?.title || drillTitle);
      const linkedDrillSummary = o.linkedDrillSummary !== undefined ? o.linkedDrillSummary : (linkedDrill ? drillSummary(linkedDrill) : null);
      return entities.Finding.create({
        club_id: report.club_id,
        report_id: report.id,
        swimmer_id: report.swimmer_id,
        video_upload_id: report.video_upload_id,
        source: 'coach',
        approval_status: 'approved',
        severity: o.severity ?? manualSeverity,
        stroke_phase: (o.phase !== undefined ? o.phase : manualPhase) || null,
        timestamp_seconds: timestampValue,
        observation: o.observation !== undefined ? o.observation : manualObservation,
        why_it_matters: (o.why ?? manualWhy) || null,
        correction_cue: o.cue ?? manualCue,
        drill: drillTitle || null,
        linked_drill_id: linkedDrill?.id || null,
        linked_drill_title: linkedDrillTitle || null,
        linked_drill_summary: linkedDrillSummary || null,
        next_focus: o.nextFocus ?? manualNextFocus,
        coach_notes: (o.coachNotes ?? manualCoachNotes) || null,
        raw_ai_payload: {
          source: 'coach_studio',
          fault_tag: (o.faultTag ?? manualFaultTag) || null,
          timestamp_seconds: timestampValue,
          // Additional (secondary) drills — kept here so a coach can attach several drills
          // to one finding with no schema change. The public sanitizer extracts only the
          // safe title/summary of each; the rest of raw_ai_payload is never exposed.
          ...(Array.isArray(o.extraDrills) && o.extraDrills.length ? { extra_drills: o.extraDrills } : {}),
        },
        created_by: user?.id,
      });
    },
    onSuccess: async (createdFinding, override) => {
      const linkId = override?.keyStampLinkId ?? pendingKeyStampLinkId;
      if (linkId) {
        try {
          await entities.VideoAnnotation.update(linkId, {
            finding_id: createdFinding.id,
            include_in_report: true,
            is_public: true,
          });
        } catch (error) {
          console.warn('Key stamp link was not saved; finding was still created.', error?.message || error);
        }
      }
      await logFeedback(createdFinding, 'manual_added', {
        phase: createdFinding.stroke_phase || null,
        fault_tag: createdFinding.fault_tag || null,
        coach_final_observation: createdFinding.observation || null,
        coach_final_cue: createdFinding.correction_cue || null,
        coach_final_drill: createdFinding.drill || null,
        coach_edit_summary: createdFinding.coach_notes || null,
      });
      // Only clear the page form when the coach used it (no override). Inline fullscreen
      // saves keep their own state in the child component.
      if (!override) {
        setManualObservation('');
        setManualPhase('');
        setManualSeverity('medium');
        setManualWhy('');
        setManualCue('');
        setManualDrill('');
        setManualNextFocus('');
        setManualCoachNotes('');
        setManualTimestamp(null);
        setManualFaultTag('');
        setManualLinkedDrill(null);
      }
      setPendingKeyStampLinkId(null);
      queryClient.invalidateQueries({ queryKey: ['ai-findings', reportId] });
      queryClient.invalidateQueries({ queryKey: ['video-annotations', reportId, report?.video_upload_id] });
    },
  });

  // Map a fullscreen phase label (e.g. "Catch setup") to the studio-phase key
  // (e.g. "catch_setup"); fall back to the raw label so a finding is never phase-less.
  const mapPhaseLabelToKey = (phaseLabel) => {
    const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');
    const wanted = norm(phaseLabel);
    if (!wanted) return '';
    return studioPhases.find(k => norm(labelFromKey(k)) === wanted || norm(k) === wanted)
      || studioPhases.find(k => norm(labelFromKey(k)).includes(wanted) || wanted.includes(norm(k)))
      || phaseLabel;
  };

  // Save a coach finding directly from the fullscreen workspace, carrying the timestamp,
  // phase, note, and one or more selected drills — without leaving fullscreen. The first
  // drill is the Primary Drill (stored on linked_drill_*); the rest become Additional
  // Drills on raw_ai_payload.extra_drills (no schema change).
  const handleCreateFindingFromFullscreen = ({ timestampSeconds, phaseLabel, note, cue, drills = [], keyStampLinkId, severity, coachNotes }) => {
    const phaseKey = mapPhaseLabelToKey(phaseLabel);
    const list = (Array.isArray(drills) ? drills : []).filter(drill => drill && drill.title);
    const primary = list[0] || null;
    const additional = list.slice(1);
    const override = {
      timestamp: timestampSeconds ?? null,
      phase: phaseKey || null,
      observation: (note || '').trim() || (phaseKey ? `Coach marked ${labelFromKey(phaseKey)} for review.` : '') || 'Coach note',
      keyStampLinkId: keyStampLinkId || null,
      ...(severity ? { severity } : {}),
      ...(coachNotes !== undefined ? { coachNotes } : {}),
      drill: primary?.title || '',
      // Library drills keep their id link; custom (coach-written) drills have no library id.
      linkedDrill: primary && !primary.custom && primary.id ? { id: primary.id, title: primary.title } : null,
      linkedDrillTitle: primary?.title || null,
      linkedDrillSummary: primary?.summary || null,
      extraDrills: additional.map(drill => ({
        title: drill.title,
        summary: drill.summary || null,
        cue: drill.cue || null,
      })),
    };
    if (primary?.cue) override.cue = primary.cue;
    if (primary?.why) override.nextFocus = primary.why;
    // The coach's explicit cue takes precedence over a drill's built-in cue.
    if (cue && cue.trim()) override.cue = cue.trim();
    return createManualFinding.mutateAsync(override);
  };

  useEffect(() => {
    if (!report) return;
    setCoachSummary(report.coach_summary || '');
    setNextFocus(report.next_focus || '');
  }, [report?.id]);

  useEffect(() => {
    let cancelled = false;
    setSignedVideoUrl('');
    setSignedVideoError('');
    if (!video?.id) return () => { cancelled = true; };

    functions.getSignedVideoUrl(video.id)
      .then((res) => {
        if (!cancelled) setSignedVideoUrl(res.data?.signed_read_url || res.data?.signed_url || '');
      })
      .catch((err) => {
        if (!cancelled) setSignedVideoError(err?.message || 'Could not load private video preview.');
      });

    return () => { cancelled = true; };
  }, [video?.id]);

  const handleFinaliseConfirmed = async () => {
    setFinalising(true);
    setShowQualityGate(false);
    await entities.Report.update(reportId, {
      status: 'finalised',
      finalised_at: new Date().toISOString(),
      coach_summary: coachSummary,
      next_focus: nextFocus,
    });
    const aiFindings = findings.filter(f => f.source === 'ai');
    await logFeedback(null, 'finalised', {
      coach_edit_summary: [
        `approved=${findings.filter(f => f.approval_status === 'approved').length}`,
        `edited=${findings.filter(f => f.approval_status === 'edited').length}`,
        `rejected=${findings.filter(f => f.approval_status === 'rejected').length}`,
        `manual_added=${findings.filter(f => f.source !== 'ai').length}`,
        `ai_total=${aiFindings.length}`,
      ].join('; '),
      coach_final_observation: coachSummary || null,
      coach_final_cue: nextFocus || null,
    });
    queryClient.invalidateQueries({ queryKey: ['ai-report', reportId] });
    queryClient.invalidateQueries({ queryKey: ['ai-reports'] });
    setFinalising(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await functions.deleteAIReport(reportId);
    queryClient.invalidateQueries({ queryKey: ['ai-reports'] });
    queryClient.invalidateQueries({ queryKey: ['reports-dashboard'] });
    navigate('/ai-reviews');
  };

  const handleCancelAI = async () => {
    if (!aiJob?.id) return;
    setCancellingAI(true);
    setCancelAIMessage('');
    try {
      const response = await functions.cancelAIReview(aiJob.id);
      setCancelAIMessage(response.data?.message || 'AI cancellation requested. Continue with manual coach review.');
      queryClient.invalidateQueries({ queryKey: ['ai-job-for-report', report?.ai_processing_job_id] });
      queryClient.invalidateQueries({ queryKey: ['video-for-report', report?.video_upload_id] });
    } catch (error) {
      setCancelAIMessage(`${error?.message || 'Cancellation could not be confirmed.'} Continue manual review; no AI result is published without coach approval.`);
    } finally {
      setCancellingAI(false);
    }
  };

  const pendingCount = findings.filter(f => f.approval_status === 'pending').length;
  const approvedCount = findings.filter(f => f.approval_status === 'approved').length;
  const rejectedCount = findings.filter(f => f.approval_status === 'rejected').length;
  const approvedFindings = findings.filter(f => f.approval_status === 'approved');
  // Manual-vs-AI report mode is based on what content is actually IN the report:
  // if any approved finding came from AI, the report shows AI content; otherwise it is
  // a pure coach manual review. Drives the score, wording, and AI disclaimer.
  const reportAiUsed = approvedFindings.some(finding => finding.source === 'ai');
  const reportIsManual = !reportAiUsed;
  const includedAnnotations = videoAnnotations.filter(annotation => annotation.include_in_report && annotation.is_public);
  const keyStampCount = videoAnnotations.filter(annotation => annotation.annotation_type === 'key_frame').length;
  const coachDrawCount = videoAnnotations.filter(annotation => ['coach_draw', 'body_line'].includes(annotation.annotation_type)).length;
  // Saved evidence the coach can link to a finding (phase moments + coach drawings with a
  // captured thumbnail). The picker in the fullscreen workspace uses this list.
  const linkableEvidence = videoAnnotations
    .filter(annotation => ['key_frame', 'coach_draw', 'body_line'].includes(annotation.annotation_type)
      && typeof annotation.thumbnail_data_url === 'string' && annotation.thumbnail_data_url.startsWith('data:image/'))
    .map(annotation => ({
      id: annotation.id,
      kind: annotation.annotation_type === 'key_frame' ? 'moment' : 'drawing',
      seconds: Number(annotation.timestamp_seconds ?? 0) || 0,
      label: annotation.title || annotation.frame_label || (annotation.annotation_type === 'key_frame' ? 'Phase moment' : 'Coach drawing'),
      thumb: annotation.thumbnail_data_url,
    }));

  // Coach drill favourites (club-scoped; owner/admin curate via clubs RLS, all members use).
  const canManageFavourites = isAdminRole(memberRole);
  const [favouriteDrills, setFavouriteDrills] = useState([]);
  useEffect(() => {
    setFavouriteDrills(Array.isArray(club?.favourite_drills) ? club.favourite_drills : []);
  }, [club?.id]);
  const persistFavourites = async (next) => {
    setFavouriteDrills(next); // optimistic
    try { await entities.Club.update(club.id, { favourite_drills: next }); }
    catch (error) { console.warn('Could not save drill favourites.', error?.message || error); }
  };
  const toggleLibraryFavourite = (entry) => {
    if (!entry?.id) return;
    const exists = favouriteDrills.some(fav => fav.type === 'library' && fav.id === entry.id);
    persistFavourites(exists
      ? favouriteDrills.filter(fav => !(fav.type === 'library' && fav.id === entry.id))
      : [...favouriteDrills, { type: 'library', id: entry.id }]);
  };
  const saveCustomFavourite = (custom) => {
    const title = (custom?.title || '').trim();
    if (!title) return;
    const norm = title.toLowerCase();
    if (favouriteDrills.some(fav => fav.type === 'custom' && String(fav.title || '').toLowerCase() === norm)) return;
    persistFavourites([...favouriteDrills, { type: 'custom', title, summary: (custom.summary || '').trim(), cue: (custom.cue || '').trim() }]);
  };

  const activeSharedLinks = sharedLinks.filter(link => link.status === 'active');
  const isReportFinalised = FINAL_REPORT_STATUSES.includes(report?.status);
  // Reopen a finalised/shared report for editing (coach role only). Pauses the public link
  // via the disable endpoint and drops the report to an editable status; re-share reactivates
  // the SAME link/token through the share-link endpoint so parents keep the same URL.
  const canReopen = canEdit && isReportFinalised;
  const reopenedForEditing = !isReportFinalised && sharedLinks.some(link => link.status === 'disabled');
  const reopenReport = useMutation({
    mutationFn: async () => {
      for (const link of activeSharedLinks) {
        try { await functions.disableSharedReportLink(link.id); } catch (error) { console.warn('Could not pause a share link.', error?.message || error); }
      }
      return entities.Report.update(reportId, { status: 'draft' });
    },
    onSuccess: async () => {
      try { await logFeedback(null, 'reopened', { coach_edit_summary: 'Report reopened for editing; shared link paused.' }); } catch { /* audit is best-effort */ }
      queryClient.invalidateQueries({ queryKey: ['ai-report', reportId] });
      queryClient.invalidateQueries({ queryKey: ['ai-reports'] });
      queryClient.invalidateQueries({ queryKey: ['shared-links', report?.id] });
    },
  });
  const reshareReport = useMutation({
    mutationFn: () => functions.createSharedReportLink(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-report', reportId] });
      queryClient.invalidateQueries({ queryKey: ['ai-reports'] });
      queryClient.invalidateQueries({ queryKey: ['shared-links', report?.id] });
    },
  });
  const isManualReviewReport = report?.analysis_mode === 'error'
    || report?.analysis_mode === 'placeholder'
    || report?.analysis_mode === 'manual_review'
    || report?.real_pose_detected === false;
  // Unified fullscreen Coach Review workspace: AI and manual reports BOTH open the
  // fullscreen workspace by default. Finalised reports keep the normal report/finalise
  // view, and ?studio=0 forces the legacy dashboard/debug view.
  const studioMode = studioParam !== '0';
  // Auto-open the MARKING workspace only for in-review reports. A finalised report opens
  // straight to the fullscreen report-ready panel instead (handled in CoachDrawStudio).
  const autoOpenStudio = studioMode && !isReportFinalised;
  const reviewMode = isManualReviewReport ? 'manual' : 'ai';
  const canFinalise = canEdit && !isReportFinalised && pendingCount === 0;
  const fullscreenShareLink = activeSharedLinks[0]?.token
    ? `${window.location.origin}/shared-report/${activeSharedLinks[0].token}`
    : null;
  const activeAIJobStatuses = ['queued', 'accepted', 'running', 'downloading_video', 'extracting_frames', 'running_pose_detection', 'analysing_stroke', 'generating_outputs', 'callback_sending'];
  const isAIJobActive = activeAIJobStatuses.includes(aiJob?.status) || ['queued', 'dispatching', 'dispatched', 'processing', 'cancel_requested'].includes(aiJob?.queue_status);
  // Keep the polling gate in sync, and refresh report/findings ONCE when a job finishes so
  // the AI results land immediately even though idle polling is off.
  useEffect(() => {
    const wasActive = activeAIJobRef.current;
    activeAIJobRef.current = isAIJobActive;
    if (wasActive && !isAIJobActive) {
      queryClient.invalidateQueries({ queryKey: ['ai-report', reportId] });
      queryClient.invalidateQueries({ queryKey: ['ai-findings', reportId] });
    }
  }, [isAIJobActive, queryClient, reportId]);
  const isAIJobUnavailable = ['error', 'timed_out', 'retry_available', 'cancelled'].includes(aiJob?.status)
    || ['failed', 'timed_out', 'retry_available', 'cancelled'].includes(aiJob?.queue_status)
    || report?.analysis_mode === 'error';
  const coachStudioStepIndex = COACH_STUDIO_GUIDED_STEPS.findIndex(step => step.id === coachStudioStep);
  const currentStudioStepIndex = coachStudioStepIndex >= 0 ? coachStudioStepIndex : 0;
  const studioCompletion = {
    video: Boolean(video?.id),
    stamps: keyStampCount > 0,
    draw: coachDrawCount > 0,
    findings: pendingCount === 0 && findings.length > 0,
    summary: Boolean((coachSummary || report?.coach_summary || '').trim() || (nextFocus || report?.next_focus || '').trim()),
    finalise: Boolean(isReportFinalised && activeSharedLinks.length > 0),
  };
  const goToStudioStep = (stepId) => {
    setCoachStudioStep(stepId);
    window.requestAnimationFrame(() => document.getElementById('section-coach-studio')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const goToNextStudioStep = () => {
    const nextStep = COACH_STUDIO_GUIDED_STEPS[currentStudioStepIndex + 1]?.id;
    if (nextStep) goToStudioStep(nextStep);
  };
  const goToPreviousStudioStep = () => {
    const previousStep = COACH_STUDIO_GUIDED_STEPS[currentStudioStepIndex - 1]?.id;
    if (previousStep) goToStudioStep(previousStep);
  };
  const prepareFindingFromKeyStamp = (stamp) => {
    const phase = stamp?.drawing_data?.phase || manualPhase || studioPhases[0] || '';
    setManualTimestamp(Number(stamp.timestamp_seconds || 0));
    setManualPhase(phase);
    setManualObservation(stamp.title || stamp.coach_note || 'Coach-created key moment');
    setManualWhy(stamp.coach_note || manualWhy);
    setManualFaultTag('');
    setPendingKeyStampLinkId(stamp.id);
    goToStudioStep('findings');
  };
  const openDrawFromKeyStamp = (stamp) => {
    const timestampSeconds = Number(stamp.timestamp_seconds || 0);
    setManualTimestamp(timestampSeconds);
    if (stamp?.drawing_data?.phase && !manualPhase) setManualPhase(stamp.drawing_data.phase);
    setStudioSeekRequest({ timestampSeconds, nonce: Date.now() });
    setStudioDrawRequest({ timestampSeconds, nonce: Date.now() });
    goToStudioStep('draw');
  };

  useEffect(() => {
    if (isReportFinalised) setCoachStudioStep('finalise');
  }, [isReportFinalised]);

  // Derive workflow step for stepper (safe — report may not be loaded yet)
  const workflowStep = !report ? 'ai' : (() => {
    if (isReportFinalised) return 'export';
    if (approvedCount > 0 && pendingCount === 0) return 'final';
    if (approvedCount > 0 || rejectedCount > 0) return 'review';
    return 'ai';
  })();

  const reviewStatus = getReviewStatus(findings);
  const statusCfg = REVIEW_STATUS_CONFIG[reviewStatus];
  const StatusIcon = statusCfg.icon;

  let phaseBreakdown = null;
  if (report?.phase_breakdown) {
    if (typeof report.phase_breakdown === 'string') {
      try { phaseBreakdown = JSON.parse(report.phase_breakdown); } catch { /* noop */ }
    } else if (typeof report.phase_breakdown === 'object') {
      phaseBreakdown = report.phase_breakdown;
    }
  }

  if (!reportId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-3">
        <Brain className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
        <div className="text-sm font-medium text-foreground">No report selected</div>
        <Button size="sm" variant="outline" onClick={() => navigate('/ai-reviews')}>
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Reports
        </Button>
      </div>
    );
  }

  if (loadingReport || loadingFindings) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
        <span className="text-sm text-muted-foreground">Loading review…</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="text-sm text-muted-foreground">Report not found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24 lg:pb-8 bg-transparent">
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── LEFT / MAIN COLUMN ── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Back nav */}
          <Button size="sm" variant="ghost" onClick={() => navigate('/ai-reviews')}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Coach Studio
          </Button>

          {/* Header */}
          <PageHeader
            eyebrow={AI_PILOT_LOCKED ? 'Coach Review' : 'AI Analysis'}
            title={report.title || (AI_PILOT_LOCKED ? 'Coach Review Report' : 'AI Technique Report')}
            subtitle={[swimmer?.name, video?.stroke_type, video?.analysis_type].filter(Boolean).join(' · ')}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
                <StatusIcon className="w-3 h-3" /> {statusCfg.label}
              </span>
              {findings.length > 0 && (
                <span className="text-[10px] text-slate-500">
                  {[
                    pendingCount > 0 && `${pendingCount} pending`,
                    approvedCount > 0 && `${approvedCount} approved`,
                    rejectedCount > 0 && `${rejectedCount} dismissed`,
                  ].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
          </PageHeader>

          {/* Manual direct mode hides the busy AI/dashboard sections — the coach works
              in the fullscreen manual workspace, not this page. */}
          {!studioMode && (
          <>

          <CoachStudioWorkflowPanel
            video={video}
            report={report}
            findings={findings}
            annotations={videoAnnotations}
            aiJob={aiJob}
            sharedLinks={sharedLinks}
            consentState={consentState}
          />

          <AICreditIndicator
            selectedFocusCount={report?.review_context?.analysis_focus_areas?.length || 0}
            selectedOutputCount={report?.review_context?.selected_report_outputs?.length || 0}
            estimatedCredits={report?.review_context?.estimated_credit_cost}
            mode={AI_PILOT_LOCKED || isManualReviewReport ? 'manual' : 'ai'}
            compact
          />

          <CoachStudioSnapshot
            pendingCount={pendingCount}
            approvedCount={approvedCount}
            keyStampCount={keyStampCount}
            coachDrawCount={coachDrawCount}
            isReportFinalised={isReportFinalised}
          />

          <AIReviewTrustSummary
            findings={findings}
            isReportFinalised={isReportFinalised}
          />

          {(isPilotRole(club?._memberRole) || user?.role === 'admin') && (
            <details className="rounded-xl border border-cyan-200 bg-cyan-50/60">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-semibold text-cyan-900">
                <ClipboardCheck className="h-4 w-4" />
                <span className="flex-1">Internal pilot tools</span>
                <span className="text-[10px] font-medium text-cyan-700">Private coach test</span>
              </summary>
              <div className="flex flex-col gap-2 border-t border-cyan-200 p-3 sm:flex-row sm:flex-wrap">
                <Button size="sm" variant="outline" className="min-h-10 text-xs" onClick={() => navigate(`/pilot-launch?report_id=${reportId}`)}>
                  Open Pilot Checklist
                </Button>
                <Button size="sm" variant="outline" className="min-h-10 text-xs" onClick={() => navigate(`/pilot-launch?report_id=${reportId}#feedback`)}>
                  Record Coach Feedback
                </Button>
                <Button size="sm" variant="outline" className="min-h-10 text-xs" onClick={() => navigate(`/pilot-launch?report_id=${reportId}#report-safety`)}>
                  Check Public Report Safety
                </Button>
              </div>
            </details>
          )}

          <div id="section-coach-studio">
            <CoachStudioGuidedNav
              activeStep={coachStudioStep}
              onStepChange={goToStudioStep}
              completion={studioCompletion}
              onBack={goToPreviousStudioStep}
              onNext={goToNextStudioStep}
              canGoBack={currentStudioStepIndex > 0}
              canGoNext={currentStudioStepIndex < COACH_STUDIO_GUIDED_STEPS.length - 1}
            />
          </div>

          <details className="rounded-xl bg-card border border-border overflow-hidden">
            <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold text-foreground flex items-center justify-between">
              {AI_PILOT_LOCKED ? 'Review readiness' : 'AI evidence, quality notes, and report readiness'}
              {!AI_PILOT_LOCKED && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${qualityMeta.className}`}>
                  {qualityMeta.label}
                </span>
              )}
            </summary>
            <div className="p-4 border-t border-border space-y-4">
              <div className="p-3 rounded-xl bg-secondary/40 border border-border">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Workflow status</div>
                <WorkflowStepper currentStep={workflowStep} />
              </div>

              <ReviewChecklist
                report={report}
                video={video}
                findings={findings}
                sharedLinks={sharedLinks}
              />

              {!AI_PILOT_LOCKED && <PoseEvidencePanel report={report} />}

              {AI_PILOT_LOCKED && (
                <AIInTestingCard onOpenCoachStudio={() => goToStudioStep('video')} />
              )}

              {!AI_PILOT_LOCKED && (aiJob || ['placeholder', 'error', 'manual_review', 'unreliable_pose'].includes(report?.analysis_mode)) && (() => {
                // One consolidated coach-facing status card per state (no stacked warnings).
                const analysisMode = report?.analysis_mode;
                const s = aiJob?.status;
                const q = aiJob?.queue_status;
                const stg = aiJob?.stage;
                let card;
                if (s === 'completed' || (analysisMode === 'real_pose' && !isAIJobActive && !isAIJobUnavailable)) {
                  card = {
                    tone: 'success',
                    title: 'AI review ready',
                    text: 'Review the AI-suggested findings before sharing.',
                    primary: { label: 'Review findings', onClick: () => goToStudioStep('findings') },
                  };
                } else if (['manual_review', 'manual_review_recommended', 'unreliable_pose'].includes(s)
                    || ['manual_review', 'unreliable_pose', 'placeholder'].includes(analysisMode)) {
                  card = {
                    tone: 'warning',
                    title: 'Manual review recommended',
                    text: 'The AI could not confidently detect enough body landmarks. Coach review is recommended.',
                    primary: { label: 'Open Coach Studio', onClick: () => goToStudioStep('video') },
                    secondary: { label: 'Upload a clearer clip', onClick: () => navigate('/analyse') },
                  };
                } else if (isWorkerWakingUp) {
                  // Worker acceptance is delayed (usually a cold start). Not a
                  // fatal error: manual review is available and we auto-retry.
                  card = autoRetryExhausted
                    ? {
                      tone: 'warning',
                      title: 'AI worker did not accept the job yet',
                      text: 'You can continue manual coach review and retry AI later. Your video is safe.',
                      primary: { label: 'Open Coach Studio', onClick: () => goToStudioStep('video') },
                      secondary: { label: 'Retry AI review', onClick: () => navigate('/analyse') },
                    }
                    : {
                      tone: 'info',
                      title: 'AI worker is waking up',
                      text: 'You can continue manual coach review now. We’ll retry shortly.',
                      primary: { label: 'Open Coach Studio', onClick: () => goToStudioStep('video') },
                    };
                } else if (analysisMode === 'error' || isAIJobUnavailable
                    || stg === 'worker_acceptance_delayed' || stg === 'callback_failed'
                    || ['error', 'timed_out', 'failed', 'retry_available', 'cancelled'].includes(s)
                    || ['failed', 'timed_out', 'retry_available', 'cancelled'].includes(q)) {
                  card = {
                    tone: 'warning',
                    title: 'AI review did not complete',
                    text: 'The video is still available. You can retry AI review or continue with manual Coach Studio review.',
                    primary: { label: 'Retry AI review', onClick: () => navigate('/analyse') },
                    secondary: { label: 'Open Coach Studio', onClick: () => goToStudioStep('video') },
                  };
                } else if (q === 'queued' && stg !== 'worker_acceptance_delayed') {
                  card = {
                    tone: 'info',
                    title: 'AI review queued',
                    text: 'This video is waiting for the AI worker. You can leave this page and come back later.',
                    primary: { label: 'Open Coach Studio', onClick: () => goToStudioStep('video') },
                    secondary: { label: cancellingAI ? 'Requesting cancellation…' : 'Cancel AI review', onClick: handleCancelAI, disabled: !aiJob?.id || cancellingAI },
                  };
                } else {
                  card = {
                    tone: 'info',
                    title: 'AI review in progress',
                    text: 'The AI worker has accepted this video and is processing it in the background.',
                    primary: { label: 'Continue manual review', onClick: () => goToStudioStep('video') },
                    secondary: { label: 'Refresh status', onClick: () => queryClient.invalidateQueries({ queryKey: ['ai-job-for-report', report?.ai_processing_job_id] }) },
                  };
                }
                const toneClass = card.tone === 'success' ? 'border-green-200 bg-green-50'
                  : card.tone === 'warning' ? 'border-amber-200 bg-amber-50'
                  : 'border-blue-200 bg-blue-50';
                return (
                  <div className={`p-4 rounded-xl border ${toneClass} space-y-3`}>
                    <div>
                      <div className="text-sm font-bold text-foreground">{card.title}</div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{card.text}</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button size="sm" className="min-h-10 flex-1 text-xs bg-primary text-primary-foreground sm:flex-none" onClick={card.primary.onClick} disabled={card.primary.disabled}>
                        {card.primary.label}
                      </Button>
                      {card.secondary && (
                        <Button size="sm" variant="outline" className="min-h-10 flex-1 text-xs sm:flex-none" onClick={card.secondary.onClick} disabled={card.secondary.disabled}>
                          {card.secondary.label}
                        </Button>
                      )}
                    </div>
                    {cancelAIMessage && <p className="text-[10px] leading-4 text-amber-700" role="status">{cancelAIMessage}</p>}
                    {aiJob && (
                      <details className="rounded-lg border border-border bg-secondary/30">
                        <summary className="cursor-pointer list-none px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Technical status
                        </summary>
                        <div className="space-y-2 px-3 pb-3">
                          <div className="grid grid-cols-2 gap-3 text-[10px] sm:grid-cols-4">
                            <div><span className="text-muted-foreground">Stage</span><div className="font-medium text-foreground">{aiJob.stage || 'Complete'}</div></div>
                            <div><span className="text-muted-foreground">Job status</span><div className="font-medium text-foreground">{aiJob.status}</div></div>
                            <div><span className="text-muted-foreground">Pose reliability</span><div className="font-medium text-foreground">{aiJob.pose_reliability || 'Not provided'}</div></div>
                            <div><span className="text-muted-foreground">Detection ratio</span><div className="font-medium text-foreground">{formatDetectionRatio(aiJob.detection_ratio)}</div></div>
                            <div><span className="text-muted-foreground">Frames processed</span><div className="font-medium text-foreground">{aiJob.frame_count_processed ?? 'Not provided'}</div></div>
                          </div>
                          {asQualityFlags(aiJob.quality_flags).length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {asQualityFlags(aiJob.quality_flags).map(flag => (
                                <span key={flag} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700">{flag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                );
              })()}

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-yellow-800 leading-relaxed">
                  AI suggestions are draft evidence only. The shared swimmer report includes coach-approved content.
                </p>
              </div>

              <HydrodynamicReviewPanel report={report} findings={findings} />
            </div>
          </details>
          </>
          )}

          {/* Coach summary / next focus */}
          {coachStudioStep === 'summary' && (
          <div id="section-summary" className="p-4 rounded-xl bg-card border border-border space-y-3">
            <div>
              <div className="text-xs font-bold text-foreground uppercase tracking-wider">Coach Summary</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Written by the coach and included in the final shared report.
              </p>
            </div>
            <Textarea
              value={coachSummary}
              onChange={e => setCoachSummary(e.target.value)}
              disabled={!canEdit || isReportFinalised}
              className="text-xs min-h-[76px]"
              placeholder="Summarise the key technical focus for this swimmer..."
            />
            <Textarea
              value={nextFocus}
              onChange={e => setNextFocus(e.target.value)}
              disabled={!canEdit || isReportFinalised}
              className="text-xs min-h-[56px]"
              placeholder="Next focus for training..."
            />
            {canEdit && !isReportFinalised && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => updateReportSummary.mutate()}
                disabled={updateReportSummary.isPending}
              >
                {updateReportSummary.isPending ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Save className="w-3 h-3 mr-1.5" />}
                Save Summary
              </Button>
            )}
          </div>
          )}

          {/* Video metadata */}
          {video && (studioMode || ['video', 'stamps', 'draw', 'findings'].includes(coachStudioStep)) && (
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              {!studioMode && (
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-primary font-bold">Coach Studio</div>
                  <h2 className="text-sm font-bold text-foreground">Manual video analysis workspace</h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5 max-w-2xl">
                    Slow the video down, capture a timestamp, mark key frames, use Coach Draw, then add coach-created findings from verified video evidence.
                  </p>
                </div>
                {manualTimestamp != null && (
                  <div className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1">
                    Finding timestamp: {Number(manualTimestamp).toFixed(2)}s
                  </div>
                )}
              </div>
              )}
              <CoachDrawStudio
                persistKey={reportId}
                signedVideoUrl={signedVideoUrl}
                signedVideoError={signedVideoError}
                video={video}
                canEdit={canEdit && !isReportFinalised}
                saving={createAnnotation.isPending}
                savingMarker={createStudioMarker.isPending}
                seekRequest={studioSeekRequest}
                drawRequest={studioDrawRequest}
                findings={findings.filter(finding => finding.approval_status !== 'rejected')}
                keyStamps={videoAnnotations.filter(annotation => annotation.annotation_type === 'key_frame')}
                drillOptions={drillOptions}
                autoOpenFullscreen={autoOpenStudio}
                studioMode={studioMode}
                reviewMode={reviewMode}
                reportFinalised={isReportFinalised}
                canFinalise={canFinalise}
                canReopen={canReopen}
                reopenedForEditing={reopenedForEditing}
                onReopen={() => reopenReport.mutateAsync()}
                reopening={reopenReport.isPending}
                onReshare={() => reshareReport.mutateAsync()}
                resharing={reshareReport.isPending}
                linkedEvidenceOptions={linkableEvidence}
                favourites={favouriteDrills}
                canManageFavourites={canManageFavourites}
                onToggleFavourite={toggleLibraryFavourite}
                onSaveCustomFavourite={saveCustomFavourite}
                onFinaliseReport={handleFinaliseConfirmed}
                onPrintReport={() => window.print()}
                shareLink={fullscreenShareLink}
                onReviewAISuggestions={() => navigate(`/ai-review?report_id=${reportId}&studio=0`)}
                onCreateFinding={handleCreateFindingFromFullscreen}
                onBackToAnalyse={() => navigate('/analyse')}
                swimmer={swimmer}
                onFinalise={() => {
                  // Finalising is a deliberate exit from marking — drop studio mode so the
                  // normal finalise/report flow is shown (not the fullscreen workspace).
                  navigate(`/ai-review?report_id=${reportId}&studio=0`);
                  goToStudioStep('finalise');
                }}
                onCaptureTimestamp={(timestampSeconds) => {
                  setManualTimestamp(timestampSeconds);
                  if (!manualPhase && studioPhases.length) setManualPhase(studioPhases[0]);
                }}
                onStartFindingFromMoment={(timestampSeconds, drill, phaseLabel, note) => {
                  setManualTimestamp(timestampSeconds);
                  if (note) setManualObservation(note);
                  // Map the fullscreen phase label (e.g. "Catch setup") to the manual form's
                  // studio-phase key (e.g. "catch_setup") so the select prefills correctly.
                  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');
                  const wanted = norm(phaseLabel);
                  const matchedPhase = wanted
                    ? (studioPhases.find(k => norm(labelFromKey(k)) === wanted || norm(k) === wanted)
                        || studioPhases.find(k => norm(labelFromKey(k)).includes(wanted) || wanted.includes(norm(k))))
                    : null;
                  if (matchedPhase) setManualPhase(matchedPhase);
                  else if (!manualPhase && studioPhases.length) setManualPhase(studioPhases[0]);
                  if (drill) {
                    setManualLinkedDrill(drill);
                    setManualDrill(drill.title || '');
                  }
                  goToStudioStep('findings');
                }}
                onSaveMarker={(payload) => createStudioMarker.mutateAsync(payload)}
                onSaveAnnotation={(payload) => createAnnotation.mutateAsync(payload)}
                report={report}
                annotations={videoAnnotations}
                onUpdateFinding={(finding, details) => updateFindingDetails.mutateAsync({ finding, details })}
                onDeleteFinding={(finding) => rejectFinding.mutateAsync({ finding, reason: 'coach_removed', note: finding.coach_notes })}
                savingFindingDetails={updateFindingDetails.isPending}
                onSaveComments={(payload) => updateReportComments.mutateAsync(payload)}
                savingComments={updateReportComments.isPending}
              />
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Film className="w-3.5 h-3.5" />{video.original_filename || 'Untitled'}</span>
                {video.stroke_type && <span className="flex items-center gap-1.5 text-foreground font-medium"><Activity className="w-3.5 h-3.5" />{video.stroke_type}</span>}
                {video.camera_angle && <span className="flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" />{video.camera_angle}</span>}
                {video.analysis_type && <span>{video.analysis_type}</span>}
                {video.capture_source && (
                  <span>{video.capture_source === 'swimpro_export' ? 'SwimPro-exported footage' : video.capture_source.replace(/_/g, ' ')}</span>
                )}
                {video.created_date && <span>Uploaded {format(new Date(video.created_date), 'dd MMM yyyy')}</span>}
              </div>
            </div>
          )}

          {/* Fullscreen finalise path: printable report kept in the DOM (hidden on screen)
              so View / Print PDF works from the fullscreen report-ready panel without the dashboard. */}
          {studioMode && isReportFinalised && coachStudioStep !== 'finalise' && (
            <div id="printable-report-area" className="hidden print:block print:absolute print:top-0 print:left-0 print:w-full print:h-full print:bg-white print:z-50">
              <PrintableReport
                report={report}
                swimmer={swimmer}
                club={club}
                coachName={user?.full_name || ''}
                video_meta={{
                  stroke_type: video?.stroke_type,
                  analysis_type: video?.analysis_type,
                  camera_angle: video?.camera_angle,
                }}
                findings={approvedFindings}
                annotations={includedAnnotations}
                dragItems={[]}
                share_link={null}
                showPrintButton={false}
                isManualReview={reportIsManual}
                aiUsed={reportAiUsed}
              />
            </div>
          )}

          {['video', 'stamps', 'draw'].includes(coachStudioStep) && (
          <div className="p-3 rounded-xl bg-secondary/40 border border-border text-[10px] text-muted-foreground">
            Coach-created annotations are available for marked frames. Multi-angle review, drag risk, and 3D references remain limited while V1 coach review stays focused on verified video evidence.
          </div>
          )}

          {/* Score + summary */}
          {(report.overall_score != null || report.technical_summary) && (
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              {report.overall_score != null && (
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-primary">{report.overall_score}</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Score</span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground mb-1">Overall Technique Score</div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.round(report.overall_score / 20) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {report.technical_summary && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">AI Technical Summary</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{report.technical_summary}</p>
                </div>
              )}
            </div>
          )}

          {/* Phase breakdown */}
          {phaseBreakdown && typeof phaseBreakdown === 'object' && !Array.isArray(phaseBreakdown) && (
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <div className="text-xs font-bold text-foreground uppercase tracking-wider">Phase Breakdown</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(phaseBreakdown).map(([key, val]) => {
                  const score = typeof val === 'number' ? val : val?.score;
                  if (score == null) return null;
                  return <PhaseBar key={key} label={key} score={score} />;
                })}
              </div>
            </div>
          )}

          {/* Legacy key frames from earlier reports — keep visible only near final review */}
          {coachStudioStep === 'finalise' && keyFrames.length > 0 && (
            <div className="p-4 rounded-xl bg-card border border-border space-y-2">
              <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-primary" /> Key Moments ({keyFrames.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {keyFrames.map((kf) => (
                  <div key={kf.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-secondary/50">
                    <div className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0">
                      {kf.timestamp_seconds?.toFixed(1)}s
                    </div>
                    <div>
                      {kf.label && <div className="text-xs font-medium text-foreground">{kf.label}</div>}
                      {kf.note && <div className="text-[10px] text-muted-foreground">{kf.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation actions */}
          {coachStudioStep === 'finalise' && (
          <ReportNavActions
            report={report}
            swimmer={swimmer}
            video={video}
            onScrollToFindings={() => scrollTo('section-ai-findings')}
            onScrollToFinalReport={() => scrollTo('section-final-report')}
            onScrollToShare={() => scrollTo('section-share')}
            onDownloadPDF={() => window.print()}
          />
          )}

          {['stamps', 'draw', 'finalise'].includes(coachStudioStep) && (
          <div id="section-annotations" className="p-4 rounded-xl bg-card border border-border space-y-3">
            {coachStudioStep === 'stamps' ? (
              <KeyStampGallery
                annotations={videoAnnotations}
                findings={findings}
                canEdit={canEdit && !isReportFinalised}
                onUpdate={(annotation, patch) => updateAnnotation.mutateAsync({ annotation, patch })}
                onDelete={(annotation) => deleteAnnotation.mutateAsync(annotation)}
                onCreateFinding={prepareFindingFromKeyStamp}
                onOpenDraw={openDrawFromKeyStamp}
              />
            ) : (
              <>
                <div>
                  <div className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {coachStudioStep === 'finalise' ? 'Report Key Moments + Coach Annotations' : 'Coach Annotations'}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Coach-created frame marks only. Include selected annotations in final/shared reports when they are public-safe.
                  </p>
                </div>
                {coachStudioStep === 'finalise' && (
                  <KeyStampGallery
                    annotations={videoAnnotations}
                    findings={findings}
                    canEdit={canEdit && !isReportFinalised}
                    onUpdate={(annotation, patch) => updateAnnotation.mutateAsync({ annotation, patch })}
                    onDelete={(annotation) => deleteAnnotation.mutateAsync(annotation)}
                    onCreateFinding={prepareFindingFromKeyStamp}
                    onOpenDraw={openDrawFromKeyStamp}
                  />
                )}
                {coachStudioStep === 'draw' && (
                  <AnnotationTimeline
                    annotations={videoAnnotations.filter(annotation => annotation.annotation_type !== 'key_frame')}
                    findings={findings}
                    canEdit={canEdit && !isReportFinalised}
                    onUpdate={(annotation, patch) => updateAnnotation.mutateAsync({ annotation, patch })}
                    onDelete={(annotation) => deleteAnnotation.mutateAsync(annotation)}
                  />
                )}
              </>
            )}
            {videoAnnotations.length > 0 && includedAnnotations.length === 0 && (
              <div className="p-3 rounded-lg bg-secondary/50 border border-border text-[10px] text-muted-foreground">
                No coach annotations selected for this report yet. Mark a saved frame as “Include in report” when it is ready for the final/shared report.
              </div>
            )}
          </div>
          )}

          {coachStudioStep === 'findings' && canEdit && !isReportFinalised && (
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-start gap-3">
                <Plus className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-foreground uppercase tracking-wider">Add Coach-Created Finding</div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Use the current Coach Studio timestamp, phase, fault tag, cue, and drill to build a report-ready finding.
                  </p>
                </div>
              </div>
              {isManualReviewReport && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800">
                  Pose evidence was unreliable or unavailable. Add real coach observations here; no AI findings are fabricated.
                </div>
              )}
              <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">What happened</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={manualPhase}
                    onChange={e => setManualPhase(e.target.value)}
                    className="h-11 rounded-md border border-input bg-background px-3 py-1 text-sm md:text-xs"
                  >
                    <option value="">Select stroke phase</option>
                    {studioPhases.map(phase => (
                      <option key={phase} value={phase}>{labelFromKey(phase)}</option>
                    ))}
                  </select>
                  <select
                    value={manualSeverity}
                    onChange={e => setManualSeverity(e.target.value)}
                    className="h-11 rounded-md border border-input bg-background px-3 py-1 text-sm md:text-xs"
                  >
                    <option value="low">Low severity</option>
                    <option value="medium">Medium severity</option>
                    <option value="high">High severity</option>
                    <option value="critical">Critical severity</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={manualFaultTag}
                    onChange={e => setManualFaultTag(e.target.value)}
                    className="h-11 rounded-md border border-input bg-background px-3 py-1 text-sm md:text-xs"
                  >
                    <option value="">Optional fault tag</option>
                    {COACH_STUDIO_FAULT_TAGS.map(tag => (
                      <option key={tag} value={tag}>{labelFromKey(tag)}</option>
                    ))}
                  </select>
                  <div className="flex min-h-11 items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs">
                    <span className="text-muted-foreground">Video timestamp</span>
                    <span className="font-mono text-primary">
                      {manualTimestamp != null ? formatTimestamp(Number(manualTimestamp)) : 'Capture from Coach Studio'}
                    </span>
                  </div>
                </div>
                <Textarea
                  value={manualObservation}
                  onChange={e => setManualObservation(e.target.value)}
                  className="text-sm min-h-[92px] bg-background md:text-xs"
                  placeholder="What did the coach verify on video?"
                />
              </div>

              <div className="rounded-xl border border-border bg-white p-4 space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Coaching correction</div>
                <Textarea
                  value={manualWhy}
                  onChange={e => setManualWhy(e.target.value)}
                  className="text-sm min-h-[72px] md:text-xs"
                  placeholder="Why does it matter for the swimmer?"
                />
                <Textarea
                  value={manualCue}
                  onChange={e => setManualCue(e.target.value)}
                  className="text-sm min-h-[72px] md:text-xs"
                  placeholder="What should the swimmer feel in the water?"
                />
                {manualDrillSuggestions.length > 0 && (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 space-y-2">
                    <div className="text-[10px] uppercase tracking-wider text-blue-700 font-bold">
                      Suggested drills from phase/fault
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                      {manualDrillSuggestions.map(drill => (
                        <button
                          key={drill.id}
                          type="button"
                          onClick={() => {
                            setManualDrill(drill.title);
                            setManualLinkedDrill(drill);
                          }}
                          className={`text-left p-3 rounded-lg border transition-colors ${
                            manualLinkedDrill?.id === drill.id || manualDrill === drill.title
                              ? 'bg-green-50 border-green-200 text-green-800'
                              : 'bg-white border-blue-100 text-slate-700 hover:border-primary/40'
                          }`}
                        >
                          <div className="text-[11px] font-semibold">{drill.title}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                            {drillSummary(drill)}
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] text-blue-700/70">
                      Suggestions come from the Drill Library using stroke, phase, fault tag, and coach wording.
                    </p>
                  </div>
                )}
                <Textarea
                  value={manualDrill}
                  onChange={e => {
                    setManualDrill(e.target.value);
                    setManualLinkedDrill(null);
                  }}
                  className="text-sm min-h-[60px] md:text-xs"
                  placeholder="Drill recommendation..."
                />
                <Textarea
                  value={manualNextFocus}
                  onChange={e => setManualNextFocus(e.target.value)}
                  className="text-sm min-h-[72px] md:text-xs"
                  placeholder="Next focus..."
                />
              </div>

              <details className="rounded-xl border border-border bg-secondary/20">
                <summary className="cursor-pointer list-none px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Report options and private note
                </summary>
                <div className="p-3 pt-0 space-y-2">
                  <Textarea
                    value={manualCoachNotes}
                    onChange={e => setManualCoachNotes(e.target.value)}
                    className="text-xs min-h-[48px] bg-background"
                    placeholder="Private coach notes — not shown on shared reports..."
                  />
                </div>
              </details>
              <Button
                size="sm"
                className="h-11 w-full text-xs bg-primary text-primary-foreground sm:w-auto"
                onClick={() => createManualFinding.mutate()}
                disabled={createManualFinding.isPending || !manualObservation.trim()}
              >
                {createManualFinding.isPending ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Plus className="w-3 h-3 mr-1.5" />}
                Add Approved Coach Finding
              </Button>
            </div>
          )}

          {/* AI Suggested Findings */}
          {coachStudioStep === 'findings' && (
          <div id="section-ai-findings" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
                {AI_PILOT_LOCKED ? 'Coach Findings' : 'AI Suggested Findings'} ({findings.length})
              </h2>
              {approvedCount > 0 && (
                <span className="text-[10px] text-green-400 font-medium">{approvedCount} approved</span>
              )}
            </div>

            {findings.length === 0 ? (
              <div className="p-6 rounded-xl bg-card border border-border text-center text-xs text-muted-foreground">
                No findings in this report.
              </div>
            ) : (
              <div className="space-y-2">
                {findings.map((f) => (
                  <AIFindingCard
                    key={f.id}
                    finding={f}
                    canEdit={canEdit}
                    strokeType={video?.stroke_type}
                    onApprove={(finding) => approveFinding.mutate(finding)}
                    onReject={(finding, rejection = {}) => rejectFinding.mutate({ finding, ...rejection })}
                    onUpdateCue={(finding, cue) => updateCue.mutateAsync({ finding, cue })}
                    onUpdateNote={(finding, note) => updateNote.mutateAsync({ finding, note })}
                    onAssignDrill={(finding, drill) => assignDrill.mutateAsync({ finding, drill })}
                    drillOptions={drillOptions}
                    clubId={report?.club_id}
                  />
                ))}
              </div>
            )}
          </div>
          )}

          {/* Approved Coach Report */}
          {coachStudioStep === 'finalise' && (
          <>
          <div id="section-final-report" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <ClipboardCheck className="w-3.5 h-3.5 text-green-400" /> Approved Coach Report
              </h2>
              {approvedFindings.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="h-8 text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download PDF
                </Button>
              )}
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] leading-relaxed text-slate-600">
              Download or print the report as a PDF straight from your browser.
            </div>
            <ApprovedCoachReport
              report={report}
              swimmer={swimmer}
              video={video}
              approvedFindings={approvedFindings}
              annotations={includedAnnotations}
              isManualReview={reportIsManual}
              aiUsed={reportAiUsed}
            />
            {/* Hidden printable version for PDF export */}
            <div id="printable-report-area" className="hidden print:block print:absolute print:top-0 print:left-0 print:w-full print:h-full print:bg-white print:z-50">
              <PrintableReport
                report={report}
                swimmer={swimmer}
                club={club}
                coachName={user?.full_name || ''}
                video_meta={{
                  stroke_type: video?.stroke_type,
                  analysis_type: video?.analysis_type,
                  camera_angle: video?.camera_angle,
                }}
                findings={approvedFindings}
                annotations={includedAnnotations}
                dragItems={dragAnalysisItems.filter(d => d.approval_status === 'approved' && d.included_in_report)}
                share_link={null}
                showPrintButton={false}
                isManualReview={reportIsManual}
                aiUsed={reportAiUsed}
              />
            </div>
          </div>

          {/* Share Report */}
          <div id="section-share" className="space-y-3">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5 text-primary" /> Share Report
            </h2>
            <ShareReportSection
              report={report}
              reportId={reportId}
              swimmer={swimmer}
              canEdit={canEdit}
              isCoachApproved={isReportFinalised}
              findings={findings}
              analysisMode={report.analysis_mode}
            />
          </div>

          {/* Finalise button */}
          {canEdit && !isReportFinalised && pendingCount === 0 && (
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              {(!report.analysis_mode || report.analysis_mode === 'placeholder') && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 leading-relaxed">
                    This report contains <strong>placeholder AI findings</strong>. Finalise only after manually reviewing and correcting every finding.
                  </p>
                </div>
              )}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-semibold text-foreground">Ready to finalise?</div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {approvedCount} approved finding{approvedCount !== 1 ? 's' : ''}.
                    {approvedCount === 0 && ' You can finalise intentionally with no findings after confirming the quality gate.'}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="h-11 w-full text-xs bg-green-700 hover:bg-green-600 text-white sm:w-auto sm:flex-shrink-0"
                  onClick={() => setShowQualityGate(true)}
                  disabled={finalising}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  {finalising ? 'Finalising…' : 'Finalise Coach Report'}
                </Button>
              </div>
            </div>
          )}
          </>
          )}

          {/* Quality gate modal */}
          {showQualityGate && (
            <FinaliseQualityGate
              report={report}
              swimmer={swimmer}
              video={video}
              findings={findings}
              onConfirm={handleFinaliseConfirmed}
              onCancel={() => setShowQualityGate(false)}
              finalising={finalising}
            />
          )}

          {isReportFinalised && (
            <>
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-green-900/10 border border-green-700/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                <p className="text-[10px] text-green-400/80 flex-1">
                  This report has been finalised by a coach.
                  {report.ai_completed_at && ` · Generated ${format(new Date(report.ai_completed_at), 'dd MMM yyyy')}`}
                </p>
              </div>
              {/* Bottom nav — repeat for convenience */}
              <ReportNavActions
                report={report}
                swimmer={swimmer}
                video={video}
                onScrollToFindings={() => scrollTo('section-ai-findings')}
                onScrollToFinalReport={() => scrollTo('section-final-report')}
                onScrollToShare={() => scrollTo('section-share')}
                onDownloadPDF={() => window.print()}
              />
            </>
          )}

          {/* Footer note */}
          {!isReportFinalised && (
            <div className="text-[10px] text-muted-foreground border-t border-border pt-3">
              {AI_PILOT_LOCKED
                ? 'Every finding is coach-created and coach-approved. Approvals and edits are saved automatically.'
                : 'AI findings are suggestions only. All approvals and edits are saved automatically.'}
              {report.ai_completed_at && (
                <span className="ml-1"> · Generated {format(new Date(report.ai_completed_at), 'dd MMM yyyy')}</span>
              )}
            </div>
          )}

          <FeedbackButton pageRoute="/ai-review" />

          {/* Danger zone */}
          {canEdit && (
            <div className="border-t border-border pt-4 mt-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Danger Zone</div>
              {!showDeleteModal ? (
                <button
                  className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="w-3 h-3" /> Delete this AI report…
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Delete <span className="text-foreground font-medium">"{report.title || 'AI Report'}"</span>? This removes it from review queues, swimmer counts, and public sharing. The video can be re-analysed. This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Deleting…</> : <><Trash2 className="w-3 h-3 mr-1" />Delete AI Report</>}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowDeleteModal(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT STICKY PANEL — desktop only ── */}
        <div className={`${studioMode ? 'hidden' : 'hidden lg:block'} w-80 flex-shrink-0 space-y-4 sticky top-6`}>
          {/* Coach Review Assistant — above the 3D viewer */}
          <CoachReviewAssistantCard
            video={video}
            report={report}
            findings={findings}
            sharedLinks={sharedLinks}
            onScrollToFindings={() => scrollTo('section-ai-findings')}
            onScrollToSummary={() => scrollTo('section-summary')}
            onScrollToShare={() => scrollTo('section-share')}
          />
        </div>

      </div>
    </div>
  );
}
