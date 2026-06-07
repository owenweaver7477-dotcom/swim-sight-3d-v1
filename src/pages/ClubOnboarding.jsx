import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { setActiveClub, setActiveRole } from '@/lib/swimState';
import { resetClubContext } from '@/lib/useClubContext';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Waves, Plus, KeyRound, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ClubOnboarding() {
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const navigate = useNavigate();
  const { user } = useAuth();

  // Pre-fill invite code from URL ?code= param
  const urlParams = new URLSearchParams(window.location.search);
  const urlCode = urlParams.get('code') || '';

  // ── Create Club ────────────────────────────────────────────────────────────
  const [form, setForm] = useState({ name: '', location: '' });

  const handleNameChange = (name) => {
    setForm(prev => ({ ...prev, name }));
  };

  const createClub = useMutation({
    mutationFn: async () => {
      const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const initials = form.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
      const club = await base44.entities.Club.create({
        name: form.name,
        slug,
        initials,
        location: form.location || undefined,
        primary_color: '#0077B6',
        accent_color: '#00A6C8',
      });
      if (user?.id) {
        await base44.entities.ClubMember.create({
          club_id: club.id,
          user_id: user.id,
          role: 'owner',
        });
      }
      return { ...club, _memberRole: 'owner' };
    },
    onSuccess: (clubWithRole) => {
      setActiveClub(clubWithRole);
      setActiveRole('owner');
      resetClubContext();
      window.dispatchEvent(new Event('swimStateChanged'));
      navigate('/dashboard', { replace: true });
    },
  });

  // ── Join Club via Invite Code ──────────────────────────────────────────────
  const [inviteCode, setInviteCode] = useState(urlCode);
  const [joinError, setJoinError] = useState('');

  // Switch to join tab if code in URL
  useEffect(() => {
    if (urlCode) setTab('join');
  }, [urlCode]);

  const joinClub = useMutation({
    mutationFn: async () => {
      setJoinError('');
      const code = inviteCode.trim().toUpperCase();
      if (!code) throw new Error('Please enter an invite code.');

      // Look up ClubInvite by code
      const invites = await base44.entities.ClubInvite.filter({ invite_code: code, is_active: true });
      const invite = invites[0];

      if (!invite) {
        throw new Error('Invite code not found, expired, or no longer active.');
      }

      // Check expiry
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        throw new Error('This invite code has expired.');
      }

      // Check max uses
      if (invite.max_uses && invite.use_count >= invite.max_uses) {
        throw new Error('This invite code has reached its maximum number of uses.');
      }

      // Fetch club
      const clubs = await base44.entities.Club.filter({ id: invite.club_id });
      const club = clubs[0];
      if (!club) throw new Error('Club not found.');

      // Check already member
      if (user?.id) {
        const existing = await base44.entities.ClubMember.filter({
          club_id: club.id,
          user_id: user.id,
        });
        if (existing.length > 0) {
          // Already a member — just activate and redirect
          return { ...club, _memberRole: existing[0].role };
        }

        // Create ClubMember with the invite's role
        await base44.entities.ClubMember.create({
          club_id: club.id,
          user_id: user.id,
          role: invite.role,
        });

        // Increment use_count and set last_used_at
        await base44.entities.ClubInvite.update(invite.id, {
          use_count: (invite.use_count || 0) + 1,
          last_used_at: new Date().toISOString(),
        });
      }

      return { ...club, _memberRole: invite.role };
    },
    onSuccess: (clubWithRole) => {
      setActiveClub(clubWithRole);
      setActiveRole(clubWithRole._memberRole);
      resetClubContext();
      window.dispatchEvent(new Event('swimStateChanged'));
      navigate('/dashboard', { replace: true });
    },
    onError: (err) => {
      setJoinError(err.message || 'Failed to join club.');
    },
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Waves className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Join or Create Your Club Workspace</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Swim Sight 3D is organised by club. Join an existing club with an invite code, or create your own workspace.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-secondary p-1 mb-6">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'create' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Plus className="w-4 h-4" /> Create New Club
          </button>
          <button
            onClick={() => setTab('join')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'join' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <KeyRound className="w-4 h-4" /> Join With Invite Code
          </button>
        </div>

        {/* Create tab */}
        {tab === 'create' && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Club / Squad Name *</Label>
              <Input
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Brisbane Torpedoes"
                className="bg-background border-border mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Location (optional)</Label>
              <Input
                value={form.location}
                onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Brisbane, QLD"
                className="bg-background border-border mt-1"
              />
            </div>
            <Button
              className="w-full bg-primary text-primary-foreground"
              disabled={!form.name.trim() || createClub.isPending}
              onClick={() => createClub.mutate()}
            >
              {createClub.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Club...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" /> Create Club Workspace</>
              )}
            </Button>
            {createClub.isError && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {createClub.error?.message || 'Failed to create club. Try again.'}
              </div>
            )}
          </div>
        )}

        {/* Join tab */}
        {tab === 'join' && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            {urlCode && (
              <div className="flex items-center gap-2 text-xs text-primary p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                Invite code detected from link.
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Invite Code</Label>
              <Input
                value={inviteCode}
                onChange={e => { setInviteCode(e.target.value.toUpperCase()); setJoinError(''); }}
                placeholder="e.g. ABC12345"
                className="bg-background border-border mt-1 font-mono tracking-widest uppercase text-base"
                maxLength={12}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Ask your club admin to share an invite code or link. Codes are case-insensitive.
              </p>
            </div>
            {joinError && (
              <div className="flex items-center gap-2 text-xs text-destructive p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {joinError}
              </div>
            )}
            <Button
              className="w-full bg-primary text-primary-foreground"
              disabled={!inviteCode.trim() || joinClub.isPending}
              onClick={() => joinClub.mutate()}
            >
              {joinClub.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Joining...</>
              ) : (
                <><KeyRound className="w-4 h-4 mr-2" /> Join Club</>
              )}
            </Button>
          </div>
        )}

        {/* Sign out option */}
        <div className="mt-6 text-center">
          <button
            onClick={() => base44.auth.logout('/login')}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}