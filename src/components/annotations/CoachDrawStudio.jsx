import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AnnotationCanvas from './AnnotationCanvas';
import { formatTimestamp } from '@/lib/annotationRender';
import { PencilLine, Save } from 'lucide-react';

export default function CoachDrawStudio({
  signedVideoUrl,
  signedVideoError,
  video,
  onSaveAnnotation,
  canEdit = true,
  saving,
}) {
  const videoRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [pendingDrawing, setPendingDrawing] = useState(null);
  const [timestamp, setTimestamp] = useState(0);
  const [title, setTitle] = useState('');
  const [coachNote, setCoachNote] = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);

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
    });
    setPendingDrawing(null);
    setTitle('');
    setCoachNote('');
    setIncludeInReport(false);
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

      <div className="flex flex-wrap gap-2 items-center">
        <Button
          size="sm"
          className="h-9 text-xs bg-primary text-primary-foreground"
          onClick={startDrawing}
          disabled={!signedVideoUrl || !canEdit}
        >
          <PencilLine className="w-3.5 h-3.5 mr-1.5" /> Coach Draw
        </Button>
        <div className="text-[10px] text-muted-foreground">
          Pause the video, choose Coach Draw, then mark the frame. Supports mouse, touch, Apple Pencil, and stylus pointer input where the browser supports it.
        </div>
      </div>

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
