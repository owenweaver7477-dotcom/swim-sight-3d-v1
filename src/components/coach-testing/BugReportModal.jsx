import React, { useState } from 'react';
import { X, Bug, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useClubContext } from '@/lib/useClubContext';

const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const ROUTES = [
  '/dashboard', '/analyse', '/ai-reviews', '/ai-review', '/swimmers',
  '/performance', '/club-progress', '/swimmer-trends', '/technical-standards',
  '/drill-library', '/club-settings', '/coach-testing', '/reference-library',
];

const SEV_STYLE = {
  low: 'border-slate-300 text-slate-600',
  medium: 'border-amber-300 text-amber-700',
  high: 'border-red-300 text-red-600',
  critical: 'border-red-500 text-red-700 font-bold',
};

export default function BugReportModal({ onClose, onSaved, defaultRoute }) {
  const { club } = useClubContext();
  const [form, setForm] = useState({
    title: '',
    page_route: defaultRoute || window.location.pathname,
    what_happened: '',
    what_expected: '',
    steps_to_reproduce: '',
    severity: 'medium',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.what_happened.trim()) return;
    setSubmitting(true);
    const user = await base44.auth.me();
    await base44.entities.CoachFeedback.create({
      club_id: club?.id || '',
      user_id: user?.id || '',
      page_route: form.page_route,
      feedback_type: 'bug',
      title: form.title || undefined,
      message: form.message || form.what_happened,
      what_happened: form.what_happened,
      what_expected: form.what_expected || undefined,
      steps_to_reproduce: form.steps_to_reproduce || undefined,
      severity: form.severity,
      status: 'new',
    });
    setSubmitting(false);
    setDone(true);
    if (onSaved) onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold text-slate-900">Report Issue</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>

        {done ? (
          <div className="py-6 text-center space-y-2">
            <div className="text-2xl">✓</div>
            <div className="text-sm font-semibold text-slate-800">Issue reported</div>
            <p className="text-xs text-slate-500">It will appear in the Bugs tab of Coach Testing.</p>
            <Button size="sm" className="mt-3 bg-primary text-white" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Issue Title (optional)</label>
              <input className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Short title…" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Page / Route</label>
              <select className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary bg-white" value={form.page_route} onChange={e => set('page_route', e.target.value)}>
                {/* Deduplicate: show defaultRoute in list only once */}
                {[...new Set([...ROUTES, form.page_route])].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">What happened? <span className="text-red-400">*</span></label>
              <textarea className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none" rows={2} placeholder="Describe what went wrong…" value={form.what_happened} onChange={e => set('what_happened', e.target.value)} required />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">What did you expect?</label>
              <textarea className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none" rows={2} placeholder="What should have happened…" value={form.what_expected} onChange={e => set('what_expected', e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Steps to reproduce</label>
              <textarea className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none" rows={2} placeholder="1. Go to…&#10;2. Click…&#10;3. See error" value={form.steps_to_reproduce} onChange={e => set('steps_to_reproduce', e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Severity</label>
              <div className="flex gap-2 flex-wrap">
                {SEVERITIES.map(s => (
                  <button key={s} type="button" onClick={() => set('severity', s)}
                    className={`text-[11px] px-3 py-1 rounded-full border capitalize transition-colors ${form.severity === s ? (s === 'critical' || s === 'high' ? 'bg-red-500 text-white border-red-500' : s === 'medium' ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-500 text-white border-slate-500') : SEV_STYLE[s] || 'border-slate-200 text-slate-600'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Tester notes (optional)</label>
              <textarea className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none" rows={2} placeholder="Any extra context…" value={form.message} onChange={e => set('message', e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" type="button" variant="outline" className="h-8 text-xs" onClick={onClose}>Cancel</Button>
              <Button size="sm" type="submit" className="h-8 text-xs bg-red-600 hover:bg-red-500 text-white" disabled={submitting || !form.what_happened.trim()}>
                {submitting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                {submitting ? 'Saving…' : 'Report Issue'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}