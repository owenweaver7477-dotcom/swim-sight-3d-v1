import React, { useState } from 'react';
import { X, MessageSquare, Star, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useClubContext } from '@/lib/useClubContext';
import { useAuth } from '@/lib/AuthContext';
import { SUPPORT_COPY, SUPPORT_EMAIL, buildFeedbackMailto, getDeviceSummary } from '@/lib/supportConfig';

const FEEDBACK_TYPES = [
  { value: 'usability',          label: 'Usability' },
  { value: 'visual_design',      label: 'Visual Design' },
  { value: 'workflow_confusion', label: 'Workflow Confusion' },
  { value: 'ai_trust',           label: 'Review quality' },
  { value: 'report_quality',     label: 'Report Quality' },
  { value: 'bug',                label: 'Bug' },
  { value: 'feature_request',    label: 'Feature Request' },
];

const SEVERITIES = ['low', 'medium', 'high', 'critical'];

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? null : n)}
          className={`transition-colors ${n <= (value || 0) ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}
        >
          <Star className="w-5 h-5 fill-current" />
        </button>
      ))}
    </div>
  );
}

// pilot_feedback.severity accepts only: blocker | annoying | suggestion.
function mapSeverity(feedbackType, severity) {
  if (severity === 'critical' || severity === 'high') return 'blocker';
  if (severity === 'medium') return 'annoying';
  if (feedbackType === 'bug') return 'annoying';
  return 'suggestion';
}

export default function FeedbackModal({ onClose, pageRoute }) {
  const { club, memberRole } = useClubContext();
  const { user } = useAuth();
  const [form, setForm] = useState({
    feedback_type: 'usability',
    rating: null,
    title: '',
    message: '',
    expected: '',
    severity: '',
    screenshot_note: '',
    ai_job_involved: 'Unknown',
    report_involved: 'Unknown',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      // Pilot feedback lands in Supabase (pilot_feedback, RLS: coach roles insert own rows).
      const detailLines = [
        form.title && `Title: ${form.title}`,
        `Type: ${form.feedback_type}`,
        form.rating && `Rating: ${form.rating}/5`,
        `Page: ${pageRoute || window.location.pathname}`,
        `AI job involved: ${form.ai_job_involved} · Report/share/PDF involved: ${form.report_involved}`,
      ].filter(Boolean).join('\n');
      const { error } = await supabase.from('pilot_feedback').insert({
        club_id: club?.id || null,
        user_id: user?.id || null,
        name: user?.full_name || user?.name || null,
        role: memberRole || null,
        club_squad: club?.name || null,
        device_used: getDeviceSummary(),
        flow_tested: detailLines,
        what_was_confusing: `${form.message}${form.expected ? `\nExpected: ${form.expected}` : ''}`,
        bug_description: form.feedback_type === 'bug' ? form.message : null,
        screenshot_or_link: form.screenshot_note || null,
        severity: mapSeverity(form.feedback_type, form.severity),
        follow_up_ok: true,
      });
      if (error) throw error;
      setDone(true);
    } catch {
      setSubmitError('The pilot log could not be saved. Open the prepared support email so this feedback is not lost.');
    } finally {
      setSubmitting(false);
    }
  };

  const supportMailto = buildFeedbackMailto({
    subject: `Swim Sight 3D ${form.feedback_type} feedback`,
    clubName: club?.name,
    coachName: user?.full_name || user?.name,
    coachEmail: user?.email,
    pageArea: pageRoute || window.location.pathname,
    severity: form.severity || form.feedback_type,
    happened: form.message,
    expected: form.expected,
    device: getDeviceSummary(),
    aiJobInvolved: form.ai_job_involved,
    reportInvolved: form.report_involved,
    extraLines: [form.title && `Title: ${form.title}`, form.screenshot_note && `Screenshot note: ${form.screenshot_note}`],
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mb-0 sm:mb-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-slate-900">Feedback for Support</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="py-6 text-center space-y-2">
            <div className="text-2xl">✓</div>
            <div className="text-sm font-semibold text-slate-800">Feedback saved to the pilot log</div>
            <p className="text-xs text-slate-500">{SUPPORT_COPY.saved}</p>
            <div className="mt-3 flex justify-center gap-2">
              <Button size="sm" variant="outline" asChild><a href={supportMailto}><Mail className="mr-1 h-3.5 w-3.5" />Email support</a></Button>
              <Button size="sm" className="bg-primary text-white" onClick={onClose}>Close</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Type</label>
              <div className="flex flex-wrap gap-1.5">
                {FEEDBACK_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set('feedback_type', t.value)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                      form.feedback_type === t.value
                        ? 'bg-primary text-white border-primary'
                        : 'border-slate-200 text-slate-600 hover:border-primary/40'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Rating (optional)</label>
              <StarRating value={form.rating} onChange={v => set('rating', v)} />
            </div>

            {/* Title */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Title (optional)</label>
              <input
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Short summary…"
                value={form.title}
                onChange={e => set('title', e.target.value)}
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Message <span className="text-red-400">*</span></label>
              <textarea
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                rows={3}
                placeholder="What did you notice?"
                value={form.message}
                onChange={e => set('message', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">What did you expect?</label>
              <textarea
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                rows={2}
                placeholder="Describe the expected result or next action."
                value={form.expected}
                onChange={e => set('expected', e.target.value)}
              />
            </div>

            {/* Bug severity */}
            {form.feedback_type === 'bug' && (
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Severity</label>
                <div className="flex gap-1.5">
                  {SEVERITIES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set('severity', s === form.severity ? '' : s)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-full border capitalize transition-colors ${
                        form.severity === s
                          ? s === 'critical' || s === 'high' ? 'bg-red-500 text-white border-red-500'
                          : s === 'medium' ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-slate-500 text-white border-slate-500'
                          : 'border-slate-200 text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Screenshot note */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Screenshot note (optional)</label>
              <input
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Describe what you'd screenshot…"
                value={form.screenshot_note}
                onChange={e => set('screenshot_note', e.target.value)}
              />
            </div>

            <div className="text-[10px] text-slate-400">Page: {pageRoute || window.location.pathname}</div>

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

            <div className="flex gap-2 justify-end pt-1">
              <Button size="sm" type="button" variant="outline" className="h-8 text-xs" onClick={onClose}>Cancel</Button>
              <Button size="sm" type="submit" className="h-8 text-xs bg-primary text-white" disabled={submitting || !form.message.trim()}>
                {submitting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                {submitting ? 'Saving…' : 'Save Feedback'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
