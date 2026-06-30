import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';

const navItems = [
  { to: '/features', label: 'Features' },
  { to: '/for-coaches', label: 'Coaches' },
  { to: '/for-clubs', label: 'Clubs' },
  { to: '/coach-approved-ai', label: 'AI + Trust' },
  { to: '/sample-report', label: 'Sample Report' },
  { to: '/stroke-analysis', label: 'Stroke Analysis' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/faq', label: 'FAQ' },
];

export default function PublicNav() {
  const [open, setOpen] = React.useState(false);

  const linkClass = ({ isActive }) =>
    `rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
      isActive
        ? 'bg-sky-100 text-sky-900'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/brand/swim-sight-logo.png"
            alt="Swim Sight 3D"
            width={36}
            height={36}
            className="h-9 w-9 rounded-xl object-contain"
          />
          <span>
            <span className="block text-sm font-bold leading-tight text-slate-950">Swim Sight 3D</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Coach-approved analysis</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Public navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/login" className="rounded-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
            Login
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-slate-950/15 transition-colors hover:bg-slate-800"
          >
            Open App <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 lg:hidden"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
          <nav className="mx-auto grid max-w-6xl gap-2" aria-label="Mobile public navigation">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link to="/login" onClick={() => setOpen(false)} className="rounded-full border border-slate-200 px-4 py-2 text-center text-xs font-semibold text-slate-700">
                Login
              </Link>
              <Link to="/login" onClick={() => setOpen(false)} className="rounded-full bg-slate-950 px-4 py-2 text-center text-xs font-semibold text-white">
                Open App
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
