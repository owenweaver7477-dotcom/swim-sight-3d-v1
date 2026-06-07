import React, { useState } from 'react';
import { X, MessageSquare, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useClubContext } from '@/lib/useClubContext';
import { useAuth } from '@/lib/AuthContext';

const FEEDBACK_TYPES = [
  { value: 'usability',          label: 'Usability' },
  { value: 'visual_design',      label: 'Visual Design' },
  { value: 'workflow_confusion', label: 'Workflow Confusion' },
  { value: 'ai_trust',           label: 'AI Trust' },
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

export default function FeedbackModal({ onClose, pageRoute }) {
  const { club } = useClubContext();
  const { user } = useAuth();
  const [form, setForm] = useState({
    feedback_type: 'usability',
    rating: null,
    title: '',
    message: '',
    severity: '',
    screenshot_note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) return;
    setSubmitting(true);
    await base44.entities.CoachFeedback.create({
      club_id: club?.id || '',
      user_id: user?.id || '',
      page_route: pageRoute || window.location.pathname,
      feedback_type: form.feedback_type,
      rating: form.rating || undefined,
      title: form.title || undefined,
      message: form.message,
      screenshot_note: form.screenshot_note || undefined,
      severity: form.feedback_type === 'bug' && form.severity ? form.severity : undefined,
      status: 'new',
    });
    setSubmitting(false);
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mb-0 sm:mb-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-slate-900">Send Feedback</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="py-6 text-center space-y-2">
            <div className="text-2xl">✓</div>
            <div className="text-sm font-semibold text-slate-800">Thanks for your feedback!</div>
            <p className="text-xs text-slate-500">Your input helps improve Swim Sight 3D.</p>
            <Button size="sm" className="mt-3 bg-primary text-white" onClick={onClose}>Close</Button>
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

            <div className="flex gap-2 justify-end pt-1">
              <Button size="sm" type="button" variant="outline" className="h-8 text-xs" onClick={onClose}>Cancel</Button>
              <Button size="sm" type="submit" className="h-8 text-xs bg-primary text-white" disabled={submitting || !form.message.trim()}>
                {submitting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                {submitting ? 'Sending…' : 'Send Feedback'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
