import React from 'react';
import { Lock } from 'lucide-react';

// A demo "video frame" placeholder for the public site. It stands in for a real
// report screenshot but is intentionally neutral and locked for privacy — it
// never uses real swimmer footage, thumbnails, or signed URLs, so the public
// page exposes nothing. Flat, minimalist styling; respects prefers-reduced-motion.
export default function PrivateFramePreview({ badge, label = 'Private — coach-controlled', className = '' }) {
  return (
    <div className={`group relative overflow-hidden bg-slate-100 ${className}`}>
      {/* Quiet neutral placeholder — a suggestion of a lane, not a render. */}
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute inset-x-0 top-[38%] h-px bg-slate-300" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-slate-300" />
        <div className="absolute inset-x-0 top-[62%] h-px bg-slate-300" />
      </div>
      {/* Privacy overlay + lock that reveals its label on hover. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100/40 transition-colors duration-300 group-hover:bg-slate-100/70">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 transition-colors duration-300 group-hover:border-sky-600 group-hover:text-sky-700 motion-reduce:transition-none">
          <Lock className="h-4 w-4" />
        </div>
        <span className="px-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none">{label}</span>
      </div>
      {badge && <div className="absolute left-3 top-3 z-10 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">{badge}</div>}
    </div>
  );
}
