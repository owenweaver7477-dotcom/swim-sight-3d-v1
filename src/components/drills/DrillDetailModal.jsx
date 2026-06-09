import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tag, Dumbbell, Check, Plus, AlertTriangle } from 'lucide-react';

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

export default function DrillDetailModal({ drill, onClose, onAssignDrill, assignMode, assignedDrillId, contextLabel }) {
  if (!drill) return null;
  const already = assignedDrillId === drill.id;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white p-0">
        {/* Context banner */}
        {contextLabel && (
          <div className="px-5 py-2.5 bg-primary/5 border-b border-primary/20 text-xs text-primary font-medium">
            Adding drill to: <span className="font-bold">{contextLabel}</span>
          </div>
        )}

        <div className="px-5 pt-5 pb-2">
          {/* Header badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className={`text-[10px] font-semibold px-2 py-1 rounded border ${STROKE_COLORS[drill.stroke] || 'bg-secondary text-muted-foreground border-border'}`}>
              {drill.stroke}
            </span>
            {drill.phase && drill.phase !== 'General' && (
              <span className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">{drill.phase}</span>
            )}
            {drill.difficulty && (
              <span className={`text-[10px] px-2 py-1 rounded font-medium ${DIFF_COLORS[drill.difficulty] || 'bg-slate-100 text-slate-600'}`}>{drill.difficulty}</span>
            )}
            {drill.equipment && drill.equipment !== 'none' && (
              <span className="text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-500 border border-slate-200">{drill.equipment}</span>
            )}
          </div>

          <h2 className="text-lg font-bold text-slate-900 mb-1">{drill.title}</h2>

          {drill.purpose && (
            <p className="text-sm text-slate-500 leading-relaxed mb-4">{drill.purpose}</p>
          )}
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Fault tags */}
          {drill.fault_tags && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-500" /> Addresses
              </div>
              <div className="flex flex-wrap gap-1.5">
                {drill.fault_tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Coaching cues */}
          {drill.coaching_cues && (
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20">
              <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">Coaching Cues</div>
              <div className="space-y-1">
                {drill.coaching_cues.split('|').map((c, i) => (
                  <div key={i} className="text-sm text-slate-800 font-medium leading-snug">"{c.trim()}"</div>
                ))}
              </div>
            </div>
          )}

          {/* Setup */}
          {drill.setup && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Setup</div>
              <p className="text-xs text-slate-600 leading-relaxed">{drill.setup}</p>
            </div>
          )}

          {/* Execution */}
          {drill.instructions && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Execution</div>
              <p className="text-xs text-slate-600 leading-relaxed">{drill.instructions}</p>
            </div>
          )}

          {/* Duration */}
          {drill.duration_or_reps && (
            <div className="flex items-center gap-2 text-sm">
              <Dumbbell className="w-3.5 h-3.5 text-primary" />
              <span className="text-slate-500">Volume:</span>
              <span className="font-semibold text-slate-800">{drill.duration_or_reps}</span>
            </div>
          )}

          {/* Common mistakes */}
          {drill.common_mistakes && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1.5">Common Mistakes</div>
              <ul className="space-y-1">
                {drill.common_mistakes.split('|').map((m, i) => (
                  <li key={i} className="text-xs text-slate-500 flex items-start gap-1.5">
                    <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>{m.trim()}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Progression / Regression */}
          {(drill.progression || drill.regression) && (
            <div className="grid grid-cols-2 gap-3">
              {drill.progression && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-1">Progression</div>
                  <p className="text-xs text-slate-500">{drill.progression}</p>
                </div>
              )}
              {drill.regression && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-1">Regression</div>
                  <p className="text-xs text-slate-500">{drill.regression}</p>
                </div>
              )}
            </div>
          )}

          {/* Safety */}
          {drill.safety_notes && drill.safety_notes !== 'None.' && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-0.5">Safety Note</div>
                <p className="text-xs text-amber-700">{drill.safety_notes}</p>
              </div>
            </div>
          )}

          {/* Assign CTA */}
          {assignMode && (
            <Button
              className={`w-full ${already ? 'bg-green-600 hover:bg-green-500' : 'bg-primary hover:bg-primary/90'} text-white`}
              onClick={() => { onAssignDrill(drill); onClose(); }}
            >
              {already
                ? <><Check className="w-3.5 h-3.5 mr-1.5" />Drill Assigned</>
                : <><Plus className="w-3.5 h-3.5 mr-1.5" />Assign This Drill</>
              }
            </Button>
          )}

          <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
