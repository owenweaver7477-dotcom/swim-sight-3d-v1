import React from 'react';
import { ChevronDown, Eye, ShieldCheck } from 'lucide-react';
import { confidenceLabel } from '@/lib/aiTrust';

const UNSAFE_TEXT = /https?:\/\/|signed[_ -]?url|file[_ -]?path|\/Users\/|\/home\/|token=|\braw[_ -]?(?:payload|landmarks?)\b/i;

function safeText(value, maxLength = 260) {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  if (!text || UNSAFE_TEXT.test(text)) return '';
  return text.slice(0, maxLength);
}

function safeTextList(value) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list.map(item => safeText(item)).filter(Boolean).slice(0, 4);
}

function evidenceFrames(finding) {
  const rawEvidence = finding?.raw_ai_payload?.evidence || {};
  const candidates = [
    finding?.evidence_frames,
    finding?.evidence_frame_indices,
    rawEvidence.evidence_frames,
    rawEvidence.frame_indices,
    finding?.frame_index,
    rawEvidence.frame_index,
  ].flatMap(value => Array.isArray(value) ? value : value != null ? [value] : []);

  return Array.from(new Set(candidates
    .map(Number)
    .filter(value => Number.isFinite(value) && value >= 0)
    .map(value => Math.round(value))))
    .slice(0, 8);
}

function displayLabel(value) {
  return safeText(String(value || ''), 80)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

export default function FindingEvidencePanel({ finding }) {
  const raw = finding?.raw_ai_payload || {};
  const rawEvidence = raw.evidence || {};
  const frames = evidenceFrames(finding);
  const phase = finding?.phase || finding?.stroke_phase || rawEvidence.phase || raw.phase;
  const cycle = finding?.cycle_idx ?? rawEvidence.cycle_idx ?? raw.cycle_idx;
  const reasons = safeTextList(
    finding?.why_flagged
      || finding?.evidence_reasons
      || raw.why_flagged
      || rawEvidence.evidence_note
      || finding?.measurement_summary
  );
  const suppliedLimitations = safeTextList(finding?.known_limitations || raw.known_limitations);
  const limitations = suppliedLimitations.length
    ? suppliedLimitations
    : [
        'Single-camera video can hide depth, body position, or part of the stroke.',
        'Confidence is a review aid and does not guarantee the suggestion is correct.',
      ];
  const hasEvidence = frames.length > 0 || reasons.length > 0 || phase || cycle != null;

  return (
    <details className="group rounded-lg border border-slate-200 bg-slate-50/70">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-800">
        <Eye className="h-3.5 w-3.5 text-cyan-700" />
        <span className="flex-1">Why this finding?</span>
        <span className="text-[10px] font-medium text-slate-500">{confidenceLabel(finding?.confidence_score)} confidence</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-500 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 border-t border-slate-200 px-3 py-3 text-[11px] leading-relaxed text-slate-600">
        {!hasEvidence && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-amber-800">
            Evidence is limited for this finding. Review the clip manually before approving.
          </div>
        )}

        {(phase || cycle != null) && (
          <div className="flex flex-wrap gap-2">
            {phase && <span className="rounded-full bg-white px-2 py-1 font-medium text-slate-700">Phase: {displayLabel(phase)}</span>}
            {cycle != null && <span className="rounded-full bg-white px-2 py-1 font-medium text-slate-700">Approx cycle: {Number(cycle) + 1}</span>}
          </div>
        )}

        {frames.length > 0 && (
          <div>
            <div className="font-semibold text-slate-800">Evidence frames</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {frames.map(frame => (
                <span key={frame} className="rounded bg-white px-2 py-1 font-mono text-[10px] text-slate-700">Frame {frame}</span>
              ))}
            </div>
          </div>
        )}

        {reasons.length > 0 && (
          <div>
            <div className="font-semibold text-slate-800">Why it was flagged</div>
            <ul className="mt-1 space-y-1">
              {reasons.map(reason => <li key={reason}>• {reason}</li>)}
            </ul>
          </div>
        )}

        <div>
          <div className="font-semibold text-slate-800">Known limitations</div>
          <ul className="mt-1 space-y-1">
            {limitations.map(limitation => <li key={limitation}>• {limitation}</li>)}
          </ul>
        </div>

        <div className="rounded-md border border-cyan-200 bg-cyan-50 p-2.5 text-cyan-900">
          <div className="mb-1 flex items-center gap-1 font-semibold"><ShieldCheck className="h-3 w-3" /> Coach action</div>
          Approve if the clip confirms it. Edit useful but unclear wording. Reject it if the issue is not visible or technically correct.
        </div>
      </div>
    </details>
  );
}
