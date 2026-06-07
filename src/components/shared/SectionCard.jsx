import React from 'react';
import { cn } from '@/lib/utils';

/**
 * SectionCard — standard white card with optional title, subtitle, and action.
 * Use for all major content blocks to ensure consistent layout.
 */
export default function SectionCard({ title, subtitle, action, children, className, noPad = false }) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-100">
          <div>
            {title && <div className="text-sm font-semibold text-slate-800">{title}</div>}
            {subtitle && <div className="text-[11px] text-slate-500 mt-0.5">{subtitle}</div>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPad ? '' : 'p-5'}>{children}</div>
    </div>
  );
}