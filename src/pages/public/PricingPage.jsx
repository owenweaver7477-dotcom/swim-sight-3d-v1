import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Lock } from 'lucide-react';
import PublicLayout, { PublicHero, PublicSection } from '@/components/public/PublicLayout';
import StructuredData from '@/components/seo/StructuredData';
import usePublicMeta from './usePublicMeta';
import { publicSeoMetadata } from './publicSeoMetadata';
import { breadcrumbStructuredData } from './publicStructuredData';
import { PLAN_DEFINITIONS, PLAN_KEYS, AI_CREDIT_COPY } from '@/lib/plans/featureGates';

const tiers = [
  {
    plan: PLAN_DEFINITIONS[PLAN_KEYS.COACH_STUDIO],
    items: ['Manual Coach Studio', 'Key moments and Coach Draw', 'Manual findings and drill suggestions', 'Secure shared reports'],
    note: 'Pricing is being finalised for pilot coaches.',
  },
  {
    plan: PLAN_DEFINITIONS[PLAN_KEYS.AI_ASSIST],
    items: ['AI draft findings', 'AI review credits', 'Quality-gated fallback to manual review', 'Coach approval required'],
    note: 'Pilot access depends on current AI processing capacity.',
    featured: true,
  },
  {
    plan: PLAN_DEFINITIONS[PLAN_KEYS.CLUB_PRO],
    items: ['Squads and swimmer profiles', 'Multi-coach roles', 'Shared technical language', 'Club report history'],
    note: 'Pilot club setup is scoped with the coaching team.',
  },
  {
    plan: PLAN_DEFINITIONS[PLAN_KEYS.ELITE_LAB],
    items: ['Future multi-angle review', 'Future 3D reference comparison', 'Future priority AI', 'Premium export planning'],
    note: 'Future premium lab tier. It is not a live measurement product today.',
  },
];

export default function PricingPage() {
  usePublicMeta(publicSeoMetadata.pricing);

  return (
    <PublicLayout>
      <StructuredData data={breadcrumbStructuredData([{ name: 'Home', path: '/' }, { name: 'Pricing', path: '/pricing' }])} />
      <PublicHero
        eyebrow="Pricing"
        title="Swim Sight 3D pricing for coaches and clubs."
        description="Being prepared for serious coach and club pilots. Billing isn't enabled on this public site."
        actions={<Link to="/login" className="rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">Request access through the app</Link>}
      />
      <PublicSection title="Pilot options" description="Access lanes, not live payment plans. Pricing is being finalised for pilots.">
        <div className="grid gap-4 lg:grid-cols-4">
          {tiers.map(({ plan, items, note, featured }) => (
            <article key={plan.key} className={`rounded-3xl border p-5 shadow-sm ${featured ? 'border-sky-200 bg-sky-50' : 'border-slate-200 bg-white'}`}>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Pilot lane</div>
              <h2 className="mt-3 text-xl font-bold text-slate-950">{plan.label}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{plan.description}</p>
              <div className="mt-5 grid gap-2">
                {items.map(item => (
                  <div key={item} className="flex items-start gap-2 text-sm font-semibold leading-6 text-slate-800">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-600" />
                    {item}
                  </div>
                ))}
              </div>
              {plan.key === PLAN_KEYS.AI_ASSIST && (
                <div className="mt-4 rounded-2xl border border-sky-200 bg-white/80 p-3 text-xs leading-6 text-slate-700">
                  {AI_CREDIT_COPY.standardReview} {AI_CREDIT_COPY.manualReport}
                </div>
              )}
              {plan.key === PLAN_KEYS.ELITE_LAB && (
                <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-800">
                  <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  Elite Lab is future premium access for reference comparison in development. It is not a live measurement product today.
                </div>
              )}
              <div className="mt-5 rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm font-semibold leading-6 text-slate-700">{note}</div>
              <Link to="/login" className="mt-4 inline-flex w-full justify-center rounded-full bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800">
                {plan.ctaLabel}
              </Link>
            </article>
          ))}
        </div>
      </PublicSection>
      <PublicSection subtle title="No payment flow yet" description="Shows the planned structure only — no billing, checkout, or subscriptions yet." />
    </PublicLayout>
  );
}
