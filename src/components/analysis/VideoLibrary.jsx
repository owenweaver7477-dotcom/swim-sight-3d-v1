import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import entities from '@/lib/data/entities';
import functions from '@/lib/data/functions';
import { Button } from '@/components/ui/button';
import {
  Film, Trash2, Play, Calendar, Camera, Activity, Loader2,
  AlertCircle, Tag, Brain, RotateCw, Clock, FileText, ArrowRight,
  RefreshCw, AlertTriangle, Info
} from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import AIJobStatusBadge from './AIJobStatusBadge';

const COACH_ROLES = ['owner', 'admin', 'coach', 'assistant_coach'];
const ACTIVE_PROCESSING_STATUSES = ['queued_ai', 'processing_ai', 'pending_ai', 'processing'];

const NEXT_ACTION_LABELS = {
  use_clearer_video: 'Try uploading a clearer or higher-quality video.',
  try_above_water_angle: 'Try adding an above-water angle for better visibility.',
  try_side_angle: 'A direct side-angle view works best for stroke analysis.',
  manual_review_recommended: 'Open Manual Review to add findings directly.',
  real_pose_review_ready: 'AI analysis is ready for coach review.',
};

const QUALITY_FLAG_LABELS = {
  screen_recording_possible: 'Possible screen recording detected',
  low_visibility: 'Low visibility conditions',
  too_few_keypoints: 'Too few pose keypoints detected',
  swimmer_partially_obscured: 'Swimmer partially obscured',
  unstable_camera: 'Unstable camera movement',
  underwater_distortion: 'Underwater optical distortion',
};

function asQualityFlags(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').filter(Boolean);
  return [];
}

function VideoCard({ upload, swimmer, job, onStartReview, onDelete, canDelete, canTriggerAI, onAIStatusChange }) {
  const navigate = useNavigate();
  const [signedUrl, setSignedUrl] = useState(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [showPlayer, setShowPlayer] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiError, setAiError] = useState('');

  const status = upload.processing_status || 'uploaded';

  const { data: linkedReports = [] } = useQuery({
    queryKey: ['ai-report-for-video', upload.id],
    queryFn: () => entities.Report.filter({ video_upload_id: upload.id, source: 'ai' }),
    enabled: !!upload.id,
    staleTime: 30 * 1000,
  });
  const linkedReport = linkedReports.find(r => !r.is_deleted) || null;
  const reportWasDeleted = linkedReports.length > 0 && !linkedReport;

  const isStuck = (() => {
    if (!ACTIVE_PROCESSING_STATUSES.includes(status)) return false;
    const ts = upload.updated_date || upload.created_date;
    if (!ts) return false;
    return differenceInMinutes(new Date(), new Date(ts)) >= 10;
  })();

  const jobStatus = job?.status;
  const jobStage = job?.stage;
  const jobProgress = job?.progress_percent;
  const qualityFlags = asQualityFlags(job?.quality_flags);
  const nextAction = job?.recommended_next_action;

  const handleTriggerAI = async () => {
    setAiLoading(true);
    setAiMessage('');
    setAiError('');
    window.setTimeout(() => {
      setAiLoading(false);
      setAiError('AI Review connection is being migrated next. Manual review remains available.');
    }, 250);
  };

  const loadSignedUrl = async () => {
    if (signedUrl) {
      setShowPlayer(true);
      return;
    }
    setLoadingUrl(true);
    setUrlError('');
    try {
      const res = await functions.getSignedVideoUrl(upload.id);
      if (res.data?.signed_url) {
        setSignedUrl(res.data.signed_url);
        setShowPlayer(true);
      } else {
        setUrlError('Could not load video.');
      }
    } catch (err) {
      setUrlError(err?.message || 'Failed to load video.');
    } finally {
      setLoadingUrl(false);
    }
  };

  const uploadDate = upload.created_date ? format(new Date(upload.created_date), 'dd MMM yyyy') : '-';
  const isUnreliable = (status === 'completed' && linkedReport?.analysis_mode === 'placeholder' && !linkedReport?.real_pose_detected)
    || jobStatus === 'unreliable_pose';
  const isTimedOut = jobStatus === 'error' && job?.stage === 'timed_out' && status === 'uploaded';

  const renderPrimaryAction = () => {
    if (isTimedOut) {
      return (
        <div className="space-y-1.5">
          <div className="flex items-start gap-1.5 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-600" />
            <span>AI processing timed out. Retry with a shorter clip later, or continue with manual review.</span>
          </div>
          <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => onStartReview(upload)}>
            <Play className="w-3 h-3 mr-1" /> Continue Manual Review
          </Button>
        </div>
      );
    }

    if (reportWasDeleted || status === 'error') {
      return (
        <Button size="sm" variant="outline"
          className="w-full h-8 text-xs border-primary/30 text-primary hover:bg-primary/10"
          onClick={handleTriggerAI} disabled={aiLoading}>
          {aiLoading ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <RotateCw className="w-3 h-3 mr-1.5" />}
          {aiLoading ? 'Checking...' : 'AI Review Migration Next'}
        </Button>
      );
    }

    if (isUnreliable) {
      return (
        <div className="space-y-1.5">
          <Button size="sm" className="w-full h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold"
            onClick={() => navigate(`/ai-review?report_id=${linkedReport?.id}`)}>
            <FileText className="w-3 h-3 mr-1.5" /> Open Manual Review
          </Button>
        </div>
      );
    }

    if (status === 'completed' && linkedReport) {
      return (
        <Button size="sm" className="w-full h-8 text-xs bg-primary text-primary-foreground font-semibold"
          onClick={() => navigate(`/ai-review?report_id=${linkedReport.id}`)}>
          <ArrowRight className="w-3 h-3 mr-1.5" /> Open AI Review
        </Button>
      );
    }

    if (status === 'completed') {
      return (
        <Button size="sm" className="w-full h-8 text-xs" variant="outline" disabled>
          <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Preparing Report...
        </Button>
      );
    }

    if (ACTIVE_PROCESSING_STATUSES.includes(status)) {
      return (
        <div className="space-y-1.5">
          <Button size="sm" className="w-full h-8 text-xs" variant="outline" disabled>
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> AI Processing...
          </Button>
          {isStuck && (
            <div className="flex items-center gap-1.5 text-[10px] text-yellow-500">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              Still processing after 10+ minutes. AI retry wiring comes next.
            </div>
          )}
        </div>
      );
    }

    if (canTriggerAI) {
      return (
        <Button size="sm" className="w-full h-8 text-xs bg-primary text-primary-foreground font-semibold"
          onClick={handleTriggerAI} disabled={aiLoading}>
          {aiLoading ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Brain className="w-3 h-3 mr-1.5" />}
          {aiLoading ? 'Checking...' : 'Send to AI Analysis'}
        </Button>
      );
    }

    return (
      <Button size="sm" className="w-full h-8 text-xs bg-primary text-primary-foreground"
        onClick={() => onStartReview(upload)}>
        <Play className="w-3 h-3 mr-1.5" /> Open Review
      </Button>
    );
  };

  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-3">
      {showPlayer && signedUrl ? (
        <div className="rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
          <video
            src={signedUrl}
            controls
            className="w-full h-full object-contain"
            onError={() => {
              setSignedUrl(null);
              setShowPlayer(false);
              setUrlError('Video link expired. Click retry to load a fresh private link.');
            }}
          />
        </div>
      ) : (
        <div
          className="rounded-lg bg-secondary flex items-center justify-center cursor-pointer hover:bg-secondary/80 transition-colors"
          style={{ aspectRatio: '16/9' }}
          onClick={loadSignedUrl}
        >
          {loadingUrl ? (
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
          ) : urlError ? (
            <div className="flex flex-col items-center gap-1.5 text-destructive px-4 text-center">
              <AlertCircle className="w-6 h-6" />
              <span className="text-[10px]">{urlError}</span>
              <button className="text-[10px] underline text-muted-foreground"
                onClick={e => { e.stopPropagation(); setUrlError(''); loadSignedUrl(); }}>Retry</button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Film className="w-8 h-8" />
              <span className="text-[10px]">Click to preview</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <div className="text-sm font-medium text-foreground truncate">
          {upload.original_filename || 'Untitled Video'}
        </div>
        {swimmer && (
          <div className="text-xs text-muted-foreground">
            Swimmer: <span className="text-foreground font-medium">{swimmer.name}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          {upload.stroke_type ? (
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Activity className="w-3 h-3 text-primary" />{upload.stroke_type}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-yellow-500 font-semibold">
              <Activity className="w-3 h-3" />No stroke set
            </span>
          )}
          {upload.camera_angle && (
            <span className="flex items-center gap-1"><Camera className="w-3 h-3" />{upload.camera_angle}</span>
          )}
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{uploadDate}</span>
        </div>
        {upload.analysis_type && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Tag className="w-3 h-3" />{upload.analysis_type}
          </div>
        )}

        <AIJobStatusBadge status={status} jobStatus={jobStatus} />

        {ACTIVE_PROCESSING_STATUSES.includes(status) && jobStage && (
          <div className="text-[10px] text-muted-foreground leading-relaxed">{jobStage}</div>
        )}

        {ACTIVE_PROCESSING_STATUSES.includes(status) && jobProgress != null && jobProgress > 0 && (
          <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${jobProgress}%` }} />
          </div>
        )}

        {status === 'error' && upload.ai_error_message && (
          <div className="text-[10px] text-destructive leading-relaxed line-clamp-2">{upload.ai_error_message}</div>
        )}

        {isUnreliable && (
          <div className="space-y-1">
            {qualityFlags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {qualityFlags.map(flag => (
                  <span key={flag} className="text-[9px] px-1.5 py-0.5 rounded bg-orange-50 border border-orange-200 text-orange-700">
                    {QUALITY_FLAG_LABELS[flag] || flag}
                  </span>
                ))}
              </div>
            )}
            {nextAction && NEXT_ACTION_LABELS[nextAction] && (
              <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                {NEXT_ACTION_LABELS[nextAction]}
              </div>
            )}
          </div>
        )}

        {aiMessage && !aiError && (
          <div className="text-[10px] text-green-600 leading-relaxed">{aiMessage}</div>
        )}
        {aiError && (
          <div className="text-[10px] text-muted-foreground leading-relaxed">{aiError}</div>
        )}
      </div>

      {renderPrimaryAction()}

      {status !== 'completed' && (
        <Button size="sm" variant="ghost"
          className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onStartReview(upload)}>
          <Play className="w-3 h-3 mr-1" /> Open Manual Review
        </Button>
      )}

      {canDelete && (
        <div className="pt-1">
          {!confirmDelete ? (
            <button
              className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="w-3 h-3" /> Delete video
            </button>
          ) : (
            <div className="flex gap-1.5">
              <Button size="sm" variant="destructive" className="h-6 text-[10px]" onClick={() => onDelete(upload.id)}>Delete</Button>
              <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VideoLibrary({ clubId, swimmerId, swimmers = [], memberRole, onStartReview }) {
  const queryClient = useQueryClient();
  const canManage = COACH_ROLES.includes(memberRole);
  const canDelete = canManage;

  const { data: uploads = [], isLoading } = useQuery({
    queryKey: ['video-uploads', clubId, swimmerId],
    queryFn: () => {
      const filter = { club_id: clubId };
      if (swimmerId) filter.swimmer_id = swimmerId;
      return entities.VideoUpload.filter(filter, '-created_date', 50);
    },
    enabled: !!clubId,
    staleTime: 15 * 1000,
    refetchInterval: (query) => {
      const currentUploads = query?.state?.data;
      const active = Array.isArray(currentUploads)
        && currentUploads.some(u => ACTIVE_PROCESSING_STATUSES.includes(u.processing_status));
      return active ? 10000 : false;
    },
  });

  const activeVideoIds = uploads
    .filter(u => ACTIVE_PROCESSING_STATUSES.includes(u.processing_status))
    .map(u => u.id);

  const { data: activeJobs = [] } = useQuery({
    queryKey: ['ai-jobs-active', clubId],
    queryFn: () => entities.AIProcessingJob.filter({ club_id: clubId }, '-created_date', 50),
    enabled: !!clubId,
    staleTime: 8 * 1000,
    refetchInterval: activeVideoIds.length > 0 ? 8000 : false,
  });

  const deleteUpload = useMutation({
    mutationFn: (id) => entities.VideoUpload.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['video-uploads'] }),
  });

  const handleAIStatusChange = (uploadId, newStatus) => {
    queryClient.setQueryData(['video-uploads', clubId, swimmerId], (old = []) =>
      old.map(u => u.id === uploadId ? { ...u, processing_status: newStatus } : u)
    );
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ['video-uploads', clubId, swimmerId] }), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
        <span className="text-sm text-muted-foreground">Loading videos...</span>
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <div className="p-8 rounded-xl bg-card border border-border text-center">
        <Film className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
        <div className="text-sm font-medium text-foreground mb-1">No videos uploaded yet</div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Upload a video first using the upload section above. Once uploaded, the video card will appear here with private signed playback and manual review options.
        </p>
      </div>
    );
  }

  const jobsByVideo = {};
  for (const job of activeJobs) {
    const vid = job.video_upload_id;
    if (!jobsByVideo[vid] || new Date(job.created_date) > new Date(jobsByVideo[vid].created_date)) {
      jobsByVideo[vid] = job;
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {uploads.length} Uploaded Video{uploads.length !== 1 ? 's' : ''}
        </div>
        <button
          className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['video-uploads', clubId, swimmerId] });
            queryClient.invalidateQueries({ queryKey: ['ai-jobs-active', clubId] });
          }}
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {uploads.map(upload => {
          const swimmer = swimmers.find(s => s.id === upload.swimmer_id);
          const job = jobsByVideo[upload.id] || null;
          return (
            <VideoCard
              key={upload.id}
              upload={upload}
              swimmer={swimmer}
              job={job}
              canDelete={canDelete}
              canTriggerAI={canManage}
              onStartReview={onStartReview}
              onDelete={(id) => deleteUpload.mutate(id)}
              onAIStatusChange={handleAIStatusChange}
            />
          );
        })}
      </div>
    </div>
  );
}
