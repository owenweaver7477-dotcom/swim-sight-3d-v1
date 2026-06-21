import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useClubContext } from '@/lib/useClubContext';
import { Loader2, Star, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

const TYPE_LABELS = {
  usability: 'Usability', visual_design: 'Visual Design', workflow_confusion: 'Workflow',
  ai_trust: 'AI Trust', report_quality: 'Report Quality', bug: 'Bug', feature_request: 'Feature',
};

const STATUS_STYLES = {
  new:        'bg-blue-50 text-blue-700 border-blue-200',
  reviewed:   'bg-amber-50 text-amber-700 border-amber-200',
  resolved:   'bg-green-50 text-green-700 border-green-200',
  wont_fix:   'bg-slate-100 text-slate-500 border-slate-200',
};

const SEV_STYLE = {
  low:      'bg-slate-100 text-slate-600',
  medium:   'bg-amber-50 text-amber-700',
  high:     'bg-red-50 text-red-600',
  critical: 'bg-red-100 text-red-700 font-bold',
};

function FeedbackRow({ item }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const update = async (status) => {
    await base44.entities.CoachFeedback.update(item.id, { status });
    qc.invalidateQueries({ queryKey: ['coach-feedback'] });
  };

  return (
    <>
      <tr className={`border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer ${item.severity === 'critical' ? 'bg-red-50/30' : ''}`} onClick={() => setExpanded(!expanded)}>
        <td className="py-2.5 px-3 text-[11px] text-slate-500 whitespace-nowrap">
          {format(new Date(item.created_date), 'dd MMM')}
        </td>
        <td className="py-2.5 px-3 text-[11px] text-slate-600 max-w-[80px] truncate">{item.page_route}</td>
        <td className="py-2.5 px-3">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{TYPE_LABELS[item.feedback_type] || item.feedback_type}</span>
        </td>
        <td className="py-2.5 px-3">
          {item.rating && (
            <span className="flex items-center gap-0.5">
              {[1,2,3,4,5].map(n => <Star key={n} className={`w-3 h-3 ${n <= item.rating ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />)}
            </span>
          )}
        </td>
        <td className="py-2.5 px-3">
          {item.severity && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize ${SEV_STYLE[item.severity] || ''}`}>{item.severity}</span>
          )}
        </td>
        <td className="py-2.5 px-3 text-[11px] text-slate-700 max-w-xs">
          <span className="line-clamp-1">{item.title || item.message}</span>
        </td>
        <td className="py-2.5 px-3">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border capitalize ${STATUS_STYLES[item.status] || STATUS_STYLES.new}`}>
            {item.status.replace('_', ' ')}
          </span>
        </td>
        <td className="py-2.5 px-3 text-right">
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50/80 border-b border-slate-100">
          <td colSpan={8} className="px-4 py-3">
            <div className="space-y-2 text-xs text-slate-700">
              {item.title && <div><span className="font-semibold">Title:</span> {item.title}</div>}
              <div><span className="font-semibold">Message:</span> {item.message}</div>
              {item.what_happened && <div><span className="font-semibold">What happened:</span> {item.what_happened}</div>}
              {item.what_expected && <div><span className="font-semibold">Expected:</span> {item.what_expected}</div>}
              {item.steps_to_reproduce && <div><span className="font-semibold">Steps:</span> {item.steps_to_reproduce}</div>}
              {item.screenshot_note && <div><span className="font-semibold">Screenshot note:</span> {item.screenshot_note}</div>}
              <div className="flex gap-2 pt-1 flex-wrap">
                {['reviewed', 'resolved', 'wont_fix'].map(s => (
                  <button key={s} onClick={() => update(s)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border capitalize transition-colors ${item.status === s ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:border-primary/30'}`}>
                    Mark {s.replace('_',' ')}
                  </button>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function FeedbackTab({ bugMode = false }) {
  const { club } = useClubContext();
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: rawFeedback = [], isLoading } = useQuery({
    queryKey: ['coach-feedback', club?.id],
    queryFn: () => base44.entities.CoachFeedback.filter({ club_id: club.id }, '-created_date', 100),
    enabled: !!club?.id,
  });

  const feedback = rawFeedback.filter(f => {
    if (bugMode && f.feedback_type !== 'bug') return false;
    if (!bugMode && f.feedback_type === 'bug') return false; // bugs in separate tab
    if (filterType !== 'all' && f.feedback_type !== filterType) return false;
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    return true;
  });

  const criticalOpen = rawFeedback.filter(f => f.feedback_type === 'bug' && f.severity === 'critical' && f.status !== 'resolved' && f.status !== 'wont_fix').length;

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {criticalOpen > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          <span className="font-bold">⚠ {criticalOpen} critical bug{criticalOpen > 1 ? 's' : ''} unresolved</span>
          <span className="text-red-500">— V1 readiness is blocked until resolved</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {!bugMode && (
          <div className="flex gap-1 flex-wrap">
            {['all', ...Object.keys(TYPE_LABELS).filter(k => k !== 'bug')].map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`text-[10px] px-2 py-1 rounded-full border capitalize transition-colors ${filterType === t ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:border-primary/30'}`}>
                {t === 'all' ? 'All Types' : TYPE_LABELS[t] || t}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-1">
          {['all', 'new', 'reviewed', 'resolved', 'wont_fix'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`text-[10px] px-2 py-1 rounded-full border capitalize transition-colors ${filterStatus === s ? 'bg-slate-700 text-white border-slate-700' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}>
              {s === 'all' ? 'All Status' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {feedback.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-slate-300 text-center text-sm text-slate-500">
          {bugMode ? 'No bug reports yet.' : 'No feedback yet.'}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Date','Page','Type','Rating','Severity','Message','Status',''].map(h => (
                  <th key={h} className="py-2 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {feedback.map(f => <FeedbackRow key={f.id} item={f} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}