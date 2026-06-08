import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Brain, Clock, ChevronDown, ChevronUp,
  ThumbsUp, ThumbsDown, Pencil, Check, X, MessageSquare, Box, Dumbbell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StandardLinker from '@/components/standards/StandardLinker';

const SEVERITY_CONFIG = {
  low:      { bg: 'bg-green-900/30',  text: 'text-green-400',  label: 'Low' },
  medium:   { bg: 'bg-yellow-900/30', text: 'text-yellow-400', label: 'Medium' },
  high:     { bg: 'bg-orange-900/30', text: 'text-orange-400', label: 'High' },
  critical: { bg: 'bg-red-900/30',    text: 'text-red-400',    label: 'Critical' },
};

export function SeverityBadge({ severity }) {
  const c = SEVERITY_CONFIG[severity?.toLowerCase()] || { bg: 'bg-secondary', text: 'text-muted-foreground', label: severity };
  return <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${c.bg} ${c.text}`}>{c.label}</span>;
}

function confidenceMeta(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  const score = numeric > 1 ? numeric / 100 : numeric;
  if (score >= 0.8) return { label: 'High evidence', cls: 'text-green-700 bg-green-50 border-green-200' };
  if (score >= 0.65) return { label: 'Moderate evidence', cls: 'text-amber-700 bg-amber-50 border-amber-200' };
  return { label: 'Low evidence', cls: 'text-orange-700 bg-orange-50 border-orange-200' };
}

export default function AIFindingCard({ finding, onApprove, onReject, onUpdateCue, onUpdateNote, onUpdateStandard, canEdit = true, onLoad3D, strokeType, clubId }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const [editingCue, setEditingCue] = useState(false);
  const [cueValue, setCueValue] = useState(finding.cue || '');
  const [savingCue, setSavingCue] = useState(false);
  const [showNoteField, setShowNoteField] = useState(false);
  const [noteValue, setNoteValue] = useState(finding.next_focus || '');
  const [savingNote, setSavingNote] = useState(false);

  const isPending = finding.approval_status === 'pending';
  const isApproved = finding.approval_status === 'approved';
  const isRejected = finding.approval_status === 'rejected';
  const isAiFinding = finding.source === 'ai';
  const evidence = confidenceMeta(finding.confidence_score);

  const handleSaveCue = async () => {
    setSavingCue(true);
    await onUpdateCue(finding, cueValue);
    setSavingCue(false);
    setEditingCue(false);
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    await onUpdateNote(finding, noteValue);
    setSavingNote(false);
    setShowNoteField(false);
  };

  const borderColor = isApproved ? 'border-green-700/50' : isRejected ? 'border-border/50' : 'border-border';
  const opacity = isRejected ? 'opacity-60' : '';

  return (
    <div className={`border rounded-xl overflow-hidden ${borderColor} ${opacity}`}>
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-secondary/50 hover:bg-secondary/80 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
          <Brain className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="text-xs font-bold text-foreground">{finding.finding_name}</span>
          {finding.severity && <SeverityBadge severity={finding.severity} />}
          {finding.phase && (
            <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">{finding.phase}</span>
          )}
          {isPending && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-yellow-900/20 text-yellow-400 border border-yellow-700/30">
              Pending Review
            </span>
          )}
          {isApproved && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-green-900/20 text-green-400 border border-green-700/30">
              ✓ Coach Approved
            </span>
          )}
          {isRejected && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-secondary text-muted-foreground">
              Dismissed
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {finding.confidence_score != null && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border hidden sm:block ${evidence?.cls || 'text-muted-foreground border-border'}`}>
              {Math.round((finding.confidence_score > 1 ? finding.confidence_score / 100 : finding.confidence_score) * 100)}% · {evidence?.label || 'AI evidence'}
            </span>
          )}
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 py-3 space-y-3 bg-card">
          {/* Timestamp + source row */}
          <div className="flex items-center gap-3 flex-wrap">
            {(finding.timestamp_start != null || finding.timestamp_end != null) && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
                <Clock className="w-3 h-3" />
                {finding.timestamp_start != null && <span>{finding.timestamp_start.toFixed(1)}s</span>}
                {finding.timestamp_end != null && <span> – {finding.timestamp_end.toFixed(1)}s</span>}
              </div>
            )}
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Brain className="w-3 h-3 text-primary" /> {isAiFinding ? 'AI draft — verify on video' : 'Coach finding'}
            </span>
            {finding.confidence_score != null && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border sm:hidden ${evidence?.cls || 'text-muted-foreground border-border'}`}>
                {Math.round((finding.confidence_score > 1 ? finding.confidence_score / 100 : finding.confidence_score) * 100)}% · {evidence?.label || 'AI evidence'}
              </span>
            )}
          </div>

          {isAiFinding && isPending && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800 leading-relaxed">
              Treat this as a draft observation. Approve only after the source video confirms the timing, phase, and coaching cue.
            </div>
          )}

          {/* AI Observation */}
          {finding.coach_sees && (() => {
            const parts = finding.coach_sees.split('\n\nCoach should check: ');
            const observation = parts[0];
            const coachCheck = parts[1];
            return (
              <>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">What the AI Observed</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{observation}</p>
                </div>
                {coachCheck && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Coach Should Check</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{coachCheck}</p>
                  </div>
                )}
              </>
            );
          })()}

          {/* Why it matters */}
          {finding.why_it_matters && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Why It Matters</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{finding.why_it_matters}</p>
            </div>
          )}

          {/* Recommended drill */}
          {finding.drill && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Recommended Drill</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{finding.drill}</p>
            </div>
          )}

          {/* Correction Cue */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-wider text-primary font-bold">Correction Cue</span>
              {canEdit && !editingCue && !isRejected && (
                <button
                  className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  onClick={(e) => { e.stopPropagation(); setEditingCue(true); }}
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              )}
            </div>
            {editingCue ? (
              <div className="space-y-2" onClick={e => e.stopPropagation()}>
                <Textarea
                  value={cueValue}
                  onChange={e => setCueValue(e.target.value)}
                  className="text-xs min-h-[64px] bg-background border-border"
                  placeholder="Enter coaching cue..."
                />
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-6 text-[10px] bg-primary text-primary-foreground" onClick={handleSaveCue} disabled={savingCue}>
                    <Check className="w-3 h-3 mr-1" />{savingCue ? 'Saving…' : 'Save'}
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => { setEditingCue(false); setCueValue(finding.cue || ''); }}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-foreground font-medium leading-relaxed">{cueValue || '—'}</p>
            )}
          </div>

          {/* Next Focus / Coach Note */}
          {canEdit && !isRejected && (
            <div>
              {showNoteField ? (
                <div className="space-y-2 p-3 rounded-lg bg-secondary/40 border border-border">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Next Focus / Coach Note</div>
                  <Textarea
                    value={noteValue}
                    onChange={e => setNoteValue(e.target.value)}
                    className="text-xs min-h-[56px] bg-background border-border"
                    placeholder="Add a coach note, drill recommendation, or next focus..."
                  />
                  <div className="flex gap-1.5">
                    <Button size="sm" className="h-6 text-[10px] bg-primary text-primary-foreground" onClick={handleSaveNote} disabled={savingNote}>
                      <Check className="w-3 h-3 mr-1" />{savingNote ? 'Saving…' : 'Save Note'}
                    </Button>
                    <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => { setShowNoteField(false); setNoteValue(finding.next_focus || ''); }}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : finding.next_focus ? (
                <div className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-secondary/40">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Next Focus</div>
                    <p className="text-xs text-foreground">{finding.next_focus}</p>
                  </div>
                  <button className="text-[10px] text-muted-foreground hover:text-foreground flex-shrink-0" onClick={() => setShowNoteField(true)}>
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowNoteField(true)}
                >
                  <MessageSquare className="w-3 h-3" /> Add next focus / coach note
                </button>
              )}
            </div>
          )}

          {/* Already-saved note display when not editable */}
          {!canEdit && finding.next_focus && (
            <div className="p-2.5 rounded-lg bg-secondary/40">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Next Focus</div>
              <p className="text-xs text-foreground">{finding.next_focus}</p>
            </div>
          )}

          {/* Pose evidence — coach-internal, only for real_pose findings */}
          {(finding.evidence_type || finding.measurement_summary) && (
            <div className="p-2.5 rounded-lg bg-secondary/60 border border-border space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Pose Evidence (Coach Only)</div>
              {finding.evidence_type && (
                <div className="text-[10px] text-muted-foreground">
                  <span className="font-medium text-foreground">Evidence type:</span>{' '}
                  <span className="font-mono">{finding.evidence_type}</span>
                </div>
              )}
              {finding.measurement_summary && (
                <div className="text-[10px] text-muted-foreground font-mono leading-relaxed break-words">
                  {finding.measurement_summary}
                </div>
              )}
              {finding.frame_reference && (
                <a
                  href={finding.frame_reference}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-primary underline"
                >
                  View annotated frame →
                </a>
              )}
            </div>
          )}

          {/* Linked Technical Standard */}
          {canEdit && !isRejected && onUpdateStandard && (
            <div className="pt-1">
              <StandardLinker
                clubId={clubId}
                value={finding.linked_standard_id}
                onChange={(id, title) => onUpdateStandard(finding, id, title)}
              />
            </div>
          )}
          {!canEdit && finding.linked_standard_title && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
              <span className="text-[10px] text-primary font-semibold">Standard:</span>
              <span className="text-[10px] text-slate-700">{finding.linked_standard_title}</span>
            </div>
          )}

          {/* Load 3D Reference — only for non-rejected findings */}
          {onLoad3D && !isRejected && (
            <div className="pt-1 space-y-1">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                  onClick={() => onLoad3D(finding)}
                >
                  <Box className="w-3 h-3 mr-1.5" /> Load 3D Reference
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-amber-300/60 text-amber-700 hover:bg-amber-50"
                  onClick={() => {
                    const stroke = strokeType || '';
                    const phase = finding.phase || '';
                    const faults = finding.finding_name || '';
                    const params = new URLSearchParams({ stroke, phase, faults });
                    navigate(`/drill-library?${params.toString()}`);
                  }}
                >
                  <Dumbbell className="w-3 h-3 mr-1.5" /> Find Matching Drills
                </Button>
              </div>
              <p className="text-[9px] text-muted-foreground/60 pl-0.5">
                Opens drill library filtered for this finding's stroke and phase.
              </p>
            </div>
          )}

          {/* Approve / Reject controls */}
          {canEdit && (
            <div className="flex gap-2 pt-1 border-t border-border">
              {isPending && (
                <>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-green-700 hover:bg-green-600 text-white flex-1"
                    onClick={() => onApprove(finding)}
                  >
                    <ThumbsUp className="w-3 h-3 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-muted-foreground flex-1"
                    onClick={() => onReject(finding)}
                  >
                    <ThumbsDown className="w-3 h-3 mr-1" /> Dismiss
                  </Button>
                </>
              )}
              {isApproved && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => onReject(finding)}
                >
                  <ThumbsDown className="w-3 h-3 mr-1" /> Undo Approve
                </Button>
              )}
              {isRejected && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-green-400 border-green-900/40"
                  onClick={() => onApprove(finding)}
                >
                  <ThumbsUp className="w-3 h-3 mr-1" /> Re-approve
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
