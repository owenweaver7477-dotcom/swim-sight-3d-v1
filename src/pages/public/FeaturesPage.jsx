import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout, { PublicCard, PublicHero, PublicSection } from '@/components/public/PublicLayout';
import StructuredData from '@/components/seo/StructuredData';
import usePublicMeta from './usePublicMeta';
import { publicSeoMetadata } from './publicSeoMetadata';
import { breadcrumbStructuredData } from './publicStructuredData';

const features = [
  ['Video upload', 'Upload race or training footage into a private club workspace.'],
  ['Coach Studio', 'Slow video down, save key moments, draw on frames, and create findings from timestamps.'],
  ['Key moments', 'Mark the points that matter: catch, breath, kick setup, body line, turns, and more.'],
  ['Coach Draw', 'Use coach-created annotations to explain line, timing, angles, and cues visually.'],
  ['AI-assisted findings', 'AI can suggest draft findings when evidence quality is strong enough.'],
  ['Manual coach findings', 'Coaches can create complete findings even when AI is not used or not confident.'],
  ['Drill suggestions', 'Connect technical faults to corrective drills and next-focus areas.'],
  ['Shared reports', 'Create swimmer-friendly reports with approved findings, cues, drills, and selected annotations.'],
  ['Squad management', 'Organise swimmers by club, squad, stroke focus, role, and coach notes.'],
  ['Club progress tracking', 'Track finalised reports and approved finding patterns without fake metrics.'],
];

export default function FeaturesPage() {
  usePublicMeta(publicSeoMetadata.features);

  return (
    <PublicLayout>
      <StructuredData data={breadcrumbStructuredData([{ name: 'Home', path: '/' }, { name: 'Features', path: '/features' }])} />
      <PublicHero
        eyebrow="Features"
        title="Swimming video analysis features for coaches."
        description="Swim Sight 3D brings video, coach-created findings, AI-assisted draft evidence, drills, and shared reports into one club-ready workflow."
        actions={<Link to="/login" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Open App</Link>}
      />
      <PublicSection title="Core capabilities" description="These are the practical tools coaches use to turn footage into an improvement plan.">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map(([title, description]) => (
            <PublicCard key={title} title={title} description={description} />
          ))}
        </div>
      </PublicSection>
      <PublicSection subtle title="Built around coach approval" description="AI findings are draft evidence. Coaches decide what is accurate, what needs editing, and what belongs in the final report." />
    </PublicLayout>
  );
}
