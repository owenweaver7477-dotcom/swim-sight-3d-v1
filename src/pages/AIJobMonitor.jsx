import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useClubContext } from '@/lib/useClubContext';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Activity, Loader2, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, XCircle, RotateCcw, ChevronDown, ChevronRight, ShieldAlert
} from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  queued:              { label: 'Queued',            color: 'text-slate-400 bg-slate-900/20 border-slate-700/30' },
  downloading_video:   { label: 'Downloading',       color: 'text-blue-400 bg-blue-900/20 border-blue-700/30' },
  extracting_frames:   { label: 'Extracting Frames', color: 'text-blue-400 bg-blue-900/20 border-blue-700/30' },
  running_pose_detection: { label: 'Pose Detection', color: 'text-primary bg-primary/10 border-primary/20' },
  analysing_stroke:    { label: 'Analysing',         color: 'text-primary bg-primary/10 border-primary/20' },
  generating_outputs:  { label: 'Generating',        color: 'text-primary bg-primary/10 border-primary/20' },
  callback_sending:    { label: 'Callback',          color: 'text-yellow-400 bg-yellow-900/20 border-yellow-700/30' },
  completed:           { label: 'Completed',         color: 'text-green-400 bg-green-900/20 border-green-700/30' },
  unreliable_pose:     { label: 'Unreliable Pose',   color: 'text-amber-400 bg-amber-900/20 border-amber-700/30' },
  error:               { label: 'Error',             color: 'text-red-400 bg-red-900/20 border-red-700/30' },
};

const isTimedOut = (job) => job.status === 'error' && job.stage === 'timed_out';

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
  { key: 'unreliable_pose',label: 'Unreliable Pose' },
  { key: 'completed',      label: 'Completed' },
  { key: 'error',          label: 'Error' },
];

const RUNNING_STATUSES = ['downloading_video','extracting_frames','running_pose_detection','analysing_stroke','generating_outputs','callback_sending'];

function JobRow({ job, swimmers, videos, onRetry, retrying }) {
  const [expanded, setExpanded] = useState(false);
  const swimmer = swimmers.find(s => s.id === job.swimmer_id);
  const video   = videos.find(v => v.id === job.video_upload_id);
  const cfg = STATUS_CONFIG[job.status] || { label: job.status, color: 'text-muted-foreground bg-secondary border-border' };
  const relCfg = job.pose_reliability ? RELIABILITY_CONFIG[job.pose_reliability] : null;

  const timedOut = isTimedOut(job);
  const canRetry = job.status === 'error' || job.status === 'unreliable_pose';

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
            <div><span className="text-muted-foreground">Job ID</span><div className="font-mono text-foreground truncate">{job.job_id || '—'}</div></div>
            <div><span className="text-muted-foreground">Server Job ID</span><div className="font-mono text-foreground truncate">{job.server_job_id || '—'}</div></div>
            <div><span className="text-muted-foreground">Pose Reliability</span>
              <div className={relCfg?.color || 'text-muted-foreground'}>{relCfg?.label || '—'}</div>
            </div>
            <div><span className="text-muted-foreground">Frames Processed</span><div className="text-foreground">{job.frame_count_processed ?? '—'}</div></div>
            <div><span className="text-muted-foreground">Avg Keypoints</span><div className="text-foreground">{job.detected_keypoints_count ?? '—'}</div></div>
            <div><span className="text-muted-foreground">Detection Ratio</span><div className="text-foreground">{job.detection_ratio != null ? `${(job.detection_ratio * 100).toFixed(0)}%` : '—'}</div></div>
            <div><span className="text-muted-foreground">Analysis Mode</span><div className="text-foreground capitalize">{job.analysis_mode || '—'}</div></div>
            <div><span className="text-muted-foreground">Callback Received</span><div className={job.callback_received ? 'text-green-400' : 'text-muted-foreground'}>{job.callback_received ? 'Yes' : 'No'}</div></div>
            <div><span className="text-muted-foreground">Retry Count</span><div className="text-foreground">{job.retry_count ?? 0}</div></div>
            {job.completed_at && <div><span className="text-muted-foreground">Completed</span><div className="text-foreground">{format(new Date(job.completed_at), 'dd MMM, HH:mm')}</div></div>}
            {job.failed_at && <div><span className="text-muted-foreground">Failed At</span><div className="text-red-400">{format(new Date(job.failed_at), 'dd MMM, HH:mm')}</div></div>}
            {job.processing_duration_seconds && <div><span className="text-muted-foreground">Duration</span><div className="text-foreground">{job.processing_duration_seconds.toFixed(1)}s</div></div>}
          </div>

          {job.quality_flags && (
            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Quality Flags</div>
              <div className="flex flex-wrap gap-1">
                {job.quality_flags.split(',').map(f => f.trim()).filter(Boolean).map(f => (
                  <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/20 text-amber-400 border border-amber-700/30">{f}</span>
                ))}
              </div>
            </div>
          )}

          {job.recommended_next_action && (
            <div className="p-2.5 rounded-lg bg-secondary/50 text-[10px] text-muted-foreground">
              <span className="font-semibold text-foreground">Recommended action: </span>{job.recommended_next_action}
            </div>
          )}

          {job.error_message && (
            <div className="p-2.5 rounded-lg bg-red-900/10 border border-red-700/20 text-[10px] text-red-400">
              <span className="font-semibold">Error: </span>{job.error_message}
            </div>
          )}

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
                : <><RotateCcw className="w-3 h-3 mr-1" />Retry Analysis</>
              }
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AIJobMonitor() {
  const { club } = useClubContext();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [retrying, setRetrying] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState(null);

  const memberRole = club?._memberRole || 'coach';
  const isAdmin = ['owner', 'admin'].includes(memberRole);

  const { data: jobs = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai-jobs', club?.id],
    queryFn: () => base44.entities.AIProcessingJob.filter({ club_id: club.id }, '-created_date', 100),
    enabled: !!club?.id && isAdmin,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  const { data: swimmers = [] } = useQuery({
    queryKey: ['swimmers', club?.id],
    queryFn: () => base44.entities.Swimmer.filter({ club_id: club.id }),
    enabled: !!club?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['videos-jobs', club?.id],
    queryFn: () => base44.entities.VideoUpload.filter({ club_id: club.id }, '-created_date', 100),
    enabled: !!club?.id,
    staleTime: 2 * 60 * 1000,
  });

  const handleResetTimedOut = async () => {
    setResetting(true);
    setResetResult(null);
    try {
      const res = await base44.functions.invoke('resetTimedOutAIJobs', {});
      setResetResult(res.data?.message || 'Done.');
      queryClient.invalidateQueries({ queryKey: ['ai-jobs', club?.id] });
      queryClient.invalidateQueries({ queryKey: ['video-uploads'] });
    } finally {
      setResetting(false);
    }
  };

  const handleRetry = async (job) => {
    setRetrying(job.id);
    try {
      await base44.functions.invoke('triggerPoseAnalysis', {
        video_upload_id: job.video_upload_id,
        club_id: job.club_id,
        swimmer_id: job.swimmer_id,
      });
      queryClient.invalidateQueries({ queryKey: ['ai-jobs', club?.id] });
    } finally {
      setRetrying(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <ShieldAlert className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <div className="text-sm font-medium text-foreground">Admin access required</div>
        <p className="text-xs text-muted-foreground mt-1">Only owners and admins can view the AI Job Monitor.</p>
      </div>
    );
  }

  const filteredJobs = jobs.filter(j => {
    if (filter === 'all') return true;
    if (filter === 'running') return RUNNING_STATUSES.includes(j.status);
    return j.status === filter;
  });

  // Counts for filter tabs
  const counts = {
    all: jobs.length,
    queued: jobs.filter(j => j.status === 'queued').length,
    running: jobs.filter(j => RUNNING_STATUSES.includes(j.status)).length,
    unreliable_pose: jobs.filter(j => j.status === 'unreliable_pose').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    error: jobs.filter(j => j.status === 'error').length,
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
              className="h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={handleResetTimedOut}
              disabled={resetting}
            >
              {resetting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
              Reset Timed-Out Jobs
            </Button>
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

      {/* Summary row */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total',     val: counts.all,            color: 'text-foreground' },
          { label: 'Running',   val: counts.running,        color: 'text-primary' },
          { label: 'Completed', val: counts.completed,      color: 'text-green-400' },
          { label: 'Unreliable',val: counts.unreliable_pose,color: 'text-amber-400' },
          { label: 'Error',     val: counts.error,          color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl bg-card border border-border text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
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