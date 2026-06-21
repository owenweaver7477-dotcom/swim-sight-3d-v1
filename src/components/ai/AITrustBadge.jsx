import React from 'react';
import { Brain, ShieldCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { confidenceLabel } from '@/lib/aiTrust';

const CONFIDENCE_STYLES = {
  High: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Medium: 'border-amber-200 bg-amber-50 text-amber-700',
  Low: 'border-orange-200 bg-orange-50 text-orange-700',
  Unknown: 'border-slate-200 bg-slate-50 text-slate-600',
};

export default function AITrustBadge({ confidence, compact = false }) {
  const label = confidenceLabel(confidence);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex flex-wrap items-center gap-1.5" aria-label="AI finding trust status">
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              tabIndex={0}
              className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-2 py-1 text-[10px] font-semibold text-cyan-800 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <Brain className="h-3 w-3" /> AI-assisted draft
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs leading-relaxed">
            This is an AI-assisted suggestion. A coach must review, edit, approve, or reject it before sharing.
          </TooltipContent>
        </Tooltip>
        {!compact && (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700">
            <ShieldCheck className="h-3 w-3" /> Coach review required
          </span>
        )}
        <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${CONFIDENCE_STYLES[label]}`}>
          {label} confidence
        </span>
      </div>
    </TooltipProvider>
  );
}
