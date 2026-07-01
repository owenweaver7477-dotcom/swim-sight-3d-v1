import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut, getActiveRole } from '@/lib/swimState';
import { useClubContext } from '@/lib/useClubContext';
import { resetClubContext } from '@/lib/useClubContext';
import { useAuth } from '@/lib/AuthContext';
import {
  LayoutDashboard, Users, FlaskConical,
  Settings, ChevronDown, ChevronRight, Dumbbell,
  Map, LogOut, Plus, Menu, X, ChevronsUpDown, Check, Brain,
  ShieldAlert, Activity, TrendingUp, BookOpen, BarChart3, ClipboardCheck, Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getRoleLabel,
  isAdminRole,
  isCoachAppRole,
  isPilotRole,
  normalizeRole,
} from '@/lib/permissions';

// ── Grouped navigation structure ──────────────────────────────────────────────
const NAV_MAIN = [
  { to: '/dashboard',       label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/analyse',         label: 'Analyse Video',   icon: FlaskConical },
  { to: '/ai-reviews',      label: 'Coach Studio',    icon: Brain },
  { to: '/swimmers',        label: 'Swimmers',        icon: Users },
  { to: '/drill-library',   label: 'Drill Library',   icon: Dumbbell },
];

const NAV_TOOLS = [
  { to: '/performance',     label: 'Reports / Performance', icon: TrendingUp },
];

const NAV_CLUB = [
  { to: '/club-settings',   label: 'Club Settings',   icon: Settings },
];

// Admin-only — all advanced/debug tools collapsed under single section
const NAV_ADMIN = [
  { to: '/ai-calibration', label: 'AI Calibration', icon: BarChart3 },
  { to: '/footage-checklist', label: 'Footage Checklist', icon: ClipboardCheck },
  { to: '/ai-infrastructure-status', label: 'AI Infrastructure', icon: Server },
  { to: '/reference-library',   label: 'Reference Library',   icon: BookOpen },
  { to: '/ai-jobs',       label: 'AI Job Monitor',  icon: Activity },
  { to: '/roadmap',       label: 'Roadmap',         icon: Map },
];

const PILOT_NAV_ITEM = { to: '/pilot-launch', label: 'Private Coach Pilot', icon: ClipboardCheck };

export default function Sidebar() {
  const { club, clubs, switchClub } = useClubContext();
  const { user, logout } = useAuth();
  const [adminOpen, setAdminOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clubDropdownOpen, setClubDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => { setClubDropdownOpen(false); }, [location.pathname]);

  const handleSignOut = () => {
    signOut();
    resetClubContext();
    logout();
  };

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/');
  const memberRole = normalizeRole(club?._memberRole || getActiveRole());
  const rawMemberRole = club?._rawMemberRole || club?._memberRole || memberRole;
  const isAdmin = isAdminRole(memberRole) || user?.role === 'admin';
  const canUseCoachApp = isCoachAppRole(memberRole) || user?.role === 'admin';
  const canUsePilot = isPilotRole(memberRole) || user?.role === 'admin';

  const NavItem = ({ item }) => {
    const active = isActive(item.to);
    return (
      <Link to={item.to}>
        <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
          active
            ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}>
          <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-primary' : 'text-slate-400'}`} />
          <span>{item.label}</span>
        </div>
      </Link>
    );
  };

  const SectionLabel = ({ label }) => (
    <div className="px-3 pt-3 pb-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
    </div>
  );

  const ClubWorkspaceCard = () => {
    if (!club) {
      return (
        <div className="mx-3 mt-3 mb-1">
          <Link to="/club-onboarding">
            <div className="px-3 py-2.5 rounded-lg border border-dashed border-primary/40 text-xs text-primary hover:text-primary/80 hover:border-primary transition-colors flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Create Club Workspace
            </div>
          </Link>
        </div>
      );
    }

    return (
      <div className="mx-3 mt-3 mb-1 relative">
        <button
          onClick={() => setClubDropdownOpen(!clubDropdownOpen)}
          className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-primary/40 transition-all"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
              style={{ backgroundColor: club.primary_color || '#0077B6' }}
            >
              {club.initials || club.name?.charAt(0) || 'C'}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="text-xs font-semibold text-slate-900 truncate">{club.name}</div>
              {memberRole && <div className="text-[10px] text-slate-400">{getRoleLabel(rawMemberRole)}</div>}
            </div>
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          </div>
        </button>

        {clubDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            {clubs.length > 1 && (
              <div className="px-2 pt-2 pb-1">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 px-2 mb-1">Switch Club</div>
                {clubs.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { switchClub(c); setClubDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 text-left transition-colors"
                  >
                    <div
                      className="w-5 h-5 rounded text-[9px] font-bold text-white flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: c.primary_color || '#0077B6' }}
                    >
                      {c.initials || c.name?.charAt(0)}
                    </div>
                    <span className="text-xs text-slate-700 truncate flex-1">{c.name}</span>
                    {c.id === club.id && <Check className="w-3 h-3 text-primary flex-shrink-0" />}
                  </button>
                ))}
                <div className="border-t border-slate-100 mt-1 mb-1" />
              </div>
            )}
            <div className="px-2 py-1.5 space-y-0.5">
              <Link to="/club-settings" onClick={() => setClubDropdownOpen(false)}>
                <div className="px-2 py-1.5 rounded-lg hover:bg-slate-50 text-xs text-slate-700">Club Settings</div>
              </Link>
              <Link to="/club-settings" onClick={() => setClubDropdownOpen(false)}>
                <div className="px-2 py-1.5 rounded-lg hover:bg-slate-50 text-xs text-slate-700">Invite Coach</div>
              </Link>
              <Link to="/club-onboarding" onClick={() => setClubDropdownOpen(false)}>
                <div className="px-2 py-1.5 rounded-lg hover:bg-slate-50 text-xs text-slate-700 flex items-center gap-1.5">
                  <Plus className="w-3 h-3" /> Create New Club
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-200">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <img
            src="/brand/swim-sight-logo.png"
            alt="Swim Sight 3D"
            width={36}
            height={36}
            className="w-9 h-9 rounded-lg object-contain"
          />
          <div>
            <div className="text-sm font-bold text-slate-900 leading-tight">Swim Sight 3D</div>
            <div className="text-[10px] text-slate-400">Performance Analysis</div>
          </div>
        </Link>
      </div>

      {/* Club workspace switcher */}
      <ClubWorkspaceCard />

      {/* New Analysis CTA */}
      {canUseCoachApp && <div className="px-3 py-2">
        <Button
          size="sm"
          className="w-full h-9 text-xs font-semibold text-white"
          style={{ backgroundColor: '#0077B6' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#005F8F'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0077B6'}
          onClick={() => navigate('/analyse')}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> New Analysis
        </Button>
      </div>}

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto pb-4">

        {/* — Main — */}
        {canUseCoachApp && (
          <>
            <SectionLabel label="Main" />
            <div className="space-y-0.5">
              {NAV_MAIN.map(item => <NavItem key={item.to} item={item} />)}
            </div>

            {/* — Tools — */}
            <SectionLabel label="Tools" />
            <div className="space-y-0.5">
              {NAV_TOOLS.map(item => <NavItem key={item.to} item={item} />)}
              {canUsePilot && <NavItem item={PILOT_NAV_ITEM} />}
            </div>

            {/* — Club — */}
            <SectionLabel label="Club" />
            <div className="space-y-0.5">
              {NAV_CLUB.map(item => <NavItem key={item.to} item={item} />)}
            </div>
          </>
        )}

        {/* Internal operational tools are owner/admin only. */}
        {isAdmin && (
          <div className="mt-2">
            <button
              onClick={() => setAdminOpen(!adminOpen)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="flex-1 text-left font-semibold uppercase tracking-widest text-[10px]">Admin</span>
              {adminOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {adminOpen && (
              <div className="ml-2 pl-3 border-l border-slate-200 mt-0.5 space-y-0.5">
                {NAV_ADMIN.map(item => <NavItem key={item.to} item={item} />)}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-200 px-3 py-3">
        {user ? (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
              {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">{user.full_name || 'Account'}</div>
              <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="text-[10px] text-slate-400 px-1">Loading...</div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] bg-white border-b border-slate-200 flex items-center px-4 justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img
            src="/brand/swim-sight-logo.png"
            alt="Swim Sight 3D"
            width={28}
            height={28}
            className="w-7 h-7 rounded-lg object-contain"
          />
          <span className="font-bold text-sm text-slate-900">Swim Sight 3D</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-500"
          aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed top-[calc(3.5rem+env(safe-area-inset-top))] left-0 bottom-0 w-64 z-50 bg-white border-r border-slate-200 overflow-y-auto">
          <SidebarContent />
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 w-56 bg-white border-r border-slate-200 z-40">
        <SidebarContent />
      </div>
    </>
  );
}
