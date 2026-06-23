import React from 'react';
import { CheckCircle2, CircleAlert, CircleSlash2, Eye, OctagonAlert } from 'lucide-react';

const STATUS_CONFIG = {
  ready: { label: 'Ready', icon: CheckCircle2, className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  partial: { label: 'Partial', icon: CircleAlert, className: 'border-amber-200 bg-amber-50 text-amber-700' },
  blocked: { label: 'Blocked', icon: OctagonAlert, className: 'border-red-200 bg-red-50 text-red-700' },
  preview: { label: 'Preview', icon: Eye, className: 'border-cyan-200 bg-cyan-50 text-cyan-700' },
  disabled: { label: 'Disabled', icon: CircleSlash2, className: 'border-slate-200 bg-slate-50 text-slate-600' },
};

export default function FeatureStatusBadge({ status = 'disabled', className = '' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.disabled;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.className} ${className}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {config.label}
    </span>
  );
}
