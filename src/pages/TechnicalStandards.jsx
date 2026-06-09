import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import entities from '@/lib/data/entities';
import { useClubContext } from '@/lib/useClubContext';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen, Plus, Search, ChevronRight, Copy, Archive, Edit2,
  Waves, Target, CheckCircle2, Tag, Loader2, X, BookMarked
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StandardFormModal from '@/components/standards/StandardFormModal';
import StandardDetailModal from '@/components/standards/StandardDetailModal';
import { DEFAULT_STANDARDS } from '@/components/standards/defaultStandards';

const STROKE_OPTIONS = ['All', 'Freestyle', 'Breaststroke', 'Backstroke', 'Butterfly', 'IM', 'General'];
const PHASE_OPTIONS = ['All', 'Body Line', 'Catch', 'Pull', 'Recovery', 'Breathing', 'Kick Recovery', 'Kick Drive', 'Glide', 'Timing', 'Rotation', 'Entry', 'Turn', 'Underwater', 'Breakout', 'Start', 'Finish', 'General'];
const DIFFICULTY_OPTIONS = ['All', 'Development', 'Competitive', 'National', 'Elite'];
const VISIBILITY_OPTIONS = ['All', 'Club Standards', 'Default Reference'];

const STROKE_COLORS = {
  Freestyle:    'bg-blue-50 text-blue-700 border-blue-200',
  Breaststroke: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Backstroke:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  Butterfly:    'bg-purple-50 text-purple-700 border-purple-200',
  IM:           'bg-amber-50 text-amber-700 border-amber-200',
  General:      'bg-slate-50 text-slate-700 border-slate-200',
};

const DIFFICULTY_COLORS = {
  Development:  'bg-green-50 text-green-700 border-green-200',
  Competitive:  'bg-blue-50 text-blue-700 border-blue-200',
  National:     'bg-amber-50 text-amber-700 border-amber-200',
  Elite:        'bg-purple-50 text-purple-700 border-purple-200',
};

function StandardCard({ standard, isDefault, onEdit, onDuplicate, onArchive, onClick, canEdit }) {
  const strokeColor = STROKE_COLORS[standard.stroke] || STROKE_COLORS.General;
  const diffColor = DIFFICULTY_COLORS[standard.difficulty_level] || DIFFICULTY_COLORS.Competitive;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-primary/40 transition-colors group">
      <button className="w-full text-left p-5" onClick={() => onClick(standard)}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap gap-1.5">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${strokeColor}`}>
              {standard.stroke}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
              {standard.phase}
            </span>
            {standard.difficulty_level && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${diffColor}`}>
                {standard.difficulty_level}
              </span>
            )}
            {isDefault && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                Default Reference
              </span>
            )}
            {!standard.is_active && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
                Archived
              </span>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary flex-shrink-0 mt-0.5" />
        </div>

        <h3 className="text-sm font-bold text-slate-900 mb-2">{standard.title}</h3>

        {standard.technical_goal && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">{standard.technical_goal}</p>
        )}

        {standard.coach_cues && (
          <div className="mb-3 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
            <div className="text-[9px] uppercase tracking-wider text-primary font-semibold mb-0.5">Coach Cues</div>
            <p className="text-xs text-slate-700 line-clamp-2">{standard.coach_cues}</p>
          </div>
        )}

        {standard.common_faults && (
          <div className="flex items-start gap-1.5">
            <Tag className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 line-clamp-1">{standard.common_faults}</p>
          </div>
        )}
      </button>

      {canEdit && (
        <div className="px-5 pb-4 flex items-center gap-2 border-t border-slate-100 pt-3">
          {!isDefault && (
            <button
              onClick={() => onEdit(standard)}
              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-primary transition-colors"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          )}
          <button
            onClick={() => onDuplicate(standard)}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-primary transition-colors"
          >
            <Copy className="w-3 h-3" /> {isDefault ? 'Duplicate to Club' : 'Duplicate'}
          </button>
          {!isDefault && standard.is_active && (
            <button
              onClick={() => onArchive(standard)}
              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-amber-600 transition-colors ml-auto"
            >
              <Archive className="w-3 h-3" /> Archive
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function TechnicalStandards() {
  const { club } = useClubContext();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [strokeFilter, setStrokeFilter] = useState('All');
  const [phaseFilter, setPhaseFilter] = useState('All');
  const [diffFilter, setDiffFilter] = useState('All');
  const [visFilter, setVisFilter] = useState('All');
  const [showInactive, setShowInactive] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStandard, setEditingStandard] = useState(null);
  const [detailStandard, setDetailStandard] = useState(null);

  const { data: clubStandards = [], isLoading } = useQuery({
    queryKey: ['technical-standards', club?.id],
    queryFn: async () => {
      try {
        return await entities.TechnicalStandard.filter({ club_id: club.id }, 'title', 250);
      } catch (error) {
        console.warn('[technical-standards] Supabase unavailable; using default standards only.', error?.message || error);
        return [];
      }
    },
    enabled: !!club?.id,
    staleTime: 2 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => entities.TechnicalStandard.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['technical-standards', club?.id] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.TechnicalStandard.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['technical-standards', club?.id] }),
  });

  const handleCreate = async (formData) => {
    await createMutation.mutateAsync({ ...formData, club_id: club.id, standard_type: 'club_standard', visibility: 'club_private' });
    setFormOpen(false);
  };

  const handleEdit = async (formData) => {
    await updateMutation.mutateAsync({ id: editingStandard.id, data: formData });
    setEditingStandard(null);
    setFormOpen(false);
  };

  const handleDuplicate = async (standard) => {
    const { id, created_date, updated_date, ...rest } = standard;
    await createMutation.mutateAsync({
      ...rest,
      club_id: club.id,
      standard_type: 'club_standard',
      visibility: 'club_private',
      title: `${standard.title} (Club Copy)`,
    });
  };

  const handleArchive = async (standard) => {
    await updateMutation.mutateAsync({ id: standard.id, data: { is_active: false } });
  };

  // Combine club standards + default reference standards
  const allStandards = useMemo(() => {
    const defaults = DEFAULT_STANDARDS.map(s => ({ ...s, _isDefault: true }));
    const club = clubStandards.map(s => ({ ...s, _isDefault: false }));
    return [...club, ...defaults];
  }, [clubStandards]);

  const filtered = useMemo(() => {
    return allStandards.filter(s => {
      if (!showInactive && s.is_active === false) return false;
      if (strokeFilter !== 'All' && s.stroke !== strokeFilter) return false;
      if (phaseFilter !== 'All' && s.phase !== phaseFilter) return false;
      if (diffFilter !== 'All' && s.difficulty_level !== diffFilter) return false;
      if (visFilter === 'Club Standards' && s._isDefault) return false;
      if (visFilter === 'Default Reference' && !s._isDefault) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.title?.toLowerCase().includes(q) ||
          s.technical_goal?.toLowerCase().includes(q) ||
          s.common_faults?.toLowerCase().includes(q) ||
          s.coach_cues?.toLowerCase().includes(q) ||
          s.stroke?.toLowerCase().includes(q) ||
          s.phase?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allStandards, strokeFilter, phaseFilter, diffFilter, visFilter, showInactive, search]);

  const clubCount = clubStandards.filter(s => s.is_active !== false).length;
  const defaultCount = DEFAULT_STANDARDS.length;

  if (!club) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="p-10 rounded-xl bg-white border border-slate-200 text-center">
          <Waves className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <div className="text-sm font-medium text-slate-700 mb-1">No club workspace selected</div>
          <p className="text-xs text-slate-400">Create or join a club to manage technical standards.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <PageHeader
        eyebrow="Coach Tools"
        title="Technical Standards"
        subtitle="Define, organise, and apply your club's technical model by stroke, phase, and skill level."
      >
        <Button size="sm" className="mt-2" onClick={() => { setEditingStandard(null); setFormOpen(true); }}>
          <Plus className="w-3.5 h-3.5 mr-1" /> New Standard
        </Button>
      </PageHeader>

      {/* Summary bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-center flex-1 min-w-[120px]">
          <div className="text-lg font-bold text-primary">{clubCount}</div>
          <div className="text-[10px] text-slate-400">Club Standards</div>
        </div>
        <div className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-center flex-1 min-w-[120px]">
          <div className="text-lg font-bold text-amber-600">{defaultCount}</div>
          <div className="text-[10px] text-slate-400">Default References</div>
        </div>
        <div className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-center flex-1 min-w-[120px]">
          <div className="text-lg font-bold text-slate-700">{filtered.length}</div>
          <div className="text-[10px] text-slate-400">Showing</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search standards..."
            className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3 text-slate-400 hover:text-slate-700" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 mb-1">Stroke</div>
            <div className="flex flex-wrap gap-1">
              {STROKE_OPTIONS.map(s => (
                <button key={s} onClick={() => setStrokeFilter(s)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${strokeFilter === s ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 mb-1">Difficulty</div>
            <div className="flex flex-wrap gap-1">
              {DIFFICULTY_OPTIONS.map(d => (
                <button key={d} onClick={() => setDiffFilter(d)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${diffFilter === d ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 mb-1">Source</div>
            <div className="flex flex-wrap gap-1">
              {VISIBILITY_OPTIONS.map(v => (
                <button key={v} onClick={() => setVisFilter(v)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${visFilter === v ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto flex items-end">
            <button
              onClick={() => setShowInactive(!showInactive)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${showInactive ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {showInactive ? 'Hide Archived' : 'Show Archived'}
            </button>
          </div>
        </div>
      </div>

      {/* Standards grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm text-slate-400">Loading standards…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <div className="text-sm font-semibold text-slate-700 mb-1">No standards found</div>
          <p className="text-xs text-slate-400 mb-4">Adjust filters or create your first club standard.</p>
          <Button size="sm" onClick={() => { setEditingStandard(null); setFormOpen(true); }}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Create Standard
          </Button>
        </div>
      ) : (
        <>
          {/* Club standards section */}
          {filtered.filter(s => !s._isDefault).length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <BookMarked className="w-4 h-4 text-primary" />
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Club Standards ({filtered.filter(s => !s._isDefault).length})
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.filter(s => !s._isDefault).map(s => (
                  <StandardCard
                    key={s.id}
                    standard={s}
                    isDefault={false}
                    onEdit={(std) => { setEditingStandard(std); setFormOpen(true); }}
                    onDuplicate={handleDuplicate}
                    onArchive={handleArchive}
                    onClick={setDetailStandard}
                    canEdit={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Default reference section */}
          {filtered.filter(s => s._isDefault).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Default Reference Standards ({filtered.filter(s => s._isDefault).length})
                </div>
                <span className="text-[10px] text-slate-400">— Duplicate to customise for your club</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.filter(s => s._isDefault).map((s, i) => (
                  <StandardCard
                    key={`default-${i}`}
                    standard={s}
                    isDefault={true}
                    onEdit={() => {}}
                    onDuplicate={handleDuplicate}
                    onArchive={() => {}}
                    onClick={setDetailStandard}
                    canEdit={true}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Form Modal */}
      {formOpen && (
        <StandardFormModal
          standard={editingStandard}
          onSave={editingStandard ? handleEdit : handleCreate}
          onClose={() => { setFormOpen(false); setEditingStandard(null); }}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Detail Modal */}
      {detailStandard && (
        <StandardDetailModal
          standard={detailStandard}
          onClose={() => setDetailStandard(null)}
          onEdit={(s) => { setDetailStandard(null); setEditingStandard(s); setFormOpen(true); }}
          onDuplicate={(s) => { handleDuplicate(s); setDetailStandard(null); }}
          isDefault={detailStandard._isDefault}
        />
      )}
    </div>
  );
}
