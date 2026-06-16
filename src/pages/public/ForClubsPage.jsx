import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout, { PublicCard, PublicHero, PublicSection } from '@/components/public/PublicLayout';
import usePublicMeta from './usePublicMeta';

export default function ForClubsPage() {
  usePublicMeta('For Clubs', 'Swim Sight 3D gives swim clubs private workspaces for squads, coaches, technical findings, reports, and progress tracking.');

  return (
    <PublicLayout>
      <PublicHero
        eyebrow="For clubs"
        title="A private technical review workspace for squads and coaching teams."
        description="Create shared coaching language, organise swimmers by squad, and keep reports consistent across coaches without exposing private video publicly."
        actions={<Link to="/pricing" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">See pilot options</Link>}
      />
      <PublicSection title="Club workflow foundations">
        <div className="grid gap-4 md:grid-cols-3">
          <PublicCard title="Squad organisation" description="Group swimmers by squad and make it easier for coaches to find the right athlete before review." />
          <PublicCard title="Shared technical language" description="Use consistent stroke phases, fault tags, drills, and report language across the club." />
          <PublicCard title="Role-based access" description="Separate owner, admin, coach, assistant coach, swimmer, and parent access inside the workspace." />
          <PublicCard title="Consistent reporting" description="Reports follow a repeatable structure: what we saw, why it matters, cue, drill, and next focus." />
          <PublicCard title="Technical fault visibility" description="Club progress views can surface common approved fault tags from real finalised reports." />
          <PublicCard title="Private workspace" description="Video handling is designed around private storage and short-lived signed access inside the app." />
        </div>
      </PublicSection>
      <PublicSection subtle title="No enterprise overpromise" description="Swim Sight 3D is being prepared for serious pilot clubs. Advanced enterprise operations should be scoped directly with the club." />
    </PublicLayout>
  );
}
