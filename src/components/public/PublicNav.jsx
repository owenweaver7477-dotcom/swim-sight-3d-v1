import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import { PILOT_MAILTO } from '@/lib/supportConfig';

const navItems = [
  { to: '/for-coaches', label: 'Clubs & Coaches' },
  { to: '/sample-report', label: 'Sample Report' },
  { to: '/coach-approved-ai', label: 'Trust & Privacy + FAQ' },
  { to: '/pricing', label: 'Pilot Access' },
];

export default function PublicNav() {
  const [open, setOpen] = React.useState(false);
  const { pathname } = useLocation();
  // The landing page is a dark cinematic hero; the nav sits transparently over it.
  // Every other public page keeps the original light header.
  const dark = pathname === '/';

  const linkClass = ({ isActive }) =>
    `rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
      isActive
        ? dark
          ? 'bg-white/10 text-white'
          : 'bg-sky-100 text-sky-900'
        : dark
          ? 'text-slate-300 hover:bg-white/10 hover:text-white'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
    }`;

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-xl ${
        dark ? 'border-b border-white/10 bg-slate-950/70' : 'border-b border-slate-200 bg-white/90'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/brand/swim-sight-emblem.png"
            alt="Swim Sight 3D"
            width={56}
            height={56}
            className="h-14 w-14 object-contain"
          />
          <span>
            <span className={`block text-sm font-bold leading-tight ${dark ? 'text-white' : 'text-slate-950'}`}>Swim Sight 3D</span>
            <span className={`block text-[10px] font-semibold uppercase tracking-[0.2em] ${dark ? 'text-cyan-300/80' : 'text-slate-500'}`}>Coach-led video review</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Public navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          <Link
            to="/login"
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              dark ? 'text-slate-200 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Log in
          </Link>
          <a
            href={PILOT_MAILTO}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-lg transition-colors ${
              dark ? 'bg-sky-500 shadow-sky-500/30 hover:bg-sky-400' : 'bg-slate-950 shadow-slate-950/15 hover:bg-slate-800'
            }`}
          >
            Book a pilot <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full xl:hidden ${
            dark ? 'border border-white/15 text-slate-100' : 'border border-slate-200 text-slate-700'
          }`}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className={`px-4 py-4 xl:hidden ${dark ? 'border-t border-white/10 bg-slate-950' : 'border-t border-slate-200 bg-white'}`}>
          <nav className="mx-auto grid max-w-6xl gap-2" aria-label="Mobile public navigation">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className={`rounded-full px-4 py-2.5 text-center text-sm font-semibold ${
                  dark ? 'border border-white/15 text-slate-100' : 'border border-slate-200 text-slate-700'
                }`}
              >
                Log in
              </Link>
              <a
                href={PILOT_MAILTO}
                onClick={() => setOpen(false)}
                className={`rounded-full px-4 py-2.5 text-center text-sm font-semibold text-white ${dark ? 'bg-sky-500' : 'bg-slate-950'}`}
              >
                Book a pilot
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
