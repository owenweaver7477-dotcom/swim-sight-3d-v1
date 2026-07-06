import React from 'react';
import { Loader2, CheckCircle2, AlertTriangle, Clock, XCircle, Brain, Download, Layers, Eye, Zap, Send, RotateCw } from 'lucide-react';

export const JOB_STATUS_CONFIG = {
  // VideoUpload.processing_status
  preparing_upload:{ label: 'Preparing upload',                  color: 'text-blue-600 bg-blue-50 border-blue-200',       icon: Clock,        spin: false },
  uploading:        { label: 'Uploading private video',           color: 'text-primary bg-primary/10 border-primary/20',   icon: Loader2,      spin: true },
  upload_failed:    { label: 'Upload failed',                     color: 'text-red-600 bg-red-50 border-red-200',          icon: XCircle,      spin: false },
  uploaded:         { label: 'Uploaded — ready for review',        color: 'text-green-600 bg-green-50 border-green-200',    icon: CheckCircle2, spin: false },
  queued_ai:        { label: 'Queued for AI review',              color: 'text-blue-600 bg-blue-50 border-blue-200',       icon: Clock,        spin: false },
  pending_ai:       { label: 'Queued for AI review',              color: 'text-blue-600 bg-blue-50 border-blue-200',       icon: Clock,        spin: false },
  processing_ai:    { label: 'AI Processing...',                  color: 'text-primary bg-primary/10 border-primary/20',   icon: Loader2,      spin: true },
  processing:       { label: 'AI Processing…',                    color: 'text-primary bg-primary/10 border-primary/20',   icon: Loader2,      spin: true },
  completed:        { label: 'AI review ready',                    color: 'text-cyan-600 bg-cyan-50 border-cyan-200',       icon: CheckCircle2, spin: false },
  manual_review:    { label: 'Manual review available',            color: 'text-orange-600 bg-orange-50 border-orange-200', icon: AlertTriangle, spin: false },
  unreliable_pose:  { label: 'Pose Unreliable',                   color: 'text-orange-600 bg-orange-50 border-orange-200', icon: AlertTriangle, spin: false },
  analysis_unreliable: { label: 'Pose Unreliable',               color: 'text-orange-600 bg-orange-50 border-orange-200', icon: AlertTriangle, spin: false },
  error:            { label: 'AI review failed',                   color: 'text-red-600 bg-red-50 border-red-200',          icon: XCircle,      spin: false },

  // AIProcessingJob.status
  queued:                 { label: 'Queued for AI Review',               color: 'text-blue-600 bg-blue-50 border-blue-200',       icon: Clock,        spin: false },
  dispatching:            { label: 'Sending to AI worker',               color: 'text-blue-600 bg-blue-50 border-blue-200',       icon: Loader2,      spin: true  },
  dispatched:             { label: 'AI server accepted job',             color: 'text-blue-600 bg-blue-50 border-blue-200',       icon: CheckCircle2, spin: false },
  accepted:               { label: 'AI server accepted job',             color: 'text-blue-600 bg-blue-50 border-blue-200',       icon: CheckCircle2, spin: false },
  running:                { label: 'AI-assisted review running',         color: 'text-primary bg-primary/10 border-primary/20',   icon: Loader2,      spin: true  },
  downloading_video:      { label: 'Downloading video securely',         color: 'text-primary bg-primary/10 border-primary/20',   icon: Download,     spin: true  },
  extracting_frames:      { label: 'Extracting review frames',           color: 'text-primary bg-primary/10 border-primary/20',   icon: Layers,       spin: true  },
  running_pose_detection: { label: 'Checking swimmer visibility',        color: 'text-primary bg-primary/10 border-primary/20',   icon: Eye,          spin: true  },
  analysing_stroke:       { label: 'Running stroke-specific checks',     color: 'text-primary bg-primary/10 border-primary/20',   icon: Brain,        spin: true  },
  generating_outputs:     { label: 'Generating findings',                color: 'text-primary bg-primary/10 border-primary/20',   icon: Zap,          spin: true  },
  callback_sending:       { label: 'Sending results to Swim Sight 3D...', color: 'text-primary bg-primary/10 border-primary/20',   icon: Send,         spin: true  },
  manual_review_recommended: { label: 'Manual review recommended',       color: 'text-orange-600 bg-orange-50 border-orange-200', icon: AlertTriangle, spin: false },
  retry_available:       { label: 'Retry available',                      color: 'text-orange-600 bg-orange-50 border-orange-200', icon: RotateCw,      spin: false },
  failed:                { label: 'AI review failed',                     color: 'text-red-600 bg-red-50 border-red-200',          icon: XCircle,      spin: false },
  timed_out:              { label: 'Timed out — retry available',         color: 'text-red-600 bg-red-50 border-red-200',          icon: Clock,        spin: false },
  cancel_requested:       { label: 'Cancellation requested',              color: 'text-slate-600 bg-slate-50 border-slate-200',    icon: Clock,        spin: false },
  cancelled:              { label: 'AI review cancelled',                color: 'text-slate-600 bg-slate-50 border-slate-200',    icon: XCircle,      spin: false },
};

export default function AIJobStatusBadge({ status, jobStatus, size = 'sm', showIcon = true }) {
  // Prefer job status for more granular labels, fall back to upload status
  const key = (jobStatus && JOB_STATUS_CONFIG[jobStatus]) ? jobStatus : (status || 'uploaded');
  const cfg = JOB_STATUS_CONFIG[key] || JOB_STATUS_CONFIG.uploaded;
  const Icon = cfg.icon;

  const sizeClass = size === 'xs'
    ? 'text-[10px] px-1.5 py-0.5'
    : 'text-[10px] font-semibold px-2 py-0.5';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${cfg.color} ${sizeClass}`}>
      {showIcon && <Icon className={`w-3 h-3 flex-shrink-0 ${cfg.spin ? 'animate-spin' : ''}`} />}
      {cfg.label}
    </span>
  );
}
