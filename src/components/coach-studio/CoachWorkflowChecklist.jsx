import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

export default function CoachWorkflowChecklist({ items = [], localOnly = true }) {
  return (
    <div className="space-y-2">
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {localOnly ? 'Local pilot checklist' : 'Workflow checklist'}
      </div>
      {items.map(item => {
        const done = Boolean(item.done);
        return (
          <div key={item.label} className="flex items-start gap-2 text-[11px] leading-5 text-slate-600">
            {done
              ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-600" aria-hidden="true" />
              : <Circle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-300" aria-hidden="true" />}
            <span className={done ? 'text-slate-800' : ''}>{item.label}</span>
          </div>
        );
      })}
      {localOnly && (
        <p className="text-[9px] leading-4 text-slate-400">This guide reflects the current page state and is not stored as a separate club record.</p>
      )}
    </div>
  );
}
