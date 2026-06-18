import React from 'react';
import { motion } from 'framer-motion';

const strokePath = 'M 0 68 C 20 42, 38 44, 56 52 S 92 82, 114 44 S 152 23, 178 36 S 218 73, 246 41 S 282 27, 318 52';
const velocityPath = 'M 0 84 C 30 78, 46 68, 70 70 S 116 58, 144 47 S 196 50, 218 36 S 276 35, 318 24';

export default function TelemetryChart() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-400">
        <span>Cycle timing cue</span>
        <span>Motion cue</span>
      </div>
      <div className="relative h-44 overflow-hidden rounded-xl border border-white/10 bg-slate-950/35">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 318 120" preserveAspectRatio="none" aria-label="Prototype movement cue chart">
          <defs>
            <linearGradient id="strokeGradient" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.15" />
              <stop offset="45%" stopColor="#00f2fe" stopOpacity="1" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="velocityGradient" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.15" />
              <stop offset="55%" stopColor="#a7f3d0" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.25" />
            </linearGradient>
          </defs>
          <motion.path
            d={strokePath}
            fill="none"
            stroke="url(#strokeGradient)"
            strokeWidth="2.2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.15, ease: 'easeOut' }}
          />
          <motion.path
            d={velocityPath}
            fill="none"
            stroke="url(#velocityGradient)"
            strokeWidth="1.6"
            strokeDasharray="5 7"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={{ duration: 1.35, ease: 'easeOut', delay: 0.12 }}
          />
          {[56, 114, 178, 246].map((x, index) => (
            <motion.circle
              key={x}
              cx={x}
              cy={[52, 44, 36, 41][index]}
              r="2.6"
              fill="#00f2fe"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.35 + index * 0.08, type: 'spring', stiffness: 360, damping: 18 }}
            />
          ))}
        </svg>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-500">
          <span>00:00</span>
          <span>Preview trend</span>
          <span>00:18</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Cadence cue</div>
          <div className="mt-1 text-lg font-semibold text-cyan-100">Sample</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Motion band</div>
          <div className="mt-1 text-lg font-semibold text-emerald-100">Preview</div>
        </div>
      </div>
    </div>
  );
}
