import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout, { PublicHero, PublicSection } from '@/components/public/PublicLayout';
import StructuredData from '@/components/seo/StructuredData';
import usePublicMeta from './usePublicMeta';
import { publicSeoMetadata } from './publicSeoMetadata';
import { breadcrumbStructuredData } from './publicStructuredData';
import { strokePages } from './strokePageData';

export default function StrokeDetailPage({ stroke }) {
  const page = strokePages[stroke];

  usePublicMeta(publicSeoMetadata[page.seoKey]);

  return (
    <PublicLayout>
      <StructuredData
        data={breadcrumbStructuredData([
          { name: 'Home', path: '/' },
          { name: 'Stroke Analysis', path: '/stroke-analysis' },
          { name: page.navLabel, path: `/stroke-analysis/${stroke}` },
        ])}
      />
      <PublicHero
        eyebrow="Stroke analysis"
        title={page.h1}
        description={page.intro}
        actions={
          <>
            <Link to="/sample-report" className="rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">See report structure</Link>
            <Link to="/features" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">Explore Coach Studio</Link>
          </>
        }
      />
      <PublicSection title="Review phases" description="Use phases as checkpoints during video review, not as automated claims. The coach decides which moments belong in the final report.">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-4 text-white sm:p-6">
          <div className="mb-5 flex flex-col gap-2 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">{page.navLabel} phase map</div>
              <h2 className="mt-2 text-2xl font-bold">Coach review checkpoints</h2>
            </div>
            <div className="text-sm text-slate-300">Tag moments, then decide what belongs in the report.</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {page.phases.map((phase, index) => (
              <div key={phase} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Phase {index + 1}</div>
                <h2 className="mt-2 text-base font-bold">{phase}</h2>
                <p className="mt-2 text-xs leading-6 text-slate-300">Tag the moment, add the cue, and include it only when coach-approved.</p>
              </div>
            ))}
          </div>
        </div>
      </PublicSection>
      <PublicSection subtle title="Common faults coaches can document">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {page.faults.map((fault) => (
            <div key={fault} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold leading-6 text-slate-800 shadow-sm">
              {fault}
            </div>
          ))}
        </div>
      </PublicSection>
      <PublicSection title="Coach-approved reporting">
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-sky-600">Report structure</div>
            <h2 className="mt-3 text-2xl font-bold text-slate-950">From phase to swimmer plan.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Findings can be AI-assisted or manual, but every report item should be coach-reviewed before it is finalised or shared.
            </p>
            <Link to="/sample-report" className="mt-5 inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              View sample report
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['What we saw', `The coach records the ${page.navLabel.toLowerCase()} moment that matters.`],
              ['Why it matters', 'The finding explains the effect in swimmer-friendly language.'],
              ['What to feel', 'The cue gives the swimmer a practical sensation to aim for.'],
              ['Recommended drill', 'The report points the swimmer toward focused pool work.'],
            ].map(([item, text]) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-sm font-bold text-slate-900">{item}</div>
                <p className="mt-2 text-xs leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </PublicSection>
      <PublicSection subtle title="Keep exploring Swim Sight 3D">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to="/stroke-analysis" className="rounded-full border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-white">All stroke analysis pages</Link>
          <Link to="/sample-report" className="rounded-full border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-white">View sample report</Link>
          <Link to="/features" className="rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">Explore features</Link>
        </div>
      </PublicSection>
    </PublicLayout>
  );
}
