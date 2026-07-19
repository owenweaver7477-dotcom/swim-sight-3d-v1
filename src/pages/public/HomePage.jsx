import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Layers3,
  Lock,
  PencilLine,
  PlayCircle,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';
import PublicLayout from '@/components/public/PublicLayout';
import StructuredData from '@/components/seo/StructuredData';
import { PILOT_MAILTO } from '@/lib/supportConfig';
import usePublicMeta from './usePublicMeta';
import { publicSeoMetadata } from './publicSeoMetadata';
import { homeStructuredData } from './publicStructuredData';

const proofPoints = [
  ['Coach-approved findings', 'Nothing reaches a swimmer report until the coach reviews it.'],
  ['Timestamped key moments', 'Capture the exact moment the swimmer needs to understand.'],
  ['Drill-linked reports', 'Connect technical feedback to practical pool work.'],
  ['Built for squads and clubs', 'Organise swimmers, roles, reports, and shared coaching language.'],
];

const workflowSteps = [
  ['Upload video', 'Add race or training footage to a private club workspace. Short side-view clips work best for pilot testing.'],
  ['Review in Coach Studio', 'Slow the video down, step frame-by-frame through moments, save key stamps, and mark frames.'],
  ['Add findings and drills', 'Create a coach finding from the video timestamp and connect it to a cue and a drill.'],
  ['Share the plan', 'Finalise a swimmer improvement report with cues, drills, next focus, and selected key moments.'],
];

const trustStrip = [
  [ShieldCheck, 'Private & secure', 'Videos never leave your private club workspace.'],
  [Target, 'Cues and drills, not dashboards', 'Feedback a swimmer can act on at the next session.'],
  [Layers3, 'Built for swimming', 'Stroke-specific review, not a generic tool.'],
  [Users, 'Coach-first', 'The coach writes and approves every finding.'],
];

const faqs = [
  ['Does Swim Sight 3D replace the coach?', 'No. It gives coaches a clearer system for reviewing video and sharing improvement plans.'],
  ['Do I need special equipment?', 'No. A short side-view clip from a phone, tablet, or standard camera works well for coach review.'],
  ['Is this a manual review tool?', 'Yes. Coach Studio is a manual video-review workspace — you mark moments, draw, and write every finding yourself.'],
  ['Are videos private?', 'Yes. Shared reports do not expose private video paths or signed video URLs.'],
];

// Section shell — one background, section rhythm from whitespace and a hairline rule.
function Section({ eyebrow, title, description, children, subtle = false, id }) {
  return (
    <section id={id} className={`border-b border-slate-200 px-4 py-16 sm:py-20 ${subtle ? 'bg-slate-50' : 'bg-white'}`}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-3xl">
          {eyebrow && <div className="reveal text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{eyebrow}</div>}
          <h2 className="reveal mt-3 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">{title}</h2>
          {description && <p className="reveal mt-3 text-base leading-8 text-slate-600">{description}</p>}
        </div>
        <div className="reveal">{children}</div>
      </div>
    </section>
  );
}

// Feature card — flat, border-defined, no icon-in-a-coloured-circle. The small
// accent icon sits inline; the headline does the work.
function Feature({ icon: Icon, title, description }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      {Icon && <Icon className="h-5 w-5 text-sky-700" strokeWidth={1.75} />}
      <h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}

export default function HomePage() {
  usePublicMeta(publicSeoMetadata.home);

  return (
    <PublicLayout>
      <StructuredData data={homeStructuredData()} />

      {/* ── Hero — light, typographic. The product output is the visual. ── */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="reveal text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                Coach-led video review
              </div>
              <div className="reveal draw-rule mt-4 h-px w-12 bg-sky-700" aria-hidden="true" />
              <h1 className="mt-5 max-w-xl text-4xl font-bold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl md:text-6xl">
                <span className="ss-line"><span style={{ animationDelay: '90ms' }}>See every stroke.</span></span>
                <span className="ss-line"><span style={{ animationDelay: '200ms' }}>Coach every swimmer.</span></span>
              </h1>
              <p className="reveal mt-6 max-w-md text-lg leading-8 text-slate-600">
                Private video review for swim coaches — mark key moments, draw over frames, add findings and drills, and share clean reports with swimmers and parents.
              </p>
              <p className="reveal mt-4 flex items-center gap-2 text-sm text-slate-500">
                <ShieldCheck className="h-4 w-4 flex-shrink-0 text-sky-700" />
                Every finding is coach-created and coach-approved.
              </p>
              <div className="reveal mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <a href={PILOT_MAILTO} className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 active:translate-y-px">
                  Book a pilot <ArrowRight className="ml-2 h-4 w-4" />
                </a>
                <Link to="/sample-report" className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50 active:translate-y-px">
                  View sample report
                </Link>
                <Link to="/login" className="inline-flex items-center justify-center px-3 py-3.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-950">
                  Log in
                </Link>
              </div>
              <a href="#how-it-works" className="reveal mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-950">
                <PlayCircle className="h-4 w-4" /> See how it works
              </a>
            </div>

            {/* Flat product preview — the real report language, no chrome. */}
            <div className="reveal">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Swimmer report</div>
                    <div className="mt-1 text-sm font-semibold text-slate-950">Breaststroke · Kick setup</div>
                  </div>
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">Coach-approved</span>
                </div>
                <div className="grid gap-px bg-slate-200">
                  {[
                    ['What we saw', 'Knees widen during heel recovery.'],
                    ['What to feel', 'Heels up first, then a late turn and strong kick back.'],
                    ['This week', 'Hold the line for three seconds after every kick drill.'],
                  ].map(([label, value]) => (
                    <div key={label} className="reveal bg-white px-5 py-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
                      <div className="mt-1.5 text-sm font-medium leading-6 text-slate-900">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 px-5 py-4">
                  <Link to="/sample-report" className="inline-flex items-center text-sm font-semibold text-sky-700 hover:text-sky-900">
                    See the full sample report <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip — flat, hairline-separated ── */}
      <section className="border-b border-slate-200 bg-slate-50 px-4 py-10">
        <div className="mx-auto grid max-w-6xl gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustStrip.map(([Icon, title, desc]) => (
            <div key={title} className="reveal flex items-start gap-3">
              <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-700" strokeWidth={1.75} />
              <div>
                <div className="text-sm font-semibold text-slate-950">{title}</div>
                <div className="mt-0.5 text-[13px] leading-5 text-slate-600">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Proof points ── */}
      <section className="border-b border-slate-200 bg-white px-4 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {proofPoints.map(([title, description]) => (
            <div key={title} className="reveal">
              <div className="text-sm font-semibold text-slate-950">{title}</div>
              <div className="mt-1.5 text-sm leading-6 text-slate-600">{description}</div>
            </div>
          ))}
        </div>
      </section>

      <Section eyebrow="How it works" title="Turn one video into a clear coaching plan." description="Video in, coach review, approved findings, swimmer report out.">
        <div id="how-it-works" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {workflowSteps.map(([title, description], index) => (
            <div key={title} className="border-t border-slate-200 pt-5">
              <div className="text-sm font-mono font-semibold text-sky-700">0{index + 1}</div>
              <h3 className="mt-3 text-base font-semibold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/for-coaches" className="inline-flex rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50">Clubs &amp; coaches</Link>
          <Link to="/sample-report" className="inline-flex rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50">See a sample report</Link>
        </div>
      </Section>

      <Section subtle eyebrow="Human trust" title="Built for real coaching conversations." description="Built for the moment after a clip, when a coach needs to explain one clear change.">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-3">
            {[
              ['1', 'Coach captures a short clip', 'A race or training moment becomes the starting point, not a pile of scattered notes.'],
              ['2', 'Coach reviews the key moment', 'The coach slows the video, saves the timestamp, and decides what matters.'],
              ['3', 'Coach adds cue and drill', 'Feedback becomes practical: what happened, what to feel, and what to practise.'],
              ['4', 'Swimmer receives a clear plan', 'The final report is written for action, not for internal software complexity.'],
            ].map(([number, title, description]) => (
              <div key={title} className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4">
                <div className="text-sm font-mono font-semibold text-sky-700">{number}</div>
                <div>
                  <div className="text-sm font-semibold text-slate-950">{title}</div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-6 py-6">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Coach-to-swimmer output</div>
              <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">A report that sounds like coaching.</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                The best report is simple enough for a swimmer to use at the next session and structured enough for a club to keep consistent.
              </p>
            </div>
            <div className="grid gap-px bg-slate-200">
              {[
                ['What we saw', 'Knees widen during heel recovery.'],
                ['What to feel', 'Heels up first, then a late turn and strong kick back.'],
                ['This week', 'Hold the line for three seconds after every kick drill.'],
              ].map(([label, value]) => (
                <div key={label} className="reveal bg-white px-6 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
                  <div className="mt-1.5 text-sm font-medium leading-6 text-slate-900">{value}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 px-6 py-4">
              <Link to="/sample-report" className="inline-flex items-center text-sm font-semibold text-sky-700 hover:text-sky-900">
                See the sample report <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </Section>

      <Section eyebrow="Why it is different" title="Better than loose video comments and scattered notes." description="Loose video comments vanish into chats and notes. This turns each moment into a structured record.">
        <div className="grid gap-6 md:grid-cols-3">
          <Feature icon={Clock3} title="Moments stay attached to feedback" description="Key timestamps and approximate frames can sit beside the finding, drill, and next focus." />
          <Feature icon={FileText} title="Feedback becomes a report" description="The coach output is a readable swimmer improvement plan, not a disconnected video clip." />
          <Feature icon={ShieldCheck} title="Only approved content is shared" description="Private coach notes and rejected findings stay out of public reports." />
        </div>
      </Section>

      <Section subtle eyebrow="Coach Studio" title="The heart of the product is a structured coach review room." description="A professional workflow for turning video moments into clear feedback. Manual review is first-class, not a fallback.">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Feature icon={PlayCircle} title="Fullscreen review" description="Review video in a focused workspace with slow motion and approximate frame stepping." />
          <Feature icon={Clock3} title="Key stamps" description="Capture timestamped moments for catch, breath, kick setup, line reset, turns, and more." />
          <Feature icon={PencilLine} title="Coach Draw" description="Draw on important frames with coach-created marks that can be included in reports." />
          <Feature icon={Target} title="Findings + drills" description="Create technical findings from moments and connect them to cues, drills, and next focus." />
        </div>
      </Section>

      <Section eyebrow="Coach control" title="Every finding is coach-created and coach-approved." description="Nothing reaches a swimmer report unless the coach marks it, writes it, and approves it. You stay in control of every word that goes to a swimmer or parent.">
        <div className="grid gap-6 md:grid-cols-3">
          <Feature icon={PencilLine} title="Coach-created findings" description="Every observation is written by the coach from the video, in your own words." />
          <Feature icon={ShieldCheck} title="Private by default" description="Videos stay in your private club workspace and are never shared without you." />
          <Feature icon={CheckCircle2} title="Coach final say" description="Reports only ever show the content you approved." />
        </div>
        <div className="mt-10">
          <Link to="/coach-approved-ai" className="inline-flex rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
            Read about trust and privacy
          </Link>
        </div>
      </Section>

      <Section subtle eyebrow="Swimmer improvement reports" title="The report is the product output." description="Reports are built so swimmers and parents understand the correction — without the app complexity.">
        <div className="grid gap-6 md:grid-cols-3">
          <Feature icon={FileText} title="What we saw" description="A clear, coach-approved observation from video." />
          <Feature icon={Layers3} title="Why it matters" description="A short explanation of how the fault affects stroke quality." />
          <Feature icon={Target} title="What to feel" description="Coach language the swimmer can take into the next set." />
          <Feature icon={PencilLine} title="Recommended drill" description="A practical correction linked to the finding." />
          <Feature icon={Clock3} title="Selected key moments" description="Approved timestamps and annotations that support the feedback." />
          <Feature icon={ShieldCheck} title="Secure sharing" description="Public links show approved content only, never private video paths." />
        </div>
      </Section>

      <Section eyebrow="Club workflow" title="For coaches, squads, and clubs that need consistency." description="Organise swimmers and reports across a coaching team — simple enough to run on pool deck.">
        <div className="grid gap-6 md:grid-cols-3">
          <Feature icon={Users} title="Squads + profiles" description="Keep swimmers, squad assignment, coach notes, and report history organised." />
          <Feature icon={Target} title="Shared technical language" description="Use consistent phases, fault tags, cues, drills, and final report structure." />
          <Feature icon={Lock} title="Private workspace" description="Club data and video access stay inside the authenticated app workflow." />
        </div>
      </Section>

      <Section subtle eyebrow="FAQ" title="Quick answers before you log in.">
        <div className="grid gap-8 md:grid-cols-2">
          {faqs.map(([question, answer]) => (
            <div key={question} className="border-t border-slate-200 pt-5">
              <h3 className="text-base font-semibold text-slate-950">{question}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{answer}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link to="/coach-approved-ai" className="text-sm font-semibold text-sky-700 hover:text-sky-900">Read the full FAQ</Link>
        </div>
      </Section>

      {/* ── Closing CTA — light, restrained ── */}
      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Built for coaches, squads, and clubs</div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Turn video into a clearer coaching plan.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Start with the sample report, then book a pilot for your club — we set it up with your coaching team.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href={PILOT_MAILTO} className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
              Book a pilot
            </a>
            <Link to="/sample-report" className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50">
              View sample report
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
