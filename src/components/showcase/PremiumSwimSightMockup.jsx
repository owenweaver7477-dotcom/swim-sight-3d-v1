import React from 'react';
import {
  Activity,
  BarChart3,
  Box,
  CheckCircle2,
  Download,
  FileText,
  Lock,
  Play,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react';
import SwimSightLogo from '@/components/brand/SwimSightLogo';

const demoAnalyses = [
  ['Emma Johnson', 'Breaststroke', 'Side View', 'Coach-reviewed', '86'],
  ['Liam Smith', 'Freestyle', 'Underwater', 'Draft review', '78'],
  ['Sophie Williams', 'Backstroke', 'Rear View', 'Coach-approved', '82'],
];

const metrics = [
  ['Velocity', '1.62', 'm/s', 'blue'],
  ['Stroke Rate', '1.28', 'Hz', 'purple'],
  ['DPS', '2.15', 'm', 'amber'],
  ['SWOLF', '28', 'score', 'cyan'],
  ['Efficiency', '86%', 'coach review', 'emerald'],
];

const findings = [
  ['Early Arm Pull', 'High', 'Arms pull before optimal extension. Focus on catch timing.', '0:02 - 0:04', 'red'],
  ['Low Kick Efficiency', 'Medium', 'Kick is slightly wide. Coach review required.', '0:04 - 0:06', 'amber'],
  ['Good Streamline', 'Good', 'Excellent body position and streamline.', '0:06 - 0:08', 'emerald'],
];

const reportOutputs = [
  ['Body line analysis', 'Available'],
  ['Stroke rhythm', 'Available'],
  ['Kick timing', 'Available'],
  ['Stroke phase breakdown', 'Available'],
  ['Stroke rate', 'Estimate-only'],
  ['Distance per stroke', 'Requires scale'],
  ['Estimated drag force', 'Requires profile + calibration'],
];

function Panel({ children, className = '' }) {
  return (
    <div className={`overflow-hidden rounded-[1.35rem] border border-white/10 bg-slate-900/55 shadow-2xl shadow-sky-950/20 backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

function MiniSwimThumb() {
  return (
    <div className="relative h-12 w-24 overflow-hidden rounded-lg border border-cyan-200/15 bg-[radial-gradient(circle_at_30%_20%,rgba(125,211,252,0.45),transparent_22%),linear-gradient(135deg,#0f4a66,#031827_68%)]">
      <div className="absolute inset-x-0 top-5 h-px bg-cyan-100/40" />
      <div className="absolute left-4 top-6 h-1 w-12 -rotate-6 rounded-full bg-white/80" />
      <div className="absolute left-14 top-5 h-1 w-7 rotate-12 rounded-full bg-sky-300/90" />
      <div className="absolute left-3 top-3 h-2 w-2 rounded-full bg-white/80" />
      <Play className="absolute left-10 top-4 h-4 w-4 rounded-full bg-black/40 p-0.5 text-white" />
    </div>
  );
}

function UnderwaterReviewVisual() {
  const points = [
    [8, 54], [18, 50], [28, 55], [38, 58], [50, 52], [61, 49], [73, 52], [86, 47],
  ];

  return (
    <div className="relative h-64 overflow-hidden rounded-2xl border border-cyan-100/10 bg-[radial-gradient(circle_at_28%_28%,rgba(125,211,252,0.45),transparent_22%),linear-gradient(150deg,#0a5d7c_0%,#062b45_43%,#020816_100%)]">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px)', backgroundSize: '48px 48px' }} />
      <div className="absolute left-10 top-20 h-3 w-72 -rotate-6 rounded-full bg-white/55 blur-[1px]" />
      <div className="absolute left-24 top-24 h-3 w-44 rotate-12 rounded-full bg-sky-200/50 blur-[1px]" />
      <div className="absolute left-8 top-16 h-8 w-8 rounded-full bg-white/70 blur-[0.5px]" />
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <polyline
          points={points.map(([x, y]) => `${x},${y}`).join(' ')}
          fill="none"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
        <polyline
          points="38,58 48,70 60,66 70,73"
          fill="none"
          stroke="#a78bfa"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <polyline
          points="50,52 55,38 65,33 75,27"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        {points.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8" fill="white" />
        ))}
        {[48, 60, 70].map((x, index) => (
          <circle key={x} cx={x} cy={[70, 66, 73][index]} r="1.7" fill="#a78bfa" />
        ))}
      </svg>
      <div className="absolute right-5 top-5 flex rounded-xl bg-black/45 p-1 text-[10px] font-bold text-white">
        <span className="rounded-lg bg-cyan-400/20 px-2 py-1 text-cyan-100">2D</span>
        <span className="rounded-lg bg-sky-500 px-2 py-1">3D preview</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 bg-black/45 px-4 py-3 text-xs text-white">
        <Play className="h-4 w-4" />
        <span>00:03.45</span>
        <div className="h-1 flex-1 rounded-full bg-white/20">
          <div className="h-1 w-1/2 rounded-full bg-sky-400" />
        </div>
        <span>00:08.20</span>
        <span className="rounded bg-white/10 px-2 py-1">1.0x</span>
      </div>
    </div>
  );
}

function Sparkline({ tone = 'blue' }) {
  const stroke = tone === 'purple' ? '#d946ef' : tone === 'amber' ? '#f59e0b' : tone === 'emerald' ? '#10b981' : '#0ea5e9';
  return (
    <svg viewBox="0 0 100 28" className="mt-3 h-8 w-full">
      <polyline points="0,22 12,18 24,20 36,14 48,16 60,10 72,13 84,9 100,11" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function RadarChart() {
  return (
    <svg viewBox="0 0 220 170" className="mx-auto mt-2 h-40 max-w-full">
      {[70, 52, 34].map((r) => (
        <polygon
          key={r}
          points={[
            [110, 16 + (70 - r)], [170 - (70 - r), 55], [165 - (70 - r), 115], [110, 150 - (70 - r)], [55 + (70 - r), 115], [50 + (70 - r), 55],
          ].map(([x, y]) => `${x},${y}`).join(' ')}
          fill="none"
          stroke="rgba(148,163,184,0.25)"
        />
      ))}
      <polygon points="110,34 154,62 148,111 110,134 72,112 68,64" fill="rgba(14,165,233,0.20)" stroke="#0ea5e9" strokeWidth="2" />
      <polygon points="110,62 140,76 134,104 110,116 86,104 82,78" fill="rgba(99,102,241,0.18)" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3 3" />
      {['Streamline', 'Kick', 'Pull', 'Breathing', 'Body Position', 'Timing'].map((label, index) => {
        const coords = [[110, 8], [184, 54], [176, 124], [110, 164], [35, 124], [28, 54]][index];
        return (
          <text key={label} x={coords[0]} y={coords[1]} textAnchor="middle" fontSize="10" fill="#cbd5e1">{label}</text>
        );
      })}
      <circle cx="110" cy="34" r="4" fill="#0ea5e9" />
      <circle cx="154" cy="62" r="4" fill="#0ea5e9" />
      <circle cx="148" cy="111" r="4" fill="#0ea5e9" />
      <circle cx="110" cy="134" r="4" fill="#0ea5e9" />
      <circle cx="72" cy="112" r="4" fill="#0ea5e9" />
      <circle cx="68" cy="64" r="4" fill="#0ea5e9" />
    </svg>
  );
}

function PhoneFrame({ children }) {
  return (
    <div className="relative h-72 w-28 rounded-[1.8rem] border border-white/20 bg-black p-1.5 shadow-xl shadow-black/50">
      <div className="absolute left-1/2 top-2 z-10 h-3 w-10 -translate-x-1/2 rounded-full bg-black" />
      <div className="h-full overflow-hidden rounded-[1.4rem] border border-white/10 bg-slate-950">
        {children}
      </div>
    </div>
  );
}

export default function PremiumSwimSightMockup({
  accountName = 'Account Owner',
  accountFirstName = 'Coach',
  roleLabel = 'Head Coach',
  planLabel = 'Pilot',
  clubName = 'Swim Sight Demo Workspace',
  athleteCount = 24,
  analysesThisMonth = 56,
  averageImprovement = '8.7%',
  aiCredits = 1248,
  selectedSwimmer = 'Emma Johnson',
  stroke = 'Breaststroke',
  cameraAngle = 'Side View',
  dateLabel = '24 Jun 2026',
  analyses = [],
  onNewAnalysis,
  onViewReports,
  className = '',
}) {
  const analysisRows = analyses.length ? analyses : demoAnalyses.map(([name, itemStroke, angle, status, score]) => ({
    name,
    stroke: itemStroke,
    cameraAngle: angle,
    status,
    score,
  }));
  const selectedRow = analysisRows[0] || {};
  const displaySwimmer = selectedSwimmer || selectedRow.name || 'Selected Swimmer';
  const displayStroke = stroke || selectedRow.stroke || 'Stroke Review';
  const displayCameraAngle = cameraAngle || selectedRow.cameraAngle || 'Camera Angle';
  const aiCreditLabel = Number.isFinite(Number(aiCredits)) ? Number(aiCredits).toLocaleString() : 'Preparing';
  const previewButtonProps = {
    type: 'button',
    tabIndex: -1,
    'aria-hidden': true,
  };

  return (
    <div className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#020817] p-3 text-white shadow-2xl shadow-sky-950/30 ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.23),transparent_24%),radial-gradient(circle_at_85%_18%,rgba(6,182,212,0.15),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0),rgba(2,6,23,0.96))]" />
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(90deg,#fff 1px,transparent 1px),linear-gradient(#fff 1px,transparent 1px)', backgroundSize: '44px 44px' }} />

      <div className="relative grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel className="min-h-[26rem]">
          <div className="grid h-full lg:grid-cols-[11rem_1fr]">
            <aside className="border-r border-white/10 bg-black/18 p-4">
              <SwimSightLogo tone="light" size="sm" />
              <nav className="mt-5 grid gap-1 text-xs text-slate-300">
                {['Dashboard', 'Analyse', 'Video Library', 'Athletes', 'Reports', 'AI Job Monitor', 'Technique Vault', 'Drills', 'Team', 'Settings'].map((item, index) => (
                  <div key={item} className={`rounded-lg px-3 py-2 ${index === 0 ? 'bg-sky-500/20 text-white' : 'hover:bg-white/5'}`}>{item}</div>
                ))}
              </nav>
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-xs font-bold">{accountName.slice(0, 1) || 'A'}</div>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold">{accountName}</div>
                    <div className="truncate text-[10px] text-slate-400">{roleLabel}</div>
                  </div>
                </div>
                <div className="mt-2 inline-flex rounded-full bg-sky-500/20 px-2 py-1 text-[10px] font-bold text-sky-100">{planLabel}</div>
              </div>
            </aside>

            <main className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold">Welcome back, {accountFirstName} 👋</h3>
                  <p className="mt-1 text-xs text-slate-400">Here&apos;s what&apos;s happening across {clubName}.</p>
                </div>
                <button
                  type="button"
                  onClick={onNewAnalysis}
                  tabIndex={onNewAnalysis ? 0 : -1}
                  aria-hidden={onNewAnalysis ? undefined : true}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-sky-950/30"
                >
                  <Plus className="h-3.5 w-3.5" /> New Analysis
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  ['Total Athletes', athleteCount, '+ workspace athletes'],
                  ['Analyses This Month', analysesThisMonth, '+ coach reviews'],
                  ['Avg. Improvement', averageImprovement, 'vs last 30 days'],
                  ['AI Credits', aiCreditLabel, 'estimate remaining'],
                ].map(([label, value, sub]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/[0.045] p-3">
                    <div className="text-[10px] font-semibold text-slate-400">{label}</div>
                    <div className="mt-2 text-2xl font-bold">{value}</div>
                    <div className="mt-1 text-[10px] text-emerald-300">{sub}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-bold">Recent Analyses</h4>
                    <span className="text-[10px] font-semibold text-sky-300">View all</span>
                  </div>
                  <div className="grid gap-2">
                    {analysisRows.map(({ name, stroke: itemStroke, cameraAngle: angle, status, score }) => (
                      <div key={name} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-xl border border-white/8 bg-black/12 p-2">
                        <MiniSwimThumb />
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold">{name}</div>
                          <div className="truncate text-[10px] text-slate-400">{itemStroke} • {angle}</div>
                          <div className="text-[10px] text-cyan-200">{status}</div>
                        </div>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/40 text-xs font-bold text-emerald-300">{score}</div>
                        <button
                          type="button"
                          onClick={onViewReports}
                          tabIndex={onViewReports ? 0 : -1}
                          aria-hidden={onViewReports ? undefined : true}
                          className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold text-slate-200"
                        >
                          View Report
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <h4 className="text-sm font-bold">Technique Overview</h4>
                  <RadarChart />
                  <div className="flex justify-center gap-4 text-[10px] text-slate-400">
                    <span className="text-sky-300">● You</span>
                    <span>◇ Team average</span>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </Panel>

        <Panel className="p-4">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold">{displaySwimmer}</h3>
              <p className="text-[11px] text-slate-400">{displayStroke} • {displayCameraAngle} • {dateLabel}</p>
            </div>
            <div className="flex gap-4 text-xs text-slate-400">
              <span className="text-sky-300">Overview</span>
              <span>Metrics</span>
              <span>Findings</span>
              <span>Report</span>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_16rem]">
            <div>
              <UnderwaterReviewVisual />
              <div className="mt-2 rounded-xl border border-cyan-200/15 bg-cyan-200/8 px-3 py-2 text-[10px] leading-5 text-cyan-50">
                Advanced metrics are estimate-only unless profile, camera angle, and calibration requirements are met. Coach review required.
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
                {metrics.map(([label, value, unit, tone]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/[0.045] p-3">
                    <div className="text-[10px] text-slate-400">{label}</div>
                    <div className="mt-1 text-xl font-bold">{value}</div>
                    <div className="text-[10px] text-slate-400">{unit}</div>
                    <Sparkline tone={tone} />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/15 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-bold">Key Findings</h4>
                <span className="text-[10px] text-slate-400">draft findings</span>
              </div>
              <div className="grid gap-2">
                {findings.map(([title, severity, text, time, tone]) => (
                  <div key={title} className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-bold">{title}</div>
                      <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${tone === 'red' ? 'bg-red-500/20 text-red-200' : tone === 'amber' ? 'bg-amber-500/20 text-amber-200' : 'bg-emerald-500/20 text-emerald-200'}`}>{severity}</span>
                    </div>
                    <p className="mt-2 text-[10px] leading-5 text-slate-400">{text}</p>
                    <div className="mt-2 text-[10px] text-slate-500">{time}</div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={onViewReports}
                tabIndex={onViewReports ? 0 : -1}
                aria-hidden={onViewReports ? undefined : true}
                className="mt-4 w-full rounded-xl bg-sky-500 px-4 py-3 text-xs font-bold text-white"
              >
                View Full Report
              </button>
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <h3 className="text-center text-lg font-bold">Mobile Coach Experience</h3>
          <p className="mt-1 text-center text-xs text-slate-400">Analyse anywhere, review anytime.</p>
          <div className="mt-5 flex justify-start gap-3 overflow-x-auto pb-2 md:justify-center">
            <PhoneFrame>
              <div className="p-3 text-[10px]">
                <div className="mb-4 font-bold">Analyse</div>
                {['Camera Roll', 'Record Video', 'Upload File', 'Choose AI Outputs'].map((item) => (
                  <div key={item} className="mb-2 rounded-lg bg-white/[0.06] px-2 py-2">{item}</div>
                ))}
                <button {...previewButtonProps} className="mt-3 w-full rounded-lg bg-sky-500 py-2 font-bold">Start Analysis</button>
              </div>
            </PhoneFrame>
            <PhoneFrame>
              <div className="p-3 text-center text-[10px]">
                <div className="mt-8 text-sm font-bold">Analysis in Progress</div>
                <div className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-sky-500 text-xl font-bold">65%</div>
                <div className="mt-6 grid gap-2 text-left text-slate-300">
                  {['Pose detection', 'Motion analysis', 'Metric calculation', 'AI insights'].map((item) => <div key={item}>✓ {item}</div>)}
                </div>
              </div>
            </PhoneFrame>
            <PhoneFrame>
              <div className="p-3 text-[10px]">
                <div className="mt-8 text-center text-sm font-bold">Analysis Complete</div>
                <div className="mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-emerald-500 text-xl font-bold">86</div>
                {['Streamline', 'Kick', 'Pull', 'Breathing', 'Timing'].map((item, index) => (
                  <div key={item} className="mt-3 grid grid-cols-[1fr_3rem] items-center gap-2">
                    <span>{item}</span>
                    <div className="h-1 rounded bg-white/10"><div className={`h-1 rounded ${index === 1 ? 'w-3/4 bg-amber-400' : 'w-5/6 bg-emerald-400'}`} /></div>
                  </div>
                ))}
              </div>
            </PhoneFrame>
          </div>
        </Panel>

        <Panel className="p-5">
          <h3 className="text-center text-lg font-bold">AI-Assisted Reports</h3>
          <p className="mt-1 text-center text-xs text-slate-400">Clear insights. Coach-approved feedback.</p>
          <div className="mt-5 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-xs font-bold">AI Technique Report</div>
              <div className="text-[10px] text-slate-400">{displaySwimmer} • {displayStroke} • {dateLabel}</div>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-500 text-3xl font-bold">86</div>
                <div>
                  <div className="text-lg font-bold">Overall Score</div>
                  <div className="text-xs text-emerald-300">Great Work!</div>
                </div>
              </div>
              <p className="mt-4 text-[11px] leading-5 text-slate-300">Coach-approved summary with selected key moments, cues, drills, and next focus.</p>
              <div className="mt-4 grid gap-2 text-[10px]">
                <div>✓ Early Arm Pull <span className="text-red-300">High Priority</span></div>
                <div>✓ Low Kick Efficiency <span className="text-amber-300">Coach review</span></div>
                <div>✓ Good Streamline <span className="text-emerald-300">Good</span></div>
              </div>
            </div>
            <div className="grid gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs font-bold">Choose AI Report Outputs</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                  {reportOutputs.map(([title, status]) => (
                    <div key={title} className="rounded-lg border border-white/10 bg-black/12 px-2 py-2">
                      <div className="font-semibold">{title}</div>
                      <div className="mt-1 text-sky-200">{status}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-[10px] text-amber-100">
                  Estimated drag force skipped — calibration required. Coach review required.
                </div>
              </div>
              <div className="flex gap-2">
                <button {...previewButtonProps} className="flex-1 rounded-lg bg-sky-500 py-2 text-xs font-bold">Share Report</button>
                <button {...previewButtonProps} className="flex-1 rounded-lg border border-white/10 py-2 text-xs font-bold"><Download className="mr-1 inline h-3 w-3" /> PDF</button>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="p-5 xl:col-span-2">
          <h3 className="text-center text-lg font-bold">Everything You Need to Succeed</h3>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              [Activity, 'AI Analysis', 'AI-assisted pose evidence with coach approval.'],
              [Box, '3D Preview', 'Future reference visualisation, not a live measurement tool.'],
              [BarChart3, 'Metric Tracking', 'Track coach-approved trends over time.'],
              [FileText, 'Technique Library', 'Drills, phases, and report language.'],
              [Users, 'Team Management', 'Manage athletes, squads, and permissions.'],
              [Lock, 'Secure & Private', 'Shared reports show approved content only.'],
            ].map(([Icon, title, text]) => (
              <div key={title} className="rounded-xl border border-white/10 bg-white/[0.045] p-5 text-center">
                <Icon className="mx-auto h-7 w-7 text-sky-300" />
                <div className="mt-3 text-sm font-bold">{title}</div>
                <div className="mt-2 text-xs leading-5 text-slate-400">{text}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-sky-300/20 bg-sky-300/5 p-4 text-center">
            <div className="text-lg font-bold">Built for Coaches. Designed for Results.</div>
            <div className="mt-1 text-xs text-slate-400">AI suggests. Coaches decide. Reports stay coach-approved.</div>
            <div className="mt-3 inline-flex items-center gap-1 text-xs text-sky-200"><ShieldCheck className="h-4 w-4" /> Account-safe privacy controls</div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
