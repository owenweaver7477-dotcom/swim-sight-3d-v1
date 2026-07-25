/**
 * DrillLibrary.jsx — the club drill library.
 * A clean flat list matching the approved reference: search · filter · add ·
 * category tabs · one row per drill (icon · name · category · description ·
 * duration · tag · overflow menu) · a footer count. Pre-filters from the
 * ?stroke/?phase/?faults URL params passed by "Find Matching Drills".
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import entities from '@/lib/data/entities';
import { useClubContext } from '@/lib/useClubContext';
import { getDefaultDrills } from '@/lib/defaultDrills';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Search, X, Filter, Plus, Clock, MoreVertical, BookOpen, Loader2,
  Waves, Flag, RotateCcw, ArrowDownToLine, Trash2, Eye,
  Repeat, Activity, Zap, Shuffle, Dumbbell,
} from 'lucide-react';
import DrillDetailModal from '@/components/drills/DrillDetailModal';
import FeedbackButton from '@/components/coach-testing/FeedbackButton';

// Category tabs in the reference order. `value` maps a tab to the drill.stroke
// data ("Underwaters" tab -> the "Underwater" stored value).
const CATEGORY_TABS = [
  { label: 'All', value: 'All' },
  { label: 'Freestyle', value: 'Freestyle' },
  { label: 'Backstroke', value: 'Backstroke' },
  { label: 'Breaststroke', value: 'Breaststroke' },
  { label: 'Butterfly', value: 'Butterfly' },
  { label: 'IM', value: 'IM' },
  { label: 'Starts', value: 'Starts' },
  { label: 'Turns', value: 'Turns' },
  { label: 'Underwaters', value: 'Underwater' },
];
const CREATE_STROKES = ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'IM', 'Starts', 'Turns', 'Underwater', 'General'];
const PHASES = ['All', 'Body Line', 'Catch', 'Pull', 'Recovery', 'Breathing', 'Kick Drive', 'Glide', 'Timing', 'Rotation', 'Turn', 'Underwater', 'Breakout', 'Start', 'Finish', 'General',
  // Starts / Turns / underwater phases (kept complete for the phase filter).
  'Set position', 'Reaction and entry', 'Streamline', 'Underwater breakout', 'Approach', 'Wall contact', 'Push-off'];
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Elite'];

// One visual identity per stroke/skill. Previously every stroke drill collapsed to
// the same Waves icon, the same sky accent and the same "Technique" badge, so the
// list was a wall of identical rows with nothing for the eye to lock onto (design
// audit A8). Icon, accent and chip now differ per category, and the badge carries
// the drill's difficulty — real information that varies row to row.
const STROKE_STYLES = {
  Freestyle:    { icon: Waves,           text: 'text-sky-600 dark:text-sky-400',         chip: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' },
  Backstroke:   { icon: Repeat,          text: 'text-violet-600 dark:text-violet-400',   chip: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' },
  Breaststroke: { icon: Activity,        text: 'text-teal-600 dark:text-teal-400',       chip: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300' },
  Butterfly:    { icon: Zap,             text: 'text-amber-600 dark:text-amber-400',     chip: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' },
  IM:           { icon: Shuffle,         text: 'text-orange-600 dark:text-orange-400',   chip: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300' },
  Starts:       { icon: Flag,            text: 'text-indigo-600 dark:text-indigo-400',   chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300' },
  Turns:        { icon: RotateCcw,       text: 'text-emerald-600 dark:text-emerald-400', chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  Underwater:   { icon: ArrowDownToLine, text: 'text-blue-600 dark:text-blue-400',       chip: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' },
  General:      { icon: Dumbbell,        text: 'text-slate-600 dark:text-slate-300',     chip: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300' },
};
const FALLBACK_STYLE = STROKE_STYLES.General;
const strokeStyle = (stroke) => STROKE_STYLES[stroke] || FALLBACK_STYLE;

const DIFFICULTY_CHIP = {
  Beginner:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  Intermediate: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  Advanced:     'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  Elite:        'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

/** Badge text: the drill's difficulty when known, else its category. */
function drillBadge(drill) {
  if (drill.difficulty && DIFFICULTY_CHIP[drill.difficulty]) {
    return { label: drill.difficulty, className: DIFFICULTY_CHIP[drill.difficulty] };
  }
  const stroke = drill.stroke;
  const label = stroke === 'Underwater' ? 'Underwaters' : (stroke || 'Drill');
  return { label, className: strokeStyle(stroke).chip };
}
function categoryText(stroke) {
  return strokeStyle(stroke).text;
}
function CategoryIcon({ stroke, className }) {
  const Icon = strokeStyle(stroke).icon;
  return <Icon className={className} />;
}

// Merge bundled default drills with database drills (db wins on id).
function mergeDrills(defaults, databaseDrills) {
  const byId = new Map();
  defaults.forEach((d) => byId.set(d.id, d));
  databaseDrills.forEach((d) => byId.set(d.id, d));
  return [...byId.values()];
}

function DrillRow({ drill, onOpen, canManage, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);
  const badge = drillBadge(drill);
  return (
    <div className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/40">
      <button type="button" onClick={() => onOpen(drill)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${strokeStyle(drill.stroke).chip}`}>
          <CategoryIcon stroke={drill.stroke} className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-foreground">{drill.title}</div>
          <div className={`text-xs font-semibold ${categoryText(drill.stroke)}`}>{drill.stroke}</div>
          {drill.purpose && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{drill.purpose}</p>}
        </div>
      </button>
      <div className="flex flex-shrink-0 items-center gap-3">
        {drill.duration_or_reps && (
          <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex"><Clock className="h-3.5 w-3.5" /> {drill.duration_or_reps}</span>
        )}
        <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}>{badge.label}</span>
        <div className="relative" ref={menuRef}>
          <button type="button" onClick={() => setMenuOpen((v) => !v)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Drill options">
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <button type="button" onClick={() => { setMenuOpen(false); onOpen(drill); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary">
                <Eye className="h-3.5 w-3.5" /> View details
              </button>
              {canManage && drill.club_id && (
                <button type="button" onClick={() => { setMenuOpen(false); onDelete(drill); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" /> Delete drill
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddDrillDialog({ open, onClose, onCreate, saving }) {
  const [form, setForm] = useState({ title: '', stroke: 'Freestyle', purpose: '', duration_or_reps: '', coaching_cues: '' });
  useEffect(() => { if (open) setForm({ title: '', stroke: 'Freestyle', purpose: '', duration_or_reps: '', coaching_cues: '' }); }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-sm" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Add a club drill</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <div><Label className="text-xs text-muted-foreground">Drill name</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Single Arm Freestyle" className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Category</Label>
              <select value={form.stroke} onChange={(e) => setForm((p) => ({ ...p, stroke: e.target.value }))} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                {CREATE_STROKES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><Label className="text-xs text-muted-foreground">Duration</Label><Input value={form.duration_or_reps} onChange={(e) => setForm((p) => ({ ...p, duration_or_reps: e.target.value }))} placeholder="e.g. 15 min" className="mt-1" /></div>
          </div>
          <div><Label className="text-xs text-muted-foreground">Description</Label><Textarea value={form.purpose} onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))} placeholder="What it works on" rows={2} className="mt-1" /></div>
          <div><Label className="text-xs text-muted-foreground">Coaching cue <span className="text-muted-foreground/60">(optional)</span></Label><Input value={form.coaching_cues} onChange={(e) => setForm((p) => ({ ...p, coaching_cues: e.target.value }))} placeholder="One thing to feel" className="mt-1" /></div>
        </div>
        <div className="mt-5 flex gap-2">
          <Button className="flex-1" onClick={() => onCreate(form)} disabled={!form.title.trim() || saving}>{saving ? 'Adding…' : 'Add drill'}</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">Club drills are private to your club — only your members see them.</p>
      </div>
    </div>
  );
}

export default function DrillLibrary() {
  const { club, memberRole } = useClubContext();
  const queryClient = useQueryClient();
  const canManage = ['owner', 'admin', 'coach', 'assistant_coach'].includes(memberRole);

  const urlParams = new URLSearchParams(window.location.search);
  const mapTab = (s) => CATEGORY_TABS.find((t) => t.value.toLowerCase() === String(s || '').toLowerCase())?.value || 'All';

  const [category, setCategory] = useState(mapTab(urlParams.get('stroke')));
  const [search, setSearch] = useState(urlParams.get('faults') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [phaseFilter, setPhaseFilter] = useState('All');
  const [diffFilter, setDiffFilter] = useState('All');
  const [selectedDrill, setSelectedDrill] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const { data: drills = [], isLoading } = useQuery({
    queryKey: ['drills', club?.id],
    queryFn: async () => {
      const defaults = getDefaultDrills();
      try {
        const shared = await entities.Drill.filter({ visibility: 'shared_default', is_active: true }, 'stroke', 200);
        const clubDrills = club?.id ? await entities.Drill.filter({ club_id: club.id, is_active: true }, 'stroke', 100) : [];
        return mergeDrills(defaults, [...shared, ...clubDrills]);
      } catch (error) {
        console.warn('[drill-library] Supabase drills unavailable; using bundled defaults.', error?.message || error);
        return defaults;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return drills.filter((d) => {
      const matchCat = category === 'All' || d.stroke === category;
      const matchPhase = phaseFilter === 'All' || d.phase === phaseFilter;
      const matchDiff = diffFilter === 'All' || d.difficulty === diffFilter;
      const matchSearch = !q || d.title?.toLowerCase().includes(q) || d.purpose?.toLowerCase().includes(q)
        || d.coaching_cues?.toLowerCase().includes(q) || d.fault_tags?.toLowerCase().includes(q) || d.stroke?.toLowerCase().includes(q);
      return matchCat && matchPhase && matchDiff && matchSearch;
    });
  }, [drills, category, phaseFilter, diffFilter, search]);

  const hasActiveFilters = phaseFilter !== 'All' || diffFilter !== 'All';

  const createDrill = useMutation({
    mutationFn: (form) => entities.Drill.create({
      club_id: club?.id,
      title: form.title.trim(),
      stroke: form.stroke,
      purpose: form.purpose.trim() || null,
      duration_or_reps: form.duration_or_reps.trim() || null,
      coaching_cues: form.coaching_cues.trim() || null,
      visibility: 'club_private',
      is_active: true,
    }),
    onSuccess: () => { setAddOpen(false); queryClient.invalidateQueries({ queryKey: ['drills', club?.id] }); },
  });

  const deleteDrill = useMutation({
    mutationFn: (drill) => entities.Drill.update(drill.id, { is_active: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drills', club?.id] }),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header + toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Drills</h1>
          <p className="text-sm text-muted-foreground">Your drill library</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search drills..." className="h-9 w-full pl-9 sm:w-56" />
            {search && <button className="absolute right-2.5 top-1/2 -translate-y-1/2" onClick={() => setSearch('')}><X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" /></button>}
          </div>
          <Button variant="outline" size="sm" className={`h-9 gap-1.5 ${hasActiveFilters ? 'border-primary/50 text-primary' : ''}`} onClick={() => setShowFilters((v) => !v)}>
            <Filter className="h-3.5 w-3.5" /> Filter{hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
          </Button>
          {canManage && (
            <Button size="sm" className="h-9 gap-1.5" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Drill
            </Button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className="mt-5 flex items-center gap-1 overflow-x-auto border-b border-border">
        {CATEGORY_TABS.map((t) => (
          <React.Fragment key={t.value}>
            {t.value === 'Starts' && <span className="mx-1 h-4 w-px flex-shrink-0 bg-border" aria-hidden="true" />}
            <button
              type="button"
              onClick={() => setCategory(t.value)}
              className={`relative whitespace-nowrap px-3 py-2.5 text-sm font-semibold transition-colors ${category === t.value ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t.label}
              {category === t.value && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Optional filter panel */}
      {showFilters && (
        <div className="mt-3 space-y-2 rounded-xl border border-border bg-secondary/40 p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="w-12 text-[10px] font-semibold uppercase text-muted-foreground">Phase</span>
            {PHASES.map((p) => (
              <button key={p} onClick={() => setPhaseFilter(p)} className={`rounded-lg border px-2 py-0.5 text-[11px] font-medium transition-colors ${phaseFilter === p ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary/40'}`}>{p}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="w-12 text-[10px] font-semibold uppercase text-muted-foreground">Level</span>
            {DIFFICULTIES.map((d) => (
              <button key={d} onClick={() => setDiffFilter(d)} className={`rounded-lg border px-2 py-0.5 text-[11px] font-medium transition-colors ${diffFilter === d ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary/40'}`}>{d}</button>
            ))}
          </div>
          {hasActiveFilters && <button onClick={() => { setPhaseFilter('All'); setDiffFilter('All'); }} className="text-[11px] text-primary underline">Clear filters</button>}
        </div>
      )}

      {/* Drill list */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <BookOpen className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
            <div className="text-sm font-semibold text-foreground">No drills here yet</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {search || hasActiveFilters ? 'Try another search or clear the filters.' : canManage ? 'Add your first club drill with “Add Drill”.' : 'No drills in this category yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((drill) => (
              <DrillRow key={drill.id} drill={drill} onOpen={setSelectedDrill} canManage={canManage} onDelete={(d) => deleteDrill.mutate(d)} />
            ))}
          </div>
        )}
      </div>

      {/* Footer count */}
      {!isLoading && (
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5" /> {filtered.length} drill{filtered.length === 1 ? '' : 's'}
        </div>
      )}

      {selectedDrill && (
        <DrillDetailModal drill={selectedDrill} onClose={() => setSelectedDrill(null)} assignMode={false} assignedDrillId={null} />
      )}
      <AddDrillDialog open={addOpen} onClose={() => setAddOpen(false)} onCreate={(form) => createDrill.mutate(form)} saving={createDrill.isPending} />

      <FeedbackButton pageRoute="/drill-library" />
    </div>
  );
}
