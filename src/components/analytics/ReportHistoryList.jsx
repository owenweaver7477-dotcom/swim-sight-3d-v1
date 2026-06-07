import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, FileText, ExternalLink, ChevronDown, ChevronUp, FlaskConical } from 'lucide-react';
import { format } from 'date-fns';
import { activeCompletedReports, reportSourceLabel, PENDING_STATUSES } from './analyticsHelpers';

const SEVERITY_STYLE = {
  low:      'text-green-700 bg-green-100',
  medium:   'text-amber-700 bg-amber-100',
  high:     'text-orange-700 bg-orange-100',
  critical: 'text-red-700 bg-red-100',
};

function ReportRow({ report, findings }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isCompleted = !PENDING_STATUSES.includes(report.status);
  const isPlaceholder = report.analysis_mode === 'placeholder';

  const topFindings = findings
    .filter(f => f.approval_status === 'approved' && f.included_in_report !== false && !f.is_deleted)
    .slice(0, 3);

  const nextFocuses = findings
    .filter(f => f.approval_status === 'approved' && f.next_focus && !f.is_deleted)
    .slice(0, 2)
    .map(f => f.next_focus);

  const dateStr = report.ai_completed_at || report.updated_date || report.created_date;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Row header */}
      <div className="flex items-center gap-3 p-3 bg-white">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isCompleted ? 'bg-green-100' : 'bg-secondary'
        }`}>
          {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <Clock className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-foreground truncate">{report.title || 'Coach Report'}</span>
            {isPlaceholder && (
              <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                <FlaskConical className="w-2.5 h-2.5" /> Coach-reviewed report
              </span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {dateStr && format(new Date(dateStr), 'dd MMM yyyy')}
            {report.overall_score != null && (
              <span className="ml-2 font-semibold text-primary">Score: {report.overall_score}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm" variant="outline"
            className="h-6 text-[10px] px-2"
            onClick={() => navigate(`/ai-review?report_id=${report.id}`)}
          >
            Open <ExternalLink className="w-2.5 h-2.5 ml-1" />
          </Button>
          {(topFindings.length > 0 || nextFocuses.length > 0) && (
            <button
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(o => !o)}
            >
              {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {open && (topFindings.length > 0 || nextFocuses.length > 0) && (
        <div className="px-3 pb-3 pt-0 border-t border-border bg-secondary/30 space-y-2">
          {topFindings.length > 0 && (
            <div className="pt-2">
              <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Top Approved Findings</div>
              <div className="space-y-1">
                {topFindings.map(f => (
                  <div key={f.id} className="flex items-center gap-1.5">
                    {f.severity && (
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-semibold ${SEVERITY_STYLE[f.severity] || ''}`}>
                        {f.severity}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">{f.finding_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {nextFocuses.length > 0 && (
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Next Focus</div>
              {nextFocuses.map((nf, i) => (
                <div key={i} className="text-[10px] text-foreground">• {nf}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReportHistoryList({ swimmerReports, allFindings }) {
  // Only show non-deleted reports, sorted by date descending
  const visible = swimmerReports
    .filter(r => !r.is_deleted)
    .sort((a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date));

  const completed = activeCompletedReports(visible);
  const pending = visible.filter(r => !completed.includes(r));

  const findingsForReport = (reportId) =>
    allFindings.filter(f => f.report_id === reportId);

  if (visible.length === 0) return null;

  return (
    <div className="p-4 rounded-xl bg-white border border-border space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">Report History</span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {completed.length} completed · {pending.length} in progress
        </span>
      </div>

      {completed.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Coach-Approved</div>
          {completed.map(r => (
            <ReportRow key={r.id} report={r} findings={findingsForReport(r.id)} />
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">In Progress / Pending</div>
          {pending.map(r => (
            <ReportRow key={r.id} report={r} findings={findingsForReport(r.id)} />
          ))}
        </div>
      )}
    </div>
  );
}