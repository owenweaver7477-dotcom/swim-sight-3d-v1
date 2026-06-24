import React from 'react';
import { AlertTriangle, CheckCircle2, Eye, ShieldAlert } from 'lucide-react';

const AREAS = [
  { area: 'Public site', status: 'Ready for controlled pilot', note: 'Public trust and sample content are available without private club data.' },
  { area: 'Login / auth', status: 'Ready for controlled pilot', note: 'Protected coach routes retain authentication and role checks.' },
  { area: 'Dashboard', status: 'Ready for controlled pilot', note: 'Coach navigation and review entry points are available.' },
  { area: 'Coach Studio', status: 'Usable with manual fallback', note: 'Nine-stage workflow, timestamps, findings, drills, and report approval are available.' },
  { area: 'Manual review', status: 'Ready for controlled pilot', note: 'Manual findings and reports do not depend on AI completion.' },
  { area: 'AI review', status: 'Needs backend verification', note: 'Use only after Render health and callback completion are production-verified.' },
  { area: 'Feedback / support', status: 'Ready for controlled pilot', note: 'Feedback can be saved and opened as a structured email to support.' },
  { area: 'Reports', status: 'Ready for controlled pilot', note: 'Coach approval remains required before finalisation.' },
  { area: 'Sharing / export', status: 'Usable with manual fallback', note: 'Use coach-approved content only and test secure links while logged out.' },
  { area: 'Drills / standards', status: 'Ready for controlled pilot', note: 'Stroke, start, turn, underwater, cue, and evidence structures are available.' },
  { area: 'Backend worker', status: 'Needs backend verification', note: 'Needs production verification before live pilot AI use.' },
  { area: 'Consent / safeguarding', status: 'Blocked', note: 'Minor footage remains blocked whenever consent records cannot be confirmed.' },
  { area: 'Elite Studio', status: 'Preview only', note: 'Reference visualisation only; not used for pilot findings or reports.' },
];

const STATUS_STYLE = {
  'Ready for controlled pilot': 'border-emerald-200 bg-emerald-50 text-emerald-800',
  'Usable with manual fallback': 'border-cyan-200 bg-cyan-50 text-cyan-800',
  'Needs backend verification': 'border-amber-200 bg-amber-50 text-amber-900',
  Blocked: 'border-red-200 bg-red-50 text-red-800',
  'Preview only': 'border-violet-200 bg-violet-50 text-violet-800',
};

function iconFor(status) {
  if (status === 'Ready for controlled pilot') return CheckCircle2;
  if (status === 'Preview only') return Eye;
  if (status === 'Blocked') return ShieldAlert;
  return AlertTriangle;
}

export default function PilotReadinessGate() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5" aria-labelledby="pilot-readiness-gate-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">Pilot readiness gate</div>
          <h2 id="pilot-readiness-gate-title" className="mt-1 text-base font-bold text-slate-900">Controlled manual pilot first</h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">The app can support a controlled coach-led workflow. Live AI use remains blocked until the Render worker is production-verified.</p>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-900">AI not yet production verified</span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {AREAS.map(item => {
          const Icon = iconFor(item.status);
          return (
            <article key={item.area} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900">{item.area}</h3>
                <Icon className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" aria-hidden="true" />
              </div>
              <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold ${STATUS_STYLE[item.status]}`}>{item.status}</span>
              <p className="mt-2 text-[10px] leading-4 text-slate-600">{item.note}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
