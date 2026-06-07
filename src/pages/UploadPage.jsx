import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { setReviewSession, getActiveClub, getActiveRole } from '@/lib/swimState';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import { Upload, CheckCircle2, AlertCircle, Loader2, Film, X } from 'lucide-react';

const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/mov'];
const MAX_SIZE_MB = 500;

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function UploadPage() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [status, setStatus] = useState('idle'); // idle | uploading | done | error
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const club = getActiveClub();
  const role = getActiveRole();

  const validateFile = (f) => {
    if (!f) return 'No file selected.';
    if (!ACCEPTED_TYPES.includes(f.type) && !f.name.match(/\.(mp4|mov|webm|avi|m4v)$/i)) {
      return 'Unsupported format. Please use MP4, MOV, WebM or AVI.';
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `File too large. Max ${MAX_SIZE_MB} MB.`;
    return null;
  };

  const handleFilePick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    setFileError(err || '');
    setFile(err ? null : f);
    setStatus('idle');
    setUploadedUrl('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    setFileError(err || '');
    setFile(err ? null : f);
    setStatus('idle');
    setUploadedUrl('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setErrorMsg('');
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploadedUrl(file_url);
    setStatus('done');
  };

  const handleContinue = () => {
    const session = {
      file_name: file?.name || 'video',
      file_size: file?.size || 0,
      file_url: uploadedUrl || null,
      preview_url: uploadedUrl || null,
      has_file: true,
      club_id: club?.id || null,
      role,
    };
    setReviewSession(session);
    navigate('/setup');
  };

  const handleSkipUpload = () => {
    // Allow coach to proceed without uploading (e.g. already has video in system)
    const session = {
      file_name: 'No file selected',
      file_size: 0,
      file_url: null,
      preview_url: null,
      has_file: false,
      club_id: club?.id || null,
      role,
    };
    setReviewSession(session);
    navigate('/setup');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <PageHeader
        eyebrow="New Review"
        title="Upload Video Footage"
        subtitle="Upload swim or dryland footage to begin a coach review session."
      />

      {/* Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 transition-colors mb-4"
      >
        <input ref={fileRef} type="file" accept=".mp4,.mov,.webm,.avi,.m4v" onChange={handleFilePick} className="hidden" />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <Film className="w-10 h-10 text-primary" />
            <div className="text-sm font-medium text-foreground">{file.name}</div>
            <div className="text-xs text-muted-foreground">{formatBytes(file.size)}</div>
            <button
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 mt-1"
              onClick={(e) => { e.stopPropagation(); setFile(null); setStatus('idle'); setUploadedUrl(''); }}
            >
              <X className="w-3 h-3" /> Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-10 h-10 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium text-foreground mb-1">Drag & drop or click to select</div>
              <div className="text-xs text-muted-foreground">MP4, MOV, WebM, AVI · Max {MAX_SIZE_MB} MB</div>
            </div>
          </div>
        )}
      </div>

      {fileError && (
        <div className="text-xs text-destructive flex items-center gap-1 mb-4">
          <AlertCircle className="w-3.5 h-3.5" /> {fileError}
        </div>
      )}

      {/* Status feedback */}
      {status === 'uploading' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 p-3 rounded-lg bg-card border border-border">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Uploading video to secure storage...
        </div>
      )}
      {status === 'done' && (
        <div className="flex items-center gap-2 text-sm text-green-400 mb-4 p-3 rounded-lg bg-card border border-border">
          <CheckCircle2 className="w-4 h-4" />
          Upload complete. Ready for review setup.
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 text-sm text-destructive mb-4 p-3 rounded-lg bg-card border border-border">
          <AlertCircle className="w-4 h-4" />
          {errorMsg || 'Upload failed. Please try again.'}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {status !== 'done' && (
          <Button
            className="flex-1 bg-primary text-primary-foreground"
            disabled={!file || status === 'uploading'}
            onClick={handleUpload}
          >
            {status === 'uploading' ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" /> Upload Video</>
            )}
          </Button>
        )}
        {status === 'done' && (
          <Button className="flex-1 bg-primary text-primary-foreground" onClick={handleContinue}>
            Continue to Setup →
          </Button>
        )}
        <Button variant="outline" onClick={handleSkipUpload} className="text-xs text-muted-foreground">
          Skip Upload
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground mt-4 text-center">
        Files are stored securely. Video is played back directly in the analysis workspace.
      </p>
    </div>
  );
}