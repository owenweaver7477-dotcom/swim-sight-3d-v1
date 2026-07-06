/**
 * DrillLibrary.jsx — Corrective Drill System
 * Three tabs: Drill Packs | All Drills | Club Drills
 * Supports assignMode (opened from finding context) with URL param passthrough.
 */
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import entities from '@/lib/data/entities';
import { useClubContext } from '@/lib/useClubContext';
import { getDefaultDrillPacks, getDefaultDrills } from '@/lib/defaultDrills';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, X, Dumbbell, Tag, ChevronRight,
  BookOpen, Filter, Package, List, Building2, Waves
} from 'lucide-react';
import DrillDetailModal from '@/components/drills/DrillDetailModal';
import DrillPackModal from '@/components/drills/DrillPackModal';
import FeedbackButton from '@/components/coach-testing/FeedbackButton';
import FeatureStatusBadge from '@/components/status/FeatureStatusBadge';

// ── Constants ────────────────────────────────────────────────────────────────

const STROKES = ['All', 'Freestyle', 'Breaststroke', 'Backstroke', 'Butterfly', 'Starts', 'Turns', 'Underwater', 'General'];
const PHASES = ['All', 'Body Line', 'Catch', 'Pull', 'Recovery', 'Breathing', 'Kick Recovery',
  'Kick Drive', 'Glide', 'Timing', 'Rotation', 'Entry', 'Turn', 'Underwater', 'Breakout', 'Start',
  'Set Position', 'Reaction and Entry', 'Streamline', 'Underwater Breakout', 'Approach', 'Wall Contact',
  'Push-off', 'Streamline / Breakout', 'Finish', 'General'];
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Elite'];

const QUICK_FILTERS = [
  { label: 'Breaststroke Kick', stroke: 'Breaststroke', phase: 'Kick Recovery' },
  { label: 'Freestyle Catch',   stroke: 'Freestyle',    phase: 'Catch' },
  { label: 'Body Line',         stroke: 'All',          phase: 'Body Line' },
  { label: 'Starts',            stroke: 'Starts',       phase: 'All' },
  { label: 'Turns',             stroke: 'Turns',        phase: 'All' },
  { label: 'Underwater',        stroke: 'All',          phase: 'Underwater' },
  { label: 'No Equipment',      stroke: 'All',          phase: 'All',  equipment: 'none' },
];

const DRILL_CATEGORIES = [
  { label: 'Starts', stroke: 'Starts', phases: ['Set position', 'Reaction and entry', 'Streamline', 'Underwater breakout'] },
  { label: 'Turns', stroke: 'Turns', phases: ['Approach', 'Rotation', 'Wall contact', 'Push-off', 'Streamline / breakout'] },
  { label: 'Underwater', phase: 'Underwater', phases: ['Streamline', 'Kick count', 'Breakout'] },
  { label: 'Breaststroke', stroke: 'Breaststroke', phases: ['Pull', 'Breathing', 'Kick recovery', 'Kick drive', 'Timing'] },
  { label: 'Freestyle', stroke: 'Freestyle', phases: ['Body line', 'Entry', 'Catch', 'Pull', 'Breathing', 'Kick timing'] },
  { label: 'Backstroke', stroke: 'Backstroke', phases: ['Body line', 'Entry', 'Catch', 'Pull', 'Rotation', 'Kick'] },
  { label: 'Butterfly', stroke: 'Butterfly', phases: ['Body wave', 'Catch', 'Pull', 'Breathing', 'Kick timing'] },
  { label: 'General body line', stroke: 'General', phase: 'Body Line', phases: ['Posture', 'Alignment', 'Streamline'] },
];

const STROKE_COLORS = {
  Freestyle:    'bg-blue-100 text-blue-700 border-blue-200',
  Breaststroke: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  Backstroke:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  Butterfly:    'bg-purple-100 text-purple-700 border-purple-200',
  Starts:       'bg-amber-100 text-amber-800 border-amber-200',
  Turns:        'bg-rose-100 text-rose-700 border-rose-200',
  Underwater:   'bg-teal-100 text-teal-700 border-teal-200',
  IM:           'bg-orange-100 text-orange-700 border-orange-200',
  General:      'bg-slate-100 text-slate-600 border-slate-200',
};

const DIFF_COLORS = {
  Beginner:     'bg-green-100 text-green-700',
  Intermediate: 'bg-blue-100 text-blue-700',
  Advanced:     'bg-orange-100 text-orange-700',
  Elite:        'bg-red-100 text-red-700',
};

// Solid stroke accents for section headers and card edge stripes.
const STROKE_ACCENT = {
  Freestyle:    'bg-blue-500',
  Breaststroke: 'bg-cyan-500',
  Backstroke:   'bg-emerald-500',
  Butterfly:    'bg-purple-500',
  Starts:       'bg-amber-500',
  Turns:        'bg-rose-500',
  Underwater:   'bg-teal-500',
  General:      'bg-slate-400',
};

// "All Drills" is grouped into these stroke sections (from the existing drill.stroke field).
const STROKE_SECTIONS = [
  { key: 'Breaststroke', label: 'Breaststroke',              strokes: ['Breaststroke'],                accent: 'Breaststroke' },
  { key: 'Freestyle',    label: 'Freestyle',                 strokes: ['Freestyle'],                   accent: 'Freestyle' },
  { key: 'Backstroke',   label: 'Backstroke',                strokes: ['Backstroke'],                  accent: 'Backstroke' },
  { key: 'Butterfly',    label: 'Butterfly',                 strokes: ['Butterfly'],                   accent: 'Butterfly' },
  { key: 'StartsTurns',  label: 'Starts & Turns',            strokes: ['Starts', 'Turns'],             accent: 'Starts' },
  { key: 'Underwater',   label: 'Underwater',                strokes: ['Underwater'],                  accent: 'Underwater' },
  { key: 'General',      label: 'General bodyline / core',   strokes: ['General', 'IM'],               accent: 'General' },
];

const DRILL_PACKS = getDefaultDrillPacks();

function splitPackIds(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map(item => item.trim()).filter(Boolean);
  return [];
}

function mergeDrills(defaultDrills, databaseDrills) {
  const byId = new Map();
  defaultDrills.forEach(drill => byId.set(drill.id, drill));
  databaseDrills.forEach(drill => {
    if (drill?.id) byId.set(drill.id, { ...byId.get(drill.id), ...drill });
  });
  return Array.from(byId.values()).filter(drill => drill.is_active !== false);
}

// ── Match drills to a pack ────────────────────────────────────────────────────

function matchDrillsToPack(pack, drills) {
  const keywords = pack.matchKeywords.map(k => k.toLowerCase());
  return drills.filter(d => {
    const packIds = splitPackIds(d.pack_ids);
    if (packIds.includes(pack.id)) return true;

    const haystack = [d.title, d.fault_tags, d.phase, d.stroke, d.purpose, d.coaching_cues, d.coaching_cue]
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

function StrokeSectionHeader({ label, accentKey, count }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className={`h-6 w-1.5 flex-shrink-0 rounded-full ${STROKE_ACCENT[accentKey] || STROKE_ACCENT.General}`} />
      <h2 className="text-sm font-bold text-slate-900">{label}</h2>
      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STROKE_COLORS[accentKey] || STROKE_COLORS.General}`}>
        {count} drill{count === 1 ? '' : 's'}
      </span>
    </div>
  );
}

function DrillCard({ drill, onOpen, assignMode, onAssignDrill }) {
  const accent = STROKE_ACCENT[drill.stroke] || STROKE_ACCENT.General;
  const cue = (drill.coaching_cue || drill.coaching_cues || '').split('|')[0].trim();
  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
      onClick={() => onOpen(drill)}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} aria-hidden="true" />
      <div className="p-4 pl-5">
        {/* Badges */}
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STROKE_COLORS[drill.stroke] || STROKE_COLORS.General}`}>{drill.stroke}</span>
          {drill.phase && drill.phase !== 'General' && (
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{drill.phase}</span>
          )}
          {drill.difficulty && (
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${DIFF_COLORS[drill.difficulty] || 'bg-slate-100 text-slate-500'}`}>{drill.difficulty}</span>
          )}
          <ChevronRight className="ml-auto h-3 w-3 flex-shrink-0 text-slate-300 transition-colors group-hover:text-primary" />
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold leading-tight text-slate-900">{drill.title}</h3>

        {/* Purpose */}
        {drill.purpose && <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{drill.purpose}</p>}

        {/* Fault it helps fix */}
        {drill.fault_tags && (
          <div className="mt-2 flex items-start gap-1.5">
            <Tag className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-500" />
            <span className="line-clamp-1 text-[10px] text-slate-500"><span className="text-slate-400">Fixes:</span> {drill.fault_tags}</span>
          </div>
        )}

        {/* Coaching cue */}
        {cue && (
          <div className="mt-1.5 line-clamp-1 rounded-lg border border-primary/10 bg-primary/5 px-2.5 py-1.5 text-[10px] font-medium italic text-primary">
            &ldquo;{cue}&rdquo;
          </div>
        )}

        {/* Pool setup + equipment */}
        {(drill.setup || (drill.equipment && drill.equipment !== 'none')) && (
          <div className="mt-2 space-y-1 text-[10px] text-slate-500">
            {drill.setup && (
              <div className="flex items-start gap-1.5">
                <Waves className="mt-0.5 h-3 w-3 flex-shrink-0 text-cyan-500" />
                <span className="line-clamp-1"><span className="text-slate-400">Pool setup:</span> {drill.setup}</span>
              </div>
            )}
            {drill.equipment && drill.equipment !== 'none' && (
              <div className="flex items-start gap-1.5">
                <Dumbbell className="mt-0.5 h-3 w-3 flex-shrink-0 text-slate-400" />
                <span className="line-clamp-1"><span className="text-slate-400">Equipment:</span> {drill.equipment}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer: duration + assign */}
        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
          {drill.duration_or_reps
            ? <span className="flex items-center gap-1 text-[10px] text-slate-400"><Dumbbell className="h-3 w-3" /> {drill.duration_or_reps}</span>
            : <span />}
          {assignMode && (
            <Button
              size="sm"
              className="h-6 bg-primary px-2 text-[10px] text-white hover:bg-primary/90"
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
  // eslint-disable-next-line unused-imports/no-unused-vars -- reserved for fault-tag drill matching (not yet wired)
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
      const defaults = getDefaultDrills();
      try {
        const shared = await entities.Drill.filter({ visibility: 'shared_default', is_active: true }, 'stroke', 200);
        const clubDrills = club?.id
          ? await entities.Drill.filter({ club_id: club.id, is_active: true }, 'stroke', 100)
          : [];
        return mergeDrills(defaults, [...shared, ...clubDrills]);
      } catch (error) {
        console.warn('[drill-library] Supabase drills unavailable; using bundled V1 default drills.', error?.message || error);
        return defaults;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

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

  // Group the filtered drills into stroke sections for the "All Drills" tab (existing data only).
  const groupedSections = useMemo(() => {
    const buckets = {};
    STROKE_SECTIONS.forEach(sec => { buckets[sec.key] = []; });
    const other = [];
    filtered.forEach(d => {
      const sec = STROKE_SECTIONS.find(s => s.strokes.includes(d.stroke));
      if (sec) buckets[sec.key].push(d);
      else other.push(d);
    });
    // Fold any unmatched strokes into the General / core section so nothing is hidden.
    buckets.General = [...buckets.General, ...other];
    return buckets;
  }, [filtered]);

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

  const applyCategory = (category) => {
    setStrokeFilter(category.stroke || 'All');
    setPhaseFilter(category.phase || 'All');
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

      {!assignMode && (
        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4" aria-labelledby="drill-category-title">
          <div className="flex flex-wrap items-center gap-2">
            <div id="drill-category-title" className="text-xs font-bold text-slate-900">Drill categories</div>
            <FeatureStatusBadge status="partial" />
          </div>
          <p className="mt-1 text-[11px] leading-5 text-slate-600">Choose a top-level coaching area. Categories still being expanded remain visible instead of appearing broken.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {DRILL_CATEGORIES.map(category => {
              const count = drills.filter(drill => {
                const strokeMatches = category.stroke ? drill.stroke === category.stroke : true;
                const phaseMatches = category.phase ? drill.phase === category.phase : true;
                return strokeMatches && phaseMatches;
              }).length;
              return (
                <button
                  key={category.label}
                  type="button"
                  onClick={() => applyCategory(category)}
                  className="min-h-16 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:border-cyan-300 hover:bg-cyan-50"
                >
                  <span className="block text-xs font-semibold text-slate-800">{category.label}</span>
                  <span className="mt-1 block text-[9px] leading-4 text-slate-500">
                    {count > 0 ? `${count} drill${count === 1 ? '' : 's'} available` : 'Drill set coming in drill rebuild phase'}
                  </span>
                  <span className="mt-1 block text-[9px] leading-4 text-slate-400">{category.phases.join(' · ')}</span>
                </button>
              );
            })}
          </div>
        </section>
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
      <div className="mb-6 flex w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 sm:w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-w-max items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
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
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {QUICK_FILTERS.map(qf => (
              <button
                key={qf.label}
                onClick={() => applyQuickFilter(qf)}
                className="min-w-max text-xs px-3 py-2 rounded-full bg-white border border-slate-200 text-slate-600 font-medium hover:border-primary/40 hover:text-primary transition-colors"
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
            <div className="space-y-6">
              {STROKE_SECTIONS.map(sec => {
                const list = groupedSections[sec.key] || [];
                if (list.length === 0) return null;
                return (
                  <section key={sec.key}>
                    <StrokeSectionHeader label={sec.label} accentKey={sec.accent} count={list.length} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {list.map(drill => (
                        <DrillCard
                          key={drill.id}
                          drill={drill}
                          onOpen={setSelectedDrill}
                          assignMode={assignMode}
                          onAssignDrill={onAssignDrill}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
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
