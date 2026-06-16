import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout, { PublicCard, PublicHero, PublicSection } from '@/components/public/PublicLayout';
import StructuredData from '@/components/seo/StructuredData';
import usePublicMeta from './usePublicMeta';
import { publicSeoMetadata } from './publicSeoMetadata';
import { breadcrumbStructuredData } from './publicStructuredData';

export default function ForCoachesPage() {
  usePublicMeta(publicSeoMetadata.coaches);

  return (
    <PublicLayout>
      <StructuredData data={breadcrumbStructuredData([{ name: 'Home', path: '/' }, { name: 'For Coaches', path: '/for-coaches' }])} />
      <PublicHero
        eyebrow="For coaches"
        title="Turn swim video into clearer coach feedback."
        description="Use video, key moments, drawing tools, manual findings, and AI-assisted draft evidence to create feedback that swimmers can actually understand."
        actions={<Link to="/sample-report" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">View sample report</Link>}
      />
      <PublicSection title="What coaches get">
        <div className="grid gap-4 md:grid-cols-3">
          <PublicCard title="Faster video review" description="Slow playback down, step approximately through key moments, and capture timestamps without losing the coaching flow." />
          <PublicCard title="Clearer swimmer feedback" description="Explain what was seen, why it matters, what to feel in the water, and what drill to practise next." />
          <PublicCard title="Coach-approved reports" description="Every shared report is built from content the coach has approved, edited, or created manually." />
          <PublicCard title="Timestamped key moments" description="Save report-ready moments for breath timing, catch setup, kick drive, body line, turns, and breakouts." />
          <PublicCard title="Drill assignment" description="Attach relevant drills and next-focus items so feedback turns into practical training direction." />
          <PublicCard title="Professional delivery" description="Share secure reports with swimmers or parents without sending private video files publicly." />
        </div>
      </PublicSection>
      <PublicSection subtle title="AI is an assistant inside the coach workflow" description="When video evidence is strong enough, AI can suggest draft findings. When it is not, Coach Studio still supports a complete manual review." />
    </PublicLayout>
  );
}
