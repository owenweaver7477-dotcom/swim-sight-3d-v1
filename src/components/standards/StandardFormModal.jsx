import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Loader2 } from 'lucide-react';

const STROKES = ['Freestyle', 'Breaststroke', 'Backstroke', 'Butterfly', 'IM', 'General'];
const PHASES = [
  'Body Line', 'Catch', 'Pull', 'Recovery', 'Breathing',
  'Kick Recovery', 'Kick Drive', 'Glide', 'Timing', 'Rotation',
  'Entry', 'Turn', 'Underwater', 'Breakout', 'Start', 'Finish', 'General'
];
const DIFFICULTIES = ['Development', 'Competitive', 'National', 'Elite'];

const EMPTY = {
  title: '',
  stroke: 'Freestyle',
  phase: 'General',
  difficulty_level: 'Competitive',
  technical_goal: '',
  key_positions: '',
  coach_cues: '',
  common_faults: '',
  linked_fault_tags: '',
  linked_drag_zones: '',
  success_criteria: '',
  scoring_guidance: '',
  is_active: true,
};

export default function StandardFormModal({ standard, onSave, onClose, isSaving }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (standard) {
      setForm({
        title: standard.title || '',
        stroke: standard.stroke || 'Freestyle',
        phase: standard.phase || 'General',
        difficulty_level: standard.difficulty_level || 'Competitive',
        technical_goal: standard.technical_goal || '',
        key_positions: standard.key_positions || '',
        coach_cues: standard.coach_cues || '',
        common_faults: standard.common_faults || '',
        linked_fault_tags: standard.linked_fault_tags || '',
        linked_drag_zones: standard.linked_drag_zones || '',
        success_criteria: standard.success_criteria || '',
        scoring_guidance: standard.scoring_guidance || '',
        is_active: standard.is_active !== false,
      });
    } else {
      setForm(EMPTY);
    }
  }, [standard]);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-8 pb-4 px-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">
            {standard ? 'Edit Technical Standard' : 'New Technical Standard'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <Label className="text-xs text-slate-500">Standard Title *</Label>
            <Input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Breaststroke Kick Recovery Standard"
              className="mt-1 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Stroke</Label>
              <Select value={form.stroke} onValueChange={v => set('stroke', v)}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STROKES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Phase</Label>
              <Select value={form.phase} onValueChange={v => set('phase', v)}>
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PHASES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs text-slate-500">Difficulty Level</Label>
            <Select value={form.difficulty_level} onValueChange={v => set('difficulty_level', v)}>
              <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DIFFICULTIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-slate-500">Technical Goal</Label>
            <Textarea
              value={form.technical_goal}
              onChange={e => set('technical_goal', e.target.value)}
              placeholder="What this standard aims to achieve technically..."
              className="mt-1 text-xs"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-xs text-slate-500">Key Positions</Label>
            <Textarea
              value={form.key_positions}
              onChange={e => set('key_positions', e.target.value)}
              placeholder="What the coach should see — body/limb positions, timing markers..."
              className="mt-1 text-xs"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-xs text-slate-500">Coach Cues</Label>
            <Textarea
              value={form.coach_cues}
              onChange={e => set('coach_cues', e.target.value)}
              placeholder="Short cue phrases, e.g. 'Heels first — narrow and high' · 'Knees inside hips'"
              className="mt-1 text-xs"
              rows={2}
            />
          </div>

          <div>
            <Label className="text-xs text-slate-500">Common Faults</Label>
            <Textarea
              value={form.common_faults}
              onChange={e => set('common_faults', e.target.value)}
              placeholder="What faults or errors this standard addresses..."
              className="mt-1 text-xs"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Fault Tags (comma-separated)</Label>
              <Input
                value={form.linked_fault_tags}
                onChange={e => set('linked_fault_tags', e.target.value)}
                placeholder="wide_knees,early_foot_turn"
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Linked Drag Zones (comma-separated)</Label>
              <Input
                value={form.linked_drag_zones}
                onChange={e => set('linked_drag_zones', e.target.value)}
                placeholder="knees,ankles,hips"
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-slate-500">Success Criteria</Label>
            <Textarea
              value={form.success_criteria}
              onChange={e => set('success_criteria', e.target.value)}
              placeholder="What improved technique looks like — what to re-check at next review..."
              className="mt-1 text-xs"
              rows={2}
            />
          </div>

          <div>
            <Label className="text-xs text-slate-500">Scoring Guidance (coach notes)</Label>
            <Textarea
              value={form.scoring_guidance}
              onChange={e => set('scoring_guidance', e.target.value)}
              placeholder="How to assess progress against this standard during review..."
              className="mt-1 text-xs"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <Button type="submit" className="flex-1" disabled={!form.title.trim() || isSaving}>
              {isSaving ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Saving…</> : standard ? 'Save Changes' : 'Create Standard'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}