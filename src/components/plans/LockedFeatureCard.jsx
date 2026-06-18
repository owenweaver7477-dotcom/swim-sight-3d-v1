import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LockedFeatureCard({
  title,
  description,
  requiredPlan,
  ctaLabel = 'Request access',
  badge = 'Premium',
  compact = false,
}) {
  return (
    <div className={`rounded-xl border border-amber-200 bg-amber-50 text-amber-900 ${compact ? 'p-3' : 'p-4'} space-y-3`}>
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white text-amber-700">
          <Lock className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-bold">{title}</div>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
              <Sparkles className="h-3 w-3" />
              {badge}
            </span>
          </div>
          {description && <p className="mt-1 text-xs leading-relaxed text-amber-800">{description}</p>}
          {requiredPlan && (
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
              Required plan: {requiredPlan}
            </p>
          )}
        </div>
      </div>
      <Button type="button" size="sm" variant="outline" className="h-8 border-amber-300 bg-white text-xs text-amber-800 hover:bg-amber-100" disabled>
        {ctaLabel}
      </Button>
    </div>
  );
}
