import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { useClubContext } from '@/lib/useClubContext';

export default function RoleProtectedRoute({ allowedRoles = [], children }) {
  const { user } = useAuth();
  const { club, memberRole, loading } = useClubContext();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const role = memberRole || club?._memberRole || null;
  const allowed = user?.role === 'admin' || allowedRoles.includes(role);

  if (!club) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <ShieldAlert className="mx-auto mb-3 h-9 w-9 text-slate-400" />
        <h1 className="text-sm font-bold text-slate-900">Club workspace required</h1>
        <p className="mt-1 text-xs leading-5 text-slate-600">Select or join a club workspace before opening coaching tools.</p>
        <Button asChild variant="outline" className="mt-4 text-xs">
          <Link to="/club-onboarding">Open club setup</Link>
        </Button>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <ShieldAlert className="mx-auto mb-3 h-9 w-9 text-amber-500" />
        <h1 className="text-sm font-bold text-slate-900">Access restricted</h1>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          Your current club role does not include this workspace. Shared swimmer reports remain available through their secure report link.
        </p>
        <Button asChild variant="outline" className="mt-4 text-xs">
          <Link to="/">Return to Swim Sight 3D</Link>
        </Button>
      </div>
    );
  }

  return children || <Outlet />;
}
