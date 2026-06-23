/**
 * ReviewSetupPanel — compact coach review context form
 * Shown on Analyse > Step 1 (Upload Video), before sending for AI Review.
 * Saves review_context fields to the VideoUpload record.
 * Non-blocking — coach can skip or return later.
 */
import React, { useEffect, useState } from 'react';
import entities from '@/lib/data/entities';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
  { value: 'starts', label: 'Starts — manual focus' },
  { value: 'turns', label: 'Turns — manual focus' },
  { value: 'race_skills', label: 'Race skills — manual focus' },
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

const REVIEW_MODE_OPTIONS = [
  { value: 'ai_review', label: 'AI Review' },
  { value: 'manual_review', label: 'Manual review only' },
];

const SWIMMER_LEVEL_OPTIONS = [
  { value: 'junior', label: 'Junior' },
  { value: 'age_group', label: 'Age group' },
  { value: 'competitive', label: 'Competitive' },
  { value: 'elite', label: 'Elite' },
  { value: 'masters', label: 'Masters' },
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

export default function ReviewSetupPanel({ videoUploadId, initialContext = {}, value, onChange, stroke, cameraAngle }) {
  const [open, setOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [context, setContext] = useState({
    review_goal: initialContext.review_goal || '',
    session_type: initialContext.session_type || '',
    primary_focus: initialContext.primary_focus || '',
    stroke_focus: initialContext.stroke_focus || '',
    camera_angle_context: initialContext.camera_angle_context || '',
    swimmer_level: initialContext.swimmer_level || '',
    coach_notes_context: initialContext.coach_notes_context || '',
    specific_concern: initialContext.specific_concern || '',
    race_training_context: initialContext.race_training_context || '',
    review_mode: initialContext.review_mode || 'ai_review',
    report_depth: initialContext.report_depth || 'full_report',
    coach_question: initialContext.coach_question || '',
    injury_or_limitations_note: initialContext.injury_or_limitations_note || '',
    desired_output: initialContext.desired_output || 'swimmer_report',
    ...(value || {}),
  });

  useEffect(() => {
    if (value) setContext(prev => ({ ...prev, ...value }));
  }, [value]);

  const updateContext = (patch) => {
    setContext(prev => {
      const next = { ...prev, ...patch };
      onChange?.(next);
      return next;
    });
  };

  const hasAnyInput = !!(
    context.review_goal || context.session_type || context.primary_focus || context.coach_question ||
    context.stroke_focus || context.coach_notes_context || context.specific_concern || context.race_training_context
  );

  const handleSave = async () => {
    if (!videoUploadId) return;
    setSaving(true);
    try {
      await entities.VideoUpload.update(videoUploadId, {
        review_context: {
          ...context,
          stroke_focus: context.stroke_focus || stroke || null,
          camera_angle_context: context.camera_angle_context || cameraAngle || null,
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
              onChange={e => updateContext({ review_goal: e.target.value })}
              placeholder="e.g. Check breaststroke kick timing, freestyle body-line, breakout and first 15m…"
              className="text-xs bg-slate-50 border-slate-200 resize-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Stroke focus</label>
              <Input
                value={context.stroke_focus || stroke || ''}
                onChange={e => updateContext({ stroke_focus: e.target.value })}
                placeholder="e.g. Pull timing, kick width, catch timing"
                className="text-xs bg-slate-50 border-slate-200"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Camera angle note</label>
              <Input
                value={context.camera_angle_context || cameraAngle || ''}
                onChange={e => updateContext({ camera_angle_context: e.target.value })}
                placeholder="e.g. side angle, above water"
                className="text-xs bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          {/* Q2 — Session type */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">
              Type of footage
            </label>
            <ChipGroup options={SESSION_TYPE_OPTIONS} value={context.session_type} onChange={v => updateContext({ session_type: v })} />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Swimmer level</label>
            <ChipGroup options={SWIMMER_LEVEL_OPTIONS} value={context.swimmer_level} onChange={v => updateContext({ swimmer_level: v })} />
          </div>

          {/* Q3 — Primary focus */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">
              Primary focus area
            </label>
            <ChipGroup options={FOCUS_OPTIONS} value={context.primary_focus} onChange={v => updateContext({ primary_focus: v })} />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Review path</label>
            <ChipGroup options={REVIEW_MODE_OPTIONS} value={context.review_mode} onChange={v => updateContext({ review_mode: v || 'ai_review' })} />
          </div>

          {/* Q4 — Report depth */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">
              Quick review or full report?
            </label>
            <ChipGroup options={DEPTH_OPTIONS} value={context.report_depth} onChange={v => updateContext({ report_depth: v })} />
          </div>

          {/* Q5 — Coach question */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">
              Anything specific the review should address?
            </label>
            <Textarea
              value={context.coach_question}
              onChange={e => updateContext({ coach_question: e.target.value })}
              placeholder="e.g. Is her heel recovery getting higher? Is head position affecting body line?"
              className="text-xs bg-slate-50 border-slate-200 resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Specific concern</label>
            <Textarea
              value={context.specific_concern}
              onChange={e => updateContext({ specific_concern: e.target.value })}
              placeholder="e.g. Timing breaks down under fatigue, knees drift wide, breath is late."
              className="text-xs bg-slate-50 border-slate-200 resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Race / training context</label>
            <Textarea
              value={context.race_training_context}
              onChange={e => updateContext({ race_training_context: e.target.value })}
              placeholder="e.g. race pace 50m breaststroke, easy technique set, post-fatigue review."
              className="text-xs bg-slate-50 border-slate-200 resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Private coach notes / context</label>
            <Textarea
              value={context.coach_notes_context}
              onChange={e => updateContext({ coach_notes_context: e.target.value })}
              placeholder="Private context for the coach. This is not shown on the public shared report."
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
              onChange={e => updateContext({ injury_or_limitations_note: e.target.value })}
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
            <ChipGroup options={OUTPUT_OPTIONS} value={context.desired_output} onChange={v => updateContext({ desired_output: v })} />
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
