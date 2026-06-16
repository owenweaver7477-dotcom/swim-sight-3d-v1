import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout, { PublicCard, PublicHero, PublicSection } from '@/components/public/PublicLayout';
import usePublicMeta from './usePublicMeta';
import { strokePages } from './strokePageData';

export default function StrokeAnalysisPage() {
  usePublicMeta('Stroke Analysis', 'Explore Swim Sight 3D stroke analysis structure for breaststroke, freestyle, backstroke, and butterfly coaching workflows.');

  return (
    <PublicLayout>
      <PublicHero
        eyebrow="Stroke analysis"
        title="Stroke review pages for coach-approved technical reporting."
        description="Swim Sight 3D organises analysis around stroke phases, common faults, coach cues, drills, and report-ready findings. AI can assist, but coaches approve the final content."
      />
      <PublicSection title="Choose a stroke">
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(strokePages).map(([slug, page]) => (
            <Link key={slug} to={`/stroke-analysis/${slug}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-sky-200 hover:shadow-md">
              <h2 className="text-lg font-bold text-slate-950">{page.h1.replace(' analysis', '')}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{page.intro}</p>
            </Link>
          ))}
        </div>
      </PublicSection>
      <PublicSection subtle title="What stroke analysis means here" description="It means a structured coaching workflow: review the video, tag the phase, identify the technical fault, approve or write the finding, assign a drill, and share the improvement plan." />
    </PublicLayout>
  );
}
