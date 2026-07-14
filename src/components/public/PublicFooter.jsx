import React from 'react';
import { Link } from 'react-router-dom';
import { PILOT_MAILTO, SUPPORT_EMAIL } from '@/lib/supportConfig';

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <img
              src="/brand/swim-sight-logo.png"
              alt="Swim Sight 3D"
              width={36}
              height={36}
              className="h-9 w-9 rounded-full bg-white object-contain"
            />
            <div>
              <div className="text-sm font-bold text-white">Swim Sight 3D</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Coach-led video review.</div>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            Private, coach-led swim video review software for serious coaches and clubs. Built around coach-created feedback, private video handling, and clear swimmer improvement reports.
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
            Built for Australian swim clubs and coaches.
          </p>
          <div className="mt-4">
            <a
              href={PILOT_MAILTO}
              className="inline-flex items-center rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-400"
            >
              Book a pilot
            </a>
            <p className="mt-2 text-xs text-slate-400">
              Questions? Email <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-slate-200 hover:text-white">{SUPPORT_EMAIL}</a>
            </p>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Product</div>
          <div className="mt-3 grid gap-2 text-sm">
            <Link to="/for-coaches" className="hover:text-white">Clubs & Coaches</Link>
            <Link to="/coach-approved-ai" className="hover:text-white">Trust & Privacy + FAQ</Link>
            <Link to="/sample-report" className="hover:text-white">Sample Report</Link>
            <Link to="/pricing" className="hover:text-white">Pilot Access</Link>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Access</div>
          <div className="mt-3 grid gap-2 text-sm">
            <Link to="/for-coaches" className="hover:text-white">Clubs & Coaches</Link>
            <Link to="/pricing" className="hover:text-white">Pilot Access</Link>
            <Link to="/login" className="hover:text-white">Login</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Swim Sight 3D.</span>
          <span>Coach-reviewed reports. Private videos. Every shared finding is coach-approved.</span>
        </div>
      </div>
    </footer>
  );
}
