import React from 'react';
import { useClubContext } from '@/lib/useClubContext';
import { useAuth } from '@/lib/AuthContext';
import { signOut } from '@/lib/swimState';
import { resetClubContext } from '@/lib/useClubContext';
import { LogOut } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

// Full-page layout for the swimmer / parent portal — deliberately NOT the coach
// AppLayout (no coaching sidebar or tools). Just a clean header + the member's
// own world below.
export default function PortalLayout({ children }) {
  const { club } = useClubContext();
  const { user, logout } = useAuth();

  const handleSignOut = () => {
    signOut();
    resetClubContext();
    logout();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          {club?.logo_url ? (
            <img src={club.logo_url} alt="" className="h-9 w-9 flex-shrink-0 rounded-lg border border-border object-contain bg-white" />
          ) : (
            <img src="/brand/swim-sight-emblem.png" alt="" className="h-9 w-9 flex-shrink-0 object-contain" />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">{club?.name || 'Swim Sight 3D'}</div>
            <div className="text-[11px] text-muted-foreground">Swimmer portal</div>
          </div>
          <ThemeToggle />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 pb-20">
        {user ? children : null}
      </main>
    </div>
  );
}
