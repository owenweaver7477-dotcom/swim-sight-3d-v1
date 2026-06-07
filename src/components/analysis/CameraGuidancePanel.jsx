import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Camera, Info } from 'lucide-react';

export default function CameraGuidancePanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
      >
        <Camera className="w-4 h-4 text-primary flex-shrink-0" />
        <div className="flex-1">
          <div className="text-xs font-semibold text-foreground">Recommended Camera Setup for Better Pose Analysis</div>
          <div className="text-[10px] text-muted-foreground">Tips for clearer footage and more reliable AI results</div>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3">
            {[
              { angle: 'Side View', tip: 'Best for body line, kick timing, stroke rate, and pull shape along the body axis.' },
              { angle: 'Front / Head-On View', tip: 'Shows width, symmetry, and hand-entry alignment. Useful for catch and pull width.' },
              { angle: 'Rear View', tip: 'Reveals kick spread, hip alignment, and stroke symmetry from behind.' },
              { angle: 'Above-Water Side', tip: 'Captures breathing pattern, recovery height, and timing above the surface.' },
              { angle: 'Underwater Side', tip: 'Clearest view of pull path, body line, kick depth, and undulation.' },
              { angle: 'Deck View', tip: 'Useful for turn approach, dive, and overall lane positioning.' },
            ].map(({ angle, tip }) => (
              <div key={angle} className="p-2.5 rounded-lg bg-secondary/50">
                <div className="text-[10px] font-semibold text-foreground mb-0.5">{angle}</div>
                <div className="text-[10px] text-muted-foreground leading-relaxed">{tip}</div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5">
            <div className="text-[10px] font-semibold text-foreground">General Guidelines</div>
            {[
              'Use the clearest original video file, not a screen recording.',
              'Keep the full swimmer visible for as much of the length as possible.',
              'Multi-angle footage improves reliability but does not guarantee automatic AI findings.',
              'Coach review is always required regardless of how many angles are uploaded.',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                <span className="text-primary flex-shrink-0 mt-0.5">·</span>
                {tip}
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <Info className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-yellow-700 leading-relaxed">
              Current AI processing uses the selected primary angle only. Supporting angles are stored for manual coach review.
              Multi-view AI fusion is a future capability.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}