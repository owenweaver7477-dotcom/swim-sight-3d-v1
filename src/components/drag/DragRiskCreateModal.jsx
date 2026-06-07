import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, AlertTriangle } from 'lucide-react';

const OVERLAY_OPTIONS = [
  { value: 'body_line',        label: 'Body Line Drag',        desc: 'Mark where the body line breaks — dropped hips, lifted head' },
  { value: 'frontal_area',     label: 'Frontal Area Warning',  desc: 'Wide knees, ankles, raised head or broad arm recovery' },
  { value: 'flow_arrows',      label: 'Water Flow Arrows',     desc: 'Show intended water flow and where body interrupts it' },
  { value: 'streamline_break', label: 'Streamline Break',      desc: 'Streamline guide from hands through torso to toes — mark deviations' },
  { value: 'kick_width',       label: 'Kick Width Zone',       desc: 'Measure knee or ankle width — breaststroke and butterfly kick' },
  { value: 'head_lift',        label: 'Head Lift Marker',      desc: 'Mark head position above body line — breathing, breaststroke' },
  { value: 'hip_drop',         label: 'Hip Drop Marker',       desc: 'Highlight hip position relative to shoulder/ankle line' },
];

const ZONE_OPTIONS = [
  'head', 'shoulders', 'torso', 'hips', 'knees', 'ankles', 'arms', 'streamline', 'full_body'
];

const RISK_OPTIONS = ['low', 'medium', 'high', 'unknown'];

export default function DragRiskCreateModal({ report, video, findings = [], userId, onClose, onCreated }) {
  const [overlayType, setOverlayType] = useState('body_line');
  const [dragZone, setDragZone] = useState('hips');
  const [riskLevel, setRiskLevel] = useState('medium');
  const [strokePhase, setStrokePhase] = useState('');
  const [timestampStart, setTimestampStart] = useState('');
  const [measurementSummary, setMeasurementSummary] = useState('');
  const [coachNotes, setCoachNotes] = useState('');
  const [findingId, setFindingId] = useState('');
  const [includedInReport, setIncludedInReport] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!dragZone) return;
    setSaving(true);
    await base44.entities.DragAnalysis.create({
      club_id: report?.club_id || video?.club_id,
      swimmer_id: report?.swimmer_id || video?.swimmer_id,
      report_id: report?.id || undefined,
      video_upload_id: video?.id || report?.video_upload_id,
      analysis_session_id: video?.analysis_session_id || undefined,
      finding_id: findingId || undefined,
      created_by: userId || undefined,
      source: 'coach_annotation',
      analysis_mode: 'manual',
      drag_risk_level: riskLevel,
      drag_zone: dragZone,
      overlay_type: overlayType,
      stroke_phase: strokePhase || undefined,
      timestamp_start: timestampStart ? parseFloat(timestampStart) : undefined,
      measurement_summary: measurementSummary || undefined,
      coach_notes: coachNotes || undefined,
      evidence_type: 'coach_review',
      approval_status: 'approved', // coach-created = auto-approved
      included_in_report: includedInReport,
    });
    onCreated();
  };

  const selected = OVERLAY_OPTIONS.find(o => o.value === overlayType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-card rounded-xl border border-border shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Add Drag Risk Overlay</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Coach annotation — drag risk estimate</p>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700">
              This is a coaching estimate of likely resistance. Not a fluid-dynamic measurement.
            </p>
          </div>

          {/* Overlay type */}
          <div>
            <Label className="text-xs text-muted-foreground">Overlay Type *</Label>
            <select
              value={overlayType}
              onChange={e => setOverlayType(e.target.value)}
              className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-xs"
            >
              {OVERLAY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {selected && (
              <p className="text-[10px] text-muted-foreground mt-1">{selected.desc}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Drag zone */}
            <div>
              <Label className="text-xs text-muted-foreground">Body Zone *</Label>
              <select
                value={dragZone}
                onChange={e => setDragZone(e.target.value)}
                className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-xs capitalize"
              >
                {ZONE_OPTIONS.map(z => (
                  <option key={z} value={z}>{z.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            {/* Risk level */}
            <div>
              <Label className="text-xs text-muted-foreground">Risk Level</Label>
              <select
                value={riskLevel}
                onChange={e => setRiskLevel(e.target.value)}
                className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-xs capitalize"
              >
                {RISK_OPTIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Stroke phase */}
            <div>
              <Label className="text-xs text-muted-foreground">Stroke Phase</Label>
              <Input
                value={strokePhase}
                onChange={e => setStrokePhase(e.target.value)}
                placeholder="e.g. Catch, Glide"
                className="mt-1 h-9 text-xs"
              />
            </div>

            {/* Timestamp */}
            <div>
              <Label className="text-xs text-muted-foreground">Timestamp (s)</Label>
              <Input
                type="number"
                value={timestampStart}
                onChange={e => setTimestampStart(e.target.value)}
                placeholder="e.g. 4.5"
                className="mt-1 h-9 text-xs"
              />
            </div>
          </div>

          {/* Evidence summary */}
          <div>
            <Label className="text-xs text-muted-foreground">Evidence Summary</Label>
            <textarea
              value={measurementSummary}
              onChange={e => setMeasurementSummary(e.target.value)}
              placeholder="What you observed in the video..."
              className="mt-1 w-full h-16 rounded-md border border-input bg-transparent px-3 py-2 text-xs resize-none"
            />
          </div>

          {/* Coach notes */}
          <div>
            <Label className="text-xs text-muted-foreground">Coach Notes</Label>
            <textarea
              value={coachNotes}
              onChange={e => setCoachNotes(e.target.value)}
              placeholder="Explanation and correction for swimmer..."
              className="mt-1 w-full h-16 rounded-md border border-input bg-transparent px-3 py-2 text-xs resize-none"
            />
          </div>

          {/* Link to finding */}
          {findings.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Link to Finding (optional)</Label>
              <select
                value={findingId}
                onChange={e => setFindingId(e.target.value)}
                className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-xs"
              >
                <option value="">— None —</option>
                {findings.filter(f => f.approval_status === 'approved').map(f => (
                  <option key={f.id} value={f.id}>{f.finding_name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Include in report */}
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={includedInReport}
              onChange={e => setIncludedInReport(e.target.checked)}
              className="accent-primary"
            />
            Include in final report
          </label>
        </div>

        <div className="flex gap-2 p-4 border-t border-border">
          <Button size="sm" className="h-8 text-xs flex-1" onClick={handleSave} disabled={saving || !dragZone}>
            {saving ? 'Saving…' : 'Save Drag Overlay'}
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}