import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout, { PublicCard, PublicHero, PublicSection } from '@/components/public/PublicLayout';
import usePublicMeta from './usePublicMeta';
import { publicSeoMetadata } from './publicSeoMetadata';

const reportItems = [
  ['What we saw', 'Breaststroke kick setup is slightly wide before the drive phase.'],
  ['Why it matters', 'A wider setup can delay line reset and make it harder to hold forward momentum.'],
  ['What to feel', 'Feel heels recover inside the hips before turning the feet out for the drive.'],
  ['Recommended drill', 'Narrow heel recovery drill with streamline reset after every kick.'],
  ['Next focus', 'Hold the line for one full count after the kick drive.'],
];

export default function SampleReportPage() {
  usePublicMeta(publicSeoMetadata.sampleReport);

  return (
    <PublicLayout>
      <PublicHero
        eyebrow="Sample report"
        title="Sample swimming analysis report."
        description="This public sample shows the kind of report structure coaches can share after approving findings. It uses demo content only."
        actions={<Link to="/login" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Create reports in app</Link>}
      />
      <PublicSection title="Demo report preview" description="Example content only. Real reports are created from coach-reviewed club data.">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-950/8" aria-label="Demo Swim Sight 3D swimmer improvement report preview">
          <div className="border-b border-slate-200 bg-slate-950 p-6 text-white">
            <div className="text-xs uppercase tracking-[0.24em] text-cyan-200">Swim Sight 3D report</div>
            <h2 className="mt-3 text-2xl font-bold">Demo Swimmer · Breaststroke Review</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">AI-assisted evidence supports coach review. Final report content is coach-approved.</p>
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-2">
            <PublicCard title="Swimmer profile" description="Demo swimmer · Breaststroke · Side view · Training clip" />
            <PublicCard title="Key moment" description="0:03.42 · Kick setup · Coach-selected timestamp" />
            {reportItems.map(([title, description]) => (
              <PublicCard key={title} title={title} description={description} />
            ))}
          </div>
        </div>
      </PublicSection>
      <PublicSection subtle title="What public reports do not include" description="Public shared reports should not include private video paths, signed URLs, raw AI payloads, rejected findings, pending findings, or private coach notes." />
      <PublicSection title="Explore the workflow behind this report">
        <div className="flex flex-wrap gap-3">
          <Link to="/features" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">Explore features</Link>
          <Link to="/for-coaches" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">For coaches</Link>
          <Link to="/for-clubs" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">For clubs</Link>
          <Link to="/login" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Log in</Link>
        </div>
      </PublicSection>
    </PublicLayout>
  );
}
