/**
 * AiFindingSuggester — generates AI-suggested coach findings from fault tags.
 * Coach MUST approve, edit, or reject each suggestion before it enters the report.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, CheckCircle2, X, RefreshCw, AlertTriangle, Pencil } from 'lucide-react';
import { SEVERITY_LEVELS } from '@/lib/swimState';

export default function AiFindingSuggester({ faultTags, stroke, phase, reviewId, onClose, onFindingAdded }) {
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [suggestion, setSuggestion] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const queryClient = useQueryClient();

  const generate = async () => {
    setStatus('loading');
    setSuggestion(null);
    const prompt = `You are a professional swim coach assistant. A coach is reviewing ${stroke} technique${phase ? ` at the ${phase} phase` : ''}.

The coach has tagged these faults: ${faultTags.join(', ')}.

Generate a coach finding in JSON with these fields:
- finding_name: short title (max 8 words)
- coach_sees: one sentence describing the observable fault
- why_it_matters: one sentence on the technical impact
- cue: one concrete coaching cue
- drill: one specific drill name
- next_focus: one short next priority
- severity: one of: low, medium, high, critical
- report_wording: 2-3 sentences for a professional parent-facing report

Return only valid JSON, no markdown.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          finding_name: { type: 'string' },
          coach_sees: { type: 'string' },
          why_it_matters: { type: 'string' },
          cue: { type: 'string' },
          drill: { type: 'string' },
          next_focus: { type: 'string' },
          severity: { type: 'string' },
          report_wording: { type: 'string' },
        }
      }
    });
    setSuggestion(result);
    setEditForm(result);
    setStatus('done');
  };

  const addFinding = useMutation({
    mutationFn: (data) => base44.entities.Finding.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings', reviewId] });
      onFindingAdded();
    },
  });

  const handleApprove = () => {
    const data = editing ? editForm : suggestion;
    addFinding.mutate({
      review_id: reviewId,
      finding_name: data.finding_name,
      coach_sees: data.coach_sees,
      why_it_matters: data.why_it_matters,
      cue: data.cue,
      drill: data.drill,
      next_focus: data.next_focus,
      severity: data.severity || 'medium',
      phase: phase || '',
      included_in_report: true,
    });
  };

  return (
    <div className="p-3 rounded-xl bg-card border border-primary/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-xs font-semibold text-foreground">AI Finding Suggestion</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-900/30 text-yellow-400 font-medium">REQUIRES COACH APPROVAL</span>
        </div>
        <button onClick={onClose}><X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" /></button>
      </div>

      <div className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
        <AlertTriangle className="w-3 h-3 text-yellow-400" />
        AI suggestions are drafts only. Review before adding to a report.
      </div>

      <div className="text-[10px] text-muted-foreground mb-3">
        Fault tags: {faultTags.map(t => (
          <span key={t} className="inline-block mr-1 px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">{t}</span>
        ))}
      </div>

      {status === 'idle' && (
        <Button size="sm" className="w-full bg-yellow-500/20 text-yellow-300 border border-yellow-700/30 hover:bg-yellow-500/30 text-xs"
          onClick={generate}>
          <Zap className="w-3.5 h-3.5 mr-1" /> Generate Suggestion
        </Button>
      )}

      {status === 'loading' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" /> Generating suggestion...
        </div>
      )}

      {status === 'done' && suggestion && (
        <div className="space-y-2">
          {!editing ? (
            <>
              <div className="p-2.5 rounded-lg bg-secondary border border-border space-y-1.5">
                <div className="text-xs font-semibold text-foreground">{suggestion.finding_name}</div>
                {suggestion.coach_sees && <div className="text-[10px] text-muted-foreground"><strong>Coach sees:</strong> {suggestion.coach_sees}</div>}
                {suggestion.why_it_matters && <div className="text-[10px] text-muted-foreground"><strong>Why it matters:</strong> {suggestion.why_it_matters}</div>}
                {suggestion.cue && <div className="text-[10px] p-1.5 rounded bg-primary/10 text-primary"><strong>Cue:</strong> {suggestion.cue}</div>}
                {suggestion.drill && <div className="text-[10px] text-muted-foreground"><strong>Drill:</strong> {suggestion.drill}</div>}
                {suggestion.next_focus && <div className="text-[10px] text-muted-foreground"><strong>Next focus:</strong> {suggestion.next_focus}</div>}
                {suggestion.report_wording && (
                  <div className="text-[10px] text-muted-foreground border-t border-border pt-1.5 mt-1.5">
                    <strong>Report wording:</strong> {suggestion.report_wording}
                  </div>
                )}
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" className="flex-1 h-7 text-xs bg-primary text-primary-foreground" onClick={handleApprove} disabled={addFinding.isPending}>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Approve & Add
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setEditing(true); setEditForm(suggestion); }}>
                  <Pencil className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={generate}>
                  <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={onClose}>Reject</Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Input placeholder="Finding name" value={editForm.finding_name || ''} onChange={e => setEditForm(p => ({ ...p, finding_name: e.target.value }))} className="bg-secondary border-border text-xs h-7" />
                <Select value={editForm.severity || 'medium'} onValueChange={v => setEditForm(p => ({ ...p, severity: v }))}>
                  <SelectTrigger className="bg-secondary border-border text-xs h-7"><SelectValue /></SelectTrigger>
                  <SelectContent>{SEVERITY_LEVELS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
                <Textarea placeholder="Coach sees..." value={editForm.coach_sees || ''} onChange={e => setEditForm(p => ({ ...p, coach_sees: e.target.value }))} className="bg-secondary border-border text-xs" rows={2} />
                <Textarea placeholder="Why it matters..." value={editForm.why_it_matters || ''} onChange={e => setEditForm(p => ({ ...p, why_it_matters: e.target.value }))} className="bg-secondary border-border text-xs" rows={2} />
                <Input placeholder="Coaching cue" value={editForm.cue || ''} onChange={e => setEditForm(p => ({ ...p, cue: e.target.value }))} className="bg-secondary border-border text-xs h-7" />
                <Input placeholder="Assigned drill" value={editForm.drill || ''} onChange={e => setEditForm(p => ({ ...p, drill: e.target.value }))} className="bg-secondary border-border text-xs h-7" />
                <Input placeholder="Next focus" value={editForm.next_focus || ''} onChange={e => setEditForm(p => ({ ...p, next_focus: e.target.value }))} className="bg-secondary border-border text-xs h-7" />
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" className="flex-1 h-7 text-xs bg-primary text-primary-foreground" onClick={handleApprove} disabled={addFinding.isPending}>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Approve Edited
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}