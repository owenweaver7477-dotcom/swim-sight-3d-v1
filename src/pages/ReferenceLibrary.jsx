import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import entities from '@/lib/data/entities';
import { REFERENCE_PROFILES_LIST } from '@/lib/swimState';
import { DEFAULT_STANDARDS } from '@/components/standards/defaultStandards';
import PageHeader from '@/components/shared/PageHeader';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, Target, AlertTriangle } from 'lucide-react';

const STROKE_GROUPS = ['All', 'Freestyle', 'Breaststroke', 'Butterfly', 'Backstroke', 'Individual Medley', 'Starts', 'Turns', 'Underwater', 'Fundamentals', 'Transition'];

function referenceDescription(profile) {
  const related = DEFAULT_STANDARDS.find(standard =>
    profile.stroke_group === 'Fundamentals'
      ? standard.stroke === 'General'
      : standard.stroke === profile.stroke_group || standard.title.toLowerCase().includes(profile.stroke_group.toLowerCase())
  );
  return related?.technical_goal || 'Use this profile as a coach reference point for reviewing stroke phase, body line, timing, and correction cues.';
}

function ProfileCard({ profile, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(profile)}
      className="text-left p-4 rounded-xl bg-white border border-slate-200 hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">{profile.stroke_group}</span>
        {profile.event_distance && profile.event_distance !== 'N/A' && (
          <span className="text-[10px] text-slate-500">{profile.event_distance}</span>
        )}
      </div>
      <div className="text-sm font-bold text-slate-900">{profile.name}</div>
      <p className="text-xs text-slate-500 leading-relaxed mt-2 line-clamp-3">{profile.description || referenceDescription(profile)}</p>
    </button>
  );
}

export default function ReferenceLibrary() {
  const [strokeFilter, setStrokeFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);

  const { data: dbProfiles = [] } = useQuery({
    queryKey: ['reference-profiles-v1'],
    queryFn: async () => {
      try {
        return await entities.ReferenceProfile.list('name', 200);
      } catch (error) {
        console.warn('[reference-library] Supabase reference profiles unavailable; using bundled V1 references.', error?.message || error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: referenceAssets = [] } = useQuery({
    queryKey: ['reference-assets-v1', selectedProfile?.id],
    queryFn: async () => {
      if (!selectedProfile?.id) return [];
      try {
        return await entities.ReferenceAsset.filter({ profile_id: selectedProfile.id }, 'title', 100);
      } catch {
        return [];
      }
    },
    enabled: !!selectedProfile?.id,
    staleTime: 5 * 60 * 1000,
  });

  const profiles = useMemo(() => {
    const byName = new Map();
    REFERENCE_PROFILES_LIST.forEach(profile => byName.set(profile.name, {
      ...profile,
      is_default: true,
      description: referenceDescription(profile),
    }));
    dbProfiles.forEach(profile => byName.set(profile.name, { ...byName.get(profile.name), ...profile }));
    return Array.from(byName.values());
  }, [dbProfiles]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return profiles.filter(profile => {
      const strokeOk = strokeFilter === 'All' || profile.stroke_group === strokeFilter;
      const searchOk = !q || [profile.name, profile.stroke_group, profile.event_distance, profile.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
      return strokeOk && searchOk;
    });
  }, [profiles, strokeFilter, search]);

  const relatedStandards = selectedProfile
    ? DEFAULT_STANDARDS.filter(standard => (
      selectedProfile.stroke_group === 'Fundamentals'
        ? standard.stroke === 'General'
        : standard.stroke === selectedProfile.stroke_group || standard.title.toLowerCase().includes(selectedProfile.stroke_group.toLowerCase())
    )).slice(0, 4)
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <PageHeader
        eyebrow="Coach Tools"
        title="Reference Library"
        subtitle="Swimming-only reference profiles and trusted coach cues. V1 uses text references and standards; model and media assets remain future work."
      />

      <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-800 leading-relaxed">
          Reference material is coach guidance only. No official athlete, federation, or third-party video assets are included unless your club adds legally permitted material later.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search references..."
                className="pl-9 bg-white"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STROKE_GROUPS.map(group => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setStrokeFilter(group)}
                  className={`text-[10px] px-2.5 py-1 rounded-full border font-medium ${
                    strokeFilter === group ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filtered.map(profile => (
              <ProfileCard key={profile.name} profile={profile} onSelect={setSelectedProfile} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-8">
          {selectedProfile ? (
            <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">{selectedProfile.stroke_group}</div>
                <h2 className="text-lg font-bold text-slate-900">{selectedProfile.name}</h2>
                {selectedProfile.event_distance && selectedProfile.event_distance !== 'N/A' && (
                  <div className="text-xs text-slate-500 mt-1">{selectedProfile.event_distance}</div>
                )}
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-primary" /> Reference Purpose
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {selectedProfile.description || referenceDescription(selectedProfile)}
                  </p>
                </div>

                {relatedStandards.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-primary" /> Related Technical Standards
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {relatedStandards.map(standard => (
                        <div key={standard.title} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="text-xs font-semibold text-slate-900">{standard.title}</div>
                          <div className="text-[10px] text-primary mt-0.5">{standard.stroke} · {standard.phase}</div>
                          <p className="text-[11px] text-slate-500 leading-relaxed mt-2 line-clamp-3">{standard.technical_goal}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Club Reference Assets</div>
                  {referenceAssets.length > 0 ? (
                    <div className="space-y-2">
                      {referenceAssets.map(asset => (
                        <div key={asset.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="text-xs font-semibold text-slate-900">{asset.title}</div>
                          {asset.description && <p className="text-[11px] text-slate-500 mt-1">{asset.description}</p>}
                          {asset.coaching_notes && <p className="text-[11px] text-slate-600 mt-1">{asset.coaching_notes}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
                      No club reference assets added yet. Media uploads and 3D model references are intentionally deferred until after V1 coach testing.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-96 rounded-2xl bg-white border border-dashed border-slate-200 flex items-center justify-center text-center p-10">
              <div>
                <BookOpen className="w-9 h-9 text-slate-300 mx-auto mb-3" />
                <div className="text-sm font-semibold text-slate-800">Select a reference profile</div>
                <p className="text-xs text-slate-500 mt-1">Choose a swimming reference to view purpose, standards, and coach cues.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
