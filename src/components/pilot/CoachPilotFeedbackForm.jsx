import React, { useEffect, useState } from 'react';
import { MessageSquareText, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const RATINGS = [1, 2, 3, 4, 5];
const YES_NO_MAYBE = ['Yes', 'No', 'Maybe'];
const PRICING_REACTIONS = [
  'Would not pay yet',
  'Could pay for individual coach',
  'Could pay as club tool',
  'Needs more proof first',
];
const EMPTY_FEEDBACK = {
  overallUsefulness: null,
  reportClarity: null,
  aiDraftUsefulness: null,
  approvalWorkflowClarity: null,
  reportReadiness: null,
  biggestMissingFeature: '',
  mostConfusingPart: '',
  useAgain: '',
  recommend: '',
  pricingReaction: '',
};

function RatingRow({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <div className="grid grid-cols-5 gap-1.5" role="group" aria-label={`${label} rating`}>
        {RATINGS.map(rating => (
          <button
            key={rating}
            type="button"
            aria-label={`${rating} out of 5`}
            onClick={() => onChange(rating)}
            className={`h-10 w-10 rounded-md border text-xs font-bold ${
              value === rating
                ? 'border-cyan-600 bg-cyan-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-300'
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );
}

function readLocalRecord(storageKey) {
  try {
    const value = window.localStorage.getItem(storageKey);
    return value ? { ...EMPTY_FEEDBACK, ...JSON.parse(value) } : EMPTY_FEEDBACK;
  } catch {
    return EMPTY_FEEDBACK;
  }
}

export default function CoachPilotFeedbackForm({ storageKey, onSaved }) {
  const [feedback, setFeedback] = useState(EMPTY_FEEDBACK);
  const [savedAt, setSavedAt] = useState('');
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    const stored = readLocalRecord(storageKey);
    setFeedback(stored);
    setSavedAt(stored.savedAt || '');
  }, [storageKey]);

  const update = (field, value) => setFeedback(current => ({ ...current, [field]: value }));
  const save = () => {
    const next = { ...feedback, savedAt: new Date().toISOString() };
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setFeedback(next);
      setSavedAt(next.savedAt);
      setStorageError('');
      onSaved?.(next);
    } catch {
      setStorageError('This browser could not save the feedback. Keep the page open and record the answers separately.');
    }
  };
  const clear = () => {
    try {
      window.localStorage.removeItem(storageKey);
      setFeedback(EMPTY_FEEDBACK);
      setSavedAt('');
      setStorageError('');
      onSaved?.(null);
    } catch {
      setStorageError('This browser could not clear the locally saved feedback.');
    }
  };

  const labelClass = 'mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500';

  return (
    <section id="feedback" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <MessageSquareText className="h-4 w-4 text-cyan-700" /> Coach pilot feedback
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
            Rate the workflow after the 15-minute session. Responses stay in this browser until cleared.
          </p>
        </div>
        {savedAt && <span className="text-[10px] text-emerald-700">Saved on this device</span>}
      </div>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
        Pilot feedback is for product validation only. It does not train the AI automatically and should not include private medical information.
      </div>

      {storageError && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{storageError}</p>}

      <div className="mt-4 space-y-2">
        <RatingRow label="Overall usefulness" value={feedback.overallUsefulness} onChange={value => update('overallUsefulness', value)} />
        <RatingRow label="Report clarity" value={feedback.reportClarity} onChange={value => update('reportClarity', value)} />
        <RatingRow label="AI draft usefulness" value={feedback.aiDraftUsefulness} onChange={value => update('aiDraftUsefulness', value)} />
        <RatingRow label="Coach approval workflow clarity" value={feedback.approvalWorkflowClarity} onChange={value => update('approvalWorkflowClarity', value)} />
        <RatingRow label="Parent / swimmer report readiness" value={feedback.reportReadiness} onChange={value => update('reportReadiness', value)} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Biggest missing feature</span>
          <Textarea className="min-h-24 border-slate-200 text-sm" value={feedback.biggestMissingFeature} onChange={event => update('biggestMissingFeature', event.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Most confusing part</span>
          <Textarea className="min-h-24 border-slate-200 text-sm" value={feedback.mostConfusingPart} onChange={event => update('mostConfusingPart', event.target.value)} />
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {[
          ['useAgain', 'Would use again'],
          ['recommend', 'Would recommend to another coach'],
        ].map(([field, label]) => (
          <div key={field}>
            <span className={labelClass}>{label}</span>
            <div className="grid grid-cols-3 gap-2">
              {YES_NO_MAYBE.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => update(field, option)}
                  className={`min-h-11 rounded-md border px-2 text-xs font-semibold ${
                    feedback[field] === option
                      ? 'border-cyan-600 bg-cyan-50 text-cyan-800'
                      : 'border-slate-200 text-slate-600 hover:border-cyan-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <span className={labelClass}>Pricing reaction</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {PRICING_REACTIONS.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => update('pricingReaction', option)}
              className={`min-h-11 rounded-md border px-3 text-left text-xs font-semibold ${
                feedback.pricingReaction === option
                  ? 'border-cyan-600 bg-cyan-50 text-cyan-800'
                  : 'border-slate-200 text-slate-600 hover:border-cyan-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="min-h-11 text-xs" onClick={clear}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear local feedback
        </Button>
        <Button type="button" className="min-h-11 bg-cyan-700 text-xs text-white hover:bg-cyan-800" onClick={save}>
          <Save className="mr-1.5 h-3.5 w-3.5" /> Save on this device
        </Button>
      </div>
    </section>
  );
}
