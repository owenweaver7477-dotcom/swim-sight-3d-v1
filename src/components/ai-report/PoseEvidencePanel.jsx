import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu } from 'lucide-react';

/**
 * Coach-internal panel showing real pose analysis metadata.
 * Only rendered for analysis_mode === "real_pose".
 * Never shown on public shared reports.
 */
export default function PoseEvidencePanel({ report }) {
  const [expanded, setExpanded] = useState(false);

  if (!report || report.analysis_mode !== 'real_pose') return null;

  return (
    <div className="print:hidden rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-primary/10 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">Real Pose Analysis — Technical Evidence</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-900/30 text-green-400 border border-green-700/30">
            Pose Detected
          </span>
        </div>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-primary" />
          : <ChevronDown className="w-3.5 h-3.5 text-primary" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Engine', value: report.ai_engine_version || '—' },
            { label: 'Model', value: report.model_name || '—' },
            { label: 'Frames Processed', value: report.frame_count_processed != null ? String(report.frame_count_processed) : '—' },
            { label: 'Avg Keypoints / Frame', value: report.detected_keypoints_count != null ? String(report.detected_keypoints_count) : '—' },
            { label: 'Pose Detected', value: report.real_pose_detected ? 'Yes' : 'No' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-card rounded-lg px-3 py-2 border border-border">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</div>
              <div className="text-xs font-semibold text-foreground">{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}