import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useClubContext } from '@/lib/useClubContext';
import { Loader2 } from 'lucide-react';
import NotificationPanel from '@/components/notifications/NotificationPanel';

export default function AppLayout() {
  const { club, clubs, loading } = useClubContext();

  // Still loading memberships — show a spinner rather than flashing onboarding
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading workspace...</span>
        </div>
      </div>
    );
  }

  // No club membership at all — redirect to onboarding gate
  if (!loading && clubs.length === 0 && !club) {
    return <Navigate to="/club-onboarding" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex dark:bg-slate-950">
      <Sidebar />
      {/* Offset content: desktop = ml-56, mobile = top bar plus iOS safe area */}
      <main className="flex-1 min-w-0 pt-[calc(3.5rem+env(safe-area-inset-top))] lg:pt-0 lg:ml-56">
        {/* Notification bell — top right corner on desktop */}
        <div className="hidden lg:flex fixed top-3 right-4 z-30">
          <NotificationPanel />
        </div>
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
