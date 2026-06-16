import React from 'react';
import { Link } from 'react-router-dom';
import { Waves } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200">
              <Waves className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-bold text-white">Swim Sight 3D</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">AI suggests. Coaches decide.</div>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            AI-assisted swimming analysis report software for serious coaches and clubs. Built around coach-approved feedback, private video handling, and clear swimmer improvement reports.
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Product</div>
          <div className="mt-3 grid gap-2 text-sm">
            <Link to="/features" className="hover:text-white">Features</Link>
            <Link to="/sample-report" className="hover:text-white">Sample Report</Link>
            <Link to="/stroke-analysis" className="hover:text-white">Stroke Analysis</Link>
            <Link to="/pricing" className="hover:text-white">Pricing</Link>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Access</div>
          <div className="mt-3 grid gap-2 text-sm">
            <Link to="/for-coaches" className="hover:text-white">For Coaches</Link>
            <Link to="/for-clubs" className="hover:text-white">For Clubs</Link>
            <Link to="/faq" className="hover:text-white">FAQ</Link>
            <Link to="/login" className="hover:text-white">Login</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Swim Sight 3D.</span>
          <span>Coach-reviewed reports. Private videos. No unsupported biomechanics claims.</span>
        </div>
      </div>
    </footer>
  );
}
