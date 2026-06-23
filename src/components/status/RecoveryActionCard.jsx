import React from 'react';
import { ArrowRight, CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RecoveryActionCard({
  title = 'Continue safely',
  message,
  primaryLabel = 'Continue manual review',
  onPrimary,
  secondaryLabel,
  onSecondary,
  secondaryDisabled = false,
  secondaryHint,
  tone = 'warning',
}) {
  const toneClass = tone === 'critical'
    ? 'border-red-200 bg-red-50 text-red-950'
    : 'border-amber-200 bg-amber-50 text-amber-950';

  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <div className="flex items-start gap-2">
        <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold">{title}</div>
          {message && <p className="mt-1 text-[11px] leading-5">{message}</p>}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            {onPrimary && (
              <Button type="button" size="sm" className="min-h-10 text-xs" onClick={onPrimary}>
                {primaryLabel}<ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            )}
            {secondaryLabel && (
              <Button type="button" size="sm" variant="outline" className="min-h-10 bg-white text-xs" onClick={onSecondary} disabled={secondaryDisabled}>
                {secondaryLabel}
              </Button>
            )}
          </div>
          {secondaryHint && <p className="mt-2 text-[10px] leading-4 opacity-80">{secondaryHint}</p>}
        </div>
      </div>
    </div>
  );
}
