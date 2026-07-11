import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Brain, Clock, ChevronDown, ChevronUp,
  ThumbsUp, ThumbsDown, Pencil, Check, X, MessageSquare, Box, Dumbbell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { suggestDrillsForFinding } from '@/lib/drillMatching';
import AITrustBadge from '@/components/ai/AITrustBadge';
import FindingEvidencePanel from '@/components/ai/FindingEvidencePanel';
import { getFindingReviewState, isAIFinding } from '@/lib/aiTrust';

const SEVERITY_CONFIG = {
  low:      { bg: 'bg-green-900/30',  text: 'text-green-400',  label: 'Low' },
  medium:   { bg: 'bg-yellow-900/30', text: 'text-yellow-400', label: 'Medium' },
  high:     { bg: 'bg-orange-900/30', text: 'text-orange-400', label: 'High' },
  critical: { bg: 'bg-red-900/30',    text: 'text-red-400',    label: 'Critical' },
};

const REJECTION_REASONS = [
  { value: 'not_visible_on_video', label: 'Not visible on video' },
  { value: 'incorrect_observation', label: 'Incorrect observation' },
  { value: 'wrong_phase', label: 'Wrong phase' },
  { value: 'wrong_fault_tag', label: 'Wrong fault tag' },
  { value: 'not_actionable', label: 'Not actionable' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'other', label: 'Other' },
];

export function SeverityBadge({ severity }) {
  const c = SEVERITY_CONFIG[severity?.toLowerCase()] || { bg: 'bg-secondary', text: 'text-muted-foreground', label: severity };
  return <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${c.bg} ${c.text}`}>{c.label}</span>;
}

const REVIEW_STATE_STYLES = {
  draft: 'border-amber-200 bg-amber-50 text-amber-800',
  edited: 'border-blue-200 bg-blue-50 text-blue-700',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-slate-200 bg-slate-100 text-slate-600',
};

export default function AIFindingCard({
  finding,
  onApprove,
  onReject,
  onUpdateCue,
  onUpdateNote,
  onAssignDrill,
  drillOptions = [],
  canEdit = true,
  onLoad3D,
  strokeType,
  clubId,
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const [editingCue, setEditingCue] = useState(false);
  const [cueValue, setCueValue] = useState(finding.cue || '');
  const [savingCue, setSavingCue] = useState(false);
  const [showNoteField, setShowNoteField] = useState(false);
  const [noteValue, setNoteValue] = useState(finding.next_focus || '');
  const [savingNote, setSavingNote] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('not_visible_on_video');
  const [rejectNote, setRejectNote] = useState('');

  const isPending = finding.approval_status === 'pending';
  const isApproved = finding.approval_status === 'approved';
  const isRejected = finding.approval_status === 'rejected';
  const isAiFinding = isAIFinding(finding);
  const reviewState = getFindingReviewState(finding);
  const suggestedDrills = suggestDrillsForFinding(drillOptions, finding, strokeType, 4);
  const assignedDrillTitle = finding.linked_drill_title || finding.drill;

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

  const handleReject = async () => {
    await onReject(finding, { reason: rejectReason, note: rejectNote });
    setShowRejectReason(false);
    setRejectReason('not_visible_on_video');
    setRejectNote('');
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
          {isAiFinding
            ? <Brain className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            : <Pencil className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
          <span className="text-xs font-bold text-foreground">{finding.finding_name}</span>
          {finding.severity && <SeverityBadge severity={finding.severity} />}
          {finding.phase && (
            <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">{finding.phase}</span>
          )}
          <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${REVIEW_STATE_STYLES[reviewState]}`}>
            {reviewState.charAt(0).toUpperCase() + reviewState.slice(1)}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
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
              {isAiFinding
                ? <Brain className="w-3 h-3 text-primary" />
                : <Pencil className="w-3 h-3 text-primary" />} {isAiFinding ? 'AI draft — verify on video' : 'Coach finding'}
            </span>
          </div>

          {isAiFinding && <AITrustBadge confidence={finding.confidence_score} />}

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
          {assignedDrillTitle && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Recommended Drill</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{assignedDrillTitle}</p>
              {finding.linked_drill_summary && (
                <p className="text-[10px] text-muted-foreground/80 leading-relaxed mt-1">{finding.linked_drill_summary}</p>
              )}
            </div>
          )}

          {canEdit && !isRejected && onAssignDrill && suggestedDrills.length > 0 && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-blue-700 font-bold">
                Drill Recommendations
              </div>
              <div className="space-y-1.5">
                {suggestedDrills.map(drill => {
                  const isAssigned = finding.linked_drill_id === drill.id || assignedDrillTitle === drill.title;
                  return (
                    <button
                      key={drill.id}
                      type="button"
                      onClick={() => onAssignDrill(finding, drill)}
                      className={`w-full text-left p-2 rounded-lg border transition-colors ${
                        isAssigned
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : 'bg-white border-blue-100 text-slate-700 hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[11px] font-semibold">{drill.title}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                            {drill.purpose || drill.coaching_cue || drill.coaching_cues}
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold flex-shrink-0">
                          {isAssigned ? 'Assigned' : 'Assign'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[9px] text-blue-700/70">
                Suggestions come from the Swim Sight drill library and are not AI-generated drills.
              </p>
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

          {isAiFinding && <FindingEvidencePanel finding={finding} />}

          {/* Load 3D Reference — only for non-rejected findings */}
          {(onLoad3D || !isRejected) && (
            <div className="pt-1 space-y-1">
              <div className="flex gap-2">
                {onLoad3D && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                    onClick={() => onLoad3D(finding)}
                  >
                    <Box className="w-3 h-3 mr-1.5" /> Load 3D Reference
                  </Button>
                )}
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
            <div className="space-y-2 pt-1 border-t border-border">
              {showRejectReason && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                    Why reject this AI draft?
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {REJECTION_REASONS.map(reason => (
                      <button
                        key={reason.value}
                        type="button"
                        onClick={() => setRejectReason(reason.value)}
                        className={`text-left text-[10px] px-2 py-1.5 rounded border transition-colors ${
                          rejectReason === reason.value
                            ? 'bg-amber-100 border-amber-400 text-amber-900 font-semibold'
                            : 'bg-white border-amber-200 text-amber-800 hover:border-amber-300'
                        }`}
                      >
                        {reason.label}
                      </button>
                    ))}
                  </div>
                  <Textarea
                    value={rejectNote}
                    onChange={event => setRejectNote(event.target.value)}
                    className="text-xs min-h-[48px] bg-white border-amber-200"
                    placeholder="Optional note for calibration, e.g. swimmer was obscured..."
                  />
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300 text-amber-800" onClick={handleReject}>
                      <ThumbsDown className="w-3 h-3 mr-1" /> Confirm Reject
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowRejectReason(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
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
                    onClick={() => setShowRejectReason(true)}
                  >
                    <ThumbsDown className="w-3 h-3 mr-1" /> Reject
                  </Button>
                </>
              )}
              {isApproved && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => setShowRejectReason(true)}
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
