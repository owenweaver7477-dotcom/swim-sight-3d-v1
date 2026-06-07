import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const VARIANTS = {
  // greens
  ready:      { cls: 'bg-green-50 text-green-700 border-green-200',  icon: CheckCircle2 },
  published:  { cls: 'bg-green-50 text-green-700 border-green-200',  icon: CheckCircle2 },
  approved:   { cls: 'bg-green-50 text-green-700 border-green-200',  icon: CheckCircle2 },
  resolved:   { cls: 'bg-green-50 text-green-700 border-green-200',  icon: CheckCircle2 },
  completed:  { cls: 'bg-green-50 text-green-700 border-green-200',  icon: CheckCircle2 },
  real_pose:  { cls: 'bg-green-50 text-green-700 border-green-200',  icon: CheckCircle2 },
  // ambers
  pending:    { cls: 'bg-amber-50 text-amber-700 border-amber-200',  icon: Clock },
  review:     { cls: 'bg-amber-50 text-amber-700 border-amber-200',  icon: Clock },
  partial:    { cls: 'bg-amber-50 text-amber-700 border-amber-200',  icon: AlertTriangle },
  unreliable: { cls: 'bg-amber-50 text-amber-700 border-amber-200',  icon: AlertTriangle },
  needs_review: { cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle },
  placeholder:{ cls: 'bg-amber-50 text-amber-700 border-amber-200',  icon: AlertTriangle },
  // reds
  error:      { cls: 'bg-red-50 text-red-700 border-red-200',        icon: XCircle },
  blocked:    { cls: 'bg-red-50 text-red-700 border-red-200',        icon: XCircle },
  critical:   { cls: 'bg-red-50 text-red-700 border-red-200',        icon: XCircle },
  // blues
  processing: { cls: 'bg-blue-50 text-blue-700 border-blue-200',     icon: Loader2 },
  in_progress:{ cls: 'bg-blue-50 text-blue-700 border-blue-200',     icon: Loader2 },
  // slate
  default:    { cls: 'bg-slate-100 text-slate-600 border-slate-200', icon: null },
  draft:      { cls: 'bg-slate-100 text-slate-600 border-slate-200', icon: null },
  new:        { cls: 'bg-slate-100 text-slate-600 border-slate-200', icon: null },
};

export default function StatusBadge({ status, label, showIcon = true, className }) {
  const cfg = VARIANTS[status] || VARIANTS.default;
  const Icon = cfg.icon;
  const text = label || (status ? status.replace(/_/g, ' ') : '');

  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize',
      cfg.cls,
      className
    )}>
      {showIcon && Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
      {text}
    </span>
  );
}