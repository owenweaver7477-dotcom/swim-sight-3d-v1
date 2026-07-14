import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock3, Dumbbell, FileText, PencilLine, Video } from 'lucide-react';
import PublicLayout, { PublicHero, PublicSection } from '@/components/public/PublicLayout';
import StructuredData from '@/components/seo/StructuredData';
import usePublicMeta from './usePublicMeta';
import { publicSeoMetadata } from './publicSeoMetadata';
import { breadcrumbStructuredData } from './publicStructuredData';

const poolDeckFlow = [
  ['Mark the moment', 'Capture the timestamp when the swimmer needs the correction.'],
  ['Explain the correction', 'Write what happened, why it matters, and what the swimmer should feel.'],
  ['Assign the drill', 'Connect the finding to practical pool work.'],
  ['Share the plan', 'Send a clean improvement report instead of loose video comments.'],
];

export default function ForCoachesPage() {
  usePublicMeta(publicSeoMetadata.coaches);

  return (
    <PublicLayout>
      <StructuredData data={breadcrumbStructuredData([{ name: 'Home', path: '/' }, { name: 'For Coaches', path: '/for-coaches' }])} />
      <PublicHero
        eyebrow="For coaches"
        title="Turn swim video into clearer coach feedback."
        description="Key moments, drawing tools, and coach findings — feedback swimmers actually understand."
        actions={
          <>
            <Link to="/sample-report" className="rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">View sample report</Link>
            <Link to="/for-coaches" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">See Coach Studio</Link>
            <Link to="/coach-approved-ai" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">AI + trust</Link>
          </>
        }
      />
      <PublicSection title="The problem: video feedback gets messy fast." description="Coaches know what they saw — but it scatters across clips, memory, chats, and notes.">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Without a system</div>
            <div className="mt-5 grid gap-3">
              {['Loose clips are hard to revisit', 'Corrections lose timestamp context', 'Drill follow-up is easy to forget', 'Parents and swimmers receive mixed detail'].map(item => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm">{item}</div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-sky-100 bg-sky-50 p-6">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-sky-700">With Coach Studio</div>
            <h2 className="mt-3 text-2xl font-bold text-slate-950">The moment becomes the report.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Moment, observation, cue, drill, and next focus — together in one coach-approved workflow.
            </p>
            <Link to="/sample-report" className="mt-6 inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              See the output <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </PublicSection>
      <PublicSection subtle title="Pool-deck workflow" description="Review the clip, mark the moment, explain the correction, send the plan.">
        <div className="grid gap-4 md:grid-cols-4">
          {poolDeckFlow.map(([title, description], index) => (
            <div key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-cyan-200">{index + 1}</div>
              <h2 className="text-base font-bold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </PublicSection>
      <PublicSection title="What coaches get" description="The tools are practical, not ornamental. They support the review a coach already wants to do.">
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            [Video, 'Faster video review', 'Slow playback, step through key moments, and capture timestamps.'],
            [PencilLine, 'Coach Draw', 'Mark body line, timing, angle, or correction cues directly on selected frames.'],
            [FileText, 'Coach-approved reports', 'Every shared report is built from content the coach has approved, edited, or created manually.'],
            [Clock3, 'Timestamped key moments', 'Save report-ready moments for catch, kick, body line, turns, and breakouts.'],
            [Dumbbell, 'Drill assignment', 'Attach relevant drills and next-focus items so feedback turns into practical training direction.'],
            [CheckCircle2, 'Professional delivery', 'Share secure reports with swimmers or parents without sending private video files publicly.'],
          ].map(([Icon, title, description]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="h-5 w-5 text-sky-600" />
              <h3 className="mt-4 text-base font-bold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </PublicSection>
      <PublicSection subtle title="You stay in control of every finding" description="Swim Sight 3D is a manual review workspace — the coach marks moments, draws, and writes every finding before it reaches a report.">
        <Link to="/coach-approved-ai" className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Read about trust and privacy
        </Link>
      </PublicSection>
    </PublicLayout>
  );
}
