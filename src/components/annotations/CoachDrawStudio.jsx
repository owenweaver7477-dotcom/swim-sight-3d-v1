import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AnnotationCanvas from './AnnotationCanvas';
import { formatTimestamp } from '@/lib/annotationRender';
import {
  BookmarkPlus,
  FastForward,
  Gauge,
  PencilLine,
  Rewind,
  Save,
  SkipBack,
  SkipForward,
} from 'lucide-react';

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1];
const APPROX_FRAME_STEP = 1 / 30;

export default function CoachDrawStudio({
  signedVideoUrl,
  signedVideoError,
  video,
  onSaveAnnotation,
  onCaptureTimestamp,
  onSaveMarker,
  savingMarker,
  findings = [],
  canEdit = true,
  saving,
}) {
  const videoRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
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

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackRate;
  }, [playbackRate, signedVideoUrl]);

  const syncTimestamp = () => {
    const current = videoRef.current;
    if (!current) return;
    setTimestamp(current.currentTime || 0);
  };

  const seekBy = (seconds) => {
    const current = videoRef.current;
    if (!current) return;
    current.currentTime = Math.max(0, Math.min(current.duration || Number.MAX_SAFE_INTEGER, (current.currentTime || 0) + seconds));
    syncTimestamp();
  };

  const pauseAndCapture = () => {
    const current = videoRef.current;
    current?.pause();
    const currentTime = current?.currentTime || timestamp || 0;
    setTimestamp(currentTime);
    onCaptureTimestamp?.(currentTime);
  };

  const startDrawing = () => {
    const current = videoRef.current;
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
      videoWidth: videoRef.current?.videoWidth || null,
      videoHeight: videoRef.current?.videoHeight || null,
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
    const currentTime = videoRef.current?.currentTime || timestamp || 0;
    await onSaveMarker({
      timestampSeconds: currentTime,
      videoFrameTimeLabel: formatTimestamp(currentTime),
      title: markerLabel || 'Key frame',
      coachNote: markerNote || null,
      includeInReport: markerIncludeInReport,
    });
    setMarkerLabel('Key frame');
    setMarkerNote('');
    setMarkerIncludeInReport(false);
  };

  return (
    <div className="space-y-3">
      <div className="relative rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
        {signedVideoUrl ? (
          <video
            ref={videoRef}
            src={signedVideoUrl}
            controls={!drawing}
            className="w-full h-full object-contain"
            onTimeUpdate={syncTimestamp}
            onLoadedMetadata={syncTimestamp}
            onSeeked={syncTimestamp}
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

        {drawing && (
          <AnnotationCanvas
            timestampSeconds={timestamp}
            onSave={handleCanvasSave}
            onCancel={() => setDrawing(false)}
            saving={saving}
          />
        )}
      </div>

      <div className="p-3 rounded-xl bg-secondary/40 border border-border space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-foreground uppercase tracking-wider">Coach Studio Controls</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Slow the private video, pause at a moment, then save a timestamp, finding, or Coach Draw annotation.
            </p>
          </div>
          <div className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1">
            {formatTimestamp(timestamp)}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
            <Gauge className="w-3.5 h-3.5 text-muted-foreground mx-1" />
            {PLAYBACK_SPEEDS.map(speed => (
              <button
                key={speed}
                type="button"
                onClick={() => setPlaybackRate(speed)}
                className={`h-8 min-w-11 rounded-md px-2 text-xs font-semibold transition-colors ${
                  playbackRate === speed
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" className="h-10 text-xs" onClick={() => seekBy(-1)} disabled={!signedVideoUrl}>
            <Rewind className="w-3.5 h-3.5 mr-1" /> 1s
          </Button>
          <Button size="sm" variant="outline" className="h-10 text-xs" onClick={() => seekBy(1)} disabled={!signedVideoUrl}>
            <FastForward className="w-3.5 h-3.5 mr-1" /> 1s
          </Button>
          <Button size="sm" variant="outline" className="h-10 text-xs" onClick={() => seekBy(-APPROX_FRAME_STEP)} disabled={!signedVideoUrl}>
            <SkipBack className="w-3.5 h-3.5 mr-1" /> Step approx
          </Button>
          <Button size="sm" variant="outline" className="h-10 text-xs" onClick={() => seekBy(APPROX_FRAME_STEP)} disabled={!signedVideoUrl}>
            <SkipForward className="w-3.5 h-3.5 mr-1" /> Step approx
          </Button>
          <Button size="sm" variant="outline" className="h-10 text-xs" onClick={pauseAndCapture} disabled={!signedVideoUrl || !canEdit}>
            Use timestamp for finding
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Button
          size="sm"
          className="h-10 text-xs bg-primary text-primary-foreground"
          onClick={startDrawing}
          disabled={!signedVideoUrl || !canEdit}
        >
          <PencilLine className="w-3.5 h-3.5 mr-1.5" /> Coach Draw
        </Button>
        {onSaveMarker && (
          <Button
            size="sm"
            variant="outline"
            className="h-10 text-xs"
            onClick={saveMarker}
            disabled={!signedVideoUrl || !canEdit || savingMarker}
          >
            <BookmarkPlus className="w-3.5 h-3.5 mr-1.5" /> {savingMarker ? 'Saving...' : 'Mark key frame'}
          </Button>
        )}
        <div className="text-[10px] text-muted-foreground">
          Pause the video, then mark the frame with finger, Apple Pencil, stylus, or mouse.
        </div>
      </div>

      {onSaveMarker && (
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,220px)_1fr_auto] gap-2 items-start p-3 rounded-xl bg-card border border-border">
          <Input
            value={markerLabel}
            onChange={e => setMarkerLabel(e.target.value)}
            className="h-9 text-xs"
            placeholder="Marker label, e.g. Catch"
          />
          <Input
            value={markerNote}
            onChange={e => setMarkerNote(e.target.value)}
            className="h-9 text-xs"
            placeholder="Optional coach note for this timestamp"
          />
          <label className="flex items-center gap-2 text-xs text-muted-foreground h-9">
            <input
              type="checkbox"
              checked={markerIncludeInReport}
              onChange={e => setMarkerIncludeInReport(e.target.checked)}
            />
            Include
          </label>
        </div>
      )}

      {pendingDrawing && (
        <div className="p-3 rounded-xl bg-card border border-border space-y-2">
          <div className="text-xs font-semibold text-foreground">Save annotation at {formatTimestamp(timestamp)}</div>
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
