import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Layers, Film, Loader2, Play, RotateCcw, Info, Pencil
} from 'lucide-react';

const ANGLE_LABELS = {
  underwater_side: 'Underwater Side',
  underwater_front: 'Underwater Front',
  underwater_rear: 'Underwater Rear',
  above_water_side: 'Above-Water Side',
  above_water_front: 'Above-Water Front',
  above_water_rear: 'Above-Water Rear',
  deck_view: 'Deck View',
  other: 'Other Angle',
  Side: 'Side',
  Front: 'Front',
  Rear: 'Rear',
  Overhead: 'Overhead',
  UnderwaterSide: 'Underwater Side',
  UnderwaterFront: 'Underwater Front',
  Unknown: 'Unknown',
};

const DEVICE_LABELS = {
  swimpro: 'SwimPro export',
  gopro: 'GoPro',
  iphone: 'iPhone/iPad',
  ipad: 'iPhone/iPad',
  generic_camera: 'Generic Camera',
  other: 'Other',
};

const QUALITY_COLORS = {
  excellent: 'text-green-600 bg-green-100',
  good: 'text-primary bg-primary/10',
  usable: 'text-yellow-600 bg-yellow-100',
  poor: 'text-destructive bg-destructive/10',
};

function AngleCard({ upload, isPrimary, onRetryAI, canRetry, annotationCount = 0 }) {
  const [signedUrl, setSignedUrl] = useState(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState('');

  const loadVideo = async () => {
    if (signedUrl) { setShowPlayer(true); return; }
    setLoadingUrl(true);
    try {
      const res = await base44.functions.invoke('getSignedVideoUrl', { video_upload_id: upload.id });
      const nextSignedUrl = res.data?.signed_read_url || res.data?.signed_url;
      if (nextSignedUrl) {
        setSignedUrl(nextSignedUrl);
        setShowPlayer(true);
      }
    } catch { /* non-fatal */ }
    setLoadingUrl(false);
  };

  const handleRetry = async () => {
    if (!onRetryAI) return;
    setRetrying(true);
    setRetryMessage('');
    try {
      await onRetryAI(upload.id);
      setRetryMessage('Opening Analyse to choose report outputs for this angle.');
    } catch (err) {
      setRetryMessage(err?.response?.data?.error || 'Failed to send to AI.');
    }
    setRetrying(false);
  };

  const angleLabel = ANGLE_LABELS[upload.camera_angle] || upload.camera_angle || 'Video';
  const deviceLabel = DEVICE_LABELS[upload.capture_device];
  const qualityColor = QUALITY_COLORS[upload.video_quality_rating] || 'text-muted-foreground bg-secondary';

  return (
    <div className={`rounded-xl border p-3 space-y-2 ${isPrimary ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
      <div className="flex items-start gap-2">
        <Film className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isPrimary ? 'text-primary' : 'text-muted-foreground'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-foreground">{angleLabel}</span>
            {isPrimary && (
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Primary · Used for AI</span>
            )}
            {annotationCount > 0 && (
              <span className="text-[10px] flex items-center gap-0.5 text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                <Pencil className="w-2.5 h-2.5" />{annotationCount}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
            {deviceLabel && (
              <span className="text-[10px] text-muted-foreground">{deviceLabel}</span>
            )}
            {upload.video_quality_rating && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${qualityColor}`}>
                {upload.video_quality_rating}
              </span>
            )}
          </div>
          {upload.notes && (
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{upload.notes}</p>
          )}
        </div>
      </div>

      {/* Video preview */}
      {showPlayer && signedUrl ? (
        <div className="rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
          <video src={signedUrl} controls className="w-full h-full object-contain" />
        </div>
      ) : (
        <button
          onClick={loadVideo}
          className="w-full rounded-lg bg-secondary flex items-center justify-center gap-2 text-muted-foreground hover:bg-secondary/80 transition-colors py-3"
        >
          {loadingUrl ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Play className="w-3.5 h-3.5" />}
          <span className="text-xs">{loadingUrl ? 'Loading…' : 'Open Video'}</span>
        </button>
      )}

      {/* Retry AI with this angle */}
      {canRetry && !isPrimary && (
        <div className="space-y-1.5">
          <Button
            size="sm"
            variant="outline"
            className="w-full h-7 text-[10px]"
            onClick={handleRetry}
            disabled={retrying}
          >
            {retrying ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <RotateCcw className="w-3 h-3 mr-1.5" />}
            {retrying ? 'Opening…' : 'Configure AI for this angle'}
          </Button>
          {retryMessage && (
            <div className={`text-[10px] ${retryMessage.includes('Failed') ? 'text-destructive' : 'text-green-600'}`}>
              {retryMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SupportingAnglesPanel({ report, video, canEdit }) {
  const navigate = useNavigate();

  // Fetch all videos in the same session (if the primary video belongs to a session)
  const sessionId = video?.analysis_session_id;

  const { data: sessionVideos = [], isLoading } = useQuery({
    queryKey: ['session-videos', sessionId],
    queryFn: () => base44.entities.VideoUpload.filter({ analysis_session_id: sessionId }),
    enabled: !!sessionId,
  });

  // Fetch annotation counts per video_upload_id for this session
  const { data: sessionAnnotations = [] } = useQuery({
    queryKey: ['session-annotations', sessionId],
    queryFn: () => base44.entities.Annotation.filter({ analysis_session_id: sessionId }, '-created_date', 500),
    enabled: !!sessionId && sessionVideos.length > 1,
  });

  const annotationCountByVideo = sessionAnnotations.reduce((acc, a) => {
    if (a.video_upload_id) acc[a.video_upload_id] = (acc[a.video_upload_id] || 0) + 1;
    return acc;
  }, {});

  const handleRetryAI = async (videoUploadId) => {
    navigate('/analyse', { state: { videoUploadId, configureAI: true } });
  };

  // If no session, or only one video, don't render (no supporting angles)
  if (!sessionId || (!isLoading && sessionVideos.length <= 1)) return null;

  const supportingVideos = sessionVideos.filter(v => v.id !== video?.id);
  const primaryVideoId = report?.video_upload_id;

  if (supportingVideos.length === 0) return null;

  const uploadedCount = sessionVideos.length;

  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-primary flex-shrink-0" />
        <div>
          <div className="text-xs font-bold text-foreground uppercase tracking-wider">Supporting Angles</div>
          <div className="text-[10px] text-muted-foreground">
            {uploadedCount} angle{uploadedCount !== 1 ? 's' : ''} in this multi-angle session
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
        <Info className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Multi-angle footage available for coach review. AI processed the primary angle only.
          Supporting angles below are for manual coach reference. Use "Configure AI for this angle"
          to choose report outputs before starting another AI-assisted draft.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading angles…
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Primary angle card */}
          {video && (
            <AngleCard
              upload={video}
              isPrimary={true}
              canRetry={false}
              annotationCount={annotationCountByVideo[video.id] || 0}
            />
          )}
          {/* Supporting angle cards */}
          {supportingVideos.map(v => (
            <AngleCard
              key={v.id}
              upload={v}
              isPrimary={false}
              canRetry={canEdit}
              onRetryAI={handleRetryAI}
              annotationCount={annotationCountByVideo[v.id] || 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
