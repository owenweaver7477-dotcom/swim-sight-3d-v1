import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getActiveRole, signOut } from '@/lib/swimState';
import { useClubContext } from '@/lib/useClubContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import PageHeader from '@/components/shared/PageHeader';
import { ChevronDown, Lock, User, Settings, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { club } = useClubContext();
  const role = getActiveRole();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (user?.full_name) setName(user.full_name);
  }, [user]);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.auth.updateMe({ full_name: name });
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
                <div className="font-medium text-foreground capitalize">{role || '—'}</div>
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
        <div className="p-5 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">Quick Links</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Club Settings', to: '/club-settings' },
              { label: 'Club Progress', to: '/club-progress' },
              { label: 'Reference Library', to: '/reference-library' },
              { label: 'Roadmap', to: '/roadmap' },
            ].map(l => (
              <Link key={l.to} to={l.to}>
                <div className="p-2.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                  {l.label} →
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <div className="p-5 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">Session</h3>
          <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs" onClick={handleSignOut}>
            <Lock className="w-3.5 h-3.5 mr-1" /> Sign Out
          </Button>
        </div>

        {/* Developer diagnostics */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border text-sm">
              <span className="text-muted-foreground text-xs">Developer Info</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 p-4 rounded-xl bg-card border border-border">
            <div className="space-y-1.5 text-[10px] font-mono">
              {[
                ['User ID', user?.id || 'N/A'],
                ['Email', user?.email || 'N/A'],
                ['Role', user?.role || role || 'N/A'],
                ['Club ID', club?.id || 'N/A'],
                ['Club Name', club?.name || 'N/A'],
                ['Backend', 'Base44 Connected'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="text-foreground">{v}</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}