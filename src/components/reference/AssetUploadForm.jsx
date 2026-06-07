import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const ACCEPTED = {
  image: '.jpg,.jpeg,.png,.webp',
  video: '.mp4,.mov,.webm',
  '3d_model': '.glb,.gltf',
};

function validateFile(file, assetType) {
  if (!file) return 'No file selected.';
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  const allowed = ACCEPTED[assetType]?.split(',') || [];
  if (!allowed.includes(ext)) return `Invalid file type. Allowed: ${ACCEPTED[assetType]}`;
  if (file.size > 200 * 1024 * 1024) return 'File too large. Max 200 MB.';
  return null;
}

export default function AssetUploadForm({ profileId, ownerScope, clubId, canUpload3D, onSuccess }) {
  const [assetType, setAssetType] = useState('image');
  const [cameraAngle, setCameraAngle] = useState('');
  const [phase, setPhase] = useState('');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | uploading | success | error
  const [statusMsg, setStatusMsg] = useState('');
  const fileRef = useRef();
  const queryClient = useQueryClient();

  const availableTypes = canUpload3D
    ? [{ value: 'image', label: 'Image' }, { value: 'video', label: 'Video' }, { value: '3d_model', label: '3D Model (.glb/.gltf)' }]
    : [{ value: 'image', label: 'Image' }, { value: 'video', label: 'Video' }];

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const err = validateFile(f, assetType);
    setFileError(err || '');
    setFile(err ? null : f);
  };

  const handleUpload = async () => {
    if (!file || !profileId) return;
    const err = validateFile(file, assetType);
    if (err) { setFileError(err); return; }

    setUploadStatus('uploading');
    setStatusMsg('Uploading file...');

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    await base44.entities.ReferenceAsset.create({
      reference_profile_id: profileId,
      owner_scope: ownerScope,
      club_id: clubId || undefined,
      asset_type: assetType,
      asset_url: file_url,
      camera_angle: cameraAngle || undefined,
      phase: phase || undefined,
      status: 'active',
    });

    setUploadStatus('success');
    setStatusMsg('Asset uploaded successfully.');
    setFile(null);
    fileRef.current && (fileRef.current.value = '');
    queryClient.invalidateQueries({ queryKey: ['reference-assets'] });
    onSuccess && onSuccess();
  };

  return (
    <div className="space-y-3 p-4 rounded-xl bg-secondary border border-border">
      <div className="text-xs font-semibold text-foreground mb-1">Upload Reference Asset</div>

      <div>
        <Label className="text-[10px] text-muted-foreground">Asset Type</Label>
        <Select value={assetType} onValueChange={(v) => { setAssetType(v); setFile(null); setFileError(''); }}>
          <SelectTrigger className="bg-card border-border mt-1 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {availableTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-[10px] text-muted-foreground">Camera Angle (optional)</Label>
        <Select value={cameraAngle} onValueChange={setCameraAngle}>
          <SelectTrigger className="bg-card border-border mt-1 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
          <SelectContent>
            {['Side', 'Front', 'Rear', '45-Degree', 'Overhead', 'Unknown'].map(a => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-[10px] text-muted-foreground">Phase (optional)</Label>
        <input
          type="text"
          value={phase}
          onChange={e => setPhase(e.target.value)}
          placeholder="e.g. Entry, Pull, Recovery"
          className="w-full mt-1 px-3 py-1.5 text-xs rounded-md border border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div>
        <Label className="text-[10px] text-muted-foreground">
          File <span className="text-muted-foreground">({ACCEPTED[assetType]})</span>
        </Label>
        <div
          onClick={() => fileRef.current?.click()}
          className="mt-1 border border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <input ref={fileRef} type="file" accept={ACCEPTED[assetType]} onChange={handleFile} className="hidden" />
          {file ? (
            <div className="text-xs text-foreground">{file.name} <span className="text-muted-foreground">({(file.size/1024/1024).toFixed(1)} MB)</span></div>
          ) : (
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Upload className="w-3.5 h-3.5" /> Click to select file
            </div>
          )}
        </div>
        {fileError && <div className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fileError}</div>}
      </div>

      {uploadStatus === 'success' && (
        <div className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />{statusMsg}</div>
      )}
      {uploadStatus === 'error' && (
        <div className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{statusMsg}</div>
      )}

      <Button
        size="sm"
        className="w-full"
        disabled={!file || uploadStatus === 'uploading' || !!fileError}
        onClick={handleUpload}
      >
        {uploadStatus === 'uploading' ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Uploading...</> : <><Upload className="w-3.5 h-3.5 mr-1" /> Upload Asset</>}
      </Button>
    </div>
  );
}