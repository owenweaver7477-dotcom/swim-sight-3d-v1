import React from 'react';
import { ClipboardList, MessageCircle } from 'lucide-react';

const SCRIPT_STEPS = [
  'Ask the coach to log in and find where to upload a video.',
  'Ask them to add a swimmer.',
  'Ask them to upload or select a video.',
  'Ask them to send it for AI Review.',
  'Ask what they think the AI reliability label means.',
  'Ask them to approve, edit, or reject a finding.',
  'Ask them to add one manual finding.',
  'Ask them to add one annotation.',
  'Ask them to link one drill.',
  'Ask them to finalise a report.',
  'Ask them to open the public shared report.',
  'Ask what they would use this for at training.',
];

const DEBRIEF_QUESTIONS = [
  'What was confusing?',
  'What felt professional?',
  'What felt too AI / gimmicky?',
  'Would you trust the report?',
  'What would stop you using this weekly?',
  'What would make this worth paying for?',
  'What is missing for your squad workflow?',
];

export default function TestScriptTab() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="p-5 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-slate-900">Suggested 20-Minute Coach Test</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Sit with a real swim coach. Do not guide them — observe where they get stuck. Ask each question in sequence and note their response.
        </p>
      </div>

      {/* Script steps */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3">Test Script</div>
        <div className="space-y-2">
          {SCRIPT_STEPS.map((step, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg bg-white border border-slate-200">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <span className="text-xs text-slate-700 leading-relaxed">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Debrief questions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-4 h-4 text-primary" />
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Post-Test Debrief Questions</div>
        </div>
        <div className="space-y-2">
          {DEBRIEF_QUESTIONS.map((q, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-[11px] font-mono flex-shrink-0">Q{i + 1}</span>
              <span className="text-xs text-slate-700 leading-relaxed">{q}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
        <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider mb-2">Facilitation Tips</div>
        <ul className="space-y-1.5 text-xs text-amber-900 leading-relaxed">
          <li>• <strong>Say nothing</strong> when they get stuck — note where the confusion is.</li>
          <li>• Do not explain the AI before they see it — observe their first reaction.</li>
          <li>• Record audio or take written notes in real-time.</li>
          <li>• Use the Checklist tab to mark each step as tested or issue_found during the session.</li>
          <li>• Use "Report Issue" for any bugs you spot during the session.</li>
          <li>• Ask the coach to complete the in-app feedback form at the end.</li>
        </ul>
      </div>

      {/* Demo data note */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Demo Data — Coming Soon</div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Demo data will allow safe product demonstrations without mixing test records into real club analytics.
          For now, use a dedicated test club workspace to avoid contaminating live data.
        </p>
      </div>
    </div>
  );
}