import React, { useState } from 'react';
import MultiAngleUploadCard from './MultiAngleUploadCard';
import CameraGuidancePanel from './CameraGuidancePanel';
import { Info, Layers } from 'lucide-react';

const ANGLE_SLOTS = [
  {
    key: 'underwater_side',
    name: 'Underwater Side View',
    description: 'Best for kick depth, pull path, body line, and undulation. Primary choice for pose analysis.',
    required: true,
  },
  {
    key: 'above_water_side',
    name: 'Above-Water Side View',
    description: 'Captures breathing pattern, recovery height, entry angle, and timing above the surface.',
    required: true,
  },
  {
    key: 'underwater_front',
    name: 'Front / Head-On View',
    description: 'Shows catch width, hand-entry alignment, and symmetry from head-on.',
    required: false,
  },
  {
    key: 'underwater_rear',
    name: 'Rear View',
    description: 'Reveals kick spread, hip alignment, and stroke symmetry from behind.',
    required: false,
  },
  {
    key: 'deck_view',
    name: 'Deck View',
    description: 'Useful for turn approach, dive, and overall lane positioning.',
    required: false,
  },
  {
    key: 'other',
    name: 'Other Angle',
    description: 'Any additional camera angle that provides useful supplementary evidence.',
    required: false,
  },
];

export default function MultiAngleUploader({
  clubId,
  swimmerId,
  userId,
  sessionId,
  onUploadsChanged,
}) {
  // Map of angleKey -> VideoUpload record
  const [uploads, setUploads] = useState({});

  const handleUploaded = (angleKey, record, isPrimary) => {
    const next = { ...uploads, [angleKey]: record };
    // If this angle was flagged as primary, clear primary from others
    if (isPrimary) {
      Object.keys(next).forEach(k => {
        if (k !== angleKey && next[k]) next[k] = { ...next[k], is_primary_angle: false };
      });
    }
    setUploads(next);
    onUploadsChanged(next, isPrimary ? angleKey : null);
  };

  const handleRemove = (angleKey) => {
    const next = { ...uploads };
    delete next[angleKey];
    setUploads(next);
    onUploadsChanged(next, null);
  };

  const uploadedCount = Object.keys(uploads).length;

  return (
    <div className="space-y-4">
      {/* SwimPro-ready badge */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
        <Layers className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-foreground">SwimPro-ready upload workflow</span>
            <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
              Compatible with exported SwimPro footage
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
            Upload exported SwimPro camera recordings as individual angles below. Swim Sight 3D can organise
            multi-camera footage for coach review and pose-assisted analysis.{' '}
            <span className="text-foreground/70">Direct camera control is not currently built.</span>
          </p>
        </div>
      </div>

      {/* Progress */}
      {uploadedCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
          <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-[10px] font-bold">
            {uploadedCount}
          </span>
          angle{uploadedCount !== 1 ? 's' : ''} uploaded
          {uploadedCount >= 2 && (
            <span className="text-[10px] text-muted-foreground font-normal ml-1">
              · AI will process the primary angle; others assist manual review
            </span>
          )}
        </div>
      )}

      {/* AI confidence notice */}
      {uploadedCount === 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <Info className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-yellow-700 leading-relaxed">
            AI confidence may be limited by one camera angle. Uploading multiple angles provides more evidence for manual coach review.
          </p>
        </div>
      )}
      {uploadedCount >= 2 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Info className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Multi-angle footage available for coach review. AI currently processes the primary angle only.
          </p>
        </div>
      )}

      {/* Camera guidance */}
      <CameraGuidancePanel />

      {/* Recommended angles */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
          Recommended Angles
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ANGLE_SLOTS.filter(s => s.required).map((slot, i) => (
            <MultiAngleUploadCard
              key={slot.key}
              angleKey={slot.key}
              angleName={slot.name}
              angleDescription={slot.description}
              required={slot.required}
              clubId={clubId}
              swimmerId={swimmerId}
              userId={userId}
              sessionId={sessionId}
              uploadOrder={i}
              uploadedRecord={uploads[slot.key] || null}
              onUploaded={handleUploaded}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </div>

      {/* Optional angles */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
          Optional Angles
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ANGLE_SLOTS.filter(s => !s.required).map((slot, i) => (
            <MultiAngleUploadCard
              key={slot.key}
              angleKey={slot.key}
              angleName={slot.name}
              angleDescription={slot.description}
              required={false}
              clubId={clubId}
              swimmerId={swimmerId}
              userId={userId}
              sessionId={sessionId}
              uploadOrder={ANGLE_SLOTS.filter(s => s.required).length + i}
              uploadedRecord={uploads[slot.key] || null}
              onUploaded={handleUploaded}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </div>
    </div>
  );
}