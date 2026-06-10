import React, { useRef, useState } from 'react';
import { uploadPrivateVideo } from '@/lib/data/videoUploads';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Film, Upload, CheckCircle2, AlertCircle, Loader2, X, Star
} from 'lucide-react';

const DEVICE_OPTIONS = [
  { value: 'swimpro', label: 'SwimPro export' },
  { value: 'gopro', label: 'GoPro' },
  { value: 'iphone', label: 'iPhone / iPad' },
  { value: 'generic_camera', label: 'Generic Camera' },
  { value: 'other', label: 'Other' },
];

const QUALITY_OPTIONS = [
  { value: 'excellent', label: 'Excellent — 2K/4K, high frame rate, very clear' },
  { value: 'good', label: 'Good — HD, clear image, minimal blur' },
  { value: 'usable', label: 'Usable — Some blur or shaky, swimmer visible' },
  { value: 'poor', label: 'Poor — Very blurry or obstructed' },
];
const LARGE_FILE_WARNING_MB = 80;
const STRONG_FILE_WARNING_MB = 150;
const TRIM_RECOMMENDATION_MB = 250;
const ACTIVE_UPLOAD_STATUSES = ['preparing_upload', 'uploading', 'finalising_upload'];

function captureSourceFromDevice(device) {
  if (device === 'swimpro') return 'swimpro_export';
  if (device === 'iphone') return 'phone_tablet';
  if (device === 'generic_camera' || device === 'gopro') return 'standard_camera';
  return device ? 'other' : undefined;
}

function formatBytes(b) {
  return b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`;
}

function getLargeFileWarning(file) {
  const mb = file.size / (1024 * 1024);
  if (mb >= TRIM_RECOMMENDATION_MB) {
    return `This angle is ${mb.toFixed(1)} MB. 250 MB+ clips are not recommended for pilot testing. Trim or compress to a 5-15 second 720p/1080p clip if possible.`;
  }
  if (mb >= STRONG_FILE_WARNING_MB) {
    return `This angle is ${mb.toFixed(1)} MB. It is allowed, but it may take several minutes. Keep this tab open on stable Wi-Fi.`;
  }
  if (mb >= LARGE_FILE_WARNING_MB) {
    return `This angle is ${mb.toFixed(1)} MB. Upload speed depends on Wi-Fi and device performance. Keep this tab open until upload completes.`;
  }
  return '';
}

export default function MultiAngleUploadCard({
  angleKey,
  angleName,
  angleDescription,
  required,
  clubId,
  swimmerId,
  userId,
  sessionId,
  uploadOrder,
  uploadedRecord,
  onUploaded,
  onRemove,
}) {
  const fileRef = useRef();
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [fileWarning, setFileWarning] = useState('');
  const [status, setStatus] = useState('idle'); // idle | preparing_upload | uploading | finalising_upload | done | error
  const [statusMessage, setStatusMessage] = useState('');
  const [failedRecordId, setFailedRecordId] = useState(null);
  const [device, setDevice] = useState('');
  const [quality, setQuality] = useState('');
  const [syncOffset, setSyncOffset] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [showSwimProTip, setShowSwimProTip] = useState(false);

  const isUploaded = !!uploadedRecord;

  const validateFile = (f) => {
    if (!f.type.startsWith('video/') && !f.name.match(/\.(mp4|mov|webm)$/i))
      return 'Unsupported format. Use MP4, MOV, or WebM.';
    if (f.size > 500 * 1024 * 1024) return 'File too large. Max 500 MB.';
    return null;
  };

  const handleFilePick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    setFileError(err || '');
    setFileWarning(err ? '' : getLargeFileWarning(f));
    setFile(err ? null : f);
    setStatus('idle');
    setStatusMessage('');
    setFailedRecordId(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    setFileError(err || '');
    setFileWarning(err ? '' : getLargeFileWarning(f));
    setFile(err ? null : f);
    setStatus('idle');
    setStatusMessage('');
    setFailedRecordId(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('preparing_upload');
    setStatusMessage('Creating private video record...');
    setFileError('');
    try {
      const record = await uploadPrivateVideo({
        file,
        clubId,
        swimmer: { id: swimmerId },
        userId,
        metadata: {
          analysis_session_id: sessionId || null,
          camera_angle: angleKey,
          capture_device: device || undefined,
          capture_source: captureSourceFromDevice(device),
          video_quality_rating: quality || undefined,
          sync_offset_seconds: syncOffset ? parseFloat(syncOffset) : undefined,
          is_primary_angle: isPrimary,
          review_context: { upload_order: uploadOrder },
        },
        existingVideoUploadId: status === 'error' ? failedRecordId : null,
        onStage: (stage, details = {}) => {
          setStatus(stage);
          if (details.videoUploadId) setFailedRecordId(details.videoUploadId);
          if (stage === 'preparing_upload') setStatusMessage('Creating private video record...');
          else if (stage === 'uploading') setStatusMessage(`Uploading to private storage. Keep this tab open. Video row: ${details.videoUploadId || failedRecordId || 'creating...'}`);
          else if (stage === 'finalising_upload') setStatusMessage('Finalising upload...');
        },
      });
      setStatus('done');
      setStatusMessage('Video uploaded. Ready for AI Review.');
      onUploaded(angleKey, record, isPrimary);
    } catch (err) {
      setStatus('error');
      if (err?.videoUploadId) setFailedRecordId(err.videoUploadId);
      setFileError(err?.response?.data?.error || err?.message || 'Upload failed.');
      setStatusMessage(`Upload did not complete. Retry on stable Wi-Fi or delete the failed row from the video library. Video row: ${err?.videoUploadId || failedRecordId || 'created before upload'}.`);
    }
  };

  const handleDeviceChange = (val) => {
    setDevice(val);
    setShowSwimProTip(val === 'swimpro');
  };

  return (
    <div
      className={`rounded-xl border-2 transition-all ${
        isUploaded
          ? 'border-green-500/40 bg-green-50/30'
          : required
          ? 'border-primary/30 bg-card'
          : 'border-border bg-card'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-3 pb-0">
        <div className={`p-1.5 rounded-lg flex-shrink-0 ${isUploaded ? 'bg-green-100' : required ? 'bg-primary/10' : 'bg-secondary'}`}>
          {isUploaded ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <Film className={`w-4 h-4 ${required ? 'text-primary' : 'text-muted-foreground'}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-foreground">{angleName}</span>
            {required && (
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Recommended</span>
            )}
            {isPrimary && (
              <span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5" /> Primary
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{angleDescription}</p>
        </div>
      </div>

      <div className="p-3 pt-2 space-y-2">
        {/* Uploaded state */}
        {isUploaded ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2 rounded-lg border border-green-200">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{uploadedRecord.original_filename}</span>
            </div>
            {onRemove && (
              <button
                onClick={() => onRemove(angleKey)}
                className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Drop zone */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="border border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <input ref={fileRef} type="file" accept=".mp4,.mov,.webm" onChange={handleFilePick} className="hidden" />
              {file ? (
                <div className="flex items-center gap-2 justify-center">
                  <Film className="w-4 h-4 text-primary" />
                  <span className="text-xs text-foreground truncate max-w-[140px]">{file.name}</span>
                  <span className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</span>
                  <button
                    onClick={e => { e.stopPropagation(); setFile(null); setStatus('idle'); setFileError(''); setFileWarning(''); setStatusMessage(''); setFailedRecordId(null); }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center text-muted-foreground">
                  <Upload className="w-3.5 h-3.5" />
                  <span className="text-xs">Click or drag to upload</span>
                </div>
              )}
            </div>

            {fileError && (
              <div className="flex items-start gap-1 text-[10px] text-destructive">
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> {fileError}
              </div>
            )}
            {fileWarning && (
              <div className="flex items-start gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> {fileWarning}
              </div>
            )}

            {/* Device selector */}
            <Select value={device} onValueChange={handleDeviceChange}>
              <SelectTrigger className="h-7 text-xs bg-card border-border">
                <SelectValue placeholder="Capture device (optional)" />
              </SelectTrigger>
              <SelectContent>
                {DEVICE_OPTIONS.map(d => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* SwimPro tip */}
            {showSwimProTip && (
              <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-[10px] text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">SwimPro export support: </span>
                Upload video files you already have permission to export and use, then add each angle here.
                <span className="block mt-1 text-[9px] text-muted-foreground/70">
                  Direct camera control is not currently built — exported video files only.
                </span>
              </div>
            )}

            {/* Quality rating */}
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger className="h-7 text-xs bg-card border-border">
                <SelectValue placeholder="Video quality (optional)" />
              </SelectTrigger>
              <SelectContent>
                {QUALITY_OPTIONS.map(q => (
                  <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sync offset */}
            <Input
              placeholder="Sync offset (seconds, optional)"
              value={syncOffset}
              onChange={e => setSyncOffset(e.target.value)}
              type="number"
              step="0.1"
              className="h-7 text-xs bg-card border-border"
            />

            {/* Primary angle checkbox */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={e => setIsPrimary(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-xs text-foreground group-hover:text-primary transition-colors">
                Set as primary angle for AI analysis
              </span>
            </label>

            {/* Upload button */}
            {file && status !== 'done' && (
              <Button
                size="sm"
                className="w-full h-8 text-xs bg-primary text-primary-foreground"
                onClick={handleUpload}
                disabled={ACTIVE_UPLOAD_STATUSES.includes(status)}
              >
                {ACTIVE_UPLOAD_STATUSES.includes(status) ? (
                  <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />{statusMessage || 'Uploading…'}</>
                ) : (
                  <><Upload className="w-3 h-3 mr-1.5" />Upload {angleName}</>
                )}
              </Button>
            )}

            {status === 'error' && (
              <div className="space-y-1">
                {statusMessage && <div className="text-[10px] text-destructive leading-relaxed">{statusMessage}</div>}
                <button className="text-[10px] text-destructive underline" onClick={handleUpload}>
                  Retry upload
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
