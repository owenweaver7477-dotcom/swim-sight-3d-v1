/**
 * CoachReviewAssistantCard — right-panel coach guidance on AI Review page.
 * Surfaces review_context from the VideoUpload, generates relevant coach prompts.
 * These are coach guidance only — not AI findings, not auto-created content.
 */
import React, { useState } from 'react';
import { ClipboardList, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Circle, Share2 } from 'lucide-react';

// ── Stroke-specific review checklists ─────────────────────────────────────────
const STROKE_FOCUS_CHECKLIST = {
  Freestyle: {
    kick:       ['Check kick depth — should stay within body silhouette', 'Check kick tempo relative to stroke cycle', 'Check knee bend — avoid excessive cycling', 'Check ankle flexibility and toe point'],
    pull:       ['Check early vertical forearm (EVF) at catch', 'Check elbow position — no dropped elbow', 'Check hand path — avoid crossover past midline', 'Check finish — full extension before recovery'],
    body_line:  ['Check hip position — hips should stay high', 'Check body rotation — shoulder-to-hip', 'Check head position at rest and during breath', 'Check streamline on push-off'],
    breathing:  ['Check head rotation — not lifting', 'Check breath timing — not too early or late', 'Check opposite shoulder drop during breath', 'Check goggle position at breath'],
    timing:     ['Check catch timing relative to kick', 'Check rotation initiation — kick-driven or arm-driven', 'Check stroke rate and stroke length balance'],
    drag_risk:  ['Check head position — high head = hips drop', 'Check shoulder width at entry', 'Check hip drop during breathing', 'Check kick width at finish'],
    general:    ['Work through each phase systematically', 'Check body line first, then propulsive phases', 'Note any asymmetry left vs right'],
  },
  Breaststroke: {
    kick:       ['Check knee width — inside hip width', 'Check heel recovery path — heels to glutes', 'Check foot turn-out before kick', 'Check kick snap — feet finish together', 'Check kick width at finish'],
    pull:       ['Check outsweep width — not too wide', 'Check catch angle before insweep', 'Check insweep path — funnelling inward', 'Check recovery — elbows in, hands forward quickly'],
    body_line:  ['Check glide position — head neutral, body flat', 'Check hip position during glide', 'Check body undulation — controlled, not excessive'],
    breathing:  ['Check head lift — chin, not forehead', 'Check breath timing — at peak of pull', 'Check head returning to neutral before kick'],
    timing:     ['Check pull-kick timing — not simultaneous', 'Check glide duration — not too long or short', 'Check recovery overlap — arms and legs sequenced'],
    drag_risk:  ['Check knee width at catch', 'Check foot position at widest kick point', 'Check head lift height', 'Check shoulder position during recovery'],
    general:    ['Check glide and timing first — biggest drag source', 'Then check kick mechanics', 'Then pull and breathing coordination'],
  },
  Backstroke: {
    kick:       ['Check kick depth — hip-driven, not knee', 'Check kick tempo — 6-beat default', 'Check ankle flexibility'],
    pull:       ['Check hand entry — pinky-first, shoulder width', 'Check catch depth at entry', 'Check pull path — shoulder blade engagement', 'Check finish — past hip before exit'],
    body_line:  ['Check head position — ears in water', 'Check hip rotation — shoulder-driven', 'Check body line during kick'],
    breathing:  ['Check breath timing — every 2 or 4 strokes', 'Check head stability — no bobbing'],
    timing:     ['Check rotation timing — opposite arm entry triggers rotation', 'Check kick coordination with rotation'],
    drag_risk:  ['Check head position — chin not tucked too much', 'Check hand entry width', 'Check hip drop during stroke'],
    general:    ['Check body line and rotation first', 'Then entry and catch', 'Then kick coordination'],
  },
  Butterfly: {
    kick:       ['Check first kick timing — at entry', 'Check second kick timing — at pull', 'Check kick depth — hip-driven', 'Check knee bend — minimal'],
    pull:       ['Check entry width — shoulder width', 'Check catch depth — early press', 'Check pull path — keyhole shape', 'Check finish — full extension'],
    body_line:  ['Check undulation — chest press, not hip drop', 'Check body line during glide', 'Check streamline on push-off'],
    breathing:  ['Check breath height — chin, not head', 'Check timing — at peak of press', 'Check head return — back to neutral before entry'],
    timing:     ['Check kick-pull coordination — two kicks per cycle', 'Check breath timing relative to pull', 'Check stroke rhythm — feel the 1-2 beat'],
    drag_risk:  ['Check breath height', 'Check entry width', 'Check hip drop during recovery', 'Check kick amplitude'],
    general:    ['Check timing and rhythm first — foundation of butterfly', 'Then undulation and kick', 'Then catch and pull'],
  },
};

const FOCUS_STANDARDS = {
  kick: ['Kick recovery phase standard', 'Kick timing and tempo standard', 'Kick width / drag risk standard'],
  pull: ['Early vertical forearm standard', 'Catch angle standard', 'Finish phase standard'],
  body_line: ['Body line and streamline standard', 'Hip position standard', 'Head position standard'],
  breathing: ['Breathing timing standard', 'Head position during breath standard'],
  timing: ['Stroke cycle timing standard', 'Phase coordination standard'],
  drag_risk: ['Frontal area drag standard', 'Kick width drag risk standard', 'Head lift drag risk standard'],
  general: ['Overall technique assessment standard'],
  starts_turns: ['Wall contact standard', 'Push-off streamline standard', 'Breakout standard'],
};

const FOCUS_DRILLS = {
  kick: ['Kick drill pack — isolation kick sets', 'Kick timing drill with board', 'Ankle flexibility drill'],
  pull: ['Catch-up drill', 'Fist drill for feel', 'Single-arm pull focus drill', 'EVF sculling drill'],
  body_line: ['Streamline + push-off drill', 'Core rotation drill', 'Head position drill'],
  breathing: ['Bilateral breathing drill', 'Breath timing drill', 'Head stability drill'],
  timing: ['Tempo trainer drill', 'Pause drill at catch', 'Stroke count per length drill'],
  drag_risk: ['Narrow kick width drill', 'Head-down body line drill', 'Frontal area awareness drill'],
  general: ['Technique focus set — low intensity', 'Phase isolation drills', 'Video feedback drill set'],
  starts_turns: ['Turn approach drill', 'Streamline push drill', 'Breakout timing drill'],
};

const MANUAL_REVIEW_STEPS = [
  'Watch the full clip once without stopping',
  'Identify the single most impactful technical fault',
  'Add one main Finding with what you observe and why it matters',
  'Add a coaching cue and an assigned drill',
  'Add an annotation if a key moment is worth marking',
  'Write the next focus for the swimmer',
  'Finalise the report when all findings are reviewed',
];

const FOCUS_LABEL = {
  body_line: 'Body line',
  kick: 'Kick',
  pull: 'Pull / catch',
  breathing: 'Breathing',
  timing: 'Timing',
  starts_turns: 'Starts & turns',
  drag_risk: 'Drag risk',
  general: 'General review',
};

const SESSION_LABEL = {
  training: 'Training session',
  race: 'Race footage',
  skills: 'Skills / drills',
  test_set: 'Test set',
  other: 'Other',
};

const OUTPUT_LABEL = {
  coach_notes_only: 'Coach notes only',
  swimmer_report: 'Swimmer report',
  parent_friendly_report: 'Parent-friendly report',
  squad_feedback: 'Squad feedback',
};

export default function CoachReviewAssistantCard({ video, report, findings = [], sharedLinks = [], onScrollToFindings, onScrollToSummary, onScrollToShare }) {
  const [checklistOpen, setChecklistOpen] = useState(true);

  const isUnreliable = report?.analysis_mode === 'error' ||
    report?.analysis_mode === 'placeholder' ||
    (report?.real_pose_detected === false && report?.analysis_mode !== 'real_pose');

  const stroke = video?.stroke_type || 'Freestyle';
  const reportContext = report?.review_context || {};
  const focus = video?.primary_focus || reportContext.primary_focus || 'general';
  const reviewGoal = video?.review_goal || reportContext.review_goal;
  const sessionType = video?.session_type || reportContext.session_type;
  const reportDepth = video?.report_depth || reportContext.report_depth;
  const coachQuestion = video?.coach_question || reportContext.coach_question;
  const injuryNote = video?.injury_or_limitations_note || reportContext.injury_or_limitations_note;
  const desiredOutput = video?.desired_output || reportContext.desired_output;
  const strokeFocus = video?.stroke_focus || reportContext.stroke_focus;
  const specificConcern = video?.specific_concern || reportContext.specific_concern;
  const raceTrainingContext = video?.race_training_context || reportContext.race_training_context;

  const pendingCount = findings.filter(f => f.approval_status === 'pending').length;
  const approvedCount = findings.filter(f => f.approval_status === 'approved').length;
  const rejectedCount = findings.filter(f => f.approval_status === 'rejected').length;
  const manualCount = findings.filter(f => f.source === 'coach' || f.source === 'manual').length;
  const aiCount = findings.filter(f => f.source === 'ai').length;
  const hasSummary = Boolean(report?.coach_summary || report?.technical_summary);
  const hasNextFocus = Boolean(report?.next_focus);
  const isFinalised = ['coach_approved', 'finalised', 'published', 'shared'].includes(report?.status);
  const hasShareLink = sharedLinks.some(link => link.status === 'active');

  const steps = [
    { done: Boolean(video), label: 'Video preview checked' },
    { done: Boolean(report?.analysis_mode), label: 'AI reliability reviewed' },
    { done: aiCount === 0 || pendingCount === 0, label: 'All AI findings approved or rejected' },
    { done: approvedCount > 0 || manualCount > 0, label: 'Coach-approved finding added' },
    { done: findings.some(f => f.drill || f.linked_drill_title), label: 'Drill linked or intentionally skipped' },
    { done: hasSummary, label: 'Coach summary written' },
    { done: hasNextFocus, label: 'Next focus written' },
    { done: isFinalised, label: 'Report finalised' },
    { done: hasShareLink, label: 'Shared link created if needed' },
  ];
  const completeSteps = steps.filter(step => step.done).length;

  let suggestedNextStep = 'Review pending AI findings';
  let nextAction = onScrollToFindings;
  if (pendingCount > 0) {
    suggestedNextStep = 'Review pending AI findings';
    nextAction = onScrollToFindings;
  } else if (approvedCount === 0 && manualCount === 0) {
    suggestedNextStep = 'Add a manual coach finding';
    nextAction = onScrollToFindings;
  } else if (!findings.some(f => f.drill || f.linked_drill_title)) {
    suggestedNextStep = 'Link a drill to a finding';
    nextAction = onScrollToFindings;
  } else if (!hasSummary || !hasNextFocus) {
    suggestedNextStep = 'Write summary and next focus';
    nextAction = onScrollToSummary;
  } else if (!isFinalised) {
    suggestedNextStep = 'Finalise coach report';
    nextAction = onScrollToShare;
  } else if (!hasShareLink) {
    suggestedNextStep = 'Create shared report link';
    nextAction = onScrollToShare;
  } else {
    suggestedNextStep = 'Report is ready to share';
    nextAction = onScrollToShare;
  }

  const hasContext = !!(reviewGoal || sessionType || focus !== 'general' || coachQuestion || strokeFocus || specificConcern || raceTrainingContext);

  const strokeChecklist = STROKE_FOCUS_CHECKLIST[stroke]?.[focus] || STROKE_FOCUS_CHECKLIST['Freestyle']?.general || [];
  const standards = FOCUS_STANDARDS[focus] || FOCUS_STANDARDS.general;
  const drills = FOCUS_DRILLS[focus] || FOCUS_DRILLS.general;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden text-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary flex-shrink-0" />
          <div>
            <div className="text-xs font-bold text-slate-800">Coach Review Assistant</div>
            <div className="text-[10px] text-slate-500">Review guidance — not an AI finding</div>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100">

        {/* Review context summary */}
        {hasContext && (
          <div className="px-4 py-3 space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Review Context</div>
            {reviewGoal && (
              <div>
                <span className="text-[10px] text-slate-500">Goal: </span>
                <span className="text-[11px] text-slate-800">{reviewGoal}</span>
              </div>
            )}
            {sessionType && (
              <div>
                <span className="text-[10px] text-slate-500">Session: </span>
                <span className="text-[11px] text-slate-700">{SESSION_LABEL[sessionType] || sessionType}</span>
              </div>
            )}
            {focus && focus !== 'general' && (
              <div>
                <span className="text-[10px] text-slate-500">Focus: </span>
                <span className="text-[11px] font-semibold text-primary">{FOCUS_LABEL[focus] || focus}</span>
              </div>
            )}
            {strokeFocus && (
              <div>
                <span className="text-[10px] text-slate-500">Stroke focus: </span>
                <span className="text-[11px] text-slate-700">{strokeFocus}</span>
              </div>
            )}
            {raceTrainingContext && (
              <div>
                <span className="text-[10px] text-slate-500">Context: </span>
                <span className="text-[11px] text-slate-700">{raceTrainingContext}</span>
              </div>
            )}
            {reportDepth && (
              <div>
                <span className="text-[10px] text-slate-500">Depth: </span>
                <span className="text-[11px] text-slate-700">{reportDepth === 'quick_review' ? 'Quick review' : 'Full report'}</span>
              </div>
            )}
            {desiredOutput && (
              <div>
                <span className="text-[10px] text-slate-500">Output: </span>
                <span className="text-[11px] text-slate-700">{OUTPUT_LABEL[desiredOutput] || desiredOutput}</span>
              </div>
            )}
            {coachQuestion && (
              <div className="mt-1.5 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="text-[10px] font-semibold text-blue-700 mb-0.5">Coach question</div>
                <div className="text-[11px] text-blue-800 leading-relaxed">{coachQuestion}</div>
              </div>
            )}
            {specificConcern && (
              <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                <div className="text-[10px] font-semibold text-slate-700 mb-0.5">Specific concern</div>
                <div className="text-[11px] text-slate-700 leading-relaxed">{specificConcern}</div>
              </div>
            )}
            {injuryNote && (
              <div className="p-2 bg-amber-50 border border-amber-100 rounded-lg">
                <div className="text-[10px] font-semibold text-amber-700 mb-0.5">Injury / limitations</div>
                <div className="text-[11px] text-amber-800 leading-relaxed">{injuryNote}</div>
              </div>
            )}
          </div>
        )}

        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Assistant Status</div>
              <div className="text-[11px] text-slate-600 mt-0.5">{completeSteps}/{steps.length} review steps complete</div>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              isUnreliable ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'
            }`}>
              {isUnreliable ? 'Manual review' : 'AI evidence ready'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {[
              ['Pending', pendingCount],
              ['Approved', approvedCount],
              ['Rejected', rejectedCount],
              ['Manual', manualCount],
            ].map(([label, value]) => (
              <div key={label} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-sm font-bold text-slate-900">{value}</div>
                <div className="text-[9px] text-slate-500">{label}</div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={nextAction}
            className="w-full text-left p-2.5 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
          >
            <div className="text-[10px] font-semibold text-primary uppercase tracking-wider">Suggested next step</div>
            <div className="text-xs font-semibold text-slate-800 mt-0.5">{suggestedNextStep}</div>
          </button>
          <div className="space-y-1.5">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                {step.done
                  ? <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                  : <Circle className="w-3 h-3 text-slate-300 flex-shrink-0 mt-0.5" />
                }
                <span className={`text-[10px] leading-relaxed ${step.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{step.label}</span>
              </div>
            ))}
          </div>
          {hasShareLink && (
            <div className="flex items-center gap-1.5 text-[10px] text-green-700 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1.5">
              <Share2 className="w-3 h-3" /> Public-safe shared link is active.
            </div>
          )}
        </div>

        {/* Unreliable pose — manual review guidance */}
        {isUnreliable && (
          <div className="px-4 py-3">
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] font-semibold text-amber-800">Pose was unreliable</div>
                <div className="text-[10px] text-amber-700 leading-relaxed mt-0.5">Continue with manual coach review below.</div>
              </div>
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Manual Review Steps</div>
            <div className="space-y-1.5">
              {MANUAL_REVIEW_STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-slate-300 w-4 flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-[11px] text-slate-700 leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested review checklist */}
        {strokeChecklist.length > 0 && (
          <div className="px-4 py-3">
            <button
              type="button"
              className="w-full flex items-center justify-between mb-2"
              onClick={() => setChecklistOpen(o => !o)}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Suggested Checklist — {stroke} {FOCUS_LABEL[focus] || ''}
              </div>
              {checklistOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            {checklistOpen && (
              <>
                <div className="space-y-1.5 mb-2">
                  {strokeChecklist.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 flex-shrink-0 mt-1.5" />
                      <span className="text-[11px] text-slate-700 leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-slate-400 italic">Coach guidance — not an AI finding.</div>
              </>
            )}
          </div>
        )}

        {/* Suggested standards */}
        <div className="px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Suggested Standards to Check</div>
          <div className="space-y-1">
            {standards.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0 mt-1.5" />
                <span className="text-[11px] text-slate-600">{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested drill categories */}
        <div className="px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Suggested Drill Categories</div>
          <div className="space-y-1">
            {drills.map((d, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0 mt-1.5" />
                <span className="text-[11px] text-slate-600">{d}</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-slate-400 italic mt-2">Coach guidance — link drills via the Drill Library.</div>
        </div>

      </div>
    </div>
  );
}
