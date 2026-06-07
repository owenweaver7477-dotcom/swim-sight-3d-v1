import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Minus, ArrowRight, Triangle, Circle, Square, Pencil, Type,
  Undo2, Trash2, Save, X, ChevronLeft, ChevronRight,
  BookOpen, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

// Drag risk presets — available on all stroke types
const DRAG_PRESETS = [
  { label: 'Body Line Drag', type: 'body_line',        colour: '#F59E0B', dragOverlay: 'body_line' },
  { label: 'Frontal Area',   type: 'rectangle',         colour: '#EF4444', dragOverlay: 'frontal_area' },
  { label: 'Flow Arrow',     type: 'arrow',             colour: '#F59E0B', dragOverlay: 'flow_arrows' },
  { label: 'Streamline',     type: 'streamline_line',   colour: '#0077B6', dragOverlay: 'streamline_break' },
  { label: 'Kick Width',     type: 'knee_width',        colour: '#EF4444', dragOverlay: 'kick_width' },
  { label: 'Head Lift',      type: 'head_position',     colour: '#EF4444', dragOverlay: 'head_lift' },
  { label: 'Hip Drop',       type: 'line',              colour: '#F59E0B', dragOverlay: 'hip_drop' },
];

// Stroke presets by type
const STROKE_PRESETS = {
  Breaststroke: [
    { label: 'Knee width', type: 'knee_width', colour: '#00A6C8' },
    { label: 'Heel recovery', type: 'line', colour: '#F59E0B' },
    { label: 'Body line', type: 'body_line', colour: '#10B981' },
    { label: 'Head position', type: 'head_position', colour: '#8B5CF6' },
    { label: 'Glide streamline', type: 'streamline_line', colour: '#0077B6' },
  ],
  Freestyle: [
    { label: 'Body line', type: 'body_line', colour: '#10B981' },
    { label: 'Catch angle', type: 'catch_angle', colour: '#00A6C8' },
    { label: 'Head/breathing', type: 'head_position', colour: '#8B5CF6' },
    { label: 'Hand entry', type: 'arrow', colour: '#F59E0B' },
  ],
  Backstroke: [
    { label: 'Shoulder entry', type: 'line', colour: '#00A6C8' },
    { label: 'Rotation line', type: 'line', colour: '#F59E0B' },
    { label: 'Head stillness', type: 'head_position', colour: '#8B5CF6' },
    { label: 'Hip height', type: 'line', colour: '#10B981' },
  ],
  Butterfly: [
    { label: 'Body wave', type: 'body_line', colour: '#10B981' },
    { label: 'Breath timing', type: 'text', colour: '#F59E0B' },
    { label: 'Recovery height', type: 'arrow', colour: '#00A6C8' },
    { label: 'Kick timing', type: 'text', colour: '#8B5CF6' },
  ],
  General: [
    { label: 'Streamline', type: 'streamline_line', colour: '#0077B6' },
    { label: 'Breakout marker', type: 'arrow', colour: '#F59E0B' },
    { label: 'Turn approach', type: 'line', colour: '#10B981' },
  ],
};

const TOOL_CONFIG = [
  { id: 'line',      icon: Minus,       label: 'Line' },
  { id: 'arrow',     icon: ArrowRight,  label: 'Arrow' },
  { id: 'angle',     icon: Triangle,    label: 'Angle' },
  { id: 'circle',    icon: Circle,      label: 'Circle' },
  { id: 'rectangle', icon: Square,      label: 'Rectangle' },
  { id: 'freehand',  icon: Pencil,      label: 'Freehand' },
  { id: 'text',      icon: Type,        label: 'Text' },
];

const COLOURS = ['#00A6C8', '#0077B6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#ffffff', '#000000'];

function drawShape(ctx, shape, offsetX = 0, offsetY = 0) {
  const { type, points, colour, label } = shape;
  ctx.strokeStyle = colour || '#00A6C8';
  ctx.fillStyle = colour || '#00A6C8';
  ctx.lineWidth = 2;
  ctx.font = '13px Inter, sans-serif';

  if (!points || points.length < 2) return;
  const [p1, p2, p3] = points.map(p => ({ x: p.x + offsetX, y: p.y + offsetY }));

  ctx.beginPath();
  switch (type) {
    case 'line':
    case 'body_line':
    case 'streamline_line':
    case 'knee_width':
    case 'head_position':
    case 'catch_angle':
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      if (label) {
        ctx.fillText(label, p1.x + 4, p1.y - 4);
      }
      break;
    case 'arrow': {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const angle = Math.atan2(dy, dx);
      const headLen = 12;
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p2.x - headLen * Math.cos(angle - 0.4), p2.y - headLen * Math.sin(angle - 0.4));
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p2.x - headLen * Math.cos(angle + 0.4), p2.y - headLen * Math.sin(angle + 0.4));
      ctx.stroke();
      if (label) ctx.fillText(label, p1.x + 4, p1.y - 4);
      break;
    }
    case 'angle': {
      if (points.length >= 3) {
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.stroke();
        // Calculate and show angle
        const a1 = Math.atan2(p1.y - p2.y, p1.x - p2.x);
        const a2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
        let deg = Math.abs((a1 - a2) * 180 / Math.PI);
        if (deg > 180) deg = 360 - deg;
        ctx.fillText(`${Math.round(deg)}°`, p2.x + 6, p2.y - 6);
      } else {
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      break;
    }
    case 'circle': {
      const rx = Math.abs(p2.x - p1.x) / 2;
      const ry = Math.abs(p2.y - p1.y) / 2;
      const cx = p1.x + (p2.x - p1.x) / 2;
      const cy = p1.y + (p2.y - p1.y) / 2;
      ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
      ctx.stroke();
      if (label) ctx.fillText(label, cx + rx + 2, cy);
      break;
    }
    case 'rectangle':
      ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      if (label) ctx.fillText(label, p1.x + 2, p1.y - 4);
      break;
    case 'freehand':
      if (points.length > 1) {
        ctx.moveTo(p1.x, p1.y);
        points.slice(1).forEach(pt => ctx.lineTo(pt.x + offsetX, pt.y + offsetY));
        ctx.stroke();
      }
      break;
    case 'text':
      ctx.fillText(label || 'Note', p1.x, p1.y);
      break;
    default:
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
  }
}

export default function VideoAnnotator({ videoUploadId, swimmerId, clubId, reportId, sessionId, findings = [], strokeType, onAnnotationSaved }) {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const { user } = useAuth();
  const [tool, setTool] = useState('line');
  const [colour, setColour] = useState('#00A6C8');
  const [drawing, setDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [shapes, setShapes] = useState([]); // shapes on current canvas
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [selectedFinding, setSelectedFinding] = useState('');
  const [visibility, setVisibility] = useState('coach_only');
  const [includeInReport, setIncludeInReport] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [anglePoints, setAnglePoints] = useState([]); // for 3-point angle tool
  const queryClient = useQueryClient();

  const { data: existingAnnotations = [] } = useQuery({
    queryKey: ['annotations', videoUploadId],
    queryFn: () => base44.entities.Annotation.filter({ video_upload_id: videoUploadId }, '-created_date', 100),
    enabled: !!videoUploadId,
  });

  const saveAnnotation = useMutation({
    mutationFn: (data) => base44.entities.Annotation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', videoUploadId] });
      if (onAnnotationSaved) onAnnotationSaved();
    },
  });

  const deleteAnnotation = useMutation({
    mutationFn: (id) => base44.entities.Annotation.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['annotations', videoUploadId] }),
  });

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw saved annotations for current timestamp (within 1s)
    if (showAnnotations) {
      existingAnnotations
        .filter(a => a.timestamp_seconds != null && Math.abs(a.timestamp_seconds - videoTime) < 1.5)
        .forEach(a => {
          try {
            const coords = JSON.parse(a.coordinates_json || '{}');
            if (coords.points) drawShape(ctx, { ...coords, colour: a.colour, label: a.label });
          } catch { /* noop */ }
        });
    }

    // Draw in-progress shapes
    shapes.forEach(s => drawShape(ctx, s));

    // Draw current in-progress shape
    if (currentPoints.length >= 2) {
      drawShape(ctx, { type: tool, points: currentPoints, colour, label });
    }
  }, [shapes, currentPoints, tool, colour, label, existingAnnotations, videoTime, showAnnotations]);

  useEffect(() => { redrawCanvas(); }, [redrawCanvas]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const handleMouseDown = (e) => {
    const pos = getPos(e);
    if (tool === 'angle') {
      const newPts = [...anglePoints, pos];
      setAnglePoints(newPts);
      if (newPts.length === 3) {
        setShapes(prev => [...prev, { type: 'angle', points: newPts, colour, label }]);
        setAnglePoints([]);
      }
      return;
    }
    setDrawing(true);
    setCurrentPoints(tool === 'freehand' ? [pos] : [pos, pos]);
  };

  const handleMouseMove = (e) => {
    if (!drawing) return;
    const pos = getPos(e);
    if (tool === 'freehand') {
      setCurrentPoints(prev => [...prev, pos]);
    } else {
      setCurrentPoints(prev => [prev[0], pos]);
    }
  };

  const handleMouseUp = () => {
    if (!drawing || currentPoints.length < 2) { setDrawing(false); return; }
    setShapes(prev => [...prev, { type: tool, points: currentPoints, colour, label }]);
    setCurrentPoints([]);
    setDrawing(false);
  };

  const handleUndo = () => setShapes(prev => prev.slice(0, -1));
  const handleClear = () => { setShapes([]); setCurrentPoints([]); setAnglePoints([]); };

  const handleSave = async () => {
    if (shapes.length === 0) return;
    setSaving(true);
    const ts = videoRef.current?.currentTime ?? videoTime;
    const mins = Math.floor(ts / 60);
    const secs = Math.floor(ts % 60);

    for (const shape of shapes) {
      await saveAnnotation.mutateAsync({
        club_id: clubId,
        swimmer_id: swimmerId,
        report_id: reportId || undefined,
        video_upload_id: videoUploadId,
        analysis_session_id: sessionId || undefined,
        finding_id: selectedFinding || undefined,
        created_by: user?.id || '',
        annotation_type: shape.type,
        timestamp_seconds: ts,
        video_time_label: `${mins}:${String(secs).padStart(2, '0')}`,
        coordinates_json: JSON.stringify({ type: shape.type, points: shape.points }),
        label: label || shape.label || shape.type,
        note: note || undefined,
        colour: shape.colour,
        is_included_in_report: includeInReport,
        source: 'coach',
        visibility,
      });
    }
    setShapes([]);
    setCurrentPoints([]);
    setLabel('');
    setNote('');
    setSaving(false);
    setSavedMsg('Annotation saved');
    setTimeout(() => setSavedMsg(''), 2500);
    // Do NOT call onAnnotationSaved — keep panel open so coach can add more annotations
  };

  const applyPreset = (preset) => {
    setTool(preset.type);
    setColour(preset.colour);
    setLabel(preset.label);
  };

  const presets = STROKE_PRESETS[strokeType] || STROKE_PRESETS.General;
  const [showDragPresets, setShowDragPresets] = useState(false);

  return (
    <div className="space-y-3">
      {/* Preset quick-buttons */}
      <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-secondary/50 border border-border">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-full mb-1">Quick Presets — {strokeType || 'General'}</span>
        {presets.map(p => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className="text-[10px] px-2 py-1 rounded border border-border bg-card hover:bg-secondary transition-colors"
            style={{ borderLeftColor: p.colour, borderLeftWidth: 3 }}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setShowDragPresets(v => !v)}
          className="text-[10px] px-2 py-1 rounded border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors w-full mt-1"
        >
          {showDragPresets ? '▲ Hide' : '▼ Drag Risk Overlays'}
        </button>
        {showDragPresets && DRAG_PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className="text-[10px] px-2 py-1 rounded border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
            style={{ borderLeftColor: p.colour, borderLeftWidth: 3 }}
          >
            ⚠ {p.label}
          </button>
        ))}
      </div>

      {/* Tool bar */}
      <div className="flex flex-wrap gap-1.5 items-center p-2 rounded-lg bg-card border border-border">
        {TOOL_CONFIG.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              title={t.label}
              onClick={() => setTool(t.id)}
              className={`p-1.5 rounded transition-colors ${tool === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
        <div className="w-px h-5 bg-border mx-1" />
        {/* Colour picker */}
        {COLOURS.map(c => (
          <button
            key={c}
            onClick={() => setColour(c)}
            className={`w-5 h-5 rounded-full border-2 transition-all ${colour === c ? 'border-foreground scale-110' : 'border-transparent'}`}
            style={{ backgroundColor: c }}
          />
        ))}
        <div className="w-px h-5 bg-border mx-1" />
        <button title="Undo" onClick={handleUndo} className="p-1.5 rounded text-muted-foreground hover:bg-secondary">
          <Undo2 className="w-4 h-4" />
        </button>
        <button title="Clear" onClick={handleClear} className="p-1.5 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          title={showAnnotations ? 'Hide saved annotations' : 'Show saved annotations'}
          onClick={() => setShowAnnotations(v => !v)}
          className="p-1.5 rounded text-muted-foreground hover:bg-secondary"
        >
          {showAnnotations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        {tool === 'angle' && anglePoints.length > 0 && (
          <span className="text-[10px] text-primary ml-1">Click {3 - anglePoints.length} more point{3 - anglePoints.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Canvas overlay on video placeholder */}
      <div className="relative rounded-lg overflow-hidden border border-border bg-black aspect-video select-none">
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs pointer-events-none z-0">
          <div className="text-center space-y-1">
            <div className="opacity-50">Video frame at {Math.floor(videoTime / 60)}:{String(Math.floor(videoTime % 60)).padStart(2,'0')}</div>
            <div className="opacity-30 text-[10px]">Draw on this canvas to annotate</div>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="absolute inset-0 w-full h-full cursor-crosshair z-10"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        />
      </div>

      {/* Video time scrubber (manual, since we store coords not live video) */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground w-16">Time: {Math.floor(videoTime / 60)}:{String(Math.floor(videoTime % 60)).padStart(2, '0')}</span>
        <input
          type="range"
          min={0}
          max={600}
          step={0.1}
          value={videoTime}
          onChange={e => setVideoTime(parseFloat(e.target.value))}
          className="flex-1 h-1 accent-primary"
        />
        <button onClick={() => setVideoTime(v => Math.max(0, v - 1/30))} className="p-1 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={() => setVideoTime(v => v + 1/30)} className="p-1 text-muted-foreground hover:text-foreground">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Annotation metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Label</label>
          <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Hip drop" className="mt-1 text-xs h-8" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Visibility</label>
          <select
            value={visibility}
            onChange={e => setVisibility(e.target.value)}
            className="mt-1 w-full h-8 rounded-md border border-input bg-transparent px-3 text-xs"
          >
            <option value="coach_only">Coach only</option>
            <option value="report">Include in report</option>
            <option value="shared_report">Shared report</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Coach Note</label>
          <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note..." className="mt-1 text-xs h-8" />
        </div>
        {findings.length > 0 && (
          <div className="sm:col-span-2">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Attach to Finding (optional)</label>
            <select
              value={selectedFinding}
              onChange={e => setSelectedFinding(e.target.value)}
              className="mt-1 w-full h-8 rounded-md border border-input bg-transparent px-3 text-xs"
            >
              <option value="">— None —</option>
              {findings.map(f => (
                <option key={f.id} value={f.id}>{f.finding_name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="includeInReport"
            checked={includeInReport}
            onChange={e => setIncludeInReport(e.target.checked)}
            className="accent-primary"
          />
          <label htmlFor="includeInReport" className="text-[10px] text-muted-foreground">Include in printed report</label>
        </div>
      </div>

      {/* Save / honesty label */}
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          className="h-8 text-xs"
          onClick={handleSave}
          disabled={shapes.length === 0 || saving}
        >
          <Save className="w-3.5 h-3.5 mr-1.5" />
          {saving ? 'Saving…' : `Save Annotation${shapes.length > 1 ? 's' : ''} (${shapes.length})`}
        </Button>
        {savedMsg && <span className="text-[10px] text-green-400">{savedMsg}</span>}
        <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
          <BookOpen className="w-3 h-3" /> Coach annotation
        </span>
      </div>

      {/* Saved annotations list */}
      {existingAnnotations.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Saved Annotations ({existingAnnotations.length})</div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {existingAnnotations.map(a => (
              <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 text-xs">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: a.colour || '#00A6C8' }} />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-foreground">{a.label || a.annotation_type}</span>
                  {a.video_time_label && <span className="text-muted-foreground ml-1.5">@ {a.video_time_label}</span>}
                  {a.note && <div className="text-muted-foreground truncate">{a.note}</div>}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[9px] px-1 rounded ${a.visibility === 'coach_only' ? 'bg-secondary text-muted-foreground' : a.visibility === 'shared_report' ? 'bg-green-900/20 text-green-400' : 'bg-primary/10 text-primary'}`}>
                      {a.visibility === 'coach_only' ? 'Coach only' : a.visibility === 'report' ? 'In report' : 'Shared'}
                    </span>
                    <span className="text-[9px] text-muted-foreground">Coach annotation</span>
                  </div>
                </div>
                <button onClick={() => deleteAnnotation.mutate(a.id)} className="p-1 text-muted-foreground hover:text-destructive flex-shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}