import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { REFERENCE_PROFILES_LIST } from '@/lib/swimState';
import { useClubContext } from '@/lib/useClubContext';
import { canUploadClubReferenceAsset, canUploadOfficialModelAsset } from '@/lib/permissions';
import PageHeader from '@/components/shared/PageHeader';
import AssetUploadForm from '@/components/reference/AssetUploadForm';
import ModelAssetStatusPanel from '@/components/reference/ModelAssetStatusPanel';
import ModelViewer3D from '@/components/viewer/ModelViewer3D';
import Technical3DViewer from '@/components/viewer/Technical3DViewer';
import { Button } from '@/components/ui/button';
import { BookOpen, ChevronRight, Image, Video, Box, Plus, ArrowLeft, Info, AlertTriangle } from 'lucide-react';

const STROKE_GROUPS = ['All', 'Freestyle', 'Breaststroke', 'Butterfly', 'Backstroke', 'Individual Medley', 'Starts', 'Turns', 'Underwater', 'Fundamentals', 'Transition'];

const POSE_TYPE_LABELS = {
  'Base':            { label: 'Base Rig Reference', cls: 'bg-secondary text-muted-foreground border border-border' },
  'Fault Pose':      { label: 'Fault Pose',          cls: 'bg-orange-100 text-orange-700 border border-orange-200' },
  'Correction Pose': { label: 'Correction Pose',     cls: 'bg-green-100 text-green-700 border border-green-200' },
  'Animation':       { label: 'Animated Sequence',   cls: 'bg-primary/10 text-primary border border-primary/20' },
};

function ThreeDAssetCard({ asset, onView, isSelected }) {
  const poseLabel = POSE_TYPE_LABELS[asset.model_pose_type] || POSE_TYPE_LABELS['Base'];
  const hasUrl = !!asset.model_url;

  return (
    <div
      className={`p-4 rounded-xl border bg-card cursor-pointer transition-all hover:shadow-sm ${
        isSelected ? 'border-primary ring-1 ring-primary/20' : 'border-border hover:border-primary/40'
      }`}
      onClick={() => hasUrl && onView(asset)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-foreground leading-tight">{asset.asset_name}</div>
        </div>
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${poseLabel.cls}`}>
          {poseLabel.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground mb-3">
        {asset.stroke_type && <span className="font-medium text-foreground">{asset.stroke_type}</span>}
        {asset.stroke_phase && <span>Phase: {asset.stroke_phase}</span>}
        {asset.technical_category && <span>{asset.technical_category}</span>}
      </div>

      {asset.coaching_cue && (
        <p className="text-[10px] text-muted-foreground leading-relaxed mb-3 line-clamp-2">
          {asset.coaching_cue}
        </p>
      )}

      {hasUrl ? (
        <Button
          size="sm"
          variant={isSelected ? 'default' : 'outline'}
          className="w-full h-7 text-[10px]"
          onClick={(e) => { e.stopPropagation(); onView(asset); }}
        >
          <Box className="w-3 h-3 mr-1.5" />
          {isSelected ? 'Viewing' : 'Open 3D Reference'}
        </Button>
      ) : (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <AlertTriangle className="w-3 h-3" />
          No model URL — unavailable
        </div>
      )}
    </div>
  );
}

function AssetIcon({ type }) {
  if (type === '3d_model') return <Box className="w-3.5 h-3.5 text-primary" />;
  if (type === 'video') return <Video className="w-3.5 h-3.5 text-primary" />;
  return <Image className="w-3.5 h-3.5 text-primary" />;
}

function ProfileCard({ profile, onSelect }) {
  return (
    <div
      className="p-4 rounded-xl bg-card border border-border cursor-pointer hover:border-primary/50 transition-colors group"
      onClick={() => onSelect(profile)}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">{profile.stroke_group}</span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="text-sm font-medium text-foreground leading-tight">{profile.name}</div>
      {profile.event_distance && profile.event_distance !== 'N/A' && (
        <div className="text-xs text-muted-foreground mt-0.5">{profile.event_distance}</div>
      )}
    </div>
  );
}

// TODO: Future: Technical 3D Reference Viewer will use external .glb model_url files.
// FBX will not be used directly in browser. Animated rigged models will be added later.
// The ThreeDAssets entity (asset_name, stroke_type, technical_category, flaw_matched,
// model_url, coaching_cue, is_active, club_id) will back the viewer when ready.

export default function ReferenceLibrary() {
  const { club } = useClubContext();
  const role = club?._memberRole;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('3d'); // '3d' | 'profiles'
  const [strokeFilter, setStrokeFilter] = useState('All');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selected3DAsset, setSelected3DAsset] = useState(null);
  const [threeDStrokeFilter, setThreeDStrokeFilter] = useState('All');

  const canUploadClub = canUploadClubReferenceAsset(role);
  const canUpload3D = canUploadOfficialModelAsset(role);

  // Load or create reference profiles from entity
  const { data: dbProfiles = [] } = useQuery({
    queryKey: ['reference-profiles'],
    queryFn: () => base44.entities.ReferenceProfile.list('-created_date', 200),
  });

  // Merge static list with DB profiles (DB profiles take precedence by name)
  const dbProfileNames = new Set(dbProfiles.map(p => p.name));
  const staticProfiles = REFERENCE_PROFILES_LIST.filter(p => !dbProfileNames.has(p.name));
  const allProfiles = [...dbProfiles, ...staticProfiles];

  const filtered = strokeFilter === 'All'
    ? allProfiles
    : allProfiles.filter(p => p.stroke_group === strokeFilter);

  // Seed missing profiles to DB on first load
  const seedProfiles = useMutation({
    mutationFn: async () => {
      const missing = REFERENCE_PROFILES_LIST.filter(p => !dbProfileNames.has(p.name));
      for (const p of missing.slice(0, 5)) { // Seed 5 at a time to avoid rate limits
        await base44.entities.ReferenceProfile.create(p);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reference-profiles'] }),
  });

  // Fetch 3D assets
  const { data: threeDAssets = [], isLoading: loadingThreeD } = useQuery({
    queryKey: ['3d-assets-library'],
    queryFn: () => base44.entities.ThreeDAssets.filter({ is_active: true }),
  });

  // Determine if all active assets share the same model URL (base rig only situation)
  const uniqueUrls = new Set(threeDAssets.filter(a => a.model_url).map(a => a.model_url));
  const allSameBaseRig = threeDAssets.length > 1 && uniqueUrls.size === 1;

  const threeDStrokes = ['All', ...Array.from(new Set(threeDAssets.map(a => a.stroke_type).filter(Boolean)))];
  const filteredThreeD = threeDStrokeFilter === 'All'
    ? threeDAssets
    : threeDAssets.filter(a => a.stroke_type === threeDStrokeFilter);

  // Fetch assets for selected profile
  const { data: assets = [] } = useQuery({
    queryKey: ['reference-assets', selectedProfile?.id],
    queryFn: () => base44.entities.ReferenceAsset.filter({ reference_profile_id: selectedProfile.id }),
    enabled: !!selectedProfile?.id,
  });

  const profileId = selectedProfile?.id;

  if (selectedProfile) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedProfile(null); setShowUploadForm(false); setSelectedAsset(null); }}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
          </Button>
          <div>
            <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-primary">{selectedProfile.stroke_group}</div>
            <h1 className="text-lg font-bold text-foreground">{selectedProfile.name}</h1>
          </div>
          {(canUploadClub || canUpload3D) && (
            <Button size="sm" variant="outline" className="ml-auto" onClick={() => setShowUploadForm(!showUploadForm)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Asset
            </Button>
          )}
        </div>

        {showUploadForm && profileId && (
          <div className="mb-6">
            <AssetUploadForm
              profileId={profileId}
              ownerScope={canUpload3D ? 'platform' : 'club'}
              clubId={club?.id}
              canUpload3D={canUpload3D}
              onSuccess={() => { setShowUploadForm(false); queryClient.invalidateQueries({ queryKey: ['reference-assets', profileId] }); }}
            />
          </div>
        )}

        {!profileId && (canUploadClub || canUpload3D) && (
          <div className="mb-4 p-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground">
            This profile is from the built-in library and hasn't been saved to the database yet.{' '}
            <Button size="sm" variant="link" className="text-xs p-0 h-auto" onClick={() => seedProfiles.mutate()} disabled={seedProfiles.isPending}>
              {seedProfiles.isPending ? 'Saving...' : 'Save to DB to enable uploads'}
            </Button>
          </div>
        )}

        {/* 3D Viewer for selected asset */}
        {selectedAsset?.asset_type === '3d_model' && (
          <div className="mb-6">
            <ModelViewer3D assetUrl={selectedAsset.asset_url} fileName={selectedAsset.camera_angle || '3D Model'} />
          </div>
        )}

        {/* Assets grid */}
        {assets.length === 0 ? (
          <div className="p-10 text-center rounded-xl bg-card border border-border">
            <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <div className="text-sm font-medium text-foreground mb-1">No assets yet</div>
            <div className="text-xs text-muted-foreground">
              {canUploadClub || canUpload3D
                ? 'Upload images, videos or 3D models for this reference profile.'
                : 'No reference assets have been added for this profile yet.'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {assets.map(asset => (
              <div
                key={asset.id}
                className={`rounded-xl border bg-card overflow-hidden cursor-pointer transition-all ${
                  selectedAsset?.id === asset.id ? 'border-primary' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedAsset(selectedAsset?.id === asset.id ? null : asset)}
              >
                {asset.asset_type === 'image' && (
                  <img src={asset.asset_url} alt={asset.phase || 'Reference'} className="w-full h-40 object-cover" />
                )}
                {asset.asset_type === 'video' && (
                  <video src={asset.asset_url} className="w-full h-40 object-cover" controls />
                )}
                {asset.asset_type === '3d_model' && (
                  <div className="w-full h-40 flex items-center justify-center bg-[#1a1f2e]">
                    <Box className="w-10 h-10 text-primary/50" />
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AssetIcon type={asset.asset_type} />
                    <span className="text-xs font-medium text-foreground capitalize">{asset.asset_type.replace('_', ' ')}</span>
                    {asset.owner_scope === 'platform' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary ml-auto">Platform</span>
                    )}
                    {asset.owner_scope === 'club' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground ml-auto">Club</span>
                    )}
                  </div>
                  {asset.camera_angle && <div className="text-[10px] text-muted-foreground">Angle: {asset.camera_angle}</div>}
                  {asset.phase && <div className="text-[10px] text-muted-foreground">Phase: {asset.phase}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <PageHeader
        eyebrow="Swim Sight 3D"
        title="Reference Library"
        subtitle="3D technical reference models and elite performance profiles for every stroke."
      />

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 p-1 bg-secondary rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('3d')}
          className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === '3d' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Box className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
          3D Models
        </button>
        <button
          onClick={() => setActiveTab('profiles')}
          className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'profiles' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
          Reference Profiles
        </button>
      </div>

      {/* ── 3D MODELS TAB ── */}
      {activeTab === '3d' && (
        <div>
          {/* Model asset status summary */}
          <ModelAssetStatusPanel assets={threeDAssets} />

          {/* Stroke filter */}
          <div className="flex gap-1.5 flex-wrap mb-5">
            {threeDStrokes.map(s => (
              <button
                key={s}
                onClick={() => setThreeDStrokeFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  threeDStrokeFilter === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Viewer + grid layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
              {loadingThreeD ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Loading 3D assets…</div>
              ) : filteredThreeD.length === 0 ? (
                <div className="p-10 rounded-xl bg-card border border-border text-center">
                  <Box className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <div className="text-sm font-medium text-foreground">No 3D models for this stroke</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredThreeD.map(asset => (
                    <ThreeDAssetCard
                      key={asset.id}
                      asset={asset}
                      isSelected={selected3DAsset?.id === asset.id}
                      onView={setSelected3DAsset}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Sticky viewer on desktop */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="lg:sticky lg:top-6">
                <Technical3DViewer
                  modelUrl={selected3DAsset?.model_url}
                  assetName={selected3DAsset?.asset_name}
                  coachingCue={selected3DAsset?.coaching_cue}
                  strokeType={selected3DAsset?.stroke_type}
                  strokePhase={selected3DAsset?.stroke_phase}
                  technicalCategory={selected3DAsset?.technical_category}
                  modelPoseType={selected3DAsset?.model_pose_type}
                  correctionFocus={selected3DAsset?.correction_focus}
                  onReset={() => setSelected3DAsset(null)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REFERENCE PROFILES TAB ── */}
      {activeTab === 'profiles' && (
        <div>
          <div className="flex gap-2 flex-wrap mb-6">
            {STROKE_GROUPS.map(g => (
              <button
                key={g}
                onClick={() => setStrokeFilter(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  strokeFilter === g
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map((profile, i) => (
              <ProfileCard key={profile.id || profile.name + i} profile={profile} onSelect={setSelectedProfile} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}