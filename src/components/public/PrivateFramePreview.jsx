import React from 'react';
import { Lock } from 'lucide-react';

// A demo "video frame" for the public site. It reads like a real report
// screenshot but is intentionally BLURRED for privacy, and reveals an animated
// lock on hover. Built only from synthetic gradient art — it never uses real
// swimmer footage, thumbnails, or signed URLs, so the public page exposes
// nothing. Respects prefers-reduced-motion (no scale animation).
export default function PrivateFramePreview({ badge, label = 'Private — coach-controlled', className = '' }) {
  return (
    <div className={`group relative overflow-hidden bg-slate-950 ${className}`}>
      {/* Blurred synthetic frame — an abstract pool-lane / swimmer suggestion. */}
      <div aria-hidden="true" className="absolute inset-0 scale-110 blur-[7px]">
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_12%,rgba(56,189,248,0.38),transparent_60%),linear-gradient(160deg,#0b3a5a,#04121d)]" />
        <div className="absolute inset-x-0 top-[34%] h-7 bg-cyan-300/25" />
        <div className="absolute inset-x-0 top-1/2 h-5 bg-white/10" />
        <div className="absolute left-[30%] top-[26%] h-14 w-24 rounded-full bg-white/15" />
      </div>
      {/* Privacy scrim + lock that scales/reveals on hover. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/45 transition-colors duration-300 group-hover:bg-slate-950/70">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-cyan-200 ring-1 ring-white/25 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-cyan-300 group-hover:text-slate-950 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
          <Lock className="h-5 w-5" />
        </div>
        <span className="px-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none">{label}</span>
      </div>
      {badge && <div className="absolute left-3 top-3 z-10 rounded-full bg-cyan-200 px-2.5 py-1 text-[10px] font-bold text-slate-950">{badge}</div>}
    </div>
  );
}
