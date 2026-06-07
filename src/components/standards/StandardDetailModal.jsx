import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Target, BookOpen, Tag, CheckCircle2, Edit2, Copy, AlertTriangle } from 'lucide-react';

const STROKE_COLORS = {
  Freestyle:    'bg-blue-50 text-blue-700 border-blue-200',
  Breaststroke: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Backstroke:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  Butterfly:    'bg-purple-50 text-purple-700 border-purple-200',
  IM:           'bg-amber-50 text-amber-700 border-amber-200',
  General:      'bg-slate-50 text-slate-700 border-slate-200',
};

function Section({ icon: Icon, title, children, color = 'text-primary' }) {
  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${color}`}>
        <Icon className="w-3.5 h-3.5" />
        {title}
      </div>
      {children}
    </div>
  );
}

function TextBlock({ text }) {
  if (!text) return <p className="text-xs text-slate-400 italic">Not specified</p>;
  const lines = text.split('·').map(l => l.trim()).filter(Boolean);
  if (lines.length <= 1) return <p className="text-xs text-slate-600 leading-relaxed">{text}</p>;
  return (
    <ul className="space-y-1">
      {lines.map((l, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
          <span className="w-1 h-1 rounded-full bg-slate-400 flex-shrink-0 mt-1.5" />
          {l}
        </li>
      ))}
    </ul>
  );
}

export default function StandardDetailModal({ standard, onClose, onEdit, onDuplicate, isDefault }) {
  const strokeColor = STROKE_COLORS[standard.stroke] || STROKE_COLORS.General;
  const dragZones = standard.linked_drag_zones?.split(',').map(z => z.trim()).filter(Boolean) || [];
  const faultTags = standard.linked_fault_tags?.split(',').map(t => t.trim()).filter(Boolean) || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-8 pb-4 px-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${strokeColor}`}>
                  {standard.stroke}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                  {standard.phase}
                </span>
                {standard.difficulty_level && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                    {standard.difficulty_level}
                  </span>
                )}
                {isDefault && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                    Default Reference
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900">{standard.title}</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-100 flex-shrink-0">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div className="flex gap-2 mt-3">
            {!isDefault && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onEdit(standard)}>
                <Edit2 className="w-3 h-3 mr-1" /> Edit
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onDuplicate(standard)}>
              <Copy className="w-3 h-3 mr-1" /> {isDefault ? 'Duplicate to Club' : 'Duplicate'}
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">

          {standard.technical_goal && (
            <Section icon={Target} title="Technical Goal">
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-xs text-slate-700 leading-relaxed">{standard.technical_goal}</p>
              </div>
            </Section>
          )}

          {standard.key_positions && (
            <Section icon={BookOpen} title="Key Positions">
              <TextBlock text={standard.key_positions} />
            </Section>
          )}

          {standard.coach_cues && (
            <Section icon={BookOpen} title="Coach Cues" color="text-primary">
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <TextBlock text={standard.coach_cues} />
              </div>
            </Section>
          )}

          {standard.common_faults && (
            <Section icon={AlertTriangle} title="Common Faults" color="text-red-600">
              <TextBlock text={standard.common_faults} />
            </Section>
          )}

          {faultTags.length > 0 && (
            <Section icon={Tag} title="Fault Tags">
              <div className="flex flex-wrap gap-1.5">
                {faultTags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                    {t}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {dragZones.length > 0 && (
            <Section icon={Tag} title="Linked Drag Zones">
              <div className="flex flex-wrap gap-1.5">
                {dragZones.map(z => (
                  <span key={z} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    {z}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {standard.success_criteria && (
            <Section icon={CheckCircle2} title="Success Criteria" color="text-green-700">
              <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                <TextBlock text={standard.success_criteria} />
              </div>
            </Section>
          )}

          {standard.scoring_guidance && (
            <Section icon={BookOpen} title="Scoring Guidance (Coach Notes)">
              <TextBlock text={standard.scoring_guidance} />
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}