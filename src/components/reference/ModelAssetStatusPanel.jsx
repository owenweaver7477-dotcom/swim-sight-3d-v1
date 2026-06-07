import React from 'react';
import { Box, Film, AlertTriangle, Upload, Info } from 'lucide-react';

function StatPill({ label, value, highlight }) {
  return (
    <div className={`flex flex-col items-center px-4 py-2.5 rounded-lg border ${highlight ? 'bg-destructive/5 border-destructive/20' : 'bg-secondary/60 border-border'}`}>
      <span className={`text-base font-bold ${highlight ? 'text-destructive' : 'text-foreground'}`}>{value}</span>
      <span className="text-[9px] text-muted-foreground mt-0.5 text-center leading-tight">{label}</span>
    </div>
  );
}

export default function ModelAssetStatusPanel({ assets = [] }) {
  const total = assets.length;
  const uniqueUrls = new Set(assets.filter(a => a.model_url).map(a => a.model_url));
  const uniqueFiles = uniqueUrls.size;
  const baseRig = assets.filter(a => !a.model_pose_type || a.model_pose_type === 'Base').length;
  const animated = assets.filter(a => a.model_pose_type === 'Animation').length;
  const broken = assets.filter(a => !a.model_url).length;
  const allSameRig = total > 1 && uniqueFiles === 1;

  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-4 mb-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Model Asset Status</div>
          <div className="text-xs text-foreground font-medium mt-0.5">Current state of your 3D reference library</div>
        </div>
        {/* Upload CTA — disabled until upload functionality is built */}
        <button
          disabled
          title="Upload functionality coming soon"
          className="flex items-center gap-1.5 text-[10px] font-semibold px-3 py-1.5 rounded-lg border border-border bg-secondary text-muted-foreground cursor-not-allowed opacity-60"
        >
          <Upload className="w-3 h-3" />
          Upload Dedicated 3D Model
          <span className="ml-1 text-[8px] bg-muted px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Soon</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="flex gap-2 flex-wrap">
        <StatPill label="Total Assets" value={total} />
        <StatPill label="Unique Model Files" value={uniqueFiles} />
        <StatPill label="Base Rig References" value={baseRig} />
        <StatPill label="Animated Sequences" value={animated} />
        {broken > 0 && <StatPill label="Unavailable" value={broken} highlight />}
      </div>

      {/* Shared base rig notice */}
      {allSameRig && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-700 leading-relaxed">
            These references currently use <strong>one shared base rig</strong>. Dedicated stroke-phase models can be uploaded later.
          </p>
        </div>
      )}

      {/* Broken models notice */}
      {broken > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-destructive/80 leading-relaxed">
            {broken} asset{broken > 1 ? 's have' : ' has'} no model URL and cannot be viewed. Update the record to add a valid .glb URL.
          </p>
        </div>
      )}
    </div>
  );
}