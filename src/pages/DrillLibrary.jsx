/**
 * DrillLibrary.jsx — Corrective Drill System
 * Three tabs: Drill Packs | All Drills | Club Drills
 * Supports assignMode (opened from finding context) with URL param passthrough.
 */
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useClubContext } from '@/lib/useClubContext';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, X, Dumbbell, Tag, ChevronRight, Loader2,
  BookOpen, Filter, Package, List, Building2, AlertTriangle
} from 'lucide-react';
import DrillDetailModal from '@/components/drills/DrillDetailModal';
import DrillPackModal from '@/components/drills/DrillPackModal';
import FeedbackButton from '@/components/coach-testing/FeedbackButton';

// ── Constants ────────────────────────────────────────────────────────────────

const STROKES = ['All', 'Freestyle', 'Breaststroke', 'Backstroke', 'Butterfly', 'IM', 'General'];
const PHASES = ['All', 'Body Line', 'Catch', 'Pull', 'Recovery', 'Breathing', 'Kick Recovery',
  'Kick Drive', 'Glide', 'Timing', 'Rotation', 'Entry', 'Turn', 'Underwater', 'Breakout', 'Start', 'Finish', 'General'];
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Elite'];

const QUICK_FILTERS = [
  { label: 'Breaststroke Kick', stroke: 'Breaststroke', phase: 'Kick Recovery' },
  { label: 'Freestyle Catch',   stroke: 'Freestyle',    phase: 'Catch' },
  { label: 'Body Line',         stroke: 'All',          phase: 'Body Line' },
  { label: 'Starts & Turns',    stroke: 'All',          phase: 'Start' },
  { label: 'Underwater',        stroke: 'All',          phase: 'Underwater' },
  { label: 'No Equipment',      stroke: 'All',          phase: 'All',  equipment: 'none' },
];

const STROKE_COLORS = {
  Freestyle:    'bg-blue-100 text-blue-700 border-blue-200',
  Breaststroke: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  Backstroke:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  Butterfly:    'bg-purple-100 text-purple-700 border-purple-200',
  IM:           'bg-orange-100 text-orange-700 border-orange-200',
  General:      'bg-slate-100 text-slate-600 border-slate-200',
};

const DIFF_COLORS = {
  Beginner:     'bg-green-100 text-green-700',
  Intermediate: 'bg-blue-100 text-blue-700',
  Advanced:     'bg-orange-100 text-orange-700',
  Elite:        'bg-red-100 text-red-700',
};

// ── Drill Packs definition ────────────────────────────────────────────────────
// Packs are matched to real drills via keyword matching on title/fault_tags/phase/stroke.
// No fake data — if no drills match, the pack shows "No matching drills found."

const DRILL_PACKS = [
  {
    id: 'bk-kick',
    title: 'Breaststroke Kick Mechanics',
    stroke: 'Breaststroke',
    phases: ['Kick Recovery', 'Kick Drive'],
    faults: ['Wide knees', 'Early foot turn', 'Weak snap', 'Asymmetric kick'],
    objective: 'Rebuild the breaststroke kick from foot position to explosive snap, addressing the most common breaststroke fault patterns.',
    primaryCue: '"Heels to seat — feet out — snap and squeeze"',
    bestFor: 'Beginners to intermediate. Essential for anyone with wide-knee habits or poor kick timing.',
    equipment: 'Wall or kickboard',
    diffRange: 'Beginner – Intermediate',
    whenToUse: 'Early in a training block, or when kick timing is breaking down under fatigue. Use before pulling drills.',
    whenNotToUse: 'Mid-race preparation phase when full-stroke integration is the focus.',
    matchKeywords: ['breaststroke kick', 'knee', 'kick recovery', 'kick drive', 'heels', 'foot turn', 'piston'],
  },
  {
    id: 'bk-timing',
    title: 'Breaststroke Timing & Glide',
    stroke: 'Breaststroke',
    phases: ['Timing', 'Glide', 'Pull'],
    faults: ['Over-glide', 'Rushed pull', 'Dropped hips', 'Poor timing'],
    objective: 'Establish the pull-breathe-kick-glide rhythm and prevent early or late action errors that kill momentum.',
    primaryCue: '"Pull, breathe, kick, glide — long and proud"',
    bestFor: 'Intermediate swimmers. Effective for swimmers who rush the pull or kill glide momentum.',
    equipment: 'None required',
    diffRange: 'Intermediate',
    whenToUse: 'After kick mechanics are solid. Works well as a warm-up or technique set before race-pace work.',
    whenNotToUse: 'When kick mechanics are still broken — timing drills won\'t help if the kick is wrong.',
    matchKeywords: ['breaststroke timing', 'glide', 'timing', 'breakout', 'pull timing'],
  },
  {
    id: 'fr-catch',
    title: 'Freestyle Catch & Pull',
    stroke: 'Freestyle',
    phases: ['Catch', 'Pull'],
    faults: ['Dropped elbow', 'Weak catch', 'Pressing down on entry', 'Slipping water'],
    objective: 'Build early vertical forearm (EVF) and high-elbow catch mechanics to maximise propulsion per stroke.',
    primaryCue: '"Elbow high, fingertips down — reach over the barrel"',
    bestFor: 'All levels. Most common freestyle weakness in club swimmers.',
    equipment: 'Paddles optional',
    diffRange: 'Intermediate – Advanced',
    whenToUse: 'Any technique session. Especially effective at low-to-moderate intensity where feedback can be processed.',
    whenNotToUse: 'High-intensity sprint sets where form breaks down under load.',
    matchKeywords: ['freestyle catch', 'catch', 'pull', 'elbow', 'scull', 'forearm', 'freestyle'],
  },
  {
    id: 'fr-body',
    title: 'Freestyle Body Position',
    stroke: 'Freestyle',
    phases: ['Body Line', 'Breathing', 'Rotation'],
    faults: ['Sinking hips', 'High head position', 'Unstable breathing', 'Over-rotation'],
    objective: 'Establish horizontal body alignment, stable breathing mechanics, and controlled axial rotation.',
    primaryCue: '"Head down, hips up — rotate to breathe, not to survive"',
    bestFor: 'All levels. Foundational for distance swimmers and those struggling with oxygen debt.',
    equipment: 'Fins optional',
    diffRange: 'Beginner – Intermediate',
    whenToUse: 'Start of every technique block. Use before catch and pull work.',
    whenNotToUse: 'Not needed if body position is already strong — diagnose first.',
    matchKeywords: ['freestyle body', 'body line', 'rotation', 'breathing', 'six-kick', 'one-goggle', 'hips'],
  },
  {
    id: 'bk-entry',
    title: 'Backstroke Rotation & Entry',
    stroke: 'Backstroke',
    phases: ['Entry', 'Rotation'],
    faults: ['Crossover entry', 'Flat rotation', 'Poor entry angle', 'Early pull'],
    objective: 'Correct shoulder-line entry and establish controlled axial rotation in backstroke.',
    primaryCue: '"Little finger first — reach through the shoulder line"',
    bestFor: 'All backstroke swimmers. Especially those crossing over on entry.',
    equipment: 'Fins optional',
    diffRange: 'Beginner – Intermediate',
    whenToUse: 'Whenever crossover issues are identified. Good at start of backstroke blocks.',
    whenNotToUse: 'During peak taper phase when stroke changes may cause anxiety.',
    matchKeywords: ['backstroke entry', 'backstroke rotation', 'rotation', 'entry', 'shoulder', 'crossover', 'backstroke'],
  },
  {
    id: 'fly-timing',
    title: 'Butterfly Timing & Undulation',
    stroke: 'Butterfly',
    phases: ['Timing', 'Body Wave', 'Breathing'],
    faults: ['Late second kick', 'Flat body wave', 'High breath', 'Early arm recovery'],
    objective: 'Establish the two-kick butterfly rhythm, body undulation, and low breathing position.',
    primaryCue: '"Kick as hands enter, kick as hands exit — wave not worm"',
    bestFor: 'Intermediate to advanced. Not suitable for beginners who lack the kick timing.',
    equipment: 'Fins recommended',
    diffRange: 'Intermediate – Advanced',
    whenToUse: 'Technique blocks at low-to-moderate intensity. Fins help groove the pattern before removing.',
    whenNotToUse: 'Early in butterfly development before the kick is established.',
    matchKeywords: ['butterfly timing', 'butterfly undulation', 'body dolphin', 'timing', 'butterfly', 'undulation', 'body wave'],
  },
  {
    id: 'uw-breakout',
    title: 'Underwater Breakout',
    stroke: 'General',
    phases: ['Underwater', 'Breakout'],
    faults: ['Early breakout', 'Weak dolphin kicks', 'Loose streamline', 'Wide breakout angle'],
    objective: 'Maximise underwater distance and velocity off every wall through locked streamline and powerful dolphin work.',
    primaryCue: '"Squeeze the ears, lock the hands — kick from the hips"',
    bestFor: 'All levels. Underwater mechanics are often undertrained — high ROI for competition swimmers.',
    equipment: 'None',
    diffRange: 'Intermediate – Elite',
    whenToUse: 'Beginning of any race-prep block. Also useful as a turn-focused technique set.',
    whenNotToUse: 'Recreational or learn-to-swim focus — not appropriate for beginners.',
    matchKeywords: ['underwater', 'breakout', 'streamline', 'dolphin', 'dolphin kick'],
  },
  {
    id: 'hip-stability',
    title: 'Hip & Knee Stability',
    stroke: 'General',
    phases: ['General'],
    faults: ['Knee collapse', 'Poor hip control', 'Unstable kick line', 'Adductor weakness'],
    objective: 'Build dryland hip and knee stability to support breaststroke kick mechanics and overall water body control.',
    primaryCue: '"Knees track over toes — squeeze from the hip, not the knee"',
    bestFor: 'Any swimmer showing knee instability or breaststroke kick deviation. Great dryland activation.',
    equipment: 'Mat, resistance band optional',
    diffRange: 'Beginner – Intermediate',
    whenToUse: 'Warm-up activation, dryland training days, or when breaststroke knee issues are flagged.',
    whenNotToUse: 'Replaces water drills — it complements them.',
    matchKeywords: ['hip', 'knee', 'dryland', 'stability', 'adductor', 'copenhagen', 'hip stability'],
  },
];

// ── Match drills to a pack ────────────────────────────────────────────────────

function matchDrillsToPack(pack, drills) {
  const keywords = pack.matchKeywords.map(k => k.toLowerCase());
  return drills.filter(d => {
    const haystack = [d.title, d.fault_tags, d.phase, d.stroke, d.purpose, d.coaching_cues]
      .join(' ')
      .toLowerCase();
    return (
      (d.stroke === pack.stroke || pack.stroke === 'General') &&
      keywords.some(k => haystack.includes(k))
    );
  });
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function SkeletonCards({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 animate-pulse space-y-2">
          <div className="flex gap-2">
            <div className="h-5 w-20 rounded-full bg-slate-100" />
            <div className="h-5 w-14 rounded-full bg-slate-100" />
          </div>
          <div className="h-4 w-3/4 rounded bg-slate-100" />
          <div className="h-3 w-full rounded bg-slate-50" />
          <div className="h-3 w-2/3 rounded bg-slate-50" />
        </div>
      ))}
    </div>
  );
}

// ── Drill Pack Card ───────────────────────────────────────────────────────────

function DrillPackCard({ pack, drillCount, onOpen }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-primary/40 hover:shadow-md transition-all overflow-hidden group">
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Dumbbell className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${STROKE_COLORS[pack.stroke] || STROKE_COLORS.General}`}>
                {pack.stroke}
              </span>
              <span className="text-[10px] text-muted-foreground">{pack.phases.join(' · ')}</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">{pack.title}</h3>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">{pack.objective}</p>

        {/* Faults */}
        <div className="flex flex-wrap gap-1 mb-3">
          {pack.faults.slice(0, 3).map(f => (
            <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{f}</span>
          ))}
          {pack.faults.length > 3 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">+{pack.faults.length - 3} more</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 text-[10px] text-slate-500">
          <div><span className="text-slate-400">Drills:</span> <span className="font-semibold text-slate-700">{drillCount}</span></div>
          <div><span className="text-slate-400">Level:</span> <span className="font-semibold text-slate-700">{pack.diffRange}</span></div>
          <div className="col-span-2"><span className="text-slate-400">Equipment:</span> <span className="font-semibold text-slate-700">{pack.equipment}</span></div>
        </div>

        {/* Primary cue preview */}
        <div className="px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 mb-4">
          <div className="text-[10px] text-primary font-semibold uppercase tracking-wider mb-0.5">Primary Cue</div>
          <p className="text-xs text-slate-700 font-medium italic line-clamp-1">{pack.primaryCue}</p>
        </div>

        <Button
          size="sm"
          className="w-full bg-primary text-white hover:bg-primary/90 text-xs"
          onClick={() => onOpen(pack)}
        >
          Open Pack <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ── Individual Drill Card ─────────────────────────────────────────────────────

function DrillCard({ drill, onOpen, assignMode, onAssignDrill }) {
  return (
    <div
      className="bg-white rounded-xl border border-slate-200 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group"
      onClick={() => onOpen(drill)}
    >
      <div className="p-4">
        {/* Badges row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${STROKE_COLORS[drill.stroke] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            {drill.stroke}
          </span>
          {drill.phase && drill.phase !== 'General' && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-medium">{drill.phase}</span>
          )}
          {drill.difficulty && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${DIFF_COLORS[drill.difficulty] || 'bg-slate-100 text-slate-500'}`}>{drill.difficulty}</span>
          )}
          {drill.equipment && drill.equipment !== 'none' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">{drill.equipment}</span>
          )}
          <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-primary ml-auto transition-colors flex-shrink-0" />
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-slate-900 mb-1 leading-tight">{drill.title}</h3>

        {/* Fault tags */}
        {drill.fault_tags && (
          <div className="flex items-center gap-1 mb-1.5">
            <Tag className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <span className="text-[10px] text-slate-400 line-clamp-1">{drill.fault_tags}</span>
          </div>
        )}

        {/* Purpose */}
        {drill.purpose && (
          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{drill.purpose}</p>
        )}

        {/* Cue preview */}
        {drill.coaching_cues && (
          <div className="mt-2 text-[10px] text-primary font-medium italic line-clamp-1">
            "{drill.coaching_cues.split('|')[0].trim()}"
          </div>
        )}

        {/* Duration + assign */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
          {drill.duration_or_reps ? (
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Dumbbell className="w-3 h-3" /> {drill.duration_or_reps}
            </span>
          ) : <span />}
          {assignMode && (
            <Button
              size="sm"
              className="h-6 text-[10px] px-2 bg-primary text-white hover:bg-primary/90"
              onClick={e => { e.stopPropagation(); onAssignDrill(drill); }}
            >
              Assign
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DrillLibrary({
  assignMode = false,
  findingStroke,
  findingPhase,
  findingFaultTags,
  onAssignDrill,
  assignedDrillTitle,
}) {
  const { club } = useClubContext();

  // URL params — passed from "Find Matching Drills" on finding cards
  const urlParams = new URLSearchParams(window.location.search);
  const urlStroke    = urlParams.get('stroke') || '';
  const urlPhase     = urlParams.get('phase')  || '';
  const urlFaults    = urlParams.get('faults') || '';
  const urlContext   = urlParams.get('context') || ''; // e.g. finding name / report title
  const urlReportId  = urlParams.get('report_id') || '';
  const urlFindingId = urlParams.get('finding_id') || '';

  const mapStroke = (s) => STROKES.find(st => st.toLowerCase() === s?.toLowerCase()) || 'All';
  const mapPhase  = (p) => PHASES.find(ph => ph.toLowerCase() === p?.toLowerCase()) || 'All';

  // Tab state
  const [activeTab, setActiveTab] = useState(urlStroke || urlPhase || urlFaults ? 'drills' : 'packs');

  // Filter state
  const [search, setSearch]           = useState(urlFaults || '');
  const [strokeFilter, setStrokeFilter] = useState(findingStroke || mapStroke(urlStroke));
  const [phaseFilter, setPhaseFilter]   = useState(findingPhase  || mapPhase(urlPhase));
  const [diffFilter, setDiffFilter]     = useState('All');
  const [showFilters, setShowFilters]   = useState(false);
  const [equipFilter, setEquipFilter]   = useState('All'); // 'none' = no equipment only

  // Modal state
  const [selectedDrill, setSelectedDrill] = useState(null);
  const [selectedPack, setSelectedPack]   = useState(null);

  // Data
  const { data: drills = [], isLoading } = useQuery({
    queryKey: ['drills', club?.id],
    queryFn: async () => {
      const shared = await base44.entities.Drill.filter({ visibility: 'shared_default', is_active: true }, 'stroke', 200);
      const clubDrills = club?.id
        ? await base44.entities.Drill.filter({ club_id: club.id, is_active: true }, 'stroke', 100)
        : [];
      return [...shared, ...clubDrills];
    },
    staleTime: 5 * 60 * 1000,
  });

  const sharedDrills = drills.filter(d => d.visibility === 'shared_default' || !d.club_id);
  const clubOnlyDrills = drills.filter(d => d.club_id === club?.id);

  // Filtered drills (All Drills tab)
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return drills.filter(d => {
      const matchSearch = !q ||
        d.title?.toLowerCase().includes(q) ||
        d.fault_tags?.toLowerCase().includes(q) ||
        d.coaching_cues?.toLowerCase().includes(q) ||
        d.purpose?.toLowerCase().includes(q) ||
        d.stroke?.toLowerCase().includes(q) ||
        d.phase?.toLowerCase().includes(q) ||
        d.equipment?.toLowerCase().includes(q) ||
        d.difficulty?.toLowerCase().includes(q);
      const matchStroke = strokeFilter === 'All' || d.stroke === strokeFilter;
      const matchPhase  = phaseFilter === 'All'  || d.phase === phaseFilter;
      const matchDiff   = diffFilter === 'All'   || d.difficulty === diffFilter;
      const matchEquip  = equipFilter === 'All'  || (equipFilter === 'none' ? (!d.equipment || d.equipment === 'none') : d.equipment?.toLowerCase().includes(equipFilter.toLowerCase()));
      return matchSearch && matchStroke && matchPhase && matchDiff && matchEquip;
    });
  }, [drills, search, strokeFilter, phaseFilter, diffFilter, equipFilter]);

  const hasActiveFilters = strokeFilter !== 'All' || phaseFilter !== 'All' || diffFilter !== 'All' || equipFilter !== 'All';

  const clearFilters = () => {
    setSearch('');
    setStrokeFilter('All');
    setPhaseFilter('All');
    setDiffFilter('All');
    setEquipFilter('All');
  };

  const applyQuickFilter = (qf) => {
    setStrokeFilter(qf.stroke);
    setPhaseFilter(qf.phase);
    if (qf.equipment) setEquipFilter(qf.equipment);
    setActiveTab('drills');
  };

  const contextLabel = urlContext || assignedDrillTitle || (urlReportId ? 'Report' : null);

  const tabs = [
    { id: 'packs',  label: 'Drill Packs', icon: Package },
    { id: 'drills', label: 'All Drills',  icon: List },
    { id: 'club',   label: 'Club Drills', icon: Building2 },
  ];

  return (
    <div className={assignMode ? '' : 'max-w-6xl mx-auto px-4 py-10'}>

      {/* ── Header ── */}
      {!assignMode && (
        <PageHeader
          eyebrow="Corrective Drill System"
          title="Corrective Drill Library"
          subtitle="Stroke-specific drills, cue progressions, and corrective packs linked to common technical faults."
        />
      )}

      {/* ── Context banner (assign mode / URL context) ── */}
      {(assignMode || contextLabel) && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
          <BookOpen className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-primary font-medium">
            {assignMode
              ? `Select a drill to assign${contextLabel ? ` to: ${contextLabel}` : ''}`
              : `Showing drills matched to: ${contextLabel}`
            }
          </p>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 mb-6 w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-primary shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === 'club' && clubOnlyDrills.length > 0 && (
                <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1.5 rounded-full">{clubOnlyDrills.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════
          TAB: DRILL PACKS
      ══════════════════════════════════════════════ */}
      {activeTab === 'packs' && (
        <div>
          {/* Quick filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {QUICK_FILTERS.map(qf => (
              <button
                key={qf.label}
                onClick={() => applyQuickFilter(qf)}
                className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 font-medium hover:border-primary/40 hover:text-primary transition-colors"
              >
                {qf.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <SkeletonCards count={6} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {DRILL_PACKS.map(pack => {
                const matched = matchDrillsToPack(pack, drills);
                return (
                  <DrillPackCard
                    key={pack.id}
                    pack={pack}
                    drillCount={matched.length}
                    onOpen={(p) => setSelectedPack(p)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: ALL DRILLS
      ══════════════════════════════════════════════ */}
      {activeTab === 'drills' && (
        <div>
          {/* Search + filter bar */}
          <div className="flex gap-2 mb-3 flex-wrap items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search drills, cues, fault tags, equipment…"
                className="pl-9 bg-white text-sm h-9 border-slate-200"
              />
              {search && (
                <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch('')}>
                  <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700" />
                </button>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className={`h-9 text-xs gap-1.5 border-slate-200 ${hasActiveFilters ? 'border-primary/40 text-primary bg-primary/5' : ''}`}
              onClick={() => setShowFilters(v => !v)}
            >
              <Filter className="w-3 h-3" /> Filters
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </Button>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground underline">
                Clear
              </button>
            )}
          </div>

          {/* Quick chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {QUICK_FILTERS.map(qf => (
              <button
                key={qf.label}
                onClick={() => applyQuickFilter(qf)}
                className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-500 hover:border-primary/40 hover:text-primary transition-colors"
              >
                {qf.label}
              </button>
            ))}
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-4 space-y-3">
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-slate-400 w-14 font-semibold uppercase">Stroke</span>
                {STROKES.map(s => (
                  <button key={s} onClick={() => setStrokeFilter(s)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                      strokeFilter === s ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:border-primary/40'
                    }`}>{s}</button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-slate-400 w-14 font-semibold uppercase">Phase</span>
                {PHASES.map(p => (
                  <button key={p} onClick={() => setPhaseFilter(p)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                      phaseFilter === p ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:border-primary/40'
                    }`}>{p}</button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-slate-400 w-14 font-semibold uppercase">Level</span>
                {DIFFICULTIES.map(d => (
                  <button key={d} onClick={() => setDiffFilter(d)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                      diffFilter === d ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:border-primary/40'
                    }`}>{d}</button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-slate-400 w-14 font-semibold uppercase">Equip</span>
                {['All', 'none', 'fins', 'board', 'paddles', 'band'].map(e => (
                  <button key={e} onClick={() => setEquipFilter(e)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-colors capitalize ${
                      equipFilter === e ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:border-primary/40'
                    }`}>{e === 'none' ? 'No equipment' : e}</button>
                ))}
              </div>
            </div>
          )}

          <div className="text-[10px] text-slate-400 mb-3">
            {filtered.length} drill{filtered.length !== 1 ? 's' : ''}
            {hasActiveFilters && ' (filtered)'}
          </div>

          {isLoading ? (
            <SkeletonCards count={8} />
          ) : filtered.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <div className="text-sm font-semibold text-slate-700 mb-1">No matching drills found.</div>
              <p className="text-xs text-slate-400">Try clearing filters or creating a club drill.</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="mt-3 text-xs text-primary underline">Clear all filters</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map(drill => (
                <DrillCard
                  key={drill.id}
                  drill={drill}
                  onOpen={setSelectedDrill}
                  assignMode={assignMode}
                  onAssignDrill={onAssignDrill}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: CLUB DRILLS
      ══════════════════════════════════════════════ */}
      {activeTab === 'club' && (
        <div>
          {clubOnlyDrills.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <div className="text-sm font-semibold text-slate-700 mb-1">No club-private drills yet.</div>
              <p className="text-xs text-slate-400">
                Club drills are visible only to your club members. Create them from the drill management area.
              </p>
            </div>
          ) : (
            <>
              <div className="text-[10px] text-slate-400 mb-3">{clubOnlyDrills.length} club-private drill{clubOnlyDrills.length !== 1 ? 's' : ''}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {clubOnlyDrills.map(drill => (
                  <DrillCard
                    key={drill.id}
                    drill={drill}
                    onOpen={setSelectedDrill}
                    assignMode={assignMode}
                    onAssignDrill={onAssignDrill}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {selectedDrill && (
        <DrillDetailModal
          drill={selectedDrill}
          onClose={() => setSelectedDrill(null)}
          onAssignDrill={onAssignDrill}
          assignMode={assignMode}
          assignedDrillId={null}
          contextLabel={contextLabel}
        />
      )}

      {selectedPack && (
        <DrillPackModal
          pack={selectedPack}
          matchedDrills={matchDrillsToPack(selectedPack, drills)}
          onClose={() => setSelectedPack(null)}
          onOpenDrill={(drill) => { setSelectedPack(null); setSelectedDrill(drill); }}
          assignMode={assignMode}
          onAssignDrill={onAssignDrill}
        />
      )}

      {!assignMode && <FeedbackButton pageRoute="/drill-library" />}
    </div>
  );
}