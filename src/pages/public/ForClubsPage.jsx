import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock, ShieldCheck, Target, Users } from 'lucide-react';
import PublicLayout, { PublicHero, PublicSection } from '@/components/public/PublicLayout';
import StructuredData from '@/components/seo/StructuredData';
import usePublicMeta from './usePublicMeta';
import { publicSeoMetadata } from './publicSeoMetadata';
import { breadcrumbStructuredData } from './publicStructuredData';

const clubFlow = ['Club workspace', 'Squads', 'Coach review', 'Shared reports', 'Progress direction'];

export default function ForClubsPage() {
  usePublicMeta(publicSeoMetadata.clubs);

  return (
    <PublicLayout>
      <StructuredData data={breadcrumbStructuredData([{ name: 'Home', path: '/' }, { name: 'For Clubs', path: '/for-clubs' }])} />
      <PublicHero
        eyebrow="For clubs"
        title="Swimming analysis workflows for clubs and squads."
        description="Create shared coaching language, organise swimmers by squad, and keep reports consistent across coaches without exposing private video publicly."
        actions={
          <>
            <Link to="/pricing" className="rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">See pilot options</Link>
            <Link to="/sample-report" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">View sample report</Link>
            <Link to="/privacy-video-review" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">Privacy + video review</Link>
          </>
        }
      />
      <PublicSection title="A club system, not just another video folder" description="Clubs need repeatable coaching language across squads, coaches, and swimmer reports. Swim Sight 3D keeps that workflow organised around private club workspaces.">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10 sm:p-6">
          <div className="grid gap-3 md:grid-cols-5">
            {clubFlow.map((step, index) => (
              <div key={step} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Layer {index + 1}</div>
                <div className="mt-2 text-sm font-bold">{step}</div>
              </div>
            ))}
          </div>
        </div>
      </PublicSection>
      <PublicSection subtle title="Club workflow foundations">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [Users, 'Squad organisation', 'Group swimmers by squad and make it easier for coaches to find the right athlete before review.'],
              [Target, 'Shared technical language', 'Use consistent stroke phases, fault tags, drills, and report language across the club.'],
              [ShieldCheck, 'Role-based access', 'Separate owner, admin, coach, assistant coach, swimmer, and parent access inside the workspace.'],
              [Lock, 'Private workspace', 'Video handling is designed around private storage and short-lived signed access inside the app.'],
            ].map(([Icon, title, description]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <Icon className="h-5 w-5 text-sky-600" />
                <h2 className="mt-4 text-base font-bold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-sky-600">Consistent coaching language</div>
            <h2 className="mt-3 text-2xl font-bold text-slate-950">One structure from coach to coach.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Reports follow a repeatable format: what we saw, why it matters, what to feel, recommended drill, and next focus. That makes feedback easier for swimmers to understand and easier for clubs to review over time.
            </p>
            <div className="mt-5 grid gap-2">
              {['Stroke phase', 'Fault tag', 'Coach cue', 'Drill', 'Next focus'].map(item => (
                <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">{item}</div>
              ))}
            </div>
            <Link to="/sample-report" className="mt-6 inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              See report format <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link to="/privacy-video-review" className="ml-0 mt-3 inline-flex items-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 sm:ml-2">
              Video privacy <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </PublicSection>
      <PublicSection subtle title="No enterprise overpromise" description="Swim Sight 3D is being prepared for serious pilot clubs. Advanced enterprise operations should be scoped directly with the club." />
    </PublicLayout>
  );
}
