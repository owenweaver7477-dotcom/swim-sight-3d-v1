import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut, getActiveRole } from '@/lib/swimState';
import { useClubContext } from '@/lib/useClubContext';
import { resetClubContext } from '@/lib/useClubContext';
import { useAuth } from '@/lib/AuthContext';
import {
  LayoutDashboard, Users, Video,
  Settings, ChevronDown, ChevronRight, Dumbbell,
  Map, LogOut, Plus, Menu, X, ChevronsUpDown, Check, Clapperboard,
  ShieldAlert, Activity, TrendingUp, BarChart3, Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import MemberAvatar from '@/components/shared/MemberAvatar';
import {
  getRoleLabel,
  isCoachAppRole,
  normalizeRole,
} from '@/lib/permissions';

// ── Grouped navigation structure ──────────────────────────────────────────────
const NAV_MAIN = [
  { to: '/dashboard',       label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/analyse',         label: 'New Review',      icon: Video },
  { to: '/ai-reviews',      label: 'Coach Studio',    icon: Clapperboard },
  { to: '/swimmers',        label: 'Swimmers',        icon: Users },
  { to: '/drill-library',   label: 'Drill Library',   icon: Dumbbell },
];

const NAV_TOOLS = [
  { to: '/performance',     label: 'Performance Hub', icon: TrendingUp },
];

const NAV_CLUB = [
  { to: '/club-settings',   label: 'Club Settings',   icon: Settings },
];

// Platform/internal tools — app-level admin only (user.role === 'admin'), not club owners/coaches.
// NOTE: the Footage Checklist (/footage-checklist) and Reference Library (/reference-library) routes
// and pages still exist in App.jsx and remain reachable directly / via Settings; they are only
// removed from this sidebar's display.
const NAV_INTERNAL = [
  { to: '/ai-calibration', label: 'AI Calibration', icon: BarChart3 },
  { to: '/ai-infrastructure-status', label: 'AI Infrastructure', icon: Server },
  { to: '/ai-jobs',       label: 'AI Job Monitor',  icon: Activity },
  { to: '/roadmap',       label: 'Roadmap',         icon: Map },
];


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
  const isPlatformAdmin = user?.role === 'admin';
  const canUseCoachApp = isCoachAppRole(memberRole) || user?.role === 'admin';

  const NavItem = ({ item }) => {
    const active = isActive(item.to);
    // The desktop rail collapses to icons only, so the label is not always
    // visible: `title` gives sighted users a hover tooltip and `aria-label`
    // gives assistive tech a name even while the text is clipped, plus
    // aria-current marks the active page.
    return (
      <Link to={item.to} title={item.label} aria-label={item.label} aria-current={active ? 'page' : undefined}>
        <div className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 cursor-pointer ${
          active
            ? 'bg-primary/10 text-primary font-semibold ring-1 ring-primary/10 shadow-sm shadow-primary/5'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:translate-x-0.5 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 motion-reduce:hover:translate-x-0'
        }`}>
          <item.icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} aria-hidden="true" />
          <span className="sb-label">{item.label}</span>
        </div>
      </Link>
    );
  };

  const SectionLabel = ({ label, divider }) => (
    <div className={`px-3 pb-1 ${divider ? 'mt-3 border-t border-slate-100 dark:border-slate-800 pt-3' : 'pt-3'}`}>
      <span className="sb-label block text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
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
          className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 transition-all hover:border-primary/50 hover:shadow-sm dark:bg-slate-800/50 dark:border-slate-700"
          style={{ boxShadow: `inset 3px 0 0 0 ${club.primary_color || '#0077B6'}` }}
        >
          <div className="flex items-center gap-3">
            {club.logo_url ? (
              <img src={club.logo_url} alt="" className="h-11 w-11 flex-shrink-0 rounded-lg border border-slate-200 object-contain bg-white p-0.5 dark:border-slate-700" />
            ) : (
              <div
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: club.primary_color || '#0077B6' }}
              >
                {club.initials || club.name?.charAt(0) || 'C'}
              </div>
            )}
            <div className="sb-label min-w-0 flex-1 text-left">
              <div className="text-sm font-bold text-slate-900 truncate dark:text-slate-100">{club.name}</div>
              {memberRole && <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{getRoleLabel(rawMemberRole)}</div>}
            </div>
            <ChevronsUpDown className="sb-label w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          </div>
        </button>

        {clubDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 w-56 min-w-[14rem] rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden dark:border-slate-700 dark:bg-slate-900">
            {clubs.length > 1 && (
              <div className="px-2 pt-2 pb-1">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 px-2 mb-1">Switch Club</div>
                {clubs.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { switchClub(c); setClubDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 text-left transition-colors dark:hover:bg-slate-800"
                  >
                    <div
                      className="w-5 h-5 rounded text-[9px] font-bold text-white flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: c.primary_color || '#0077B6' }}
                    >
                      {c.initials || c.name?.charAt(0)}
                    </div>
                    <span className="text-xs text-slate-700 truncate flex-1 dark:text-slate-200">{c.name}</span>
                    {c.id === club.id && <Check className="w-3 h-3 text-primary flex-shrink-0" />}
                  </button>
                ))}
                <div className="border-t border-slate-100 dark:border-slate-800 mt-1 mb-1" />
              </div>
            )}
            <div className="px-2 py-1.5 space-y-0.5">
              <Link to="/club-settings" onClick={() => setClubDropdownOpen(false)}>
                <div className="px-2 py-1.5 rounded-lg hover:bg-slate-50 text-xs text-slate-700 dark:hover:bg-slate-800 dark:text-slate-200">Club Settings</div>
              </Link>
              <Link to="/club-settings" onClick={() => setClubDropdownOpen(false)}>
                <div className="px-2 py-1.5 rounded-lg hover:bg-slate-50 text-xs text-slate-700 dark:hover:bg-slate-800 dark:text-slate-200">Invite Coach</div>
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
      <div className="px-4 py-6 border-b border-slate-200">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img
            src="/brand/swim-sight-logo.png"
            alt="Swim Sight 3D"
            width={40}
            height={40}
            className="w-10 h-10 rounded-lg object-contain"
          />
          <div className="sb-label">
            <div className="text-sm font-bold text-slate-900 leading-tight dark:text-slate-100">Swim Sight 3D</div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Performance Analysis</div>
          </div>
        </Link>
      </div>

      {/* Club workspace switcher */}
      <ClubWorkspaceCard />

      {/* New Analysis CTA */}
      {canUseCoachApp && <div className="px-3 py-2">
        <Button
          size="sm"
          className="w-full h-9 text-xs font-semibold text-white bg-primary transition-colors hover:bg-primary/90"
          onClick={() => navigate('/analyse')}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" /> <span className="sb-label">New Analysis</span>
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
            <SectionLabel label="Tools" divider />
            <div className="space-y-0.5">
              {NAV_TOOLS.map(item => <NavItem key={item.to} item={item} />)}
            </div>

            {/* — Club — */}
            <SectionLabel label="Club" divider />
            <div className="space-y-0.5">
              {NAV_CLUB.map(item => <NavItem key={item.to} item={item} />)}
            </div>
          </>
        )}

        {/* Platform/internal tools — app-level admin only (not club owners/coaches). */}
        {isPlatformAdmin && (
          <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-2">
            <button
              onClick={() => setAdminOpen(!adminOpen)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="sb-label flex-1 text-left font-semibold uppercase tracking-widest text-[10px]">Internal Tools</span>
              <span className="sb-label">{adminOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}</span>
            </button>
            {adminOpen && (
              <div className="ml-2 pl-3 border-l border-slate-200 mt-0.5 dark:border-slate-700 space-y-0.5">
                {NAV_INTERNAL.map(item => <NavItem key={item.to} item={item} />)}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-3 pt-2">
        {user ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/50">
            <MemberAvatar name={user.full_name || user.email} path={user.avatar_url} size="sm" />
            <div className="sb-label flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate dark:text-slate-100">{user.full_name || 'Account'}</div>
              <div className="text-[10px] text-slate-400 truncate">{memberRole ? getRoleLabel(rawMemberRole) : user.email}</div>
            </div>
            <div className="sb-label flex items-center gap-1">
              <ThemeToggle className="flex-shrink-0" />
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors dark:hover:bg-red-500/10"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] bg-white border-b border-slate-200 flex items-center px-4 justify-between dark:bg-slate-900 dark:border-slate-800">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img
            src="/brand/swim-sight-logo.png"
            alt="Swim Sight 3D"
            width={28}
            height={28}
            className="w-7 h-7 rounded-lg object-contain"
          />
          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Swim Sight 3D</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-slate-500 dark:text-slate-400"
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed top-[calc(3.5rem+env(safe-area-inset-top))] left-0 bottom-0 w-64 z-50 bg-white border-r border-slate-200 overflow-y-auto dark:bg-slate-900 dark:border-slate-800">
          <SidebarContent />
        </div>
      )}

      {/* Desktop sidebar — collapsed icon rail that expands to full width on hover.
          Width + label collapse handled by `.sb-rail` in index.css. */}
      <div className="sb-rail hidden lg:flex flex-col fixed top-0 left-0 bottom-0 bg-white border-r border-slate-200 z-40 shadow-sm transition-shadow hover:shadow-xl dark:bg-slate-900 dark:border-slate-800">
        <SidebarContent />
      </div>
    </>
  );
}
