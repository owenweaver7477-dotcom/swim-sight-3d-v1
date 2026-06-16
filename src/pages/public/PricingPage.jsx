import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout, { PublicCard, PublicHero, PublicSection } from '@/components/public/PublicLayout';
import usePublicMeta from './usePublicMeta';
import { publicSeoMetadata } from './publicSeoMetadata';

const tiers = [
  ['Coach pilot', 'For individual coaches testing video review, Coach Studio, reports, and manual delivery.', 'Pricing is being finalised for pilot coaches.'],
  ['Club pilot', 'For clubs testing squads, roles, shared coaching language, and swimmer report workflows.', 'Pilot club setup is scoped with the coaching team.'],
  ['Custom club setup', 'For larger clubs that need onboarding, permissions, workflow support, or custom rollout planning.', 'Custom setup is discussed directly before rollout.'],
];

export default function PricingPage() {
  usePublicMeta(publicSeoMetadata.pricing);

  return (
    <PublicLayout>
      <PublicHero
        eyebrow="Pricing"
        title="Swim Sight 3D pricing for coaches and clubs."
        description="Swim Sight 3D is currently being prepared for serious coach and club pilot use. Billing is not enabled on this public website."
        actions={<Link to="/login" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Request access through the app</Link>}
      />
      <PublicSection title="Pilot options">
        <div className="grid gap-4 md:grid-cols-3">
          {tiers.map(([title, description, note]) => (
            <PublicCard key={title} title={title} description={description}>
              <div className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">{note}</div>
            </PublicCard>
          ))}
        </div>
      </PublicSection>
      <PublicSection subtle title="No payment flow yet" description="This phase only creates public pricing structure. It does not add billing, payment collection, or subscription logic." />
    </PublicLayout>
  );
}
