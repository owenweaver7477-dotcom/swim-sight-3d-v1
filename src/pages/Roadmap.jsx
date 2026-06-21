import React from 'react';
import { CheckCircle2, FlaskConical, ShieldX } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';

const STATUS_SECTIONS = [
  {
    title: 'Current private pilot',
    description: 'Available for controlled coach testing with safeguarding and coach approval in place.',
    icon: CheckCircle2,
    style: 'border-emerald-200 bg-emerald-50/60 text-emerald-700',
    items: [
      'Private coach video review workflow',
      'Private video storage with short-lived signed playback access',
      'AI-assisted draft findings that require a coach decision',
      'Manual Coach Studio findings, key moments, Coach Draw, cues, and drills',
      'Club swimmers, squads, reports, and role-based workspaces',
      'Public-safe shared reports with expiry and revocation controls',
      'Safeguarding, consent, retention, and deletion controls',
    ],
  },
  {
    title: 'In validation',
    description: 'Internal evaluation work that must improve on representative footage before broader use.',
    icon: FlaskConical,
    style: 'border-sky-200 bg-sky-50/60 text-sky-700',
    items: [
      'AI pose reliability across representative real swim clips',
      'Stroke-phase context for breaststroke, freestyle, backstroke, and butterfly',
      'Coach feedback records for evaluating accepted, edited, and rejected draft findings',
      'Optional known-distance calibration for internal comparison',
      'Quality thresholds for manual review when video evidence is weak',
    ],
  },
  {
    title: 'Not claimed',
    description: 'These statements are outside the product promise and must not be presented as live capability.',
    icon: ShieldX,
    style: 'border-slate-200 bg-slate-50 text-slate-700',
    items: [
      'Automated coaching without coach oversight',
      'Medical diagnosis or clinical performance advice',
      'Validated 3D biomechanics from a single camera',
      'Measured hydrodynamics or exact drag force',
      'Guaranteed swimmer improvement or automatic correction',
    ],
  },
];

export default function Roadmap() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader
        eyebrow="Owner view"
        title="Product Status"
        subtitle="A plain-language view of what is ready for a private coach pilot, what still needs validation, and what Swim Sight 3D does not claim."
      />

      <div className="mb-6 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-xs leading-6 text-cyan-950">
        <strong className="block text-sm text-slate-950">AI suggests. Coaches decide.</strong>
        AI-assisted findings remain drafts until a coach approves, edits, or rejects them. Weak evidence stays in manual review, and only coach-approved content can be shared.
      </div>

      <div className="grid gap-4">
        {STATUS_SECTIONS.map(({ title, description, icon: Icon, style, items }) => (
          <section key={title} className={`rounded-xl border p-5 ${style}`}>
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <h2 className="text-base font-bold text-slate-950">{title}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
              </div>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {items.map(item => (
                <li key={item} className="rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-xs leading-5 text-slate-700">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-6 text-xs leading-5 text-slate-500">
        This status view describes the current product boundary for controlled testing. It is not evidence of clinical, biomechanical, or competitive performance outcomes.
      </p>
    </div>
  );
}
