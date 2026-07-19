import React from 'react';
import { Link } from 'react-router-dom';
import { PILOT_MAILTO, SUPPORT_EMAIL } from '@/lib/supportConfig';

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <img
              src="/brand/swim-sight-emblem.png"
              alt="Swim Sight 3D"
              width={44}
              height={44}
              className="h-11 w-11 object-contain"
            />
            <div>
              <div className="text-sm font-bold text-slate-950">Swim Sight 3D</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Coach-led video review.</div>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-600">
            Private, coach-led swim video review software for serious coaches and clubs. Built around coach-created feedback, private video handling, and clear swimmer improvement reports.
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
            Built for Australian swim clubs and coaches.
          </p>
          <div className="mt-5">
            <a
              href={PILOT_MAILTO}
              className="inline-flex items-center rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Book a pilot
            </a>
            <p className="mt-3 text-xs text-slate-500">
              Questions? Email <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-sky-700 hover:text-sky-900">{SUPPORT_EMAIL}</a>
            </p>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Product</div>
          <div className="mt-4 grid gap-2.5 text-sm">
            <Link to="/for-coaches" className="text-slate-600 hover:text-slate-950">Clubs & Coaches</Link>
            <Link to="/coach-approved-ai" className="text-slate-600 hover:text-slate-950">Trust & Privacy + FAQ</Link>
            <Link to="/sample-report" className="text-slate-600 hover:text-slate-950">Sample Report</Link>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Access</div>
          <div className="mt-4 grid gap-2.5 text-sm">
            <Link to="/pricing" className="text-slate-600 hover:text-slate-950">Pilot Access</Link>
            <Link to="/login" className="text-slate-600 hover:text-slate-950">Login</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 px-4 py-5">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Swim Sight 3D.</span>
          <span>Coach-reviewed reports. Private videos. Every shared finding is coach-approved.</span>
        </div>
      </div>
    </footer>
  );
}
