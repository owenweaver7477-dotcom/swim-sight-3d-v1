import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tag, Dumbbell, ChevronRight, Plus, ArrowRight } from 'lucide-react';

const STROKE_COLORS = {
  Freestyle:    'bg-blue-100 text-blue-700 border-blue-200',
  Breaststroke: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  Backstroke:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  Butterfly:    'bg-purple-100 text-purple-700 border-purple-200',
  IM:           'bg-orange-100 text-orange-700 border-orange-200',
  General:      'bg-slate-100 text-slate-600 border-slate-200',
};

const DIFF_COLORS = {
  Beginner:     'bg-green-100 text-green-700',
  Intermediate: 'bg-blue-100 text-blue-700',
  Advanced:     'bg-orange-100 text-orange-700',
  Elite:        'bg-red-100 text-red-700',
};

const STEPS = ['Awareness', 'Control', 'Timing', 'Speed', 'Full-stroke transfer'];

export default function DrillPackModal({ pack, matchedDrills = [], onClose, onOpenDrill, assignMode, onAssignDrill }) {
  const [selectedIdx, setSelectedIdx] = useState(null);

  if (!pack) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-200">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Dumbbell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${STROKE_COLORS[pack.stroke] || STROKE_COLORS.General}`}>
                  {pack.stroke}
                </span>
                <span className="text-[10px] text-muted-foreground bg-slate-100 px-2 py-0.5 rounded">
                  {pack.phases.join(' · ')}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">{pack.title}</h2>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{pack.objective}</p>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Faults addressed */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-2 flex items-center gap-1.5">
              <Tag className="w-3 h-3" /> Faults Addressed
            </div>
            <div className="flex flex-wrap gap-1.5">
              {pack.faults.map(f => (
                <span key={f} className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-medium">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Coaching sequence */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Recommended Sequence</div>
            <div className="flex gap-1 flex-wrap mb-4">
              {STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-1">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                    <span className="text-[10px] text-slate-600 font-medium">{step}</span>
                  </div>
                  {i < STEPS.length - 1 && <ArrowRight className="w-3 h-3 text-slate-300 flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>

          {/* Drill list */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
              Drills in this pack ({matchedDrills.length})
            </div>
            {matchedDrills.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No matching drills found in your library for this pack.</p>
            ) : (
              <div className="space-y-2">
                {matchedDrills.map((drill, idx) => (
                  <div
                    key={drill.id}
                    className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedIdx === idx
                        ? 'bg-primary/5 border-primary/40'
                        : 'bg-white border-slate-200 hover:border-primary/30'
                    }`}
                    onClick={() => setSelectedIdx(selectedIdx === idx ? null : idx)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-sm font-semibold text-slate-900">{drill.title}</span>
                          {drill.difficulty && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${DIFF_COLORS[drill.difficulty] || ''}`}>
                              {drill.difficulty}
                            </span>
                          )}
                          {drill.equipment && drill.equipment !== 'none' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                              {drill.equipment}
                            </span>
                          )}
                        </div>
                        {drill.purpose && (
                          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{drill.purpose}</p>
                        )}
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-400 flex-shrink-0 mt-1 transition-transform ${selectedIdx === idx ? 'rotate-90' : ''}`} />
                    </div>

                    {selectedIdx === idx && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5 pl-9">
                        {drill.coaching_cues && (
                          <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                            <div className="text-[10px] uppercase tracking-wider text-primary mb-1">Coaching Cues</div>
                            {drill.coaching_cues.split('|').map((c, i) => (
                              <div key={i} className="text-xs text-slate-800 font-medium">"{c.trim()}"</div>
                            ))}
                          </div>
                        )}
                        {drill.duration_or_reps && (
                          <div className="text-xs text-slate-500">
                            <span className="font-medium text-slate-700">Volume:</span> {drill.duration_or_reps}
                          </div>
                        )}
                        {drill.common_mistakes && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-amber-600 mb-1">Watch for</div>
                            {drill.common_mistakes.split('|').slice(0, 2).map((m, i) => (
                              <div key={i} className="text-xs text-slate-500 flex items-start gap-1">
                                <span className="text-amber-400 mt-0.5">•</span>{m.trim()}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onOpenDrill(drill)}>
                            Full Detail
                          </Button>
                          {assignMode && (
                            <Button size="sm" className="h-7 text-xs bg-primary text-white" onClick={() => { onAssignDrill(drill); onClose(); }}>
                              <Plus className="w-3 h-3 mr-1" /> Assign
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* When to use / not to use */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-green-50 border border-green-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-green-700 mb-1.5">When to use</div>
              <p className="text-xs text-green-800 leading-relaxed">{pack.whenToUse}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">When to hold off</div>
              <p className="text-xs text-slate-600 leading-relaxed">{pack.whenNotToUse}</p>
            </div>
          </div>

          {/* Primary cue */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1.5">Primary Coaching Cue</div>
            <p className="text-sm font-semibold text-slate-900">"{pack.primaryCue}"</p>
          </div>
        </div>

        <div className="px-6 pb-6">
          <Button variant="outline" className="w-full" onClick={onClose}>Close Pack</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}