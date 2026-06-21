import React, { useState, useEffect } from 'react';
import { signOut } from '@/lib/swimState';
import { useClubContext } from '@/lib/useClubContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/shared/PageHeader';
import { Lock, User, Settings, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function SettingsPage() {
  const { user, logout, updateProfile } = useAuth();
  const { club, memberRole } = useClubContext();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState('');
  const canUseCoachApp = ['owner', 'admin', 'coach', 'assistant_coach'].includes(memberRole) || user?.role === 'admin';
  const isAdmin = ['owner', 'admin'].includes(memberRole) || user?.role === 'admin';
  const quickLinks = [
    ...(canUseCoachApp ? [
      { label: 'Club Settings', to: '/club-settings' },
      { label: 'Club Progress', to: '/club-progress' },
      { label: 'Reference Library', to: '/reference-library' },
    ] : []),
    ...(isAdmin ? [{ label: 'Product Status', to: '/roadmap' }] : []),
  ];

  useEffect(() => {
    if (user?.full_name) setName(user.full_name);
  }, [user]);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setSaving(true);
    await updateProfile({ full_name: name });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = () => {
    signOut();
    logout();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <PageHeader eyebrow="Platform" title="Settings" subtitle="Your account and workspace configuration." />

      <div className="space-y-4">
        {/* Account info */}
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Your Account</h3>
          </div>
          {user ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground mb-0.5">Name</div>
                  <div className="font-medium text-foreground">{user.full_name || '—'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-0.5">Email</div>
                  <div className="font-medium text-foreground">{user.email || '—'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-0.5">Role</div>
                  <div className="font-medium text-foreground capitalize">{user.role || 'user'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-0.5">Workspace</div>
                  <div className="font-medium text-foreground">{club?.name || 'Personal'}</div>
                </div>
              </div>
              <form onSubmit={handleUpdateName} className="pt-3 border-t border-border space-y-2">
                <Label className="text-xs text-muted-foreground">Update Display Name</Label>
                <div className="flex gap-2">
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Display name" className="bg-secondary border-border text-xs h-8 flex-1" />
                  <Button type="submit" size="sm" className="h-8 text-xs" disabled={saving}>
                    {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save'}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Loading user details...</p>
          )}
        </div>

        {/* Active workspace */}
        {club && (
          <div className="p-5 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Active Club Workspace</h3>
              </div>
              <Link to="/club-settings">
                <Button size="sm" variant="outline" className="text-xs h-7">
                  <ExternalLink className="w-3 h-3 mr-1" /> Club Settings
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground mb-0.5">Club Name</div>
                <div className="font-medium text-foreground">{club.name}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-0.5">Your Role</div>
                  <div className="font-medium text-foreground capitalize">{memberRole || '—'}</div>
              </div>
              {club.location && (
                <div>
                  <div className="text-muted-foreground mb-0.5">Location</div>
                  <div className="font-medium text-foreground">{club.location}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation shortcuts */}
        {quickLinks.length > 0 && <div className="p-5 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">Quick Links</h3>
          <div className="grid grid-cols-2 gap-2">
            {quickLinks.map(l => (
              <Link key={l.to} to={l.to}>
                <div className="p-2.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                  {l.label} →
                </div>
              </Link>
            ))}
          </div>
        </div>}

        {/* Sign out */}
        <div className="p-5 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">Session</h3>
          <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs" onClick={handleSignOut}>
            <Lock className="w-3.5 h-3.5 mr-1" /> Sign Out
          </Button>
        </div>

      </div>
    </div>
  );
}
