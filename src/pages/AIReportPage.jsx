import React, { useEffect, useState } from 'react';
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
  ArrowLeft, Star, Camera, Film, AlertTriangle, ClipboardCheck, Share2, Download, ChevronRight,
  Trash2, Plus, Save
} from 'lucide-react';
import { format } from 'date-fns';
import WorkflowStepper from '@/components/ai-report/WorkflowStepper';
import ReportNavActions from '@/components/ai-report/ReportNavActions';
import PlaceholderWarningBanner from '@/components/ai-report/PlaceholderWarningBanner';
import PoseEvidencePanel from '@/components/ai-report/PoseEvidencePanel';
import ReviewChecklist from '@/components/ai-report/ReviewChecklist';
import FinaliseQualityGate from '@/components/ai-report/FinaliseQualityGate';
import FeedbackButton from '@/components/coach-testing/FeedbackButton';
import CoachReviewAssistantCard from '@/components/ai-report/CoachReviewAssistantCard';

function PhaseBar({ label, score }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 80 ? 'bg-green-500' : pct >= 65 ? 'bg-yellow-500' : 'bg-orange-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground capitalize">{label.replace(/_/g, ' ')}</span>
        <span className="text-foreground font-semibold">{score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

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

const COACH_ROLES = ['owner', 'admin', 'coach', 'assistant_coach'];
const FINAL_REPORT_STATUSES = ['coach_approved', 'finalised', 'published', 'shared'];

export default function AIReportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { club } = useClubContext();
  const { user } = useAuth();

  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get('report_id');

  const [finalising, setFinalising] = useState(false);
  const [showQualityGate, setShowQualityGate] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signedVideoUrl, setSignedVideoUrl] = useState('');
  const [signedVideoError, setSignedVideoError] = useState('');
  const [coachSummary, setCoachSummary] = useState('');
  const [nextFocus, setNextFocus] = useState('');
  const [manualObservation, setManualObservation] = useState('');
  const [manualCue, setManualCue] = useState('');
  const [manualNextFocus, setManualNextFocus] = useState('');

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Determine coach role
  const memberRole = club?._memberRole || 'coach';
  const canEdit = COACH_ROLES.includes(memberRole);

  const { data: reportArr = [], isLoading: loadingReport } = useQuery({
    queryKey: ['ai-report', reportId],
    queryFn: () => entities.Report.filter({ id: reportId }),
    enabled: !!reportId,
    staleTime: 60 * 1000,
  });
  const report = reportArr[0];

  const { data: findings = [], isLoading: loadingFindings } = useQuery({
    queryKey: ['ai-findings', reportId],
    queryFn: () => entities.Finding.filter({ report_id: reportId }, '-created_date', 50),
    enabled: !!reportId,
    staleTime: 60 * 1000,
  });

  const { data: keyFrames = [] } = useQuery({
    queryKey: ['ai-keyframes', reportId],
    queryFn: () => entities.KeyFrame.filter({ report_id: reportId }, 'timestamp_seconds', 50),
    enabled: !!reportId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: swimmerArr = [] } = useQuery({
    queryKey: ['swimmer-for-report', report?.swimmer_id],
    queryFn: () => entities.Swimmer.filter({ id: report.swimmer_id }),
    enabled: !!report?.swimmer_id,
    staleTime: 10 * 60 * 1000,
  });
  const swimmer = swimmerArr[0];

  const { data: videoArr = [] } = useQuery({
    queryKey: ['video-for-report', report?.video_upload_id],
    queryFn: () => entities.VideoUpload.filter({ id: report.video_upload_id }),
    enabled: !!report?.video_upload_id,
    staleTime: 10 * 60 * 1000,
  });
  const video = videoArr[0];

  const { data: jobArr = [] } = useQuery({
    queryKey: ['ai-job-for-report', report?.ai_processing_job_id],
    queryFn: () => entities.AIProcessingJob.filter({ id: report.ai_processing_job_id }),
    enabled: !!report?.ai_processing_job_id,
    staleTime: 60 * 1000,
  });
  const aiJob = jobArr[0] || null;

  const dragAnalysisItems = [];
  const annotations = [];

  const approveFinding = useMutation({
    mutationFn: (f) => entities.Finding.update(f.id, { approval_status: 'approved' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-findings', reportId] }),
  });

  const rejectFinding = useMutation({
    mutationFn: (f) => entities.Finding.update(f.id, { approval_status: 'rejected' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-findings', reportId] }),
  });

  const updateCue = useMutation({
    mutationFn: ({ finding, cue }) => entities.Finding.update(finding.id, { cue }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-findings', reportId] }),
  });

  const updateNote = useMutation({
    mutationFn: ({ finding, note }) => entities.Finding.update(finding.id, { next_focus: note }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-findings', reportId] }),
  });

  const updateReportSummary = useMutation({
    mutationFn: () => entities.Report.update(reportId, {
      coach_summary: coachSummary,
      next_focus: nextFocus,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-report', reportId] }),
  });

  const createManualFinding = useMutation({
    mutationFn: () => entities.Finding.create({
      club_id: report.club_id,
      report_id: report.id,
      swimmer_id: report.swimmer_id,
      video_upload_id: report.video_upload_id,
      source: 'coach',
      approval_status: 'approved',
      severity: 'medium',
      observation: manualObservation,
      correction_cue: manualCue,
      next_focus: manualNextFocus,
      created_by: user?.id,
    }),
    onSuccess: () => {
      setManualObservation('');
      setManualCue('');
      setManualNextFocus('');
      queryClient.invalidateQueries({ queryKey: ['ai-findings', reportId] });
    },
  });

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
        if (!cancelled) setSignedVideoUrl(res.data?.signed_url || '');
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

  const pendingCount = findings.filter(f => f.approval_status === 'pending').length;
  const approvedCount = findings.filter(f => f.approval_status === 'approved').length;
  const rejectedCount = findings.filter(f => f.approval_status === 'rejected').length;
  const approvedFindings = findings.filter(f => f.approval_status === 'approved');
  const isReportFinalised = FINAL_REPORT_STATUSES.includes(report?.status);
  const isManualReviewReport = report?.analysis_mode === 'error'
    || report?.analysis_mode === 'placeholder'
    || report?.analysis_mode === 'manual_review'
    || report?.real_pose_detected === false;

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
        <Button size="sm" variant="outline" onClick={() => navigate('/ai-reports')}>
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Reports
        </Button>
      </div>
    );
  }

  if (loadingReport || loadingFindings) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
        <span className="text-sm text-muted-foreground">Loading AI report…</span>
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
          <Button size="sm" variant="ghost" onClick={() => navigate('/ai-reports')}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> AI Reviews
          </Button>

          {/* Header */}
          <PageHeader
            eyebrow="AI Analysis"
            title={report.title || 'AI Technique Report'}
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

          {/* Workflow stepper */}
          <div className="p-3 rounded-xl bg-card border border-border">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Where you are</div>
            <WorkflowStepper currentStep={workflowStep} />
          </div>

          {/* Review progress checklist */}
          <ReviewChecklist
            report={report}
            video={video}
            findings={findings}
            dragItems={dragAnalysisItems}
            annotations={annotations}
          />

          {/* Prominent CTA based on step */}
          {workflowStep === 'ai' && findings.length > 0 && (
            <div className="p-4 rounded-xl bg-yellow-900/10 border border-yellow-700/20 flex items-center gap-3">
              <Brain className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">Review AI Findings</div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Scroll down to approve or dismiss each AI-suggested finding.</p>
              </div>
              <ChevronRight className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            </div>
          )}
          {workflowStep === 'review' && canEdit && approvedCount > 0 && !isReportFinalised && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3">
              <ClipboardCheck className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">{approvedCount} finding{approvedCount !== 1 ? 's' : ''} approved</div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {pendingCount > 0 ? `${pendingCount} still pending — review them below, then finalise.` : 'Ready to finalise the coach report.'}
                </p>
              </div>
            </div>
          )}
          {workflowStep === 'final' && canEdit && !isReportFinalised && (
            <div className="p-4 rounded-xl bg-green-900/10 border border-green-700/20 flex items-center gap-3">
              <ClipboardCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">Ready to Finalise</div>
                <p className="text-[10px] text-muted-foreground mt-0.5">All findings reviewed. Click "Finalise Coach Report" below.</p>
              </div>
            </div>
          )}
          {workflowStep === 'export' && (
            <div className="p-4 rounded-xl bg-green-900/10 border border-green-700/20 flex items-center gap-3 flex-wrap gap-y-2">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">Final Report Ready</div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Download the PDF or create a share link for the swimmer.</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-3 h-3" /> Download PDF
                </button>
              </div>
            </div>
          )}

          {/* Placeholder / error warning — coach internal only */}
          <PlaceholderWarningBanner
            analysisMode={report.analysis_mode}
            aiErrorMessage={report.ai_error_message}
            realPoseDetected={report.real_pose_detected}
          />

          {/* Real pose evidence panel — coach internal only */}
          <PoseEvidencePanel report={report} />
          {aiJob && (
            <div className="p-3 rounded-lg bg-secondary/50 border border-border text-[10px] text-muted-foreground">
              <span className="font-semibold text-foreground">AI job:</span> {aiJob.status}
              {aiJob.stage && <span> · {aiJob.stage}</span>}
              {aiJob.pose_reliability && <span> · reliability: {aiJob.pose_reliability}</span>}
            </div>
          )}

          {/* AI transparency notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-yellow-900/10 border border-yellow-700/20">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-yellow-400/80 leading-relaxed">
              AI suggestions require coach review before being shared with swimmers or parents. Approve findings below to include them in the final coach report.
            </p>
          </div>

          {/* Coach summary / next focus */}
          <div className="p-4 rounded-xl bg-card border border-border space-y-3">
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

          {/* Video metadata */}
          {video && (
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Source Video</div>
              {signedVideoUrl ? (
                <div className="rounded-lg overflow-hidden bg-black mb-3" style={{ aspectRatio: '16/9' }}>
                  <video src={signedVideoUrl} controls className="w-full h-full object-contain" />
                </div>
              ) : signedVideoError ? (
                <div className="mb-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                  {signedVideoError}
                </div>
              ) : (
                <div className="mb-3 p-3 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground">
                  Loading private video preview...
                </div>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Film className="w-3.5 h-3.5" />{video.original_filename || 'Untitled'}</span>
                {video.stroke_type && <span className="flex items-center gap-1.5 text-foreground font-medium"><Activity className="w-3.5 h-3.5" />{video.stroke_type}</span>}
                {video.camera_angle && <span className="flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" />{video.camera_angle}</span>}
                {video.analysis_type && <span>{video.analysis_type}</span>}
                {video.created_date && <span>Uploaded {format(new Date(video.created_date), 'dd MMM yyyy')}</span>}
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-secondary/40 border border-border text-[10px] text-muted-foreground">
            Multi-angle review, drag risk, annotations, and 3D references are preserved for later migration phases and are intentionally hidden from this V1 Supabase report workflow.
          </div>

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

          {/* Key moments */}
          {keyFrames.length > 0 && (
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
          <ReportNavActions
            report={report}
            swimmer={swimmer}
            video={video}
            onScrollToFindings={() => scrollTo('section-ai-findings')}
            onScrollToFinalReport={() => scrollTo('section-final-report')}
            onScrollToShare={() => scrollTo('section-share')}
            onDownloadPDF={() => window.print()}
          />

          {canEdit && !isReportFinalised && (
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-start gap-2">
                <Plus className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-foreground uppercase tracking-wider">Add Coach Finding</div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Use this for manual review, especially when pose evidence was unreliable.
                  </p>
                </div>
              </div>
              {isManualReviewReport && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800">
                  Pose evidence was unreliable or unavailable. Add real coach observations here; no AI findings are fabricated.
                </div>
              )}
              <Textarea
                value={manualObservation}
                onChange={e => setManualObservation(e.target.value)}
                className="text-xs min-h-[64px]"
                placeholder="What did the coach observe?"
              />
              <Textarea
                value={manualCue}
                onChange={e => setManualCue(e.target.value)}
                className="text-xs min-h-[48px]"
                placeholder="Correction cue or drill..."
              />
              <Textarea
                value={manualNextFocus}
                onChange={e => setManualNextFocus(e.target.value)}
                className="text-xs min-h-[48px]"
                placeholder="Next focus..."
              />
              <Button
                size="sm"
                className="h-8 text-xs bg-primary text-primary-foreground"
                onClick={() => createManualFinding.mutate()}
                disabled={createManualFinding.isPending || !manualObservation.trim()}
              >
                {createManualFinding.isPending ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Plus className="w-3 h-3 mr-1.5" />}
                Add Approved Coach Finding
              </Button>
            </div>
          )}

          {/* AI Suggested Findings */}
          <div id="section-ai-findings" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
                AI Suggested Findings ({findings.length})
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
                    onReject={(finding) => rejectFinding.mutate(finding)}
                    onUpdateCue={(finding, cue) => updateCue.mutateAsync({ finding, cue })}
                    onUpdateNote={(finding, note) => updateNote.mutateAsync({ finding, note })}
                    clubId={report?.club_id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Approved Coach Report */}
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
            <ApprovedCoachReport
              report={report}
              swimmer={swimmer}
              video={video}
              approvedFindings={approvedFindings}
            />
            {/* Hidden printable version for PDF export */}
            <div id="printable-report-area" className="hidden print:block print:absolute print:top-0 print:left-0 print:w-full print:h-full print:bg-white print:z-50">
              <PrintableReport
                report={report}
                swimmer={swimmer}
                club={club}
                video_meta={{
                  stroke_type: video?.stroke_type,
                  analysis_type: video?.analysis_type,
                  camera_angle: video?.camera_angle,
                }}
                findings={approvedFindings}
                annotations={video ? annotations.filter(a => a.is_included_in_report && a.video_upload_id === video.id) : []}
                dragItems={dragAnalysisItems.filter(d => d.approval_status === 'approved' && d.included_in_report)}
                share_link={null}
                showPrintButton={false}
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
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-foreground">Ready to finalise?</div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {approvedCount} approved finding{approvedCount !== 1 ? 's' : ''}.
                    {approvedCount === 0 && ' You can finalise intentionally with no findings after confirming the quality gate.'}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="h-8 text-xs bg-green-700 hover:bg-green-600 text-white flex-shrink-0"
                  onClick={() => setShowQualityGate(true)}
                  disabled={finalising}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  {finalising ? 'Finalising…' : 'Finalise Coach Report'}
                </Button>
              </div>
            </div>
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
              AI findings are suggestions only. All approvals and edits are saved automatically.
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
        <div className="hidden lg:block w-80 flex-shrink-0 space-y-4 sticky top-6">
          {/* Coach Review Assistant — above the 3D viewer */}
          <CoachReviewAssistantCard video={video} report={report} />
        </div>

      </div>
    </div>
  );
}
