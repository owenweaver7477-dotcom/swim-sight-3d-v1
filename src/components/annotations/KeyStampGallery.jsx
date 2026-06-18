import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatTimestamp } from '@/lib/annotationRender';
import {
  CheckCircle2,
  Edit3,
  Image,
  Link2,
  MoreHorizontal,
  PencilLine,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';

function labelFromKey(value = '') {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function getApproxFrame(annotation) {
  return annotation?.drawing_data?.approx_frame
    ?? annotation?.drawing_data?.approxFrame
    ?? null;
}

function KeyStampCard({
  stamp,
  findings,
  linkedFinding,
  canEdit,
  onUpdate,
  onDelete,
  onCreateFinding,
  onOpenDraw,
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(stamp.title || 'Key moment');
  const [coachNote, setCoachNote] = useState(stamp.coach_note || '');
  const [phaseValue, setPhaseValue] = useState(stamp?.drawing_data?.phase || '');
  const phase = stamp?.drawing_data?.phase || null;
  const approxFrame = getApproxFrame(stamp);
  const thumbnail = typeof stamp.thumbnail_data_url === 'string' && stamp.thumbnail_data_url.startsWith('data:image/')
    ? stamp.thumbnail_data_url
    : null;

  const saveEdit = async () => {
    await onUpdate(stamp, {
      title: title.trim() || 'Key moment',
      coach_note: coachNote.trim() || null,
      drawing_data: {
        ...(stamp.drawing_data || {}),
        phase: phaseValue.trim() || null,
      },
    });
    setEditing(false);
  };

  return (
    <div className={`rounded-2xl bg-card border overflow-hidden transition-colors ${
      stamp.include_in_report ? 'border-green-200 shadow-sm' : 'border-border'
    }`}>
      <div className="relative bg-slate-950" style={{ aspectRatio: '16/9' }}>
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={stamp.title || 'Key stamp thumbnail'}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
            <Image className="w-8 h-8 opacity-40 mb-2" />
            <div className="text-xs font-mono">{stamp.frame_label || stamp.video_frame_time_label || formatTimestamp(stamp.timestamp_seconds)}</div>
          </div>
        )}
        <div className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow ${
          stamp.include_in_report ? 'bg-green-500 text-white' : 'bg-slate-900/80 text-slate-200 border border-white/10'
        }`}>
          {stamp.include_in_report ? <CheckCircle2 className="w-3 h-3" /> : <Image className="w-3 h-3" />}
          {stamp.include_in_report ? 'In report' : 'Not included'}
        </div>
      </div>

      <div className="p-3 space-y-3">
        {editing ? (
          <div className="space-y-2">
            <Input value={title} onChange={event => setTitle(event.target.value)} className="h-11 text-sm md:text-xs" />
            <Input
              value={phaseValue}
              onChange={event => setPhaseValue(event.target.value)}
              className="h-11 text-sm md:text-xs"
              placeholder="Stroke phase, e.g. kick_setup"
            />
            <Textarea value={coachNote} onChange={event => setCoachNote(event.target.value)} className="text-sm min-h-[72px] md:text-xs" />
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" className="h-10 text-xs" onClick={saveEdit}>
                <Save className="w-3.5 h-3.5 mr-1" /> Save
              </Button>
              <Button size="sm" variant="outline" className="h-10 text-xs" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-foreground">{stamp.title || 'Key moment'}</div>
                  <div className="text-[10px] font-mono text-primary mt-0.5">
                    {stamp.frame_label || stamp.video_frame_time_label || formatTimestamp(stamp.timestamp_seconds)}
                    {approxFrame != null ? ` · Approx frame ~${approxFrame}` : ''}
                  </div>
                </div>
                {phase && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {labelFromKey(phase)}
                  </span>
                )}
              </div>
              {stamp.coach_note && <p className="text-[11px] text-muted-foreground leading-relaxed mt-2">{stamp.coach_note}</p>}
              {linkedFinding && (
                <div className="mt-2 text-[10px] text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
                  Attached to: <span className="font-semibold text-slate-800">{linkedFinding.finding_name || linkedFinding.observation}</span>
                </div>
              )}
            </div>

            {canEdit && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant={stamp.include_in_report ? 'default' : 'outline'}
                    className="h-11 text-xs"
                    onClick={() => onUpdate(stamp, {
                      include_in_report: !stamp.include_in_report,
                      is_public: !stamp.include_in_report,
                    })}
                  >
                    <Link2 className="w-3.5 h-3.5 mr-1" />
                    {stamp.include_in_report ? 'Remove' : 'Approve'}
                  </Button>
                  <Button size="sm" variant="outline" className="h-11 text-xs" onClick={() => onCreateFinding(stamp)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Finding
                  </Button>
                </div>

                <details className="rounded-lg border border-border bg-secondary/30">
                  <summary className="cursor-pointer list-none px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    More actions
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </summary>
                  <div className="p-3 pt-0 space-y-2">
                    <select
                      value={stamp.finding_id || ''}
                      onChange={event => onUpdate(stamp, { finding_id: event.target.value || null })}
                      className="w-full h-11 rounded-md border border-input bg-background px-2 text-sm md:text-xs"
                    >
                      <option value="">Attach to finding...</option>
                      {findings.map(finding => (
                        <option key={finding.id} value={finding.id}>
                          {finding.finding_name || finding.observation}
                        </option>
                      ))}
                    </select>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" className="h-10 text-xs" onClick={() => onOpenDraw(stamp)}>
                        <PencilLine className="w-3.5 h-3.5 mr-1" /> Coach Draw
                      </Button>
                      <Button size="sm" variant="outline" className="h-10 text-xs" onClick={() => setEditing(true)}>
                        <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                    </div>
                    <Button size="sm" variant="outline" className="h-10 text-xs text-destructive w-full" onClick={() => onDelete(stamp)}>
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete key stamp
                    </Button>
                  </div>
                </details>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function KeyStampGallery({
  annotations = [],
  findings = [],
  canEdit = true,
  onUpdate,
  onDelete,
  onCreateFinding,
  onOpenDraw,
}) {
  const findingsById = useMemo(() => new Map(findings.map(finding => [finding.id, finding])), [findings]);
  const keyStamps = annotations
    .filter(annotation => annotation.annotation_type === 'key_frame')
    .sort((a, b) => Number(a.timestamp_seconds || 0) - Number(b.timestamp_seconds || 0));

  if (keyStamps.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-card border border-dashed border-border text-center">
        <Image className="w-8 h-8 mx-auto text-muted-foreground opacity-30 mb-2" />
        <div className="text-xs font-semibold text-foreground">No key stamps saved yet</div>
        <p className="text-[10px] text-muted-foreground mt-1 max-w-sm mx-auto">
          Open Fullscreen Review, pause or step to a moment, then save key stamps. They will appear here as report-ready cards.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="text-xs font-bold text-foreground uppercase tracking-wider">Key Moment Gallery</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Review saved timestamps, approve public-safe moments, and turn them into findings or Coach Draw annotations.
          </p>
        </div>
        <div className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-[10px] font-semibold text-muted-foreground">
          {keyStamps.filter(stamp => stamp.include_in_report).length} approved of {keyStamps.length}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {keyStamps.map(stamp => (
          <KeyStampCard
            key={stamp.id}
            stamp={stamp}
            findings={findings}
            linkedFinding={stamp.finding_id ? findingsById.get(stamp.finding_id) : null}
            canEdit={canEdit}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onCreateFinding={onCreateFinding}
            onOpenDraw={onOpenDraw}
          />
        ))}
      </div>
    </div>
  );
}
