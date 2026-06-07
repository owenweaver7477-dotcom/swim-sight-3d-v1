/**
 * ReviewSetupPanel — compact coach review context form
 * Shown on Analyse > Step 1 (Upload Video), before sending for AI Review.
 * Saves review_context fields to the VideoUpload record.
 * Non-blocking — coach can skip or return later.
 */
import React, { useState } from 'react';
import entities from '@/lib/data/entities';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardList, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

const SESSION_TYPE_OPTIONS = [
  { value: 'training', label: 'Training' },
  { value: 'race', label: 'Race footage' },
  { value: 'skills', label: 'Skills / drills' },
  { value: 'test_set', label: 'Test set' },
  { value: 'other', label: 'Other' },
];

const FOCUS_OPTIONS = [
  { value: 'body_line', label: 'Body line' },
  { value: 'kick', label: 'Kick' },
  { value: 'pull', label: 'Pull / catch' },
  { value: 'breathing', label: 'Breathing' },
  { value: 'timing', label: 'Timing' },
  { value: 'starts_turns', label: 'Starts & turns' },
  { value: 'drag_risk', label: 'Drag risk' },
  { value: 'general', label: 'General review' },
];

const DEPTH_OPTIONS = [
  { value: 'quick_review', label: 'Quick review' },
  { value: 'full_report', label: 'Full report' },
];

const OUTPUT_OPTIONS = [
  { value: 'coach_notes_only', label: 'Coach notes only' },
  { value: 'swimmer_report', label: 'Swimmer report' },
  { value: 'parent_friendly_report', label: 'Parent-friendly report' },
  { value: 'squad_feedback', label: 'Squad feedback' },
];

function ChipGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(value === o.value ? '' : o.value)}
          className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
            value === o.value
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function ReviewSetupPanel({ videoUploadId, initialContext = {} }) {
  const [open, setOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [context, setContext] = useState({
    review_goal: initialContext.review_goal || '',
    session_type: initialContext.session_type || '',
    primary_focus: initialContext.primary_focus || '',
    report_depth: initialContext.report_depth || 'full_report',
    coach_question: initialContext.coach_question || '',
    injury_or_limitations_note: initialContext.injury_or_limitations_note || '',
    desired_output: initialContext.desired_output || 'swimmer_report',
  });

  const hasAnyInput = !!(
    context.review_goal || context.session_type || context.primary_focus || context.coach_question
  );

  const handleSave = async () => {
    if (!videoUploadId) return;
    setSaving(true);
    try {
      await entities.VideoUpload.update(videoUploadId, {
        review_context: {
          ...context,
          review_context_completed: hasAnyInput,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-5 rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="text-left">
            <div className="text-xs font-semibold text-slate-800">Review Setup</div>
            <div className="text-[10px] text-slate-500">
              {hasAnyInput ? 'Context added — helps produce a clearer report' : 'Optional — adding context improves report clarity'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasAnyInput && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100">
          <p className="text-[10px] text-slate-500 pt-3 leading-relaxed">
            Adding review context helps produce a clearer coach report. All fields are optional.
          </p>

          {/* Q1 — Goal */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">
              What is the main goal of this review?
            </label>
            <Textarea
              value={context.review_goal}
              onChange={e => setContext(p => ({ ...p, review_goal: e.target.value }))}
              placeholder="e.g. Check if kick is narrowing after last session's drill focus…"
              className="text-xs bg-slate-50 border-slate-200 resize-none"
              rows={2}
            />
          </div>

          {/* Q2 — Session type */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">
              Type of footage
            </label>
            <ChipGroup options={SESSION_TYPE_OPTIONS} value={context.session_type} onChange={v => setContext(p => ({ ...p, session_type: v }))} />
          </div>

          {/* Q3 — Primary focus */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">
              Primary focus area
            </label>
            <ChipGroup options={FOCUS_OPTIONS} value={context.primary_focus} onChange={v => setContext(p => ({ ...p, primary_focus: v }))} />
          </div>

          {/* Q4 — Report depth */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">
              Quick review or full report?
            </label>
            <ChipGroup options={DEPTH_OPTIONS} value={context.report_depth} onChange={v => setContext(p => ({ ...p, report_depth: v }))} />
          </div>

          {/* Q5 — Coach question */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">
              Anything specific the review should address?
            </label>
            <Textarea
              value={context.coach_question}
              onChange={e => setContext(p => ({ ...p, coach_question: e.target.value }))}
              placeholder="e.g. Is her heel recovery getting higher? Is head position affecting body line?"
              className="text-xs bg-slate-50 border-slate-200 resize-none"
              rows={2}
            />
          </div>

          {/* Injury note */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">
              Injury or limitations note <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <Textarea
              value={context.injury_or_limitations_note}
              onChange={e => setContext(p => ({ ...p, injury_or_limitations_note: e.target.value }))}
              placeholder="e.g. Left shoulder still recovering — avoid full pull load"
              className="text-xs bg-slate-50 border-slate-200 resize-none"
              rows={1}
            />
          </div>

          {/* Desired output */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">
              Who is the report for?
            </label>
            <ChipGroup options={OUTPUT_OPTIONS} value={context.desired_output} onChange={v => setContext(p => ({ ...p, desired_output: v }))} />
          </div>

          {/* Save */}
          {videoUploadId && (
            <Button
              size="sm"
              className="bg-primary text-white text-xs h-8"
              onClick={handleSave}
              disabled={saving}
            >
              {saved ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Saved</> : saving ? 'Saving…' : 'Save Review Context'}
            </Button>
          )}
          {!videoUploadId && (
            <p className="text-[10px] text-slate-400 italic">Upload a video first to save context.</p>
          )}
        </div>
      )}
    </div>
  );
}
