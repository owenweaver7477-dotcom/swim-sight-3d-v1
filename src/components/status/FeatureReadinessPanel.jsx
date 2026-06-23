import React from 'react';
import { ShieldCheck } from 'lucide-react';
import FeatureStatusBadge from '@/components/status/FeatureStatusBadge';

export default function FeatureReadinessPanel({ feature, compact = false }) {
  if (!feature) return null;
  return (
    <section className={`rounded-lg border border-slate-200 bg-white ${compact ? 'p-3' : 'p-4'}`} aria-label={`${feature.label} readiness`}>
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-700" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-bold text-slate-900">{feature.label}</h3>
            <FeatureStatusBadge status={feature.status} />
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-600">{feature.userMessage}</p>
          <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-800">Next: {feature.coachAction}</p>
        </div>
      </div>
    </section>
  );
}
