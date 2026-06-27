import React, { useState } from 'react';
import { X, Bug, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useClubContext } from '@/lib/useClubContext';
import { useAuth } from '@/lib/AuthContext';
import { SUPPORT_COPY, SUPPORT_EMAIL, buildFeedbackMailto, getDeviceSummary } from '@/lib/supportConfig';

const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const ROUTES = [
  '/dashboard', '/analyse', '/ai-reviews', '/ai-review', '/swimmers',
  '/performance', '/club-progress', '/swimmer-trends',
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
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '',
    page_route: defaultRoute || window.location.pathname,
    what_happened: '',
    what_expected: '',
    steps_to_reproduce: '',
    severity: 'medium',
    message: '',
    ai_job_involved: 'Unknown',
    report_involved: 'Unknown',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.what_happened.trim()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
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
      setDone(true);
      if (onSaved) onSaved();
    } catch {
      setSubmitError('The issue could not be saved to the pilot log. Open the prepared support email so it is not lost.');
    } finally {
      setSubmitting(false);
    }
  };

  const supportMailto = buildFeedbackMailto({
    subject: `Swim Sight 3D issue - ${form.severity}`,
    clubName: club?.name,
    coachName: user?.full_name || user?.name,
    coachEmail: user?.email,
    pageArea: form.page_route,
    severity: form.severity,
    happened: form.what_happened,
    expected: form.what_expected,
    device: getDeviceSummary(),
    aiJobInvolved: form.ai_job_involved,
    reportInvolved: form.report_involved,
    extraLines: [form.title && `Title: ${form.title}`, form.steps_to_reproduce && `Steps to reproduce: ${form.steps_to_reproduce}`, form.message && `Tester notes: ${form.message}`],
  });

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
            <div className="text-sm font-semibold text-slate-800">Issue saved to the pilot log</div>
            <p className="text-xs text-slate-500">It will appear in Coach Testing. Email delivery is not automatic.</p>
            <div className="mt-3 flex justify-center gap-2">
              <Button size="sm" variant="outline" asChild><a href={supportMailto}><Mail className="mr-1 h-3.5 w-3.5" />Email support</a></Button>
              <Button size="sm" className="bg-primary text-white" onClick={onClose}>Close</Button>
            </div>
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
            <div className="grid grid-cols-2 gap-3">
              {[
                ['ai_job_involved', 'AI job involved'],
                ['report_involved', 'Report / share / PDF'],
              ].map(([field, label]) => (
                <label key={field} className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {label}
                  <select className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs normal-case tracking-normal" value={form[field]} onChange={event => set(field, event.target.value)}>
                    <option>Unknown</option><option>Yes</option><option>No</option>
                  </select>
                </label>
              ))}
            </div>
            <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-2.5 text-[10px] leading-4 text-cyan-900">
              {SUPPORT_COPY.pilot} Support: {SUPPORT_EMAIL}
            </div>
            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                {submitError} <a className="font-semibold underline" href={supportMailto}>Open support email</a>
              </div>
            )}
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
