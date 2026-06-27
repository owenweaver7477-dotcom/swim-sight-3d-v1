import React from 'react';
import {
  Ban,
  CheckCircle2,
  CircleDot,
  FlaskConical,
  Lock,
  ShieldCheck,
} from 'lucide-react';

const STATUS_CONFIG = {
  live_safe: {
    label: 'Live and safe',
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  internal_only: {
    label: 'Internal',
    icon: ShieldCheck,
    className: 'border-blue-200 bg-blue-50 text-blue-800',
  },
  pilot_disabled: {
    label: 'Pilot only - disabled',
    icon: Lock,
    className: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  needs_clips: {
    label: 'Needs real clips',
    icon: CircleDot,
    className: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  },
  needs_labels: {
    label: 'Needs labelled data',
    icon: CircleDot,
    className: 'border-violet-200 bg-violet-50 text-violet-800',
  },
  needs_calibration: {
    label: 'Requires validation',
    icon: FlaskConical,
    className: 'border-orange-200 bg-orange-50 text-orange-800',
  },
  future_lab: {
    label: 'AI Analysis Improvements',
    icon: Lock,
    className: 'border-slate-300 bg-slate-100 text-slate-700',
  },
  do_not_display: {
    label: 'Do not display',
    icon: Ban,
    className: 'border-red-200 bg-red-50 text-red-800',
  },
};

function YesNo({ value }) {
  return (
    <span className={value ? 'font-semibold text-emerald-700' : 'font-semibold text-slate-500'}>
      {value ? 'Yes' : 'No'}
    </span>
  );
}
export function FeatureReadinessCard({
  title,
  status,
  category,
  description,
  prerequisite,
  safe_now: safeNow,
  blocked_by: blockedBy,
  visible_to_coach: visibleToCoach,
  visible_to_shared_report: visibleToSharedReport,
  next_action: nextAction,
}) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.internal_only;
  const StatusIcon = config.icon;

  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {category}
          </div>
          <h3 className="mt-1 text-sm font-bold text-foreground">{title}</h3>
        </div>
        <span className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${config.className}`}>
          <StatusIcon className="h-3 w-3" aria-hidden="true" />
          {config.label}
        </span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{description}</p>

      <dl className="mt-4 grid gap-2 border-t border-border pt-3 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Safe now</dt>
          <dd className="mt-0.5"><YesNo value={safeNow} /></dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Coach visibility</dt>
          <dd className="mt-0.5"><YesNo value={visibleToCoach} /></dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Shared report</dt>
          <dd className="mt-0.5"><YesNo value={visibleToSharedReport} /></dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Prerequisite</dt>
          <dd className="mt-0.5 text-foreground">{prerequisite || 'None'}</dd>
        </div>
      </dl>

      {blockedBy && (
        <div className="mt-3 text-xs">
          <span className="font-semibold text-foreground">Blocked by: </span>
          <span className="text-muted-foreground">{blockedBy}</span>
        </div>
      )}

      <div className="mt-3 rounded-md bg-secondary/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">Next action: </span>{nextAction}
      </div>
    </article>
  );
}
