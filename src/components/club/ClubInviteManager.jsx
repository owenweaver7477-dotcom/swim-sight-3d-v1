import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase, hasSupabaseBrowserEnv } from '@/lib/supabaseClient';
import functions from '@/lib/data/functions';
import {
  Plus, Copy, Link, Ban, KeyRound, Check, AlertCircle, Clock, Users
} from 'lucide-react';
import { format } from 'date-fns';

const ROLE_CONFIG = {
  coach:   { label: 'Coach',   colour: 'text-primary bg-primary/10 border-primary/20' },
  admin:   { label: 'Admin',   colour: 'text-yellow-400 bg-yellow-900/20 border-yellow-700/30' },
  swimmer: { label: 'Swimmer', colour: 'text-green-400 bg-green-900/20 border-green-700/30' },
  parent:  { label: 'Parent',  colour: 'text-purple-400 bg-purple-900/20 border-purple-700/30' },
  owner:   { label: 'Owner',   colour: 'text-orange-400 bg-orange-900/20 border-orange-700/30' },
  assistant_coach: { label: 'Assistant Coach', colour: 'text-sky-400 bg-sky-900/20 border-sky-700/30' },
};

const BASE_URL = import.meta.env.VITE_APP_BASE_URL || window.location.origin;

function swimmerName(swimmer) {
  const fullName = [swimmer.first_name, swimmer.last_name].filter(Boolean).join(' ').trim();
  return fullName || swimmer.name || 'Unnamed swimmer';
}

export default function ClubInviteManager({ club, memberRole }) {
  const queryClient = useQueryClient();
  const canManage = ['owner', 'admin'].includes(memberRole);

  const [newRole, setNewRole] = useState('coach');
  const [newEmail, setNewEmail] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiryDays, setExpiryDays] = useState('');
  const [copied, setCopied] = useState('');

  const { data: invites = [] } = useQuery({
    queryKey: ['club-invites', club?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_invites')
        .select('*')
        .eq('club_id', club.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!club?.id && hasSupabaseBrowserEnv() && canManage,
  });

  const { data: swimmers = [] } = useQuery({
    queryKey: ['swimmers-for-invite', club?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('swimmers')
        .select('id, first_name, last_name')
        .eq('club_id', club.id)
        .eq('is_active', true)
        .order('last_name', { ascending: true })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!club?.id && hasSupabaseBrowserEnv() && canManage,
  });

  const [selectedSwimmer, setSelectedSwimmer] = useState('');

  const createInvite = useMutation({
    mutationFn: async () => {
      const expiresAt = expiryDays
        ? new Date(Date.now() + parseInt(expiryDays, 10) * 86400000).toISOString()
        : null;
      const { data } = await functions.createClubInvite({
        club_id: club.id,
        role: newRole,
        email: newEmail.trim() || undefined,
        swimmer_id: selectedSwimmer || undefined,
        max_uses: maxUses ? parseInt(maxUses, 10) : undefined,
        expires_at: expiresAt,
      });
      return data.invite;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-invites', club?.id] });
      setNewEmail('');
      setMaxUses('');
      setExpiryDays('');
      setSelectedSwimmer('');
    },
  });

  const revokeInvite = useMutation({
    mutationFn: (invite) => functions.revokeClubInvite(invite.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['club-invites', club?.id] }),
  });

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const getInviteUrl = (code) => `${BASE_URL}/join?code=${code}`;

  const isExpired = (inv) => inv.expires_at && new Date(inv.expires_at) < new Date();
  const isMaxed = (inv) => inv.max_uses && inv.use_count >= inv.max_uses;
  const isValid = (inv) => inv.is_active && !isExpired(inv) && !isMaxed(inv);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground p-2.5 rounded-lg bg-secondary/50 border border-border">
        <KeyRound className="w-3 h-3 flex-shrink-0" />
        Share invite links/codes to add members. Codes are checked for expiry and use limits on join.
        <span className="ml-auto text-[9px] text-primary">Email invites coming soon</span>
      </div>

      {/* Create invite form */}
      {canManage && (
        <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-3">
          <div className="text-xs font-semibold text-foreground">Create New Invite</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Role</label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                className="mt-1 w-full h-8 rounded-md border border-input bg-transparent px-2 text-xs"
              >
                <option value="coach">Coach</option>
                <option value="assistant_coach">Assistant Coach</option>
                <option value="swimmer">Swimmer</option>
                <option value="parent">Parent</option>
                {memberRole === 'owner' && <option value="admin">Admin</option>}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Max Uses (blank = unlimited)</label>
              <Input value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="e.g. 10" type="number" className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Expires in (days, optional)</label>
              <Input value={expiryDays} onChange={e => setExpiryDays(e.target.value)} placeholder="e.g. 7" type="number" className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Email (optional — invites are shared by link)</label>
              <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="specific@email.com" className="mt-1 h-8 text-xs" />
            </div>
            {['swimmer', 'parent'].includes(newRole) && swimmers.length > 0 && (
              <div className="col-span-2">
                <label className="text-[10px] text-muted-foreground">Link to swimmer (optional)</label>
                <select
                  value={selectedSwimmer}
                  onChange={e => setSelectedSwimmer(e.target.value)}
                  className="mt-1 w-full h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                >
                  <option value="">— None —</option>
                  {swimmers.map(s => <option key={s.id} value={s.id}>{swimmerName(s)}</option>)}
                </select>
              </div>
            )}
          </div>
          <Button size="sm" className="h-8 text-xs" disabled={createInvite.isPending} onClick={() => createInvite.mutate()}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            {createInvite.isPending ? 'Creating…' : 'Generate Invite Code'}
          </Button>
          {createInvite.isError && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {createInvite.error?.message || 'Unable to create invite.'}
            </div>
          )}
        </div>
      )}

      {/* Invite table */}
      {invites.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-6">
          No invites created yet. {canManage ? 'Create one above.' : 'Ask your admin for an invite code.'}
        </div>
      ) : (
        <div className="space-y-2">
          {invites.map(inv => {
            const roleCfg = ROLE_CONFIG[inv.role] || ROLE_CONFIG.coach;
            const valid = isValid(inv);
            const expired = isExpired(inv);
            const maxed = isMaxed(inv);
            const url = getInviteUrl(inv.invite_code);

            return (
              <div key={inv.id} className={`p-3 rounded-xl border ${valid ? 'bg-card border-border' : 'bg-secondary/30 border-border/50 opacity-60'}`}>
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="font-mono text-sm font-bold text-foreground tracking-widest">{inv.invite_code}</code>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${roleCfg.colour}`}>{roleCfg.label}</span>
                    {!inv.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20">Revoked</span>}
                    {expired && inv.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border flex items-center gap-1"><Clock className="w-2.5 h-2.5" />Expired</span>}
                    {maxed && inv.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border">Max uses reached</span>}
                    {valid && <span className="text-[10px] text-green-400 flex items-center gap-1"><Check className="w-2.5 h-2.5" />Active</span>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {valid && (
                      <>
                        <button
                          onClick={() => copyToClipboard(inv.invite_code, inv.id + '-code')}
                          title="Copy code"
                          className="p-1.5 rounded text-muted-foreground hover:bg-secondary text-[10px] flex items-center gap-1"
                        >
                          {copied === inv.id + '-code' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(url, inv.id + '-url')}
                          title="Copy invite link"
                          className="p-1.5 rounded text-muted-foreground hover:bg-secondary text-[10px] flex items-center gap-1"
                        >
                          {copied === inv.id + '-url' ? <Check className="w-3 h-3 text-green-400" /> : <Link className="w-3 h-3" />}
                        </button>
                      </>
                    )}
                    {canManage && inv.is_active && (
                      <button
                        onClick={() => revokeInvite.mutate(inv)}
                        title="Revoke invite"
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Ban className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" />{inv.use_count || 0}{inv.max_uses ? `/${inv.max_uses}` : ''} uses</span>
                  {inv.expires_at && <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />Expires {format(new Date(inv.expires_at), 'dd MMM yyyy')}</span>}
                  {inv.email && <span>For: {inv.email}</span>}
                  {inv.last_used_at && <span>Last used {format(new Date(inv.last_used_at), 'dd MMM yyyy')}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
