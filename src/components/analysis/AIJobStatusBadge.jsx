import React from 'react';
import { Loader2, CheckCircle2, AlertTriangle, Clock, XCircle, Brain, Download, Layers, Eye, Zap, Send } from 'lucide-react';

export const JOB_STATUS_CONFIG = {
  // VideoUpload.processing_status
  uploaded:         { label: 'Ready',                              color: 'text-green-600 bg-green-50 border-green-200',    icon: CheckCircle2, spin: false },
  pending_ai:       { label: 'Queued for AI review',              color: 'text-blue-600 bg-blue-50 border-blue-200',       icon: Clock,        spin: false },
  processing:       { label: 'AI Processing…',                    color: 'text-primary bg-primary/10 border-primary/20',   icon: Loader2,      spin: true },
  completed:        { label: 'Review Ready',                       color: 'text-cyan-600 bg-cyan-50 border-cyan-200',       icon: CheckCircle2, spin: false },
  analysis_unreliable: { label: 'Pose Unreliable',               color: 'text-orange-600 bg-orange-50 border-orange-200', icon: AlertTriangle, spin: false },
  error:            { label: 'Processing Failed',                  color: 'text-red-600 bg-red-50 border-red-200',          icon: XCircle,      spin: false },

  // AIProcessingJob.status
  queued:                 { label: 'Queued for pose-assisted review',    color: 'text-blue-600 bg-blue-50 border-blue-200',       icon: Clock,        spin: false },
  downloading_video:      { label: 'Downloading video securely',         color: 'text-primary bg-primary/10 border-primary/20',   icon: Download,     spin: true  },
  extracting_frames:      { label: 'Extracting review frames',           color: 'text-primary bg-primary/10 border-primary/20',   icon: Layers,       spin: true  },
  running_pose_detection: { label: 'Checking swimmer visibility',        color: 'text-primary bg-primary/10 border-primary/20',   icon: Eye,          spin: true  },
  analysing_stroke:       { label: 'Running stroke-specific checks',     color: 'text-primary bg-primary/10 border-primary/20',   icon: Brain,        spin: true  },
  generating_outputs:     { label: 'Generating findings',                color: 'text-primary bg-primary/10 border-primary/20',   icon: Zap,          spin: true  },
  callback_sending:       { label: 'Sending results to Base44…',         color: 'text-primary bg-primary/10 border-primary/20',   icon: Send,         spin: true  },
  unreliable_pose:        { label: 'Pose unreliable — manual review rec.',color: 'text-orange-600 bg-orange-50 border-orange-200', icon: AlertTriangle, spin: false },
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