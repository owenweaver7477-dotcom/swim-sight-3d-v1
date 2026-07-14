import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock3, Dumbbell, FileText, Lock, PencilLine, ShieldCheck, Target, Users, Video } from 'lucide-react';
import PublicLayout, { PublicHero, PublicSection } from '@/components/public/PublicLayout';
import StructuredData from '@/components/seo/StructuredData';
import usePublicMeta from './usePublicMeta';
import { publicSeoMetadata } from './publicSeoMetadata';
import { breadcrumbStructuredData } from './publicStructuredData';

const coachTools = [
  [Video, 'Faster video review', 'Slow playback, step through key moments, and capture timestamps.'],
  [PencilLine, 'Coach Draw', 'Mark body line, timing, angle, or correction cues directly on selected frames.'],
  [FileText, 'Coach-approved reports', 'Every shared report is built from content the coach reviewed, edited, or created.'],
  [Clock3, 'Timestamped key moments', 'Save report-ready moments for catch, kick, body line, turns, and breakouts.'],
  [Dumbbell, 'Drill assignment', 'Attach drills and next-focus items so feedback turns into practical training.'],
  [CheckCircle2, 'Professional delivery', 'Share secure reports with swimmers or parents — never private video files.'],
];

const clubFoundations = [
  [Users, 'Squad organisation', 'Group swimmers by squad so coaches find the right athlete fast.'],
  [Target, 'Shared technical language', 'Consistent stroke phases, cues, drills, and report language across the club.'],
  [ShieldCheck, 'Role-based access', 'Separate owner, admin, coach, swimmer, and parent access inside the workspace.'],
  [Lock, 'Private workspace', 'Video handling is built around private storage and short-lived signed access.'],
];

export default function ForCoachesPage() {
  usePublicMeta(publicSeoMetadata.coaches);

  return (
    <PublicLayout>
      <StructuredData data={breadcrumbStructuredData([{ name: 'Home', path: '/' }, { name: 'Clubs and Coaches', path: '/for-coaches' }])} />
      <PublicHero
        eyebrow="For clubs and coaches"
        title="One clear video-review system, from pool deck to club."
        description="Coaches mark the moment, draw the correction, and share a clean report. Clubs get one shared coaching language across every squad."
        actions={
          <>
            <Link to="/sample-report" className="rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">View sample report</Link>
            <Link to="/pricing" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">See pilot options</Link>
          </>
        }
      />

      {/* ── Coaches ─────────────────────────────────────────────── */}
      <PublicSection title="For coaches: the moment becomes the report." description="Review the clip, mark the moment, explain the correction, and send the plan — one coach-approved workflow instead of loose clips and chat messages.">
        <div className="grid gap-4 lg:grid-cols-3">
          {coachTools.map(([Icon, title, description]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="h-5 w-5 text-sky-600" />
              <h3 className="mt-4 text-base font-bold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </PublicSection>

      {/* ── Clubs ───────────────────────────────────────────────── */}
      <PublicSection subtle title="For clubs: a system, not just another video folder." description="Repeatable coaching language across squads and coaches, inside one private club workspace.">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {clubFoundations.map(([Icon, title, description]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <Icon className="h-5 w-5 text-sky-600" />
                <h3 className="mt-4 text-base font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-sky-600">One report structure</div>
            <h2 className="mt-3 text-2xl font-bold text-slate-950">The same format, coach to coach.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Every report follows one structure: what we saw, why it matters, what to feel, the drill, and the next focus.
            </p>
            <div className="mt-5 grid gap-2">
              {['Stroke phase', 'Coach cue', 'Drill', 'Next focus'].map(item => (
                <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">{item}</div>
              ))}
            </div>
            <Link to="/sample-report" className="mt-6 inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              See the report format <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </PublicSection>

      {/* ── Control + pilot ─────────────────────────────────────── */}
      <PublicSection subtle title="You stay in control of every finding." description="Swim Sight 3D is a manual review workspace — the coach marks moments, draws, and writes every finding before it reaches a swimmer report. We set each club pilot up directly with your coaching team.">
        <div className="flex flex-wrap gap-3">
          <Link to="/coach-approved-ai" className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Read about trust and privacy
          </Link>
          <Link to="/pricing" className="inline-flex rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            Book a club pilot
          </Link>
        </div>
      </PublicSection>
    </PublicLayout>
  );
}
