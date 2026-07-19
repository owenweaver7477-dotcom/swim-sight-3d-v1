import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Dumbbell,
  Eye,
  Lock,
  ShieldCheck,
  Target,
  Waves,
} from 'lucide-react';
import PublicLayout, { PublicSection } from '@/components/public/PublicLayout';
import PrivateFramePreview from '@/components/public/PrivateFramePreview';
import StructuredData from '@/components/seo/StructuredData';
import usePublicMeta from './usePublicMeta';
import { publicSeoMetadata } from './publicSeoMetadata';
import { breadcrumbStructuredData } from './publicStructuredData';

const studioGlimpses = [
  ['Analysis', 'Mark key moments frame by frame'],
  ['Findings', 'Write coach findings on the frame'],
  ['Drills & report', 'Attach drills and share the plan'],
];

const keyMoments = [
  {
    time: '0:03.42',
    phase: 'Kick setup',
    note: 'Heels begin to recover, but knees widen slightly before the foot turn.',
  },
  {
    time: '0:04.10',
    phase: 'Foot turn timing',
    note: 'Feet turn before the heels reach the best setup position.',
  },
  {
    time: '0:05.25',
    phase: 'Line reset',
    note: 'Kick finishes downward instead of fully back into the line.',
  },
];

const findings = [
  {
    title: 'Knees widen during heel recovery',
    saw: 'During the kick setup, the knees move wider than the hips before the feet turn out.',
    matters: 'A wide recovery increases resistance and makes it harder to finish the kick backwards into a clean line.',
    feel: 'Bring the heels up first while keeping the knees inside the hips.',
    drill: 'Wall breaststroke kick with narrow knees and late foot turn.',
    next: 'Keep the recovery compact before turning the feet.',
  },
  {
    title: 'Foot turn starts too early',
    saw: 'The feet begin to turn before the heels are high enough, which makes the kick lose pressure at the back end.',
    matters: 'Turning too early can reduce the power of the kick and cause the swimmer to press water down instead of back.',
    feel: 'Heels up, then turn late, then drive back.',
    drill: 'Slow 2-count breaststroke kick: heels up, turn, drive.',
    next: 'Delay the foot turn until the heels are set.',
  },
  {
    title: 'Line reset needs a stronger finish',
    saw: 'After the kick, the body line does not fully lock into a long streamlined position.',
    matters: 'A weak line reset can cause speed to leak away after the kick.',
    feel: 'Finish the kick back and snap into a long, quiet line.',
    drill: 'Breaststroke kick into 3-second line hold.',
    next: 'Hold the line after every kick before starting the next stroke.',
  },
];

function DemoFrame({ moment }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* Real reports carry the marked frame here — blurred on the public demo for
          privacy, with a lock on hover. Synthetic art only, never real footage. */}
      <PrivateFramePreview badge={moment.time} className="h-36 rounded-none" />
      <div className="p-4">
        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-700">{moment.phase}</div>
        <p className="mt-2 text-sm leading-6 text-slate-700">{moment.note}</p>
      </div>
    </div>
  );
}

function FindingCard({ finding, index }) {
  const rows = [
    ['What we saw', finding.saw, Eye],
    ['Why it matters', finding.matters, Waves],
    ['What to feel in the water', finding.feel, Target],
    ['Recommended drill', finding.drill, Dumbbell],
    ['Next focus', finding.next, CheckCircle2],
  ];

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Coach finding {index + 1}</div>
        <h3 className="mt-2 text-xl font-bold text-slate-950">{finding.title}</h3>
      </div>
      <div className="grid gap-4 p-6">
        {rows.map(([label, text, Icon]) => (
          <div key={label} className={`rounded-lg border border-slate-200 p-4 ${label === 'What to feel in the water' || label === 'Recommended drill' ? 'bg-slate-50' : 'bg-white'}`}>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              <Icon className="h-3.5 w-3.5 text-sky-700" />
              {label}
            </div>
            <p className="mt-2 text-sm leading-7 text-slate-800">{text}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function SampleReportPage() {
  usePublicMeta(publicSeoMetadata.sampleReport);

  return (
    <PublicLayout>
      <StructuredData data={breadcrumbStructuredData([{ name: 'Home', path: '/' }, { name: 'Sample Report', path: '/sample-report' }])} />

      <section className="border-b border-slate-200 bg-white px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-700" />
            Demo report — no real swimmer data
          </div>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_0.82fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">Sample swimming analysis report.</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                This public demo shows how Swim Sight 3D turns coach-reviewed video moments into findings, cues, drills, and a swimmer improvement plan.
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-700">Every finding is coach-created. Coaches decide what appears in the final report.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="grid gap-px bg-slate-200">
                {[
                  ['Swimmer', 'Sample Swimmer'],
                  ['Stroke', 'Breaststroke'],
                  ['Review type', 'Technique Review'],
                  ['Video type', 'Side-view training clip'],
                  ['Focus', 'Kick setup and line reset'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 bg-white px-4 py-3">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{label}</span>
                    <span className="text-right font-semibold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicSection eyebrow="Key moments" title="Coach-selected moments from the clip." description="Each card holds the timestamp, phase, and coach note. The marked frame is blurred for privacy on this public demo — hover to see the lock.">
        <div className="grid gap-4 md:grid-cols-3">
          {keyMoments.map((moment) => (
            <DemoFrame key={moment.time} moment={moment} />
          ))}
        </div>
      </PublicSection>

      <PublicSection subtle eyebrow="Coach findings" title="Report-ready feedback a swimmer can act on." description="Each finding is written in swimmer-friendly language: what happened, why it matters, what to feel, which drill to use, and what to focus on next.">
        <div className="grid gap-5">
          {findings.map((finding, index) => (
            <FindingCard key={finding.title} finding={finding} index={index} />
          ))}
        </div>
      </PublicSection>

      <PublicSection eyebrow="Swimmer improvement plan" title="This week’s focus." description="The report ends with a simple plan the swimmer and coach can take into the next week of training.">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-sky-700">This week’s focus</div>
            <h2 className="mt-3 text-2xl font-bold text-slate-950">Cleaner breaststroke kick setup into a stronger line reset.</h2>
            <div className="mt-6 grid gap-3">
              {[
                ['Coach cues', 'Heels up before feet turn. Kick back, then lock into the line.'],
                ['Avoid', 'Turning the feet while the heels are still low.'],
                ['Next review target', 'Film another side-view breaststroke clip after one week of focused drill work.'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</div>
                  <p className="mt-2 text-sm leading-7 text-slate-800">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
            <Dumbbell className="h-6 w-6 text-sky-700" />
            <h3 className="mt-4 text-xl font-bold text-slate-950">Drills for the next block</h3>
            <div className="mt-4 grid gap-3">
              {['Wall breaststroke kick with narrow knees', 'Breaststroke kick into 3-second line hold'].map((drill) => (
                <div key={drill} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-700" />
                  {drill}
                </div>
              ))}
            </div>
          </div>
        </div>
      </PublicSection>

      <PublicSection eyebrow="Inside Coach Studio" title="A glimpse of where the report comes from." description="Coaches build every report in Coach Studio — move through the video, mark findings, and attach drills. These workspace previews are blurred for privacy; hover to see the lock.">
        <div className="grid gap-4 sm:grid-cols-3">
          {studioGlimpses.map(([step, caption]) => (
            <div key={step} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <PrivateFramePreview badge={step} label="Coach Studio — private" className="h-40 rounded-none" />
              <div className="p-4">
                <div className="text-sm font-bold text-slate-950">{step}</div>
                <p className="mt-1 text-sm leading-6 text-slate-600">{caption}</p>
              </div>
            </div>
          ))}
        </div>
      </PublicSection>

      <PublicSection subtle eyebrow="Privacy and trust" title="Public reports show approved content only.">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sky-700">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base leading-8 text-slate-700">
                Sample reports show only coach-approved content. Private video paths, rejected findings, and internal coach notes are never included.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link to="/coach-approved-ai" className="rounded-lg border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">How privacy works</Link>
                <Link to="/for-coaches" className="rounded-lg bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">Clubs &amp; coaches</Link>
              </div>
            </div>
          </div>
        </div>
      </PublicSection>

      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-sky-700">Coach Studio creates the report</div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">See how Swim Sight works for coaches.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Use Coach Studio to review video, capture key moments, add coach-approved feedback, and share clear swimmer improvement reports.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link to="/for-coaches" className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
              Explore features <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50">
              Log in to create a report
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
