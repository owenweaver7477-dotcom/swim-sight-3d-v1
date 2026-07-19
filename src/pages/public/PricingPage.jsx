import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import PublicLayout, { PublicHero, PublicSection } from '@/components/public/PublicLayout';
import { PILOT_MAILTO } from '@/lib/supportConfig';
import StructuredData from '@/components/seo/StructuredData';
import usePublicMeta from './usePublicMeta';
import { publicSeoMetadata } from './publicSeoMetadata';
import { breadcrumbStructuredData } from './publicStructuredData';
import { PLAN_DEFINITIONS, PLAN_KEYS } from '@/lib/plans/featureGates';

const tiers = [
  {
    plan: PLAN_DEFINITIONS[PLAN_KEYS.COACH_STUDIO],
    items: ['Manual Coach Studio', 'Key moments and Coach Draw', 'Coach findings and drill suggestions', 'Secure shared reports'],
    note: 'Pricing is being finalised for pilot coaches.',
    featured: true,
  },
  {
    plan: PLAN_DEFINITIONS[PLAN_KEYS.CLUB_PRO],
    items: ['Squads and swimmer profiles', 'Multi-coach roles', 'Shared technical language', 'Club report history'],
    note: 'Pilot club setup is scoped with the coaching team.',
  },
];

export default function PricingPage() {
  usePublicMeta(publicSeoMetadata.pricing);

  return (
    <PublicLayout>
      <StructuredData data={breadcrumbStructuredData([{ name: 'Home', path: '/' }, { name: 'Pilot Access', path: '/pricing' }])} />
      <PublicHero
        eyebrow="Pilot Access"
        title="Join the Swim Sight 3D pilot."
        description="We're piloting with a small number of Australian swim clubs. There's no billing or checkout yet — pilot access and pricing are arranged directly with your coaching team."
        actions={(
          <>
            <a href={PILOT_MAILTO} className="rounded-lg bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">Book a pilot</a>
            <Link to="/sample-report" className="rounded-lg border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100">View sample report</Link>
          </>
        )}
      />
      <PublicSection title="What a pilot includes" description="The parts of Swim Sight 3D a pilot club can use today. Pricing is finalised with pilot clubs — no payment flow on this site.">
        <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
          {tiers.map(({ plan, items, note, featured }) => (
            <article key={plan.key} className={`rounded-lg border p-5 shadow-sm ${featured ? 'border-sky-200 bg-sky-50' : 'border-slate-200 bg-white'}`}>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Pilot lane</div>
              <h2 className="mt-3 text-xl font-bold text-slate-950">{plan.label}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{plan.description}</p>
              <div className="mt-5 grid gap-2">
                {items.map(item => (
                  <div key={item} className="flex items-start gap-2 text-sm font-semibold leading-6 text-slate-800">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-700" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-lg border border-slate-200 bg-white/80 p-3 text-sm font-semibold leading-6 text-slate-700">{note}</div>
              <a href={PILOT_MAILTO} className="mt-4 inline-flex w-full justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800">
                {plan.ctaLabel}
              </a>
            </article>
          ))}
        </div>
        <p className="mt-6 text-xs leading-6 text-slate-500">
          This shows the planned structure only — there is no billing, checkout, or subscription on this site. Email us and we&apos;ll scope the right pilot for your club.
        </p>
      </PublicSection>
    </PublicLayout>
  );
}
