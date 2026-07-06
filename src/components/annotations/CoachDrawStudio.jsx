import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AnnotationCanvas from './AnnotationCanvas';
import { formatTimestamp } from '@/lib/annotationRender';
import { DEFAULT_DRILLS } from '@/lib/defaultDrills';
import { suggestDrillsForFinding } from '@/lib/drillMatching';
import FeatureStatusBadge from '@/components/status/FeatureStatusBadge';
import {
  BookmarkPlus,
  FastForward,
  Gauge,
  Maximize2,
  PencilLine,
  Plus,
  Rewind,
  Save,
  SlidersHorizontal,
  SkipBack,
  SkipForward,
  X,
} from 'lucide-react';

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
const APPROX_FRAME_STEP = 1 / 30;
const THUMBNAIL_MAX_WIDTH = 480;
const QUICK_LABELS_BY_STROKE = {
  breaststroke: ['Catch', 'Breath', 'Kick setup', 'Kick drive', 'Line reset'],
  freestyle: ['Entry', 'Catch setup', 'Pull', 'Breath', 'Recovery', 'Body line'],
  backstroke: ['Rotation', 'Catch setup', 'Pull', 'Recovery', 'Body line'],
  butterfly: ['Catch setup', 'Pull', 'Breath', 'Kick timing', 'Recovery'],
};

// Reuse existing default drill data (no schema change) to suggest drills for the
// selected stroke + phase. Falls back to stroke-only, then to any drills.
function recommendedDrillsFor(stroke, phase) {
  const s = String(stroke || '').toLowerCase();
  const p = String(phase || '').toLowerCase();
  const byStroke = DEFAULT_DRILLS.filter((d) => String(d.stroke || '').toLowerCase() === s);
  const pool = byStroke.length ? byStroke : DEFAULT_DRILLS;
  if (!p) return pool.slice(0, 8);
  const words = p.split(/\s+/).filter((w) => w.length > 2);
  const matched = pool.filter((d) => {
    const hay = `${d.phase || ''} ${d.fault_tags || ''}`.toLowerCase();
    return words.some((w) => hay.includes(w));
  });
  return (matched.length ? matched : pool).slice(0, 8);
}

function estimateFps(video = {}) {
  const value = Number(video?.fps || video?.video_fps || video?.metadata?.fps || video?.review_context?.fps);
  return Number.isFinite(value) && value > 0 ? value : 30;
}

function captureVideoThumbnail(videoNode) {
  try {
    if (!videoNode?.videoWidth || !videoNode?.videoHeight) return null;
    const scale = Math.min(1, THUMBNAIL_MAX_WIDTH / videoNode.videoWidth);
    const width = Math.max(1, Math.round(videoNode.videoWidth * scale));
    const height = Math.max(1, Math.round(videoNode.videoHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.drawImage(videoNode, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.68);
  } catch {
    return null;
  }
}

export default function CoachDrawStudio({
  signedVideoUrl,
  signedVideoError,
  video,
  onSaveAnnotation,
  onCaptureTimestamp,
  onStartFindingFromMoment,
  onSaveMarker,
  seekRequest,
  drawRequest,
  savingMarker,
  findings = [],
  keyStamps = [],
  drillOptions = [],
  canEdit = true,
  saving,
}) {
  const inlineVideoRef = useRef(null);
  const fullscreenVideoRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [pendingDrawing, setPendingDrawing] = useState(null);
  const [timestamp, setTimestamp] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [title, setTitle] = useState('');
  const [coachNote, setCoachNote] = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);
  const [linkedFindingId, setLinkedFindingId] = useState('');
  const [markerLabel, setMarkerLabel] = useState('Key frame');
  const [markerNote, setMarkerNote] = useState('');
  const [markerIncludeInReport, setMarkerIncludeInReport] = useState(false);
  const [controlsExpanded, setControlsExpanded] = useState(false);
  const fps = estimateFps(video);
  const approxFrame = Math.max(0, Math.round((timestamp || 0) * fps));
  const quickLabels = QUICK_LABELS_BY_STROKE[String(video?.stroke_type || '').toLowerCase()] || ['Key frame', 'Catch', 'Breath', 'Body line', 'Turn', 'Breakout'];
  const [selectedDrill, setSelectedDrill] = useState(null);
  const drillPool = (drillOptions && drillOptions.length) ? drillOptions : DEFAULT_DRILLS;
  const draftFindingForDrills = { stroke_phase: markerLabel, phase: markerLabel, observation: markerNote, coach_sees: markerNote, fault_tag: markerNote };
  const suggestedDrills = suggestDrillsForFinding(drillPool, draftFindingForDrills, video?.stroke_type, 8);
  const fullscreenDrills = suggestedDrills.length ? suggestedDrills : recommendedDrillsFor(video?.stroke_type, markerLabel);
  // Key moments come from saved key_frame annotations (which carry a captured thumbnail),
  // not from findings — so the strip shows real screenshots.
  const keyMoments = (keyStamps || []).map((a) => ({
    id: a.id,
    seconds: Number(a.timestamp_seconds ?? 0) || 0,
    phase: a.title || a.frame_label || 'Key moment',
    note: a.coach_note || '',
    thumb: (typeof a.thumbnail_data_url === 'string' && a.thumbnail_data_url.startsWith('data:image/')) ? a.thumbnail_data_url : null,
  }));

  useEffect(() => {
    [inlineVideoRef.current, fullscreenVideoRef.current].forEach(current => {
      if (current) current.playbackRate = playbackRate;
    });
  }, [playbackRate, signedVideoUrl]);

  useEffect(() => {
    const source = fullscreenOpen ? inlineVideoRef.current : fullscreenVideoRef.current;
    const target = fullscreenOpen ? fullscreenVideoRef.current : inlineVideoRef.current;
    if (!target) return;
    target.playbackRate = playbackRate;
    if (source && Number.isFinite(source.currentTime)) {
      target.currentTime = source.currentTime || timestamp || 0;
    } else if (timestamp) {
      target.currentTime = timestamp;
    }
  }, [fullscreenOpen, playbackRate, signedVideoUrl]);

  useEffect(() => {
    if (!fullscreenOpen) return undefined;
    const onKeyDown = (e) => { if (e.key === 'Escape') setFullscreenOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fullscreenOpen]);

  useEffect(() => {
    if (!seekRequest || !Number.isFinite(Number(seekRequest.timestampSeconds))) return;
    const current = activeVideo();
    if (!current) return;
    current.pause();
    current.currentTime = Math.max(0, Number(seekRequest.timestampSeconds));
    syncTimestamp(current);
  }, [seekRequest?.nonce]);

  useEffect(() => {
    if (!drawRequest || !Number.isFinite(Number(drawRequest.timestampSeconds))) return;
    const current = activeVideo();
    if (current) {
      current.pause();
      current.currentTime = Math.max(0, Number(drawRequest.timestampSeconds));
      syncTimestamp(current);
    }
    setPendingDrawing(null);
    setDrawing(true);
  }, [drawRequest?.nonce]);

  const activeVideo = () => (fullscreenOpen ? fullscreenVideoRef.current : inlineVideoRef.current);

  const syncTimestamp = (node) => {
    const current = node || activeVideo();
    if (!current) return;
    setTimestamp(current.currentTime || 0);
  };

  const seekBy = (seconds) => {
    const current = activeVideo();
    if (!current) return;
    current.currentTime = Math.max(0, Math.min(current.duration || Number.MAX_SAFE_INTEGER, (current.currentTime || 0) + seconds));
    syncTimestamp(current);
  };

  const pauseAndCapture = () => {
    const current = activeVideo();
    current?.pause();
    const currentTime = current?.currentTime || timestamp || 0;
    setTimestamp(currentTime);
    onCaptureTimestamp?.(currentTime);
    return currentTime;
  };

  const startFindingFromMoment = () => {
    const currentTime = pauseAndCapture();
    onStartFindingFromMoment?.(currentTime, selectedDrill, markerLabel);
    if (fullscreenOpen) {
      if (inlineVideoRef.current) {
        inlineVideoRef.current.currentTime = currentTime;
      }
      setFullscreenOpen(false);
    }
  };

  const startDrawing = () => {
    const current = activeVideo();
    current?.pause();
    setTimestamp(current?.currentTime || 0);
    setPendingDrawing(null);
    setDrawing(true);
  };

  const handleCanvasSave = (drawingData) => {
    setPendingDrawing(drawingData);
    setDrawing(false);
  };

  const saveAnnotation = async () => {
    if (!pendingDrawing) return;
    await onSaveAnnotation({
      drawingData: pendingDrawing,
      timestampSeconds: timestamp,
      videoFrameTimeLabel: formatTimestamp(timestamp),
      title: title || 'Coach-created annotation',
      coachNote,
      includeInReport,
      videoWidth: activeVideo()?.videoWidth || null,
      videoHeight: activeVideo()?.videoHeight || null,
      findingId: linkedFindingId || null,
    });
    setPendingDrawing(null);
    setTitle('');
    setCoachNote('');
    setIncludeInReport(false);
    setLinkedFindingId('');
  };

  const saveMarker = async () => {
    if (!onSaveMarker) return;
    const current = activeVideo();
    const currentTime = current?.currentTime || timestamp || 0;
    await onSaveMarker({
      timestampSeconds: currentTime,
      videoFrameTimeLabel: formatTimestamp(currentTime),
      approxFrame: Math.round(currentTime * fps),
      title: markerLabel || 'Key frame',
      coachNote: markerNote || null,
      includeInReport: markerIncludeInReport,
      thumbnailDataUrl: captureVideoThumbnail(current),
    });
    setMarkerLabel('Key frame');
    setMarkerNote('');
    setMarkerIncludeInReport(false);
  };

  const closeFullscreen = () => {
    const current = fullscreenVideoRef.current;
    if (current) {
      current.pause();
      setTimestamp(current.currentTime || timestamp || 0);
      if (inlineVideoRef.current) {
        inlineVideoRef.current.currentTime = current.currentTime || timestamp || 0;
      }
    }
    setFullscreenOpen(false);
  };

  const renderVideoSurface = (ref, isFullscreen = false) => (
    <div className={`relative overflow-hidden bg-black ${isFullscreen ? 'rounded-xl min-h-[45vh] lg:min-h-[62vh]' : 'rounded-lg'}`} style={{ aspectRatio: '16/9' }}>
      {signedVideoUrl ? (
        <video
          ref={ref}
          src={signedVideoUrl}
          crossOrigin="anonymous"
          controls={!drawing}
          className="w-full h-full object-contain"
          onTimeUpdate={(event) => syncTimestamp(event.currentTarget)}
          onLoadedMetadata={(event) => syncTimestamp(event.currentTarget)}
          onSeeked={(event) => syncTimestamp(event.currentTarget)}
          onPause={(event) => syncTimestamp(event.currentTarget)}
          onPlay={(event) => syncTimestamp(event.currentTarget)}
        />
      ) : signedVideoError ? (
        <div className="h-full flex items-center justify-center text-xs text-red-300 px-4 text-center">
          {signedVideoError}
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
          Loading private video preview...
        </div>
      )}

      {drawing && ((isFullscreen && fullscreenOpen) || (!isFullscreen && !fullscreenOpen)) && (
        <AnnotationCanvas
          timestampSeconds={timestamp}
          onSave={handleCanvasSave}
          onCancel={() => setDrawing(false)}
          saving={saving}
        />
      )}
    </div>
  );

  const controlButtons = (compact = false) => (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="flex w-full flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1 sm:w-auto">
        <Gauge className="w-3.5 h-3.5 text-muted-foreground mx-1" />
        {PLAYBACK_SPEEDS.map(speed => (
          <button
            key={speed}
            type="button"
            onClick={() => setPlaybackRate(speed)}
            className={`${compact ? 'h-10 min-w-12' : 'h-10 min-w-12'} flex-1 rounded-md px-2 text-xs font-semibold transition-colors sm:flex-none ${
              playbackRate === speed
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>
      <Button size="sm" variant="outline" className="h-11 flex-1 text-xs sm:flex-none" onClick={() => seekBy(-1)} disabled={!signedVideoUrl}>
        <Rewind className="w-3.5 h-3.5 mr-1" /> 1s
      </Button>
      <Button size="sm" variant="outline" className="h-11 flex-1 text-xs sm:flex-none" onClick={() => seekBy(1)} disabled={!signedVideoUrl}>
        <FastForward className="w-3.5 h-3.5 mr-1" /> 1s
      </Button>
      <Button size="sm" variant="outline" className="h-11 flex-1 text-xs sm:flex-none" onClick={() => seekBy(-APPROX_FRAME_STEP)} disabled={!signedVideoUrl}>
        <SkipBack className="w-3.5 h-3.5 mr-1" /> Step approx
      </Button>
      <Button size="sm" variant="outline" className="h-11 flex-1 text-xs sm:flex-none" onClick={() => seekBy(APPROX_FRAME_STEP)} disabled={!signedVideoUrl}>
        <SkipForward className="w-3.5 h-3.5 mr-1" /> Step approx
      </Button>
      <Button size="sm" variant="outline" className="h-11 flex-1 text-xs sm:flex-none" onClick={pauseAndCapture} disabled={!signedVideoUrl || !canEdit}>
        Use timestamp
      </Button>
      <Button size="sm" className="h-11 w-full text-xs bg-primary text-primary-foreground sm:w-auto" onClick={startFindingFromMoment} disabled={!signedVideoUrl || !canEdit}>
        <Plus className="w-3.5 h-3.5 mr-1" /> Finding from moment
      </Button>
    </div>
  );

  const actionButtons = (
    <div className="flex flex-wrap gap-2 items-center">
      <Button
        size="sm"
        className="h-11 flex-1 text-xs bg-primary text-primary-foreground sm:flex-none"
        onClick={startDrawing}
        disabled={!signedVideoUrl || !canEdit}
      >
        <PencilLine className="w-3.5 h-3.5 mr-1.5" /> Coach Draw
      </Button>
      {onSaveMarker && (
        <Button
          size="sm"
          variant="outline"
          className="h-11 flex-1 text-xs sm:flex-none"
          onClick={saveMarker}
          disabled={!signedVideoUrl || !canEdit || savingMarker}
        >
          <BookmarkPlus className="w-3.5 h-3.5 mr-1.5" /> {savingMarker ? 'Saving...' : 'Save Key Stamp'}
        </Button>
      )}
      <div className="w-full text-[10px] text-muted-foreground sm:w-auto">
        Pause the video, then mark the frame with finger, Apple Pencil, stylus, or mouse.
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-900">Video-first review</span>
          <FeatureStatusBadge status="partial" />
          <span>Tap Draw, mark the frame, then choose Done Drawing or Hide drawing tools.</span>
        </div>
      </div>
      {renderVideoSurface(inlineVideoRef)}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-10 text-xs"
          onClick={() => setFullscreenOpen(true)}
          disabled={!signedVideoUrl}
        >
          <Maximize2 className="w-3.5 h-3.5 mr-1.5" /> Open Fullscreen Review
        </Button>
        <div className="text-[10px] text-muted-foreground">
          Timestamp updates on play, pause, seek, and step. Frame values are approximate browser estimates.
        </div>
      </div>

      <div className="p-3 rounded-xl bg-secondary/40 border border-border space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-foreground uppercase tracking-wider">Coach Studio Controls</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Slow the private video, pause at a moment, then save a timestamp, finding, or Coach Draw annotation.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1">
              {formatTimestamp(timestamp)}
            </div>
            <div className="text-xs font-mono text-muted-foreground bg-background border border-border rounded-lg px-2.5 py-1">
              Approx frame ~{approxFrame}
            </div>
            <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => setControlsExpanded(current => !current)}>
              <SlidersHorizontal className="mr-1 h-3.5 w-3.5" /> {controlsExpanded ? 'Hide controls' : 'More controls'}
            </Button>
          </div>
        </div>

        {controlsExpanded && controlButtons()}
      </div>

      {actionButtons}

      {onSaveMarker && (
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <div className="flex flex-wrap gap-2">
            {quickLabels.map(label => (
              <button
                key={label}
                type="button"
                onClick={() => setMarkerLabel(label)}
                className={`h-9 rounded-full border px-3 text-[10px] font-semibold ${
                  markerLabel === label
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,220px)_1fr_auto] gap-3 items-start">
            <Input
              value={markerLabel}
              onChange={e => setMarkerLabel(e.target.value)}
              className="h-11 text-sm md:text-xs"
              placeholder="Marker label, e.g. Catch"
            />
            <Input
              value={markerNote}
              onChange={e => setMarkerNote(e.target.value)}
              className="h-11 text-sm md:text-xs"
              placeholder="Optional coach note for this timestamp"
            />
            <label className="flex min-h-11 items-center gap-2 rounded-md border border-border bg-secondary/30 px-3 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={markerIncludeInReport}
                onChange={e => setMarkerIncludeInReport(e.target.checked)}
              />
              Include
            </label>
          </div>
        </div>
      )}

      {fullscreenOpen && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950 p-4 text-white sm:p-6">
          <div className="mx-auto max-w-[1600px] space-y-4">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Fullscreen Review</div>
                <h3 className="text-lg font-semibold sm:text-xl">Mark the exact coaching moment</h3>
                <p className="text-xs text-slate-300">Use slow playback and key moments to mark, draw, and add your coaching findings.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 font-mono text-sm text-cyan-200">{formatTimestamp(timestamp)}</div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-sm text-slate-200">{playbackRate}x</div>
                <Button size="sm" variant="outline" className="h-12 px-4 text-sm font-semibold border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={closeFullscreen}>
                  <X className="mr-1.5 h-4 w-4" /> Exit (Esc)
                </Button>
              </div>
            </div>

            {/* Main: video (left) + Mark this Moment panel (right) */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-3">
                {renderVideoSurface(fullscreenVideoRef, true)}
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Speed</span>
                      {PLAYBACK_SPEEDS.map((speed) => (
                        <button
                          key={speed}
                          type="button"
                          onClick={() => setPlaybackRate(speed)}
                          className={`h-11 min-w-[3rem] rounded-md px-2 text-xs font-semibold transition-colors ${playbackRate === speed ? 'bg-cyan-400 text-slate-950' : 'bg-white/5 text-slate-200 hover:bg-white/10'}`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-11 px-3 text-xs border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => seekBy(-1)} disabled={!signedVideoUrl}>
                        <Rewind className="mr-1 h-4 w-4" /> 1s
                      </Button>
                      <Button size="sm" variant="outline" className="h-11 px-3 text-xs border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => seekBy(1)} disabled={!signedVideoUrl}>
                        <FastForward className="mr-1 h-4 w-4" /> 1s
                      </Button>
                      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-slate-200">Frame ~{approxFrame}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-bold uppercase tracking-wider">Mark this moment</div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300">1. Select stroke phase</div>
                  <div className="grid grid-cols-2 gap-2">
                    {quickLabels.map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setMarkerLabel(label)}
                        className={`min-h-12 rounded-lg border px-3 text-xs font-semibold transition-colors ${markerLabel === label ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-white/15 bg-white/5 text-slate-200 hover:border-cyan-300/50'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300">2. Coach tools</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" className="min-h-12 text-xs border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={startDrawing} disabled={!signedVideoUrl || !canEdit}>
                      <PencilLine className="mr-1.5 h-4 w-4 text-cyan-300" /> Coach Draw
                    </Button>
                    {onSaveMarker && (
                      <Button size="sm" variant="outline" className="min-h-12 text-xs border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={saveMarker} disabled={!signedVideoUrl || !canEdit || savingMarker}>
                        <BookmarkPlus className="mr-1.5 h-4 w-4 text-cyan-300" /> {savingMarker ? 'Saving…' : 'Save Key Stamp'}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-300">3. Optional note</div>
                  <Textarea
                    value={markerNote}
                    onChange={(e) => setMarkerNote(e.target.value)}
                    maxLength={150}
                    className="min-h-[72px] bg-white text-sm text-slate-950"
                    placeholder="Add a quick coaching note…"
                  />
                  <div className="text-right text-[10px] text-slate-400">{markerNote.length}/150</div>
                </div>

                <div className="space-y-1">
                  <Button className="h-12 w-full bg-cyan-400 text-sm font-semibold text-slate-950 hover:bg-cyan-300" onClick={startFindingFromMoment} disabled={!signedVideoUrl || !canEdit}>
                    <Plus className="mr-1.5 h-5 w-5" /> Add Finding from this Moment
                  </Button>
                  <p className="text-center text-[10px] text-slate-400">You can edit the details after adding it.</p>
                </div>
              </div>
            </div>

            {/* Bottom: recommended drills + key moments */}
            <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300">Recommended drills for this phase</div>
                <select
                  value={selectedDrill?.id || ''}
                  onChange={(e) => setSelectedDrill(fullscreenDrills.find((d) => d.id === e.target.value) || null)}
                  className="h-11 w-full max-w-md rounded-lg border border-white/15 bg-white px-3 text-sm text-slate-950"
                >
                  <option value="">Select recommended drill</option>
                  {fullscreenDrills.map((d) => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
                {selectedDrill && (
                  <div className="text-xs text-cyan-200">
                    Selected: {selectedDrill.title}
                    {selectedDrill.report_summary ? ` — ${selectedDrill.report_summary}` : (selectedDrill.purpose ? ` — ${selectedDrill.purpose}` : '')}
                  </div>
                )}
                <p className="text-[10px] text-slate-400">The selected drill attaches to the next finding you add from this moment.</p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300">Key moments ({keyMoments.length})</div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {keyMoments.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { const current = activeVideo(); if (current && Number.isFinite(m.seconds)) { current.currentTime = m.seconds; setTimestamp(m.seconds); } }}
                      className="w-40 flex-shrink-0 rounded-lg border border-white/10 bg-white/5 p-2 text-left transition-colors hover:border-cyan-300/50"
                    >
                      {m.thumb ? (
                        <img src={m.thumb} alt={m.phase} className="mb-2 aspect-video w-full rounded bg-slate-800 object-cover" />
                      ) : (
                        <div className="mb-2 flex aspect-video items-center justify-center rounded bg-slate-800 text-[10px] text-slate-500">No thumbnail</div>
                      )}
                      <div className="font-mono text-xs text-cyan-200">{formatTimestamp(m.seconds)}</div>
                      <div className="truncate text-xs font-semibold text-white">{m.phase}</div>
                      {m.note && <div className="truncate text-[10px] text-slate-400">{m.note}</div>}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={startFindingFromMoment}
                    disabled={!signedVideoUrl || !canEdit}
                    className="flex w-40 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/20 bg-white/5 p-2 text-slate-300 transition-colors hover:border-cyan-300/50 disabled:opacity-50"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-xs font-semibold">Add moment</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {pendingDrawing && (
        <div className="p-3 rounded-xl bg-card border border-border space-y-2">
          <div className="text-xs font-semibold text-foreground">Save annotation at {formatTimestamp(timestamp)} · Approx frame ~{approxFrame}</div>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="h-8 text-xs"
            placeholder="Title, e.g. Body line at breath"
          />
          <Textarea
            value={coachNote}
            onChange={e => setCoachNote(e.target.value)}
            className="text-xs min-h-[52px]"
            placeholder="Coach note for this marked frame..."
          />
          {findings.length > 0 && (
            <select
              value={linkedFindingId}
              onChange={e => setLinkedFindingId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
            >
              <option value="">Leave as report annotation</option>
              {findings.map(finding => (
                <option key={finding.id} value={finding.id}>
                  Attach to: {finding.finding_name || finding.observation || 'Coach finding'}
                </option>
              ))}
            </select>
          )}
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={includeInReport}
              onChange={e => setIncludeInReport(e.target.checked)}
            />
            Include in final/shared report
          </label>
          <div className="flex gap-2">
            <Button size="sm" className="h-8 text-xs" onClick={saveAnnotation} disabled={saving}>
              <Save className="w-3.5 h-3.5 mr-1" />{saving ? 'Saving...' : 'Save Marked Frame'}
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setPendingDrawing(null)}>
              Discard
            </Button>
          </div>
        </div>
      )}

      {video?.capture_source === 'swimpro_export' && (
        <div className="text-[10px] text-muted-foreground p-2.5 rounded-lg bg-secondary/50 border border-border">
          SwimPro export support means coaches can upload video files they already have permission to export and use.
        </div>
      )}
    </div>
  );
}
