import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout, { PublicCard, PublicHero, PublicSection } from '@/components/public/PublicLayout';
import usePublicMeta from './usePublicMeta';
import { publicSeoMetadata } from './publicSeoMetadata';
import { strokePages } from './strokePageData';

export default function StrokeDetailPage({ stroke }) {
  const page = strokePages[stroke];

  usePublicMeta(publicSeoMetadata[page.seoKey]);

  return (
    <PublicLayout>
      <PublicHero
        eyebrow="Stroke analysis"
        title={page.h1}
        description={page.intro}
        actions={<Link to="/sample-report" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">See report structure</Link>}
      />
      <PublicSection title="Review phases">
        <div className="grid gap-4 md:grid-cols-3">
          {page.phases.map((phase) => (
            <PublicCard key={phase} title={phase} description="A coach can tag this phase, add a timestamped finding, connect a cue, and include approved feedback in the report." />
          ))}
        </div>
      </PublicSection>
      <PublicSection subtle title="Common faults coaches can document">
        <div className="grid gap-3 md:grid-cols-5">
          {page.faults.map((fault) => (
            <div key={fault} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm">
              {fault}
            </div>
          ))}
        </div>
      </PublicSection>
      <PublicSection title="Coach-approved reporting" description="Findings can be AI-assisted or manual, but every report item should be coach-reviewed before it is finalised or shared." />
      <PublicSection subtle title="Keep exploring Swim Sight 3D">
        <div className="flex flex-wrap gap-3">
          <Link to="/stroke-analysis" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-white">All stroke analysis pages</Link>
          <Link to="/sample-report" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-white">View sample report</Link>
          <Link to="/features" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Explore features</Link>
        </div>
      </PublicSection>
    </PublicLayout>
  );
}
