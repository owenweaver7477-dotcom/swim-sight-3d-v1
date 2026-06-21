import React, { useMemo, useRef, useState } from 'react';

// Feature A — phase-aligned before/after comparison. Flag-gated, DEFAULT OFF.
// Set VITE_ENABLE_COMPARISON=true to enable. With it off this renders nothing.
const COMPARISON_ENABLED = import.meta.env.VITE_ENABLE_COMPARISON === 'true';

/**
 * Synced side-by-side player driven by the worker's compare_clips() output.
 *
 * Props:
 *   clipAUrl, clipBUrl : signed video URLs for the two clips (before / after, or
 *                        swimmer / reference).
 *   comparison         : the worker payload from app/comparison.py:
 *     { status, phases, aligned_frames:[[aIdx,bIdx],...],
 *       per_phase:[{phase, mean_delta, joint_deltas}],
 *       summary:{ overall_mean_delta, largest_change_phase, confidence } }
 *   fpsA, fpsB         : frame rates used to turn aligned frame indices into video times.
 *
 * Wiring: add `compareClips(reportAId, reportBId)` to src/lib/data/functions.js and
 * surface a "Compare to…" action from SwimmerProgressAnalytics / ReportHistoryList
 * (see FRONTEND_FEATURES_WIRING.md). This component is presentational only.
 */
export default function SideBySideComparison({
  clipAUrl,
  clipBUrl,
  comparison,
  fpsA = 30,
  fpsB = 30,
  labelA = 'Before',
  labelB = 'After',
}) {
  const videoA = useRef(null);
  const videoB = useRef(null);
  const [idx, setIdx] = useState(0);

  const aligned = comparison?.aligned_frames || [];
  const ready = COMPARISON_ENABLED && comparison?.status === 'completed' && aligned.length > 0;

  const phaseRows = useMemo(
    () => (comparison?.per_phase || []).slice().sort((a, b) => (b.mean_delta || 0) - (a.mean_delta || 0)),
    [comparison],
  );

  const seek = (i) => {
    setIdx(i);
    const pair = aligned[i];
    if (!pair) return;
    if (videoA.current) videoA.current.currentTime = pair[0] / fpsA;
    if (videoB.current) videoB.current.currentTime = pair[1] / fpsB;
  };

  if (!COMPARISON_ENABLED) return null;
  if (!ready) {
    return (
      <div className="p-4 rounded-xl bg-card border border-border text-[10px] text-muted-foreground">
        Not enough reliable stroke cycles to compare these two clips yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {[
          { u: clipAUrl, r: videoA, l: labelA },
          { u: clipBUrl, r: videoB, l: labelB },
        ].map((v, k) => (
          <div key={k} className="space-y-1">
            <div className="text-[10px] font-semibold text-muted-foreground">{v.l}</div>
            <video ref={v.r} src={v.u} className="w-full rounded-lg border border-border" muted playsInline preload="metadata" />
          </div>
        ))}
      </div>

      <input
        type="range"
        min={0}
        max={aligned.length - 1}
        value={idx}
        onChange={(e) => seek(Number(e.target.value))}
        className="w-full"
        aria-label="Phase-aligned scrubber"
      />
      <div className="text-[10px] text-muted-foreground text-center">
        Phase-aligned frame {idx + 1} / {aligned.length}
      </div>

      <div className="p-3 rounded-xl bg-card border border-border space-y-2">
        <div className="text-xs font-semibold text-foreground">What changed (AI-assisted draft / estimate)</div>
        <p className="text-[10px] text-muted-foreground">
          Biggest change in the <span className="font-semibold capitalize">{(comparison.summary?.largest_change_phase || '—').replace(/_/g, ' ')}</span> phase ·
          overall movement delta {Number(comparison.summary?.overall_mean_delta ?? 0).toFixed(3)} ·
          confidence {Number(comparison.summary?.confidence ?? 0).toFixed(2)}.
        </p>
        <div className="space-y-1">
          {phaseRows.map((p) => (
            <div key={p.phase} className="flex items-center justify-between text-[10px]">
              <span className="capitalize text-muted-foreground">{String(p.phase).replace(/_/g, ' ')}</span>
              <span className="font-mono text-foreground">{Number(p.mean_delta ?? 0).toFixed(3)}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground/70">
          Estimates from monocular video, not validated measurements. For coach review only.
        </p>
      </div>
    </div>
  );
}
