import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import PublicLayout, { PublicHero, PublicSection } from '@/components/public/PublicLayout';
import StructuredData from '@/components/seo/StructuredData';
import usePublicMeta from './usePublicMeta';
import { publicSeoMetadata } from './publicSeoMetadata';
import { breadcrumbStructuredData } from './publicStructuredData';

const tiers = [
  ['Coach Studio', 'For individual coaches testing video review, Coach Studio, reports, and manual delivery.', ['Coach Studio', 'Manual findings', 'Secure report links'], 'Pricing is being finalised for pilot coaches.'],
  ['AI Assist', 'For coaches testing AI-assisted draft evidence with strict coach approval and manual review fallback.', ['AI draft findings', 'Quality-gated review', 'Coach approval workflow'], 'Pilot access depends on current AI processing capacity.'],
  ['Club Pro', 'For clubs testing squads, roles, shared coaching language, swimmer profiles, and report workflows.', ['Squads and roles', 'Shared technical language', 'Club report history'], 'Pilot club setup is scoped with the coaching team.'],
  ['Elite Lab', 'For future deeper club rollout planning, support, and advanced workflow scoping.', ['Custom onboarding', 'Workflow support', 'Future capability planning'], 'Custom setup is discussed directly before rollout.'],
];

export default function PricingPage() {
  usePublicMeta(publicSeoMetadata.pricing);

  return (
    <PublicLayout>
      <StructuredData data={breadcrumbStructuredData([{ name: 'Home', path: '/' }, { name: 'Pricing', path: '/pricing' }])} />
      <PublicHero
        eyebrow="Pricing"
        title="Swim Sight 3D pricing for coaches and clubs."
        description="Swim Sight 3D is currently being prepared for serious coach and club pilot use. Billing is not enabled on this public website."
        actions={<Link to="/login" className="rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">Request access through the app</Link>}
      />
      <PublicSection title="Pilot options" description="These are product access lanes, not live payment plans. Pricing is being finalised for pilot coaches and clubs.">
        <div className="grid gap-4 lg:grid-cols-4">
          {tiers.map(([title, description, items, note], index) => (
            <article key={title} className={`rounded-3xl border p-5 shadow-sm ${index === 1 ? 'border-sky-200 bg-sky-50' : 'border-slate-200 bg-white'}`}>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Pilot lane</div>
              <h2 className="mt-3 text-xl font-bold text-slate-950">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
              <div className="mt-5 grid gap-2">
                {items.map(item => (
                  <div key={item} className="flex items-start gap-2 text-sm font-semibold leading-6 text-slate-800">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-600" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm font-semibold leading-6 text-slate-700">{note}</div>
            </article>
          ))}
        </div>
      </PublicSection>
      <PublicSection subtle title="No payment flow yet" description="This phase only creates public pricing structure. It does not add billing, payment collection, or subscription logic." />
    </PublicLayout>
  );
}
