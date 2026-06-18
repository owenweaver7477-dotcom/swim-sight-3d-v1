import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, ChevronLeft, CircleGauge, Crosshair, Eye, Layers3, LocateFixed, Move3D, Waves } from 'lucide-react';
import { Link } from 'react-router-dom';
import FloatingHUDPanel from '@/components/hud/FloatingHUDPanel';
import SwimTelemetryScene from '@/components/hud/SwimTelemetryScene';
import TelemetryChart from '@/components/hud/TelemetryChart';

const cameraPresets = [
  { id: 'underwater', label: 'Underwater View', icon: Waves },
  { id: 'birdsEye', label: "Bird's Eye", icon: Eye },
  { id: 'follow', label: 'Follow Swimmer', icon: LocateFixed },
  { id: 'bone', label: 'Bone Alignment', icon: Move3D },
];

const trialGroups = [
  {
    athlete: 'Mia Hartley',
    lane: 'Lane 4',
    trials: [
      { id: 'BR-042', date: 'Today 07:18', stroke: 'Breaststroke', status: 'Coach Review', score: 82 },
      { id: 'BR-041', date: 'Jun 14', stroke: 'Breaststroke', status: 'Finalised', score: 78 },
      { id: 'FR-018', date: 'Jun 10', stroke: 'Freestyle', status: 'Shared', score: 84 },
    ],
  },
  {
    athlete: 'Noah Vale',
    lane: 'Lane 2',
    trials: [
      { id: 'BK-022', date: 'Today 06:55', stroke: 'Backstroke', status: 'Processing', score: 74 },
      { id: 'FR-017', date: 'Jun 12', stroke: 'Freestyle', status: 'Manual Review', score: 71 },
    ],
  },
  {
    athlete: 'Ava Chen',
    lane: 'Lane 6',
    trials: [
      { id: 'FL-009', date: 'Jun 15', stroke: 'Butterfly', status: 'Coach Review', score: 79 },
      { id: 'FR-016', date: 'Jun 09', stroke: 'Freestyle', status: 'Finalised', score: 86 },
    ],
  },
];

const statRows = [
  ['Stroke', 'Breaststroke'],
  ['Camera', 'Side view'],
  ['Clip', '00:18.4'],
  ['Pose reliability', 'High'],
];

function MotionRow({ children, delay = 0 }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { duration: 0.22, delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

function RollingMetric({ value, suffix = '', className = '' }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={`${value}${suffix}`}
        initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        className={className}
      >
        {value}
        {suffix}
      </motion.span>
    </AnimatePresence>
  );
}

function MetricPill({ label, value, suffix, tone = 'cyan' }) {
  const toneClass = tone === 'emerald' ? 'text-emerald-100 shadow-emerald-500/10' : 'text-cyan-100 shadow-cyan-500/10';

  return (
    <motion.div
      whileHover={{ scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-4 shadow-lg"
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">[ {label} ]</div>
      <div className={`mt-3 flex items-end gap-1 text-4xl font-semibold tracking-tight ${toneClass}`}>
        <RollingMetric value={value} suffix={suffix} />
      </div>
    </motion.div>
  );
}

function TrialRail() {
  return (
    <FloatingHUDPanel title="Historical Trials" label="Archive" dock="left" className="h-[calc(100vh-2rem)] w-[21rem]">
      <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Active squad</div>
          <div className="mt-1 text-sm font-semibold text-white">Junior Performance</div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
          <Activity className="h-4 w-4" />
        </div>
      </div>
      <div className="max-h-[calc(100vh-13rem)] space-y-5 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cyan-300/20">
        {trialGroups.map((group) => (
          <MotionRow key={group.athlete}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-100">{group.athlete}</div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{group.lane}</div>
                </div>
                <div className="text-[11px] text-cyan-200">{group.trials.length} trials</div>
              </div>
              <div className="space-y-2">
                {group.trials.map((trial) => (
                  <motion.button
                    key={trial.id}
                    type="button"
                    whileHover={{ scale: 1.012, backgroundColor: 'rgba(14,165,233,0.12)' }}
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/25 px-3 py-2 text-left transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold text-white">{trial.stroke}</div>
                        <div className="mt-1 text-[11px] text-slate-500">{trial.date} · {trial.id}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-cyan-100">{trial.score}</div>
                        <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{trial.status}</div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </MotionRow>
        ))}
      </div>
    </FloatingHUDPanel>
  );
}

function AthleteOverview() {
  return (
    <FloatingHUDPanel title="Athlete Overview" label="Biomechanics" dock="right" className="min-h-[18rem]">
      <div className="space-y-4">
        <MotionRow>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-xl font-semibold text-cyan-50">
              MH
            </div>
            <div>
              <div className="text-lg font-semibold text-white">Mia Hartley</div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Breaststroke · Lane 4 · U15</div>
            </div>
          </div>
        </MotionRow>
        <div className="grid grid-cols-2 gap-2">
          {statRows.map(([label, value], index) => (
            <MotionRow key={label} delay={index * 0.02}>
              <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
                <div className="mt-1 text-sm font-semibold text-slate-100">{value}</div>
              </div>
            </MotionRow>
          ))}
        </div>
      </div>
    </FloatingHUDPanel>
  );
}

function MetricSummary({ tick }) {
  const swolf = useMemo(() => (34.2 + Math.sin(tick / 2) * 0.4).toFixed(1), [tick]);
  const dragRisk = useMemo(() => Math.round(62 + Math.cos(tick / 3) * 5), [tick]);

  return (
    <FloatingHUDPanel title="Metric Summary" label="Hydro Index" dock="right">
      <div className="space-y-3">
        <MetricPill label="SWOLF score" value={swolf} tone="cyan" />
        <MetricPill label="Peak drag risk cue" value={dragRisk} suffix="%" tone="emerald" />
        <MotionRow>
          <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.055] px-3 py-3 text-xs leading-relaxed text-amber-50/80">
            Estimate only. Coach verification remains required before report inclusion.
          </div>
        </MotionRow>
      </div>
    </FloatingHUDPanel>
  );
}

function CameraDock({ activePreset, onPresetChange }) {
  return (
    <div className="pointer-events-auto fixed bottom-5 left-1/2 z-[82] w-[min(48rem,calc(100vw-1.5rem))] -translate-x-1/2">
      <div className="rounded-full border border-white/10 bg-slate-950/65 px-2 py-2 shadow-2xl shadow-cyan-950/25 backdrop-blur-xl">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {cameraPresets.map((preset) => {
            const Icon = preset.icon;
            const active = activePreset === preset.id;
            return (
              <motion.button
                key={preset.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                onClick={() => onPresetChange(preset.id)}
                className={`flex h-11 items-center justify-center gap-2 rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition-all ${
                  active
                    ? 'border-cyan-200/40 bg-cyan-300/15 text-cyan-50 shadow-lg shadow-cyan-400/10'
                    : 'border-white/10 bg-white/[0.035] text-slate-400 hover:bg-white/[0.075] hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">[ {preset.label} ]</span>
                <span className="sm:hidden">{preset.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function BiomechanicsHUD() {
  const [cameraPreset, setCameraPreset] = useState('underwater');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), 2600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden bg-[#030712] text-slate-100">
      <div className="absolute inset-0">
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-[#030712] text-xs uppercase tracking-[0.24em] text-cyan-100">
              Loading telemetry scene
            </div>
          }
        >
          <SwimTelemetryScene cameraPreset={cameraPreset} />
        </Suspense>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(14,165,233,0.13),transparent_36%),linear-gradient(180deg,rgba(2,6,23,0.18),rgba(2,6,23,0.64))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(90deg, #ffffff 0.5px, transparent 0.5px), linear-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '64px 64px' }} />

      <div className="pointer-events-none absolute inset-0 z-[80]">
        <div className="pointer-events-auto fixed left-4 top-4 z-[85]">
          <Link
            to="/dashboard"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-slate-950/65 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300 shadow-xl shadow-cyan-950/20 backdrop-blur-xl transition-colors hover:border-cyan-200/30 hover:text-cyan-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Coach App
          </Link>
        </div>

        <div className="hidden xl:block fixed left-4 top-16 z-[82]">
          <TrialRail />
        </div>

        <div className="fixed right-4 top-4 z-[82] hidden w-[min(24.5rem,calc(100vw-2rem))] grid-cols-1 gap-4 lg:grid">
          <AthleteOverview />
          <FloatingHUDPanel title="Telemetry Chart" label="Stroke Velocity" dock="right">
            <TelemetryChart />
          </FloatingHUDPanel>
          <MetricSummary tick={tick} />
        </div>

        <div className="fixed left-4 right-4 top-16 z-[82] grid max-h-[40vh] gap-3 overflow-y-auto lg:hidden">
          <AthleteOverview />
          <MetricSummary tick={tick} />
        </div>

        <div className="pointer-events-none fixed left-1/2 top-1/2 z-[78] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-100/10">
          <div className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-cyan-100/25" />
          <div className="absolute bottom-0 left-1/2 h-3 w-px -translate-x-1/2 bg-cyan-100/25" />
          <div className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-cyan-100/25" />
          <div className="absolute right-0 top-1/2 h-px w-3 -translate-y-1/2 bg-cyan-100/25" />
          <Crosshair className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-cyan-100/45" />
        </div>

        <div className="pointer-events-auto fixed bottom-24 left-1/2 z-[82] hidden -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/50 px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-slate-400 backdrop-blur-xl md:flex">
          <CircleGauge className="mr-2 h-3.5 w-3.5 text-cyan-200" />
          Left drag orbit · Scroll zoom · Right drag pan
        </div>

        <CameraDock activePreset={cameraPreset} onPresetChange={setCameraPreset} />
      </div>
    </div>
  );
}
