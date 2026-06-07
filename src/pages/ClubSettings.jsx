import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, hasSupabaseBrowserEnv } from '@/lib/supabaseClient';
import { useClubContext } from '@/lib/useClubContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import PageHeader from '@/components/shared/PageHeader';
import { Plus, ChevronDown, Settings, Waves, KeyRound, Pencil, Check, X, Map, RotateCcw, FlaskConical, ArrowRight, Activity } from 'lucide-react';
import ClubInviteManager from '@/components/club/ClubInviteManager';
import { Link, useNavigate } from 'react-router-dom';

// Section visible to all roles: read-only club profile
function ClubProfileCard({ club }) {
  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      <h3 className="text-sm font-semibold text-foreground mb-4">Club Profile</h3>
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
          style={{ backgroundColor: club.primary_color || '#0ea5e9', color: '#fff' }}
        >
          {club.initials || club.name?.charAt(0)}
        </div>
        <div>
          <div className="text-base font-semibold text-foreground">{club.name}</div>
          <div className="text-xs text-muted-foreground font-mono">/{club.slug}</div>
          {club.location && <div className="text-xs text-muted-foreground">{club.location}</div>}
          <div className="flex gap-2 mt-2 items-center">
            <div className="w-5 h-5 rounded border border-border" style={{ backgroundColor: club.primary_color || '#0ea5e9' }} title="Primary colour" />
            <div className="w-5 h-5 rounded border border-border" style={{ backgroundColor: club.accent_color || '#06b6d4' }} title="Accent colour" />
            <span className="text-[10px] text-muted-foreground">Club colours</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Section visible only to owner/admin: editable club profile
function ClubEditCard({ club }) {
  const queryClient = useQueryClient();
  const { refreshClubs } = useClubContext();

  const [name, setName] = useState(club.name || '');
  const [initials, setInitials] = useState(club.initials || '');
  const [location, setLocation] = useState(club.location || '');
  const [primaryColor, setPrimaryColor] = useState(club.primary_color || '#0ea5e9');
  const [accentColor, setAccentColor] = useState(club.accent_color || '#06b6d4');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    setName(club.name || '');
    setInitials(club.initials || '');
    setLocation(club.location || '');
    setPrimaryColor(club.primary_color || '#0ea5e9');
    setAccentColor(club.accent_color || '#06b6d4');
  }, [club.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setSaveError('');

    try {
      const { error } = await supabase
        .from('clubs')
        .update({ name: name.trim() })
        .eq('id', club.id);
      if (error) throw error;
      await refreshClubs();
      queryClient.invalidateQueries({ queryKey: ['club'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      setSaveError(error.message || 'Unable to save club changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-4">
        <Pencil className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Club Profile</h3>
        <span className="ml-auto text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Owner / Admin only</span>
      </div>

      {/* Live preview */}
      <div className="flex items-center gap-4 mb-5 p-3 rounded-lg bg-secondary/50">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0 transition-all"
          style={{ backgroundColor: primaryColor, color: '#fff' }}
        >
          {initials || name?.charAt(0) || '?'}
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{name || 'Club name'}</div>
          {location && <div className="text-xs text-muted-foreground">{location}</div>}
          <div className="flex gap-1.5 mt-1.5">
            <div className="w-4 h-4 rounded border border-border transition-all" style={{ backgroundColor: primaryColor }} />
            <div className="w-4 h-4 rounded border border-border transition-all" style={{ backgroundColor: accentColor }} />
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">Club Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sydney Aquatics Club" className="mt-1 h-8 text-sm" required />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Initials (logo)</Label>
            <Input value={initials} onChange={e => setInitials(e.target.value)} placeholder="e.g. SAC" maxLength={4} className="mt-1 h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Location</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Sydney, NSW" className="mt-1 h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Primary Colour</Label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent p-0.5"
              />
              <span className="text-xs font-mono text-muted-foreground">{primaryColor}</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Accent Colour</Label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={accentColor}
                onChange={e => setAccentColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent p-0.5"
              />
              <span className="text-xs font-mono text-muted-foreground">{accentColor}</span>
            </div>
          </div>
        </div>

        <Button type="submit" size="sm" className="h-8 text-xs" disabled={saving || !name.trim()}>
          {saving ? (
            'Saving…'
          ) : saved ? (
            <><Check className="w-3.5 h-3.5 mr-1 text-green-400" /> Saved</>
          ) : (
            'Save Changes'
          )}
        </Button>
        {saveError && <div className="text-xs text-destructive">{saveError}</div>}
      </form>
    </div>
  );
}

export default function ClubSettings() {
  const { club } = useClubContext();
  const navigate = useNavigate();
  const [squadName, setSquadName] = useState('');
  const queryClient = useQueryClient();

  const memberRole = club?._memberRole || 'coach';
  const canManage = ['owner', 'admin'].includes(memberRole);

  const { data: squads = [] } = useQuery({
    queryKey: ['squads', club?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('squads')
        .select('*')
        .eq('club_id', club.id)
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!club?.id && hasSupabaseBrowserEnv(),
  });

  const addSquad = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('squads').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['squads', club?.id] });
      setSquadName('');
    },
  });

  if (!club) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="p-10 rounded-xl bg-card border border-border text-center">
          <Waves className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <div className="text-sm font-medium text-foreground mb-1">No club workspace selected</div>
          <p className="text-xs text-muted-foreground mb-4">Create a club workspace first.</p>
          <Button size="sm" onClick={() => navigate('/club-onboarding')}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Create Club
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <PageHeader
        eyebrow="Club Workspace"
        title={club.name}
        subtitle={canManage ? 'Manage club settings, branding, squads and invites.' : 'Club information and your membership details.'}
      />

      <div className="space-y-6">
        {/* Editable profile — owner/admin only */}
        {canManage ? (
          <ClubEditCard club={club} />
        ) : (
          <ClubProfileCard club={club} />
        )}

        {/* Membership info for non-managers */}
        {!canManage && (
          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">Your Membership</h3>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Waves className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{club.name}</div>
                <div className="text-xs text-muted-foreground capitalize">Role: <span className="font-medium text-foreground">{memberRole}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Squads — viewable by all, editable by owner/admin */}
        <div className="p-5 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">Squads ({squads.length})</h3>
          {squads.length > 0 ? (
            <div className="space-y-2 mb-4">
              {squads.map(s => (
                <div key={s.id} className="flex items-center gap-2 p-2 rounded bg-secondary text-sm text-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  {s.name}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mb-4">No squads created yet.</p>
          )}
          {canManage && (
            <div className="flex gap-2">
              <Input
                value={squadName}
                onChange={e => setSquadName(e.target.value)}
                placeholder="New squad name"
                className="bg-secondary border-border text-sm"
                onKeyDown={e => e.key === 'Enter' && squadName.trim() && addSquad.mutate({ club_id: club.id, name: squadName.trim() })}
              />
              <Button
                size="sm"
                disabled={!squadName.trim() || addSquad.isPending}
                onClick={() => addSquad.mutate({ club_id: club.id, name: squadName.trim() })}
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
          )}
        </div>

        {/* Club Invites — owner/admin only */}
        {canManage && (
          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" /> Club Invites
            </h3>
            <ClubInviteManager club={club} memberRole={memberRole} />
          </div>
        )}

        {/* Admin & Platform Links — owner/admin only */}
        {canManage && (
          <div className="p-5 rounded-xl bg-card border border-border space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Settings className="w-4 h-4 text-muted-foreground" /> Admin & Platform
            </h3>

            <Link to="/roadmap">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors group">
                <Map className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-foreground">Product Roadmap</div>
                  <div className="text-[10px] text-muted-foreground">Feature status, what's live, what's coming</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
              </div>
            </Link>

            <Link to="/ai-reviews">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors group">
                <FlaskConical className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-foreground">AI Review Queue</div>
                  <div className="text-[10px] text-muted-foreground">Pending approvals, failed jobs, finalised reports</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
              </div>
            </Link>

            <Link to="/analyse">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors group">
                <RotateCcw className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-foreground">Reset Stuck Videos</div>
                  <div className="text-[10px] text-muted-foreground">Open Analyse Video → Admin Tools on any video card</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
              </div>
            </Link>

            <Link to="/ai-jobs">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors group">
                <Activity className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-foreground">AI Job Monitor</div>
                  <div className="text-[10px] text-muted-foreground">Debug pose analysis pipeline, track job status and errors</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
              </div>
            </Link>
          </div>
        )}

        {/* Developer Diagnostics — owner/admin only */}
        {canManage && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Settings className="w-4 h-4" /> Developer Diagnostics
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 p-4 rounded-xl bg-card border border-border">
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between"><span className="text-muted-foreground">Backend</span><span className="text-primary">Supabase Connected</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Active Club</span><span className="text-foreground">{club?.name || 'None'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Club ID</span><span className="text-foreground">{club?.id || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Data Source</span><span className="text-foreground">Supabase Tables</span></div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}
