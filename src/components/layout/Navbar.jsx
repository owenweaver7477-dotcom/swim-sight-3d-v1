import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getActiveClub, getActiveRole, signOut } from '@/lib/swimState';
import { useAuth } from '@/lib/AuthContext';
import {
  LayoutDashboard, Users, FlaskConical, Eye, FileText, Dumbbell,
  BookOpen, BarChart3, Map, Settings, Menu, X, ChevronDown, Lock
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

const NAV_MAIN = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/swimmers', label: 'Swimmers', icon: Users },
  { to: '/analyse', label: 'Analyse', icon: FlaskConical },
  { to: '/ai-reviews', label: 'Reports', icon: FileText },
  { to: '/reference-library', label: 'Library', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const NAV_MORE = [
  { to: '/ai-calibration', label: 'AI Calibration', icon: Eye },
  { to: '/drill-library', label: 'Drills', icon: Dumbbell },
  { to: '/club-progress', label: 'Club Progress', icon: BarChart3 },
  { to: '/roadmap', label: 'Roadmap', icon: Map },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [club, setClub] = useState(null);
  const [role, setRole] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const refresh = () => {
      setClub(getActiveClub());
      setRole(getActiveRole());
    };
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('swimStateChanged', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('swimStateChanged', refresh);
    };
  }, []);

  const handleSignOut = () => {
    signOut();
    logout();
  };

  const isActive = (to) => location.pathname === to;

  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
  const isPublicPage = publicRoutes.includes(location.pathname);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-xs tracking-tight">SS</span>
          </div>
          <span className="font-semibold text-foreground text-sm hidden sm:block tracking-tight">Swim Sight 3D</span>
        </Link>

        {/* Desktop nav — only show when signed in and not on public pages */}
        {!isPublicPage && (
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_MAIN.map(link => (
              <Link key={link.to} to={link.to}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-xs h-8 px-3 ${isActive(link.to) ? 'text-foreground bg-secondary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <link.icon className="w-3.5 h-3.5 mr-1.5" />
                  {link.label}
                </Button>
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs h-8 px-3 text-muted-foreground hover:text-foreground">
                  More <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border w-44">
                {NAV_MORE.map(link => (
                  <DropdownMenuItem key={link.to} onClick={() => navigate(link.to)} className="text-xs gap-2">
                    <link.icon className="w-3.5 h-3.5" /> {link.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isPublicPage ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Log In</Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="text-xs bg-primary text-primary-foreground">Get Started</Button>
              </Link>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              {club && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary text-xs">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: club.primary_color || '#0ea5e9' }}
                  >
                    {club.initials || club.name?.charAt(0) || 'C'}
                  </div>
                  <span className="text-secondary-foreground max-w-[96px] truncate">{club.name}</span>
                  {role && <span className="text-[9px] text-muted-foreground">· {role}</span>}
                </div>
              )}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-8 px-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-semibold text-primary mr-1.5">
                        {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </div>
                      {user.full_name?.split(' ')[0] || 'Account'}
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border w-44">
                    <div className="px-2 py-1.5 border-b border-border mb-1">
                      <div className="text-xs font-medium text-foreground truncate">{user.full_name || 'User'}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
                    </div>
                    <DropdownMenuItem onClick={() => navigate('/settings')} className="text-xs gap-2">
                      <Settings className="w-3.5 h-3.5" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/club-settings')} className="text-xs gap-2">
                      <Users className="w-3.5 h-3.5" /> Club Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-xs text-muted-foreground gap-2">
                      <Lock className="w-3.5 h-3.5" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          <button className="md:hidden text-muted-foreground p-1" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-0.5">
          {isPublicPage ? (
            <div className="space-y-1 pt-1">
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" size="sm" className="text-xs w-full justify-start">Log In</Button>
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="text-xs w-full bg-primary text-primary-foreground">Get Started</Button>
              </Link>
            </div>
          ) : (
            <>
              {[...NAV_MAIN, ...NAV_MORE].map(link => (
                <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}>
                  <div className={`flex items-center gap-2.5 px-2 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive(link.to) ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}>
                    <link.icon className="w-4 h-4" /> {link.label}
                  </div>
                </Link>
              ))}
              <div className="border-t border-border pt-2 mt-2">
                {club && (
                  <div className="text-xs text-muted-foreground px-2 py-1.5">{club.name} · {role || 'Member'}</div>
                )}
                <button
                  onClick={() => { handleSignOut(); setMobileOpen(false); }}
                  className="flex items-center gap-2 w-full px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Lock className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
