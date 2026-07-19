import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, hasSupabaseBrowserEnv } from '@/lib/supabaseClient';
import entities from '@/lib/data/entities';
import { useClubContext } from '@/lib/useClubContext';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/shared/PageHeader';
import { CLUB_STYLE_PRESETS } from '@/lib/clubTheme';
import {
  Plus, Settings, Waves, KeyRound, Pencil, Check, Map, RotateCcw, FlaskConical,
  ArrowRight, Activity, Archive, Users, User, Target, ExternalLink, Lock, Palette
} from 'lucide-react';
import ClubInviteManager from '@/components/club/ClubInviteManager';
import { Link, useNavigate } from 'react-router-dom';

// ── Shared club save (existing `clubs` columns only, with migration-011 fallback) ──
function useClubSave() {
  const { refreshClubs } = useClubContext();
  const queryClient = useQueryClient();
  return async (clubId, payload, coreKey) => {
    const { error } = await supabase.from('clubs').update(payload).eq('id', clubId);
    if (error) {
      const isColumnError = error.message?.toLowerCase().includes('column');
      if (isColumnError && coreKey && payload[coreKey] !== undefined) {
        const { error: fallbackError } = await supabase.from('clubs').update({ [coreKey]: payload[coreKey] }).eq('id', clubId);
        if (fallbackError) throw fallbackError;
        await refreshClubs();
        queryClient.invalidateQueries({ queryKey: ['club'] });
        return 'Saved the core field. Run migration 011 to enable the remaining club fields.';
      }
      throw error;
    }
    await refreshClubs();
    queryClient.invalidateQueries({ queryKey: ['club'] });
    return '';
  };
}

function SaveButton({ saving, saved }) {
  return (
    <Button type="submit" size="sm" className="h-8 text-xs" disabled={saving}>
      {saving ? 'Saving…' : saved ? <><Check className="w-3.5 h-3.5 mr-1 text-green-500" /> Saved</> : 'Save Changes'}
    </Button>
  );
}

// ── 1. Club Profile (owner/admin editable) ────────────────────────────────────────
function ClubProfileEditor({ club }) {
  const saveClub = useClubSave();
  const [name, setName] = useState(club.name || '');
  const [location, setLocation] = useState(club.location || '');
  const [headCoach, setHeadCoach] = useState(club.head_coach_name || '');
  const [focus, setFocus] = useState(club.default_training_focus || '');
  const [notes, setNotes] = useState(club.notes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setName(club.name || '');
    setLocation(club.location || '');
    setHeadCoach(club.head_coach_name || '');
    setFocus(club.default_training_focus || '');
    setNotes(club.notes || '');
  }, [club.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setMsg('');
    try {
      const warn = await saveClub(club.id, {
        name: name.trim(),
        location: location.trim() || null,
        head_coach_name: headCoach.trim() || null,
        default_training_focus: focus.trim() || null,
        notes: notes.trim() || null,
      }, 'name');
      setMsg(warn);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      setMsg(error.message || 'Unable to save club profile.');
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
      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">Club Name *</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sydney Aquatics Club" className="mt-1 h-8 text-sm" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Location</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Sydney, NSW" className="mt-1 h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Head Coach</Label>
            <Input value={headCoach} onChange={e => setHeadCoach(e.target.value)} placeholder="e.g. Coach Owen" className="mt-1 h-8 text-sm" />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><Target className="w-3 h-3 text-primary" /> Coaching focus / philosophy</Label>
          <Textarea value={focus} onChange={e => setFocus(e.target.value)} placeholder="e.g. Technique-first development, long-term athlete health, race-skill consistency." className="mt-1 text-sm" rows={2} />
          <p className="text-[10px] text-muted-foreground mt-1">Shown as your club&apos;s default training focus.</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Internal notes (private to coaches)</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional private notes — not shown to swimmers or parents." className="mt-1 text-sm" rows={2} />
        </div>
        <SaveButton saving={saving} saved={saved} />
        {msg && <div className={`text-xs ${msg.startsWith('Saved') || msg.startsWith('Run') ? 'text-amber-600' : 'text-destructive'}`}>{msg}</div>}
      </form>
    </div>
  );
}

// ── 2. Branding (owner/admin editable) ─────────────────────────────────────────────
function ClubBrandingEditor({ club }) {
  const saveClub = useClubSave();
  const [initials, setInitials] = useState(club.initials || '');
  const [primaryColor, setPrimaryColor] = useState(club.primary_color || '#0ea5e9');
  const [accentColor, setAccentColor] = useState(club.accent_color || '#06b6d4');
  const [logoUrl, setLogoUrl] = useState(club.logo_url || '');
  const [reportIntro, setReportIntro] = useState(club.report_intro || '');
  const [reportSignOff, setReportSignOff] = useState(club.report_sign_off || '');
  const [reportOutro, setReportOutro] = useState(club.report_outro || '');
  const [reportContact, setReportContact] = useState(club.report_contact || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setInitials(club.initials || '');
    setPrimaryColor(club.primary_color || '#0ea5e9');
    setAccentColor(club.accent_color || '#06b6d4');
    setLogoUrl(club.logo_url || '');
    setReportIntro(club.report_intro || '');
    setReportSignOff(club.report_sign_off || '');
    setReportOutro(club.report_outro || '');
    setReportContact(club.report_contact || '');
  }, [club.id]);

  // Upload a club logo to the club-branding bucket (owner/admin write per storage RLS),
  // then save its public URL to clubs.logo_url.
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg('');
    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
      const path = `${club.id}/logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('club-branding').upload(path, file, { upsert: true, contentType: file.type || undefined });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('club-branding').getPublicUrl(path);
      const url = data?.publicUrl || '';
      setLogoUrl(url);
      await saveClub(club.id, { logo_url: url });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      setMsg(error.message || 'Could not upload the logo.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    setLogoUrl('');
    try { await saveClub(club.id, { logo_url: null }); } catch (error) { setMsg(error.message || 'Could not remove the logo.'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const warn = await saveClub(club.id, {
        initials: initials.trim().toUpperCase() || null,
        primary_color: primaryColor,
        accent_color: accentColor,
        report_intro: reportIntro.trim() || null,
        report_sign_off: reportSignOff.trim() || null,
        report_outro: reportOutro.trim() || null,
        report_contact: reportContact.trim() || null,
      });
      setMsg(warn);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      setMsg(error.message || 'Unable to save branding.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Branding</h3>
        <span className="ml-auto text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Owner / Admin only</span>
      </div>

      {/* Live club-mark preview — the logo is the club mark; colour initial is the
          automatic fallback only when no logo is uploaded. */}
      <div className="flex items-center gap-4 mb-5 p-3 rounded-lg bg-secondary/50">
        {logoUrl ? (
          <img src={logoUrl} alt="Club logo" className="w-12 h-12 rounded-xl object-contain border border-border bg-white flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0 transition-all" style={{ backgroundColor: primaryColor, color: '#fff' }}>
            {club.name?.charAt(0) || '?'}
          </div>
        )}
        <div>
          <div className="text-sm font-semibold text-foreground">{club.name}</div>
          <div className="flex gap-1.5 mt-1.5">
            <div className="w-4 h-4 rounded border border-border transition-all" style={{ backgroundColor: primaryColor }} />
            <div className="w-4 h-4 rounded border border-border transition-all" style={{ backgroundColor: accentColor }} />
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        {/* Quick club styles — applied to the whole workspace for every member after Save. */}
        <div>
          <Label className="text-xs text-muted-foreground">Workspace style</Label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {CLUB_STYLE_PRESETS.map((preset) => {
              const active = primaryColor?.toLowerCase() === preset.primary.toLowerCase() && accentColor?.toLowerCase() === preset.accent.toLowerCase();
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => { setPrimaryColor(preset.primary); setAccentColor(preset.accent); }}
                  title={preset.name}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/40'}`}
                >
                  <span className="flex -space-x-1">
                    <span className="h-3 w-3 rounded-full border border-white/60" style={{ backgroundColor: preset.primary }} />
                    <span className="h-3 w-3 rounded-full border border-white/60" style={{ backgroundColor: preset.accent }} />
                  </span>
                  {preset.name}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">Pick a style or set custom colours below. Saved styles recolour the whole club workspace for every member.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Primary Colour</Label>
            <div className="mt-1 flex items-center gap-2">
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent p-0.5" />
              <span className="text-[10px] font-mono text-muted-foreground">{primaryColor}</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Accent Colour</Label>
            <div className="mt-1 flex items-center gap-2">
              <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent p-0.5" />
              <span className="text-[10px] font-mono text-muted-foreground">{accentColor}</span>
            </div>
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Club logo (shown on reports)</Label>
          <div className="mt-1 flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Club logo" className="h-12 w-12 rounded-lg object-contain border border-border bg-white" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-border text-[9px] text-muted-foreground">No logo</div>
            )}
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <span className="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-xs font-medium hover:bg-secondary">{uploading ? 'Uploading…' : 'Upload logo'}</span>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
              </label>
              {logoUrl && <button type="button" onClick={handleRemoveLogo} className="text-xs text-destructive hover:underline">Remove</button>}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG, WEBP or SVG. Shown beside “Powered by Swim Sight 3D”.</p>
        </div>

        <div className="space-y-3 border-t border-border pt-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Report defaults</div>
          <div>
            <Label className="text-xs text-muted-foreground">Report intro (optional)</Label>
            <Textarea value={reportIntro} onChange={e => setReportIntro(e.target.value)} placeholder="A short welcome line at the top of every report." className="mt-1 text-sm" rows={2} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Report sign-off (optional)</Label>
            <Input value={reportSignOff} onChange={e => setReportSignOff(e.target.value)} placeholder="e.g. Keep up the great work — Coach Owen" className="mt-1 h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Report closing note (optional)</Label>
            <Textarea value={reportOutro} onChange={e => setReportOutro(e.target.value)} placeholder="A closing message shown near the report footer." className="mt-1 text-sm" rows={2} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Report contact (optional)</Label>
            <Input value={reportContact} onChange={e => setReportContact(e.target.value)} placeholder="e.g. coach@club.com · club.com" className="mt-1 h-8 text-sm" />
          </div>
        </div>

        <SaveButton saving={saving} saved={saved} />
        {msg && <div className={`text-xs ${msg.startsWith('Saved') || msg.startsWith('Run') ? 'text-amber-600' : 'text-destructive'}`}>{msg}</div>}
      </form>
    </div>
  );
}

// ── Read-only profile for non-managers ─────────────────────────────────────────────
function ClubProfileReadOnly({ club, memberRole }) {
  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      <h3 className="text-sm font-semibold text-foreground mb-4">Club Profile</h3>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0" style={{ backgroundColor: club.primary_color || '#0ea5e9', color: '#fff' }}>
          {club.initials || club.name?.charAt(0)}
        </div>
        <div>
          <div className="text-base font-semibold text-foreground">{club.name}</div>
          <div className="text-xs text-muted-foreground font-mono">/{club.slug}</div>
          {club.location && <div className="text-xs text-muted-foreground">{club.location}</div>}
        </div>
      </div>
      {(club.head_coach_name || club.default_training_focus) && (
        <div className="mt-4 space-y-2 border-t border-border pt-3 text-xs">
          {club.head_coach_name && <div><span className="text-muted-foreground">Head coach: </span><span className="text-foreground font-medium">{club.head_coach_name}</span></div>}
          {club.default_training_focus && <div><span className="text-muted-foreground">Coaching focus: </span><span className="text-foreground">{club.default_training_focus}</span></div>}
        </div>
      )}
      <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
        Your role: <span className="font-medium text-foreground capitalize">{memberRole}</span>
      </div>
    </div>
  );
}

// ── 3. Squads (existing create/archive + richer read display) ──────────────────────
function SquadsCard({ club, squads, canManage }) {
  const queryClient = useQueryClient();
  const [squadForm, setSquadForm] = useState({ name: '', level: '', training_focus: '', lead_coach_name: '' });

  const addSquad = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('squads').insert(data);
      if (error) {
        if (error.message?.toLowerCase().includes('column')) {
          const { error: fallbackError } = await supabase.from('squads').insert({ club_id: data.club_id, name: data.name });
          if (fallbackError) throw fallbackError;
          return;
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['squads', club?.id] });
      setSquadForm({ name: '', level: '', training_focus: '', lead_coach_name: '' });
    },
  });

  const archiveSquad = useMutation({
    mutationFn: async (squadId) => {
      const { error } = await supabase
        .from('squads')
        .update({ is_active: false, archived_at: new Date().toISOString() })
        .eq('id', squadId)
        .eq('club_id', club.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['squads', club?.id] }),
  });

  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      <h3 className="text-sm font-semibold text-foreground mb-3">Squads ({squads.length})</h3>
      {squads.length > 0 ? (
        <div className="space-y-2 mb-4">
          {squads.map(s => (
            <div key={s.id} className={`flex items-start gap-2 p-3 rounded bg-secondary text-sm text-foreground ${s.is_active === false ? 'opacity-60' : ''}`}>
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{s.name}</div>
                {s.description && <div className="mt-0.5 text-[11px] text-muted-foreground">{s.description}</div>}
                <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                  {s.level && <span className="px-1.5 py-0.5 rounded bg-background border border-border">{s.level}</span>}
                  {s.training_focus && <span className="flex items-center gap-1"><Target className="w-2.5 h-2.5" />{s.training_focus}</span>}
                  {s.lead_coach_name && <span>Lead: {s.lead_coach_name}</span>}
                  {Array.isArray(s.strokes_focus) && s.strokes_focus.length > 0 && <span>Strokes: {s.strokes_focus.join(', ')}</span>}
                  {s.is_active === false && <span className="text-amber-600">Archived</span>}
                </div>
              </div>
              {canManage && s.is_active !== false && (
                <button type="button" onClick={() => archiveSquad.mutate(s.id)} className="text-[10px] text-muted-foreground hover:text-amber-600 flex items-center gap-1 flex-shrink-0">
                  <Archive className="w-3 h-3" /> Archive
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mb-4">No squads created yet.</p>
      )}
      {canManage && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input value={squadForm.name} onChange={e => setSquadForm(prev => ({ ...prev, name: e.target.value }))} placeholder="New squad name" className="bg-secondary border-border text-sm" />
          <Input value={squadForm.level} onChange={e => setSquadForm(prev => ({ ...prev, level: e.target.value }))} placeholder="Level e.g. Junior / Senior" className="bg-secondary border-border text-sm" />
          <Input value={squadForm.training_focus} onChange={e => setSquadForm(prev => ({ ...prev, training_focus: e.target.value }))} placeholder="Training focus" className="bg-secondary border-border text-sm" />
          <div className="flex gap-2">
            <Input value={squadForm.lead_coach_name} onChange={e => setSquadForm(prev => ({ ...prev, lead_coach_name: e.target.value }))} placeholder="Lead coach" className="bg-secondary border-border text-sm" />
            <Button size="sm" disabled={!squadForm.name.trim() || addSquad.isPending} onClick={() => addSquad.mutate({
              club_id: club.id,
              name: squadForm.name.trim(),
              level: squadForm.level.trim() || null,
              training_focus: squadForm.training_focus.trim() || null,
              lead_coach_name: squadForm.lead_coach_name.trim() || null,
            })}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 4. Squad Membership + Unassigned Swimmers (read-only, existing data) ────────────
function SquadMembershipCard({ squads, swimmers, navigate }) {
  const byId = {};
  squads.forEach(sq => { byId[sq.id] = []; });
  const unassigned = [];
  swimmers.forEach(sw => {
    if (sw.squad_id && byId[sw.squad_id]) byId[sw.squad_id].push(sw);
    else unassigned.push(sw);
  });
  const activeSquads = squads.filter(sq => sq.is_active !== false);

  const swimmerLabel = (sw) => sw.name || [sw.first_name, sw.last_name].filter(Boolean).join(' ') || 'Unnamed swimmer';

  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Squad Membership</h3>
        <Link to="/swimmers" className="ml-auto text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5">
          Manage in Swimmers <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <p className="text-[10px] text-muted-foreground mb-3">Read-only overview. Assign or edit swimmers on the Swimmers page.</p>

      {activeSquads.length === 0 && unassigned.length === 0 ? (
        <p className="text-xs text-muted-foreground">No swimmers or squads yet.</p>
      ) : (
        <div className="space-y-3">
          {activeSquads.map(sq => (
            <div key={sq.id} className="rounded-lg border border-border bg-secondary/30 p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-foreground">{sq.name}</div>
                <span className="text-[10px] text-muted-foreground">{byId[sq.id]?.length || 0} swimmer{(byId[sq.id]?.length || 0) === 1 ? '' : 's'}</span>
              </div>
              {(byId[sq.id]?.length || 0) > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {byId[sq.id].map(sw => (
                    <span key={sw.id} className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] text-foreground">{swimmerLabel(sw)}</span>
                  ))}
                </div>
              ) : (
                <div className="mt-1 text-[10px] text-muted-foreground">No swimmers assigned.</div>
              )}
            </div>
          ))}

          <div className="rounded-lg border border-dashed border-border p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-foreground">Unassigned</div>
              <span className="text-[10px] text-muted-foreground">{unassigned.length} swimmer{unassigned.length === 1 ? '' : 's'}</span>
            </div>
            {unassigned.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {unassigned.map(sw => (
                  <button key={sw.id} onClick={() => navigate('/swimmers')} className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] text-foreground hover:border-primary/40">
                    {swimmerLabel(sw)}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-1 text-[10px] text-muted-foreground">Every swimmer is assigned to a squad.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 6. User Profile (link to account settings) ─────────────────────────────────────
function UserProfileCard({ user, memberRole }) {
  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-3">
        <User className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Your Profile</h3>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{user?.full_name || 'Your account'}</div>
          <div className="text-[11px] text-muted-foreground truncate">{user?.email}{memberRole ? ` · ${memberRole}` : ''}</div>
        </div>
        <Link to="/settings">
          <Button size="sm" variant="outline" className="h-8 text-xs flex-shrink-0">
            <ExternalLink className="w-3 h-3 mr-1" /> Account settings
          </Button>
        </Link>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">Your display name is managed in account settings.</p>
    </div>
  );
}

// ── 7. Later / Not yet available (static, no fake controls) ────────────────────────
function ComingLaterCard() {
  const items = [
    'Custom club logo image upload',
    'Managing member roles (promote / change coach access)',
    'Removing club members',
    'Report preferences (defaults, disclaimers, branding on reports)',
    'A dedicated club motto / quote field',
  ];
  return (
    <div className="p-5 rounded-xl bg-card border border-dashed border-border">
      <div className="flex items-center gap-2 mb-3">
        <Lock className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Later / Not yet available</h3>
      </div>
      <ul className="space-y-1.5">
        {items.map(item => (
          <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" /> {item}
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-muted-foreground mt-3">These need new storage, roles, or preferences work and are intentionally not shown yet.</p>
    </div>
  );
}

// ── Admin & Platform links (owner/admin) — preserved existing shortcuts ─────────────
function AdminPlatformLinks() {
  const links = [
    { to: '/roadmap', icon: Map, title: 'Product Roadmap', desc: "Feature status, what's live, what's coming" },
    { to: '/ai-reviews', icon: FlaskConical, title: 'AI Review Queue', desc: 'Pending approvals, failed jobs, finalised reports' },
    { to: '/analyse', icon: RotateCcw, title: 'Reset Stuck Videos', desc: 'Open Analyse Video to delete and re-upload a stuck video' },
    { to: '/ai-jobs', icon: Activity, title: 'AI Job Monitor', desc: 'Debug pose analysis pipeline, track job status and errors' },
  ];
  return (
    <div className="p-5 rounded-xl bg-card border border-border space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Settings className="w-4 h-4 text-muted-foreground" /> Admin & Platform
      </h3>
      {links.map(l => {
        const Icon = l.icon;
        return (
          <Link key={l.title} to={l.to}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors group">
              <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
              <div className="flex-1">
                <div className="text-xs font-medium text-foreground">{l.title}</div>
                <div className="text-[10px] text-muted-foreground">{l.desc}</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function ClubSettings() {
  const { club, memberRole } = useClubContext();
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const { data: swimmers = [] } = useQuery({
    queryKey: ['swimmers', club?.id],
    queryFn: () => entities.Swimmer.filter({ club_id: club.id }),
    enabled: !!club?.id,
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
        subtitle={canManage ? 'Manage club profile, branding, squads, members and invites.' : 'Club information and your membership details.'}
      />

      <div className="space-y-6">
        {/* 1. Club Profile */}
        {canManage ? <ClubProfileEditor club={club} /> : <ClubProfileReadOnly club={club} memberRole={memberRole} />}

        {/* 2. Branding — editable for managers */}
        {canManage && <ClubBrandingEditor club={club} />}

        {/* 3. Squads */}
        <SquadsCard club={club} squads={squads} canManage={canManage} />

        {/* 4. Squad Membership + Unassigned Swimmers (read-only) */}
        <SquadMembershipCard squads={squads} swimmers={swimmers} navigate={navigate} />

        {/* 5. Members & Invites */}
        {canManage && (
          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" /> Members & Invites
            </h3>
            <ClubInviteManager club={club} memberRole={memberRole} />
            <p className="text-[10px] text-muted-foreground mt-3">Changing existing member roles and removing members is coming later.</p>
          </div>
        )}

        {/* 6. User Profile */}
        <UserProfileCard user={user} memberRole={memberRole} />

        {/* 7. Later / Not yet available */}
        <ComingLaterCard />

        {/* Preserved: Admin & Platform links (owner/admin) */}
        {canManage && <AdminPlatformLinks />}
      </div>
    </div>
  );
}
