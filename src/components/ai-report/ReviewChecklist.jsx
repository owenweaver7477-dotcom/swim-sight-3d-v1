import React, { useState } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronRight, ClipboardList } from 'lucide-react';

function Item({ done, label }) {
  return (
    <div className="flex items-center gap-2">
      {done
        ? <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
        : <Circle className="w-3 h-3 text-muted-foreground flex-shrink-0" />
      }
      <span className={`text-[11px] ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{label}</span>
    </div>
  );
}

export default function ReviewChecklist({ report, video, findings, sharedLinks = [] }) {
  const [open, setOpen] = useState(true);

  const approvedFindings = findings.filter(f => f.approval_status === 'approved');
  const pendingFindings  = findings.filter(f => f.approval_status === 'pending');
  const aiFindings       = findings.filter(f => f.source === 'ai');
  // "AI suggestions reviewed" = all AI findings have been actioned (none left pending)
  const aiSuggestionsReviewed = aiFindings.length === 0 || pendingFindings.filter(f => f.source === 'ai').length === 0;
  const hasFinding = approvedFindings.length > 0 || findings.some(f => f.source === 'coach' || f.source === 'manual');
  const hasDrill = approvedFindings.some(f => f.drill || f.linked_drill_title);
  const hasSummary = !!(report?.coach_summary || report?.technical_summary);
  const hasNextFocus = !!report?.next_focus;
  const isFinalised      = ['coach_approved', 'finalised', 'published', 'shared'].includes(report?.status);
  const hasShareLink = sharedLinks.some(link => link.status === 'active');

  const ITEMS = [
    { done: !!video, label: 'Video preview checked' },
    { done: !!report?.analysis_mode, label: 'AI reliability reviewed' },
    { done: aiSuggestionsReviewed, label: 'All AI findings approved / rejected' },
    { done: hasFinding, label: 'Approved coach finding or intentional no-finding review' },
    { done: hasDrill, label: 'Drill linked or intentionally skipped' },
    { done: hasSummary, label: 'Coach summary written' },
    { done: hasNextFocus, label: 'Next focus written' },
    { done: isFinalised, label: 'Report finalised' },
    { done: hasShareLink, label: 'Shared link created if needed' },
  ];

  const doneCount = ITEMS.filter(i => i.done).length;

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <button
        className="w-full flex items-center justify-between"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Review Progress</span>
          <span className="text-[10px] text-muted-foreground">{doneCount}/{ITEMS.length}</span>
        </div>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="mt-3 space-y-1.5 border-t border-border pt-3">
          {ITEMS.map((item, i) => <Item key={i} done={item.done} label={item.label} />)}
        </div>
      )}
    </div>
  );
}
