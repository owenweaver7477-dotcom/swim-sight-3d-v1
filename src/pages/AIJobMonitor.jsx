import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import entities from '@/lib/data/entities';
import functions from '@/lib/data/functions';
import { useClubContext } from '@/lib/useClubContext';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Activity, Loader2, RefreshCw, AlertTriangle,
  Clock, RotateCcw, ChevronDown, ChevronRight, ShieldAlert, FileText, Film
} from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  queued:              { label: 'Queued',            color: 'text-slate-400 bg-slate-900/20 border-slate-700/30' },
  dispatching:         { label: 'Dispatching',       color: 'text-blue-400 bg-blue-900/20 border-blue-700/30' },
  dispatched:          { label: 'Dispatched',        color: 'text-blue-400 bg-blue-900/20 border-blue-700/30' },
  accepted:            { label: 'Accepted',          color: 'text-blue-400 bg-blue-900/20 border-blue-700/30' },
  running:             { label: 'Running',           color: 'text-primary bg-primary/10 border-primary/20' },
  downloading_video:   { label: 'Downloading',       color: 'text-blue-400 bg-blue-900/20 border-blue-700/30' },
  reading_video_metadata: { label: 'Reading Metadata', color: 'text-blue-400 bg-blue-900/20 border-blue-700/30' },
  metadata_read:       { label: 'Metadata Ready',     color: 'text-blue-400 bg-blue-900/20 border-blue-700/30' },
  processing_tier_selected: { label: 'Workload Ready', color: 'text-blue-400 bg-blue-900/20 border-blue-700/30' },
  extracting_frames:   { label: 'Extracting Frames', color: 'text-blue-400 bg-blue-900/20 border-blue-700/30' },
  frames_extracted:    { label: 'Frames Ready',       color: 'text-blue-400 bg-blue-900/20 border-blue-700/30' },
  running_pose_detection: { label: 'Pose Detection', color: 'text-primary bg-primary/10 border-primary/20' },
  analysing_stroke:    { label: 'Analysing',         color: 'text-primary bg-primary/10 border-primary/20' },
  analysing_stroke_phases: { label: 'Stroke Phases', color: 'text-primary bg-primary/10 border-primary/20' },
  generating_findings: { label: 'Draft Findings',    color: 'text-primary bg-primary/10 border-primary/20' },
  generating_outputs:  { label: 'Generating',        color: 'text-primary bg-primary/10 border-primary/20' },
  callback_sending:    { label: 'Callback',          color: 'text-yellow-400 bg-yellow-900/20 border-yellow-700/30' },
  completed:           { label: 'Completed',         color: 'text-green-400 bg-green-900/20 border-green-700/30' },
  unreliable_pose:     { label: 'Unreliable Pose',   color: 'text-amber-400 bg-amber-900/20 border-amber-700/30' },
  manual_review_recommended: { label: 'Coach Studio', color: 'text-amber-400 bg-amber-900/20 border-amber-700/30' },
  manual_review:       { label: 'Coach Studio',       color: 'text-amber-400 bg-amber-900/20 border-amber-700/30' },
  retry_available:     { label: 'Retry Available',     color: 'text-amber-400 bg-amber-900/20 border-amber-700/30' },
  failed:              { label: 'Dispatch Failed',      color: 'text-red-400 bg-red-900/20 border-red-700/30' },
  timed_out:           { label: 'Timed Out',         color: 'text-red-400 bg-red-900/20 border-red-700/30' },
  error:               { label: 'Error',             color: 'text-red-400 bg-red-900/20 border-red-700/30' },
  cancelled:           { label: 'Cancelled',         color: 'text-slate-400 bg-slate-900/20 border-slate-700/30' },
};

const isTimedOut = (job) => job.status === 'timed_out' || (job.status === 'error' && job.stage === 'timed_out');

const RELIABILITY_CONFIG = {
  reliable: { label: 'Reliable', color: 'text-green-400' },
  partial:  { label: 'Partial',  color: 'text-yellow-400' },
  weak:     { label: 'Weak',     color: 'text-amber-400' },
  failed:   { label: 'Failed',   color: 'text-red-400' },
};

const FILTERS = [
  { key: 'all',            label: 'All Jobs' },
  { key: 'queued',         label: 'Queued' },
  { key: 'running',        label: 'Running' },
  { key: 'retry_available', label: 'Retry' },
  { key: 'unreliable_pose',label: 'Unreliable Pose' },
  { key: 'completed',      label: 'Completed' },
  { key: 'error',          label: 'Error' },
];

const RUNNING_STATUSES = [
  'accepted', 'running', 'downloading_video', 'reading_video_metadata', 'metadata_read',
  'processing_tier_selected', 'extracting_frames', 'frames_extracted', 'running_pose_detection',
  'analysing_stroke', 'analysing_stroke_phases', 'generating_findings', 'generating_outputs',
  'callback_sending',
];
const ACTIVE_QUEUE_STATUSES = ['dispatching', 'dispatched', 'processing'];

function asQualityFlags(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map(flag => flag.trim()).filter(Boolean);
  return [];
}

function feedbackCounts(rows = []) {
  return rows.reduce((acc, row) => {
    acc[row.coach_action] = (acc[row.coach_action] || 0) + 1;
    return acc;
  }, {});
}

function displayStatus(job) {
  if (['queued', 'dispatching', 'dispatched', 'failed', 'retry_available', 'timed_out'].includes(job.queue_status)) {
    return job.queue_status;
  }
  return job.status;
}

function isQueuedJob(job) {
  return job.queue_status === 'queued' || job.status === 'queued';
}

function isActiveJob(job) {
  return ACTIVE_QUEUE_STATUSES.includes(job.queue_status) || RUNNING_STATUSES.includes(job.status);
}

function TelemetryValue({ label, value }) {
  return (
    <div className="rounded-md border border-border bg-secondary/40 px-3 py-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xs font-semibold text-foreground">{value ?? 'Not available'}</div>
    </div>
  );
}

function SafeTelemetry({ job }) {
  const fallbackTriggered = [
    'manual_review', 'manual_review_recommended', 'unreliable_pose', 'error', 'timed_out',
  ].includes(job.status);
  const hasTelemetry = [
    job.frame_count_processed,
    job.detection_ratio,
    job.detected_keypoints_count,
    job.processing_duration_seconds,
    job.stage,
  ].some(value => value != null && value !== '');
  const stageConfig = STATUS_CONFIG[job.stage];

  if (!hasTelemetry) {
    return (
      <div className="rounded-md border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
        Telemetry will appear after worker output includes this field.
      </div>
    );
  }

  return (
    <section aria-label="Safe worker telemetry">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Safe worker telemetry</div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <TelemetryValue label="Frames analysed" value={job.frame_count_processed ?? null} />
        <TelemetryValue label="Pose coverage" value={job.detection_ratio != null ? `${(job.detection_ratio * 100).toFixed(0)}%` : null} />
        <TelemetryValue label="Average keypoints" value={job.detected_keypoints_count ?? null} />
        <TelemetryValue label="Fallback triggered" value={fallbackTriggered ? 'Yes - Coach Studio' : 'No'} />
        <TelemetryValue label="Stage" value={stageConfig?.label || job.stage || null} />
        <TelemetryValue label="Processing time" value={job.processing_duration_seconds != null ? `${Number(job.processing_duration_seconds).toFixed(1)}s` : null} />
      </div>
    </section>
  );
}

function JobRow({ job, swimmers, videos, feedback, onRetry, retrying }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const video   = videos.find(v => v.id === job.video_upload_id);
  const swimmer = swimmers.find(s => s.id === (job.swimmer_id || video?.swimmer_id));
  const effectiveStatus = displayStatus(job);
  const cfg = STATUS_CONFIG[effectiveStatus] || { label: effectiveStatus, color: 'text-muted-foreground bg-secondary border-border' };
  const relCfg = job.pose_reliability ? RELIABILITY_CONFIG[job.pose_reliability] : null;
  const qualityFlags = asQualityFlags(job.quality_flags);
  const jobFeedback = feedback.filter(row => (
    row.ai_job_id === job.id
    || row.report_id === job.report_id
    || row.video_upload_id === job.video_upload_id
  ));
  const calibrationCounts = feedbackCounts(jobFeedback);

  const timedOut = isTimedOut(job);
  const canRetry = (
    ['error', 'timed_out', 'retry_available', 'unreliable_pose', 'manual_review', 'manual_review_recommended'].includes(job.status)
    || ['failed', 'retry_available', 'timed_out'].includes(job.queue_status)
  ) && job.retryable !== false;
  const attemptCount = job.attempt_count ?? ((job.retry_count || 0) + 1);
  const maxAttempts = job.max_attempts || 3;

  return (
    <div className={`rounded-xl bg-card border overflow-hidden ${timedOut ? 'border-amber-500/40' : 'border-border'}`}>
      <button
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">{swimmer?.name || 'Unknown Swimmer'}</div>
            <div className="text-[10px] text-muted-foreground truncate">{video?.original_filename || job.video_upload_id?.slice(0,8) || '—'}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
              {cfg.label}
            </span>
            {timedOut && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-900/20 text-amber-400 border-amber-700/30">
                <Clock className="w-2.5 h-2.5" /> Timed Out
              </span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {job.stage && <div className="truncate">{job.stage}</div>}
            {job.progress_percent != null && (
              <div className="mt-1 h-1.5 bg-secondary rounded-full overflow-hidden w-24">
                <div className="h-full bg-primary rounded-full" style={{ width: `${job.progress_percent}%` }} />
              </div>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {job.created_date && format(new Date(job.created_date), 'dd MMM, HH:mm')}
          </div>
        </div>
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[10px]">
            <div><span className="text-muted-foreground">Job ID</span><div className="font-mono text-foreground truncate">{job.id || '—'}</div></div>
            <div><span className="text-muted-foreground">Server Job ID</span><div className="font-mono text-foreground truncate">{job.server_job_id || '—'}</div></div>
            <div><span className="text-muted-foreground">Queue Status</span><div className="text-foreground">{job.queue_status || '—'}</div></div>
            <div><span className="text-muted-foreground">Queue Position</span><div className="text-foreground">{job.queue_position ?? '—'}</div></div>
            <div><span className="text-muted-foreground">Pose Reliability</span>
              <div className={relCfg?.color || 'text-muted-foreground'}>{relCfg?.label || '—'}</div>
            </div>
            <div><span className="text-muted-foreground">Analysis Mode</span><div className="text-foreground capitalize">{job.analysis_mode || '—'}</div></div>
            <div><span className="text-muted-foreground">Callback Received</span><div className={job.callback_received ? 'text-green-400' : 'text-muted-foreground'}>{job.callback_received ? 'Yes' : 'No'}</div></div>
            <div><span className="text-muted-foreground">Attempts</span><div className="text-foreground">{attemptCount}/{maxAttempts}</div></div>
            <div><span className="text-muted-foreground">Render Acceptance</span><div className="text-foreground">{job.render_acceptance_status || '—'}</div></div>
            <div><span className="text-muted-foreground">Callback Status</span><div className="text-foreground">{job.callback_status || (job.callback_received ? 'received' : '—')}</div></div>
            <div><span className="text-muted-foreground">Retryable</span><div className={job.retryable === false ? 'text-amber-400' : 'text-green-400'}>{job.retryable === false ? 'No' : 'Yes'}</div></div>
            {job.accepted_at && <div><span className="text-muted-foreground">Accepted</span><div className="text-foreground">{format(new Date(job.accepted_at), 'dd MMM, HH:mm')}</div></div>}
            {job.dispatched_at && <div><span className="text-muted-foreground">Dispatched</span><div className="text-foreground">{format(new Date(job.dispatched_at), 'dd MMM, HH:mm')}</div></div>}
            {job.started_at && <div><span className="text-muted-foreground">Started</span><div className="text-foreground">{format(new Date(job.started_at), 'dd MMM, HH:mm')}</div></div>}
            {job.failed_at && <div><span className="text-muted-foreground">Failed</span><div className="text-foreground">{format(new Date(job.failed_at), 'dd MMM, HH:mm')}</div></div>}
            {job.timed_out_at && <div><span className="text-muted-foreground">Timed out</span><div className="text-foreground">{format(new Date(job.timed_out_at), 'dd MMM, HH:mm')}</div></div>}
            {job.completed_at && <div><span className="text-muted-foreground">Completed</span><div className="text-foreground">{format(new Date(job.completed_at), 'dd MMM, HH:mm')}</div></div>}
          </div>

          <SafeTelemetry job={job} />

          {qualityFlags.length > 0 && (
            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Quality Flags</div>
              <div className="flex flex-wrap gap-1">
                {qualityFlags.map(f => (
                  <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/20 text-amber-400 border border-amber-700/30">{f}</span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
            <div className="p-2 rounded-lg bg-secondary/40 border border-border">
              <span className="text-muted-foreground">AI returned</span>
              <div className="font-semibold text-foreground">{job.callback_summary?.findings_count ?? '—'}</div>
            </div>
            <div className="p-2 rounded-lg bg-secondary/40 border border-border">
              <span className="text-muted-foreground">Approved</span>
              <div className="font-semibold text-green-400">{calibrationCounts.approved || 0}</div>
            </div>
            <div className="p-2 rounded-lg bg-secondary/40 border border-border">
              <span className="text-muted-foreground">Edited</span>
              <div className="font-semibold text-primary">{calibrationCounts.edited || 0}</div>
            </div>
            <div className="p-2 rounded-lg bg-secondary/40 border border-border">
              <span className="text-muted-foreground">Rejected</span>
              <div className="font-semibold text-amber-400">{calibrationCounts.rejected || 0}</div>
            </div>
            <div className="p-2 rounded-lg bg-secondary/40 border border-border">
              <span className="text-muted-foreground">Manual added</span>
              <div className="font-semibold text-foreground">{calibrationCounts.manual_added || 0}</div>
            </div>
          </div>

          {job.recommended_next_action && (
            <div className="p-2.5 rounded-lg bg-secondary/50 text-[10px] text-muted-foreground">
              <span className="font-semibold text-foreground">Recommended action: </span>{job.recommended_next_action}
            </div>
          )}

          {(job.last_error || job.error_message) && (
            <div className="p-2.5 rounded-lg bg-red-900/10 border border-red-700/20 text-[10px] text-red-400">
              <span className="font-semibold">{job.error_code ? `${job.error_code}: ` : 'Error: '}</span>{job.last_error || job.error_message}
            </div>
          )}

          {job.dispatch_error && (
            <div className="p-2.5 rounded-lg bg-amber-900/10 border border-amber-700/20 text-[10px] text-amber-400">
              <span className="font-semibold">Dispatch: </span>{job.dispatch_error}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {canRetry && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => onRetry(job)}
                disabled={retrying === job.id}
              >
                {retrying === job.id
                  ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Retrying…</>
                  : <><RotateCcw className="w-3 h-3 mr-1" />Retry AI Review</>
                }
              </Button>
            )}
            {video?.id && (
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => navigate('/analyse')}>
                <Film className="w-3 h-3 mr-1" /> Open Video Library
              </Button>
            )}
            {job.report_id && (
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => navigate(`/ai-review?report_id=${job.report_id}`)}>
                <FileText className="w-3 h-3 mr-1" /> Open Report
              </Button>
            )}
            {video?.id && !job.report_id && (
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => navigate('/analyse')}>
                <FileText className="w-3 h-3 mr-1" /> Open Coach Studio
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AIJobMonitor() {
  const { club, memberRole } = useClubContext();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [retrying, setRetrying] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [resetResult, setResetResult] = useState(null);
  const [dispatchResult, setDispatchResult] = useState(null);

  const isAdmin = ['owner', 'admin'].includes(memberRole);
  const canViewJobs = ['owner', 'admin'].includes(memberRole);

  const { data: jobs = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai-jobs', club?.id],
    queryFn: () => entities.AIProcessingJob.filter({ club_id: club.id }, '-created_date', 100),
    enabled: !!club?.id && canViewJobs,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  const { data: swimmers = [] } = useQuery({
    queryKey: ['swimmers', club?.id],
    queryFn: () => entities.Swimmer.filter({ club_id: club.id }),
    enabled: !!club?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['videos-jobs', club?.id],
    queryFn: () => entities.VideoUpload.filter({ club_id: club.id }, '-created_date', 100),
    enabled: !!club?.id,
    staleTime: 2 * 60 * 1000,
  });

  const { data: feedback = [] } = useQuery({
    queryKey: ['ai-job-feedback', club?.id],
    queryFn: () => entities.AIFindingFeedback.list('-created_at', 500),
    enabled: !!club?.id && canViewJobs,
    staleTime: 60 * 1000,
  });

  const { data: queueStatus } = useQuery({
    queryKey: ['ai-queue-status', club?.id],
    queryFn: async () => {
      const res = await functions.getAIQueueStatus(club.id);
      return res.data;
    },
    enabled: !!club?.id && canViewJobs,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });

  const handleResetTimedOut = async () => {
    setResetting(true);
    setResetResult(null);
    try {
      const res = await functions.resetTimedOutAIJobs({ club_id: club.id });
      setResetResult(`${res.data?.reset_count ?? 0} timed-out job${res.data?.reset_count === 1 ? '' : 's'} reset.`);
      queryClient.invalidateQueries({ queryKey: ['ai-jobs', club?.id] });
      queryClient.invalidateQueries({ queryKey: ['video-uploads'] });
    } finally {
      setResetting(false);
    }
  };

  const handleDispatchNext = async () => {
    setDispatching(true);
    setDispatchResult(null);
    try {
      const res = await functions.dispatchNextAIJob({ club_id: club.id });
      if (res.data?.dispatched) {
        setDispatchResult(res.data?.job_visible
          ? 'Next queued job was sent to the AI worker.'
          : 'A queued job was sent to the AI worker. Private details stay hidden if it belongs to another club.');
      } else if (res.data?.reason === 'capacity_full') {
        setDispatchResult('No AI worker slot is available yet. Queued jobs will stay safe until capacity opens.');
      } else {
        setDispatchResult('No queued job is waiting to dispatch.');
      }
      queryClient.invalidateQueries({ queryKey: ['ai-jobs', club?.id] });
      queryClient.invalidateQueries({ queryKey: ['ai-queue-status', club?.id] });
      queryClient.invalidateQueries({ queryKey: ['video-uploads'] });
    } finally {
      setDispatching(false);
    }
  };

  const handleRetry = async (job) => {
    setRetrying(job.id);
    try {
      await functions.triggerPoseAnalysis(job.video_upload_id);
      queryClient.invalidateQueries({ queryKey: ['ai-jobs', club?.id] });
    } finally {
      setRetrying(null);
    }
  };

  if (!canViewJobs) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <ShieldAlert className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <div className="text-sm font-medium text-foreground">Coach access required</div>
        <p className="text-xs text-muted-foreground mt-1">Only coaching staff can view the AI Job Monitor.</p>
      </div>
    );
  }

  const filteredJobs = jobs.filter(j => {
    if (filter === 'all') return true;
    if (filter === 'queued') return isQueuedJob(j);
    if (filter === 'running') return isActiveJob(j);
    if (filter === 'retry_available') return (
      ['retry_available', 'timed_out', 'error'].includes(j.status)
      || ['failed', 'retry_available', 'timed_out'].includes(j.queue_status)
    ) && j.retryable !== false;
    if (filter === 'unreliable_pose') return ['unreliable_pose', 'manual_review_recommended'].includes(j.status);
    if (filter === 'error') return ['error', 'timed_out'].includes(j.status);
    return j.status === filter;
  });

  // Counts for filter tabs
  const counts = {
    all: jobs.length,
    queued: jobs.filter(isQueuedJob).length,
    running: jobs.filter(isActiveJob).length,
    retry_available: jobs.filter(j => (
      ['retry_available', 'timed_out', 'error'].includes(j.status)
      || ['failed', 'retry_available', 'timed_out'].includes(j.queue_status)
    ) && j.retryable !== false).length,
    unreliable_pose: jobs.filter(j => ['unreliable_pose', 'manual_review_recommended'].includes(j.status)).length,
    completed: jobs.filter(j => j.status === 'completed').length,
    error: jobs.filter(j => ['error', 'timed_out'].includes(j.status)).length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <PageHeader
        eyebrow="Admin"
        title="AI Job Monitor"
        subtitle="Monitor AI processing jobs, debug the pose analysis pipeline, and review callback flow."
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={handleDispatchNext}
              disabled={dispatching}
            >
              {dispatching ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Activity className="w-3 h-3 mr-1" />}
              Dispatch Next
            </Button>
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                onClick={handleResetTimedOut}
                disabled={resetting}
              >
                {resetting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                Reset Timed-Out Jobs
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
              Refresh
            </Button>
          </div>
        }
      />
      {resetResult && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          {resetResult}
        </div>
      )}
      {dispatchResult && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800">
          {dispatchResult}
        </div>
      )}

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total',     val: counts.all,            color: 'text-foreground' },
          { label: 'Queued',    val: queueStatus?.club_queued_jobs ?? counts.queued, color: 'text-blue-400' },
          { label: 'Running',   val: counts.running,        color: 'text-primary' },
          { label: 'Completed', val: counts.completed,      color: 'text-green-400' },
          { label: 'Retry',     val: counts.retry_available,color: 'text-amber-400' },
          { label: 'Error',     val: counts.error,          color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl bg-card border border-border text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-5 p-3 rounded-xl bg-card border border-border text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span><strong className="text-foreground">Max active AI jobs:</strong> {queueStatus?.max_active_ai_jobs ?? 1}</span>
          <span><strong className="text-foreground">Global active:</strong> {queueStatus?.global_active_jobs ?? '—'}</span>
          <span><strong className="text-foreground">Global queued:</strong> {queueStatus?.global_queued_jobs ?? '—'}</span>
          {queueStatus?.next_queued_job?.queue_position && (
            <span><strong className="text-foreground">Next club queue position:</strong> {queueStatus.next_queued_job.queue_position}</span>
          )}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed">
          Queued jobs do not receive signed video URLs until an AI worker slot opens. This protects private video links and prevents Render overload.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filter === f.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            {f.label}
            {counts[f.key] > 0 && (
              <span className={`text-[9px] font-bold px-1 rounded-full ${filter === f.key ? 'bg-white/20' : 'bg-secondary'}`}>
                {counts[f.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">Loading jobs…</span>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-10 rounded-xl bg-card border border-border text-center">
          <Activity className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <div className="text-sm text-muted-foreground">No jobs found for this filter.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-4 gap-2 px-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <div>Swimmer / Video</div>
            <div>Status</div>
            <div>Stage / Progress</div>
            <div>Created</div>
          </div>
          {filteredJobs.map(job => (
            <JobRow
              key={job.id}
              job={job}
              swimmers={swimmers}
              videos={videos}
              feedback={feedback}
              onRetry={handleRetry}
              retrying={retrying}
            />
          ))}
        </div>
      )}

      <div className="mt-6 text-[10px] text-muted-foreground border-t border-border pt-3">
        Auto-refreshes every 30 seconds. Showing last 100 jobs for this club.
      </div>
    </div>
  );
}
