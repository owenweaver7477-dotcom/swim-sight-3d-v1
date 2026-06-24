import React, { Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, ChevronLeft, Crosshair, Eye, LocateFixed, Lock, MousePointer2, Move3D, RotateCcw, Waves } from 'lucide-react';
import { Link } from 'react-router-dom';
import FloatingHUDPanel from '@/components/hud/FloatingHUDPanel';
import SwimTelemetryScene from '@/components/hud/SwimTelemetryScene';
import TelemetryChart from '@/components/hud/TelemetryChart';
import { useClubContext } from '@/lib/useClubContext';
import { getFeatureGateState, getPlanKey } from '@/lib/plans/featureGates';

const cameraPresets = [
  { id: 'side', label: 'Side View', icon: Waves },
  { id: 'top', label: 'Top View', icon: Eye },
  { id: 'follow', label: 'Follow View', icon: LocateFixed },
  { id: 'alignment', label: 'Alignment View', icon: Move3D },
  { id: 'reset', label: 'Reset', icon: RotateCcw, reset: true },
];

const trialGroups = [
  {
    athlete: 'Sample swimmer A',
    lane: 'Reference profile',
    trials: [
      { id: 'BR-S01', date: 'Sample clip 01', stroke: 'Breaststroke', status: 'Reference only' },
      { id: 'FR-S01', date: 'Sample clip 02', stroke: 'Freestyle', status: 'Reference only' },
    ],
  },
  {
    athlete: 'Sample swimmer B',
    lane: 'Reference profile',
    trials: [
      { id: 'BK-S01', date: 'Sample clip 03', stroke: 'Backstroke', status: 'Reference only' },
      { id: 'FL-S01', date: 'Sample clip 04', stroke: 'Butterfly', status: 'Reference only' },
    ],
  },
];

const statRows = [
  ['Stroke', 'Breaststroke'],
  ['Camera', 'Side view'],
  ['Clip', '00:18.4'],
  ['Evidence mode', 'Prototype preview'],
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

function TrialRail() {
  return (
    <FloatingHUDPanel title="Sample Review Archive" label="Prototype" dock="left" className="h-[calc(100vh-2rem)] w-[20rem]">
      <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Preview context</div>
          <div className="mt-1 text-sm font-semibold text-white">Coach-guided sample</div>
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
                        <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-100">{trial.status}</div>
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
    <FloatingHUDPanel title="Reference Context" label="Elite Lab Preview" dock="right" className="min-h-[18rem]">
      <div className="space-y-4">
        <MotionRow>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-xl font-semibold text-cyan-50">
              MH
            </div>
            <div>
              <div className="text-lg font-semibold text-white">Mia Hartley</div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Sample breaststroke reference</div>
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

function MetricSummary() {
  return (
    <FloatingHUDPanel title="Module Readiness" label="Preview Only" dock="right">
      <div className="space-y-3">
        <MotionRow><div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.055] p-3"><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-100">Available now</div><p className="mt-1 text-xs leading-5 text-slate-300">Interactive reference scene and camera controls.</p></div></MotionRow>
        <MotionRow><div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.055] p-3"><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-100">Not available yet</div><p className="mt-1 text-xs leading-5 text-slate-300">Swimmer-specific movement, calibrated comparison, and automated technical judgement.</p></div></MotionRow>
        <MotionRow>
          <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.055] px-3 py-3 text-xs leading-relaxed text-amber-50/80">
            Prototype visualisation only. Coach verification remains required before any report inclusion.
          </div>
        </MotionRow>
      </div>
    </FloatingHUDPanel>
  );
}

function CameraDock({ activePreset, onPresetChange, onReset }) {
  return (
    <div className="pointer-events-auto fixed bottom-5 left-1/2 z-[82] w-[min(52rem,calc(100vw-1.5rem))] -translate-x-1/2">
      <div className="rounded-3xl border border-white/10 bg-slate-950/70 px-2 py-2 shadow-2xl shadow-cyan-950/25 backdrop-blur-xl md:rounded-full">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {cameraPresets.map((preset) => {
            const Icon = preset.icon;
            const active = !preset.reset && activePreset === preset.id;
            return (
              <motion.button
                key={preset.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                onClick={() => preset.reset ? onReset() : onPresetChange(preset.id)}
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

function EliteLabAccessPanel({ gate }) {
  const gateMessage = gate.isEnforced && !gate.isAllowed
    ? gate.message
    : 'Elite Lab reference comparison is being prepared for future premium plans.';

  return (
    <div className="pointer-events-auto fixed left-4 top-16 z-[84] w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-amber-200/20 bg-slate-950/72 p-4 text-slate-100 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl xl:left-[22.5rem]">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-amber-200/30 bg-amber-300/10 text-amber-100">
          <Lock className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-100">Future Premium</div>
          <h1 className="mt-1 text-lg font-semibold text-white">Elite Lab Preview</h1>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            Elite Studio is a preview module. Full movement model, 3D phase viewer, and advanced reference comparison are not pilot-ready yet.
          </p>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-3 text-xs leading-relaxed text-slate-300">
        {gateMessage} Required plan: <span className="font-semibold text-amber-100">{gate.requiredPlanLabel}</span>.
        Coach Studio and reports remain available now.
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        <span className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-2.5 py-1 text-cyan-100">In development</span>
        <span className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1">Not a live measurement tool</span>
        <span className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1">Requires calibration before use</span>
      </div>
      <Link to="/elite-lab-roadmap" className="mt-3 inline-flex text-xs font-semibold text-cyan-100 hover:text-white">
        View readiness roadmap
      </Link>
    </div>
  );
}

function MovementHelpPanel() {
  return (
    <div className="pointer-events-auto fixed bottom-24 left-1/2 z-[82] hidden w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-950/62 px-4 py-3 text-xs text-slate-300 shadow-xl shadow-cyan-950/20 backdrop-blur-xl md:block">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-100">
        <MousePointer2 className="h-3.5 w-3.5" />
        How to move
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2">
        <div>Desktop: drag to rotate · scroll to zoom · right-drag to pan</div>
        <div>Touch: one finger to rotate · pinch to zoom · two fingers to pan</div>
      </div>
    </div>
  );
}

export default function BiomechanicsHUD() {
  const { club } = useClubContext();
  const canView = ['owner', 'admin'].includes(club?._memberRole);
  const planKey = getPlanKey(club);
  const eliteGate = getFeatureGateState('elite_3d_comparison', planKey);
  const [cameraPreset, setCameraPreset] = useState('side');
  const [viewKey, setViewKey] = useState(0);

  const resetView = () => {
    setCameraPreset('side');
    setViewKey((value) => value + 1);
  };

  if (!canView) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712] px-4 text-center text-slate-100">
        <div className="max-w-md rounded-lg border border-white/10 bg-slate-950/70 p-6">
          <Lock className="mx-auto h-8 w-8 text-amber-100" />
          <h1 className="mt-3 text-lg font-semibold">Owner or admin access required</h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">Elite Lab is an internal prototype visualisation and is not a live measurement tool.</p>
          <Link to="/dashboard" className="mt-4 inline-flex text-xs font-semibold text-cyan-100 hover:text-white">Return to Coach App</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden bg-[#030712] text-slate-100">
      <div className="absolute inset-0">
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-[#030712] text-xs uppercase tracking-[0.24em] text-cyan-100">
              Loading prototype reference scene
            </div>
          }
        >
          <SwimTelemetryScene cameraPreset={cameraPreset} viewKey={viewKey} />
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

        <div className="pointer-events-auto fixed left-1/2 top-4 z-[85] hidden w-[min(36rem,calc(100vw-10rem))] -translate-x-1/2 rounded-full border border-amber-200/20 bg-slate-950/70 px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100 shadow-xl shadow-cyan-950/20 backdrop-blur-xl md:block">
          Elite Lab Preview - future calibrated comparison. Coach-reviewed prototype; not part of standard reports.
        </div>

        <EliteLabAccessPanel gate={eliteGate} />

        <div className="hidden 2xl:block fixed left-4 top-16 z-[82]">
          <TrialRail />
        </div>

        <div className="fixed right-4 top-20 z-[82] hidden w-[min(23rem,calc(100vw-2rem))] grid-cols-1 gap-4 lg:grid">
          <AthleteOverview />
          <FloatingHUDPanel title="Movement Preview" label="Sample Trend" dock="right">
            <TelemetryChart />
          </FloatingHUDPanel>
          <MetricSummary />
        </div>

        <div className="fixed left-4 right-4 top-[17rem] z-[82] grid max-h-[28vh] gap-3 overflow-y-auto lg:hidden">
          <AthleteOverview />
          <MetricSummary />
        </div>

        <div className="pointer-events-none fixed left-1/2 top-1/2 z-[78] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-100/10">
          <div className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-cyan-100/25" />
          <div className="absolute bottom-0 left-1/2 h-3 w-px -translate-x-1/2 bg-cyan-100/25" />
          <div className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-cyan-100/25" />
          <div className="absolute right-0 top-1/2 h-px w-3 -translate-y-1/2 bg-cyan-100/25" />
          <Crosshair className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-cyan-100/45" />
        </div>

        <MovementHelpPanel />

        <CameraDock activePreset={cameraPreset} onPresetChange={setCameraPreset} onReset={resetView} />
      </div>
    </div>
  );
}
