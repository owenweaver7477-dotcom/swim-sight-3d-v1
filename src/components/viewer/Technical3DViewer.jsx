import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCcw, Loader2, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Default camera — three-quarter front view, full body framed
const DEFAULT_ORBIT  = '20deg 75deg 2.8m';
const DEFAULT_TARGET = '0m 0.9m 0m';
const DEFAULT_FOV    = '28deg';

const POSE_TYPE_LABELS = {
  'Base':             { label: 'Base Rig Model',       cls: 'bg-secondary text-muted-foreground' },
  'Fault Pose':       { label: 'Fault Pose',            cls: 'bg-orange-900/30 text-orange-400' },
  'Correction Pose':  { label: 'Correction Pose',       cls: 'bg-green-900/30 text-green-400' },
  'Animation':        { label: 'Animation Reference',   cls: 'bg-primary/10 text-primary' },
};

export default function Technical3DViewer({
  modelUrl, assetName, coachingCue, strokeType, strokePhase,
  technicalCategory, modelPoseType, correctionFocus, linkedFindingName, onReset
}) {
  const [modelStatus, setModelStatus]         = useState('idle'); // idle | loading | loaded | error
  const [animations, setAnimations]           = useState([]);
  const viewerRef = useRef(null);

  // Reset status whenever URL changes
  useEffect(() => {
    setModelStatus(modelUrl ? 'loading' : 'idle');
    setAnimations([]);
  }, [modelUrl]);

  // Attach native custom-element events
  useEffect(() => {
    const el = viewerRef.current;
    if (!el || !modelUrl) return;

    const onLoad = () => {
      setModelStatus('loaded');
      // Detect available animation clips
      const clips = el.availableAnimations || [];
      setAnimations(Array.isArray(clips) ? [...clips] : []);
    };
    const onError = () => setModelStatus('error');

    el.addEventListener('load', onLoad);
    el.addEventListener('error', onError);
    return () => {
      el.removeEventListener('load', onLoad);
      el.removeEventListener('error', onError);
    };
  }, [modelUrl]);

  const handleResetView = useCallback(() => {
    const el = viewerRef.current;
    if (!el) return;
    el.cameraOrbit  = DEFAULT_ORBIT;
    el.cameraTarget = DEFAULT_TARGET;
    el.fieldOfView  = DEFAULT_FOV;
    if (typeof el.jumpCameraToGoal === 'function') el.jumpCameraToGoal();
  }, []);

  const poseTypeCfg = POSE_TYPE_LABELS[modelPoseType] || POSE_TYPE_LABELS['Base'];
  const isBase = !modelPoseType || modelPoseType === 'Base';

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/50">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
            Technical 3D Reference
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider ${poseTypeCfg.cls}`}>
              {poseTypeCfg.label}
            </span>
            {modelStatus === 'loaded' && (
              <span className="text-[9px] text-muted-foreground/70">Drag · Rotate · Zoom</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {modelStatus === 'loaded' && (
            <button
              onClick={handleResetView}
              title="Reset to default view"
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-secondary transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset View
            </button>
          )}
          {onReset && modelUrl && (
            <button
              onClick={onReset}
              title="Clear 3D selection"
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-secondary transition-colors"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Viewport ── */}
      <div className="relative w-full bg-[#0d1520]" style={{ height: 380 }}>

        {/* Empty state */}
        {!modelUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8">
            <div className="w-16 h-16 rounded-full border border-border/40 flex items-center justify-center">
              <svg viewBox="0 0 32 48" width="24" height="36" fill="none" className="opacity-25">
                <circle cx="16" cy="6" r="5" stroke="currentColor" strokeWidth="2" className="text-primary"/>
                <path d="M8 16 Q16 12 24 16 L22 30 L16 28 L10 30 Z" stroke="currentColor" strokeWidth="1.5" className="text-primary" fill="none"/>
                <path d="M10 30 L8 44M22 30 L24 44" stroke="currentColor" strokeWidth="1.5" className="text-primary"/>
                <path d="M8 16 L4 24M24 16 L28 24" stroke="currentColor" strokeWidth="1.5" className="text-primary"/>
              </svg>
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground font-medium">No 3D reference model loaded</p>
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                Click <strong className="text-muted-foreground">Load 3D Reference</strong> on a finding<br/>to load the technical reference model.
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {modelStatus === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 z-10 bg-[#0d1520]">
            <AlertTriangle className="w-8 h-8 text-destructive/60" />
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground font-medium">3D model unavailable</p>
              <p className="text-[10px] text-muted-foreground/60">Check the file URL or storage permissions.</p>
            </div>
            {onReset && (
              <Button size="sm" variant="outline" className="h-7 text-xs mt-1" onClick={onReset}>Clear</Button>
            )}
          </div>
        )}

        {/* Loading overlay */}
        {modelStatus === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-[#0d1520]/95 pointer-events-none">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <div className="text-center space-y-1">
              <p className="text-[11px] text-muted-foreground">Loading 3D reference model…</p>
              <p className="text-[9px] text-muted-foreground/50">Large model — this may take a moment</p>
            </div>
          </div>
        )}

        {/* model-viewer */}
        {modelUrl && modelStatus !== 'error' && (
          <model-viewer
            ref={viewerRef}
            src={modelUrl}
            alt={assetName || 'Technical reference swimmer model'}
            camera-controls
            camera-orbit={DEFAULT_ORBIT}
            camera-target={DEFAULT_TARGET}
            field-of-view={DEFAULT_FOV}
            min-field-of-view="15deg"
            max-field-of-view="45deg"
            shadow-intensity="0.4"
            exposure="1.1"
            environment-image="neutral"
            interaction-prompt="none"
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              position: 'absolute',
              inset: 0,
            }}
          />
        )}
      </div>

      {/* ── Info panel — shown when a model is selected ── */}
      {modelUrl && (
        <div className="px-4 py-3 border-t border-border bg-secondary/30 space-y-3">

          {/* Tags row */}
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {strokeType && strokeType !== 'General' && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wider border border-primary/20">
                {strokeType}
              </span>
            )}
            {strokePhase && (
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-secondary text-foreground uppercase tracking-wider">
                {strokePhase}
              </span>
            )}
            {technicalCategory && (
              <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                {technicalCategory}
              </span>
            )}
          </div>

          {/* Asset name */}
          {assetName && (
            <div className="text-[11px] font-semibold text-foreground">{assetName}</div>
          )}

          {/* Linked finding */}
          {linkedFindingName && (
            <div className="text-[10px] text-muted-foreground/70">
              Linked to: <span className="text-muted-foreground font-medium">{linkedFindingName}</span>
            </div>
          )}

          {/* Correction focus */}
          {correctionFocus && (
            <div className="text-[10px] text-muted-foreground">
              Focus: <span className="text-foreground font-medium">{correctionFocus}</span>
            </div>
          )}

          {/* Coaching cue */}
          {coachingCue && (
            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/15">
              <div className="text-[9px] font-bold uppercase tracking-wider text-primary mb-1">Coaching Cue</div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{coachingCue}</p>
            </div>
          )}

          {/* Base model fallback notice */}
          {isBase && (
            <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/50">
              <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
                Base technical reference — linked to this finding's phase and technical focus.
                Use this model to discuss alignment, body line, and correction focus with the swimmer.
              </p>
            </div>
          )}

          {/* Future note */}
          <div className="pt-1 border-t border-border/40">
            <p className="text-[9px] text-muted-foreground/40 leading-relaxed">
              Stroke-specific animated poses coming in a future update. Static reference model only.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}