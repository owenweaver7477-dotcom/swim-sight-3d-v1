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
  Waves,
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

const strokeCards = [
  ['Breaststroke', '/stroke-analysis/breaststroke', 'Timing, kick setup, line reset'],
  ['Freestyle', '/stroke-analysis/freestyle', 'Body line, catch setup, breathing timing'],
  ['Backstroke', '/stroke-analysis/backstroke', 'Rotation, catch, body alignment'],
  ['Butterfly', '/stroke-analysis/butterfly', 'Rhythm, catch, kick timing'],
];

const faqs = [
  ['Does Swim Sight 3D replace the coach?', 'No. It gives coaches a clearer system for reviewing video and sharing improvement plans.'],
  ['Do I need special equipment?', 'No. A short side-view clip from a phone, tablet, or standard camera works well for coach review.'],
  ['Is this a manual review tool?', 'Yes. Coach Studio is a manual video-review workspace — you mark moments, draw, and write every finding yourself.'],
  ['Are videos private?', 'Yes. Shared reports do not expose private video paths or signed video URLs.'],
];

function Section({ eyebrow, title, description, children, dark = false }) {
  return (
    <section className={`${dark ? 'bg-slate-950 text-white border-slate-800' : 'bg-white text-slate-950 border-slate-200'} border-b px-4 py-16`}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 max-w-3xl">
          {eyebrow && <div className={`reveal text-xs font-bold uppercase tracking-[0.24em] ${dark ? 'text-cyan-200' : 'text-sky-600'}`}>{eyebrow}</div>}
          <h2 className={`reveal mt-3 text-2xl font-bold tracking-tight md:text-4xl ${dark ? 'text-white' : 'text-slate-950'}`}>{title}</h2>
          {description && <p className={`reveal mt-4 text-base leading-8 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{description}</p>}
        </div>
        <div className="reveal">{children}</div>
      </div>
    </section>
  );
}

function MiniCard({ icon: Icon, title, description, dark = false }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${dark ? 'border-white/10 bg-white/[0.045] shadow-cyan-950/20' : 'border-slate-200 bg-white shadow-slate-950/5'}`}>
      {Icon && (
        <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${dark ? 'bg-cyan-300/10 text-cyan-200' : 'bg-sky-50 text-sky-700'}`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h3 className={`text-base font-bold ${dark ? 'text-white' : 'text-slate-950'}`}>{title}</h3>
      <p className={`mt-2 text-sm leading-7 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{description}</p>
    </div>
  );
}

// Hero visual is now the cinematic photo background rendered in the hero section below.

export default function HomePage() {
  usePublicMeta(publicSeoMetadata.home);

  return (
    <PublicLayout>
      <StructuredData data={homeStructuredData()} />
      <section className="relative -mt-16 overflow-hidden border-b border-slate-900 bg-[#05070d] text-white">
        {/* Cinematic photo hero — decorative background, pulled up behind the sticky nav */}
        <div className="relative">
          <img
            src="/hero/hero-desktop.jpg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-[62%_center]"
          />
          {/* Legibility scrims: overall darken on mobile, dark-left on desktop, top/bottom depth */}
          <div aria-hidden="true" className="absolute inset-0 bg-black/65 md:bg-transparent" />
          <div aria-hidden="true" className="absolute inset-0 md:bg-gradient-to-r md:from-[#04060c] md:via-[#04060c]/70 md:to-transparent" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#04060c] via-transparent to-[#04060c]/40" />

          <div className="relative z-10 mx-auto flex min-h-[92svh] max-w-7xl items-center px-4 pb-16 pt-24 md:pt-20">
            <div className="max-w-xl">
              <div className="reveal inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">
                <Waves className="h-3.5 w-3.5" />
                Coach-led video review
              </div>
              <h1 className="reveal mt-6 text-5xl font-extrabold leading-[1.02] tracking-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.55)] sm:text-6xl lg:text-7xl">
                See every stroke.{' '}
                <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">Coach every swimmer.</span>
              </h1>
              <p className="reveal mt-6 max-w-md text-base leading-8 text-slate-200 md:text-lg">
                Private video review for swim coaches — mark key moments, draw over frames, add findings and drills, and share clean reports with swimmers and parents.
              </p>
              <p className="reveal mt-4 flex items-center gap-2 text-sm text-slate-300">
                <ShieldCheck className="h-4 w-4 flex-shrink-0 text-cyan-300" />
                Every finding is coach-created and coach-approved.
              </p>
              <div className="reveal mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <a href={PILOT_MAILTO} className="inline-flex items-center justify-center rounded-full bg-sky-500 px-7 py-4 text-base font-bold text-white shadow-xl shadow-sky-500/30 transition-colors hover:bg-sky-400">
                  Book a pilot <ArrowRight className="ml-2 h-4 w-4" />
                </a>
                <Link to="/sample-report" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-7 py-4 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20">
                  View Sample Report
                </Link>
                <Link to="/login" className="inline-flex items-center justify-center rounded-full px-4 py-4 text-sm font-semibold text-slate-200 transition-colors hover:text-white">
                  Log in
                </Link>
              </div>
              <a href="#how-it-works" className="reveal mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-200 transition-colors hover:text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-white/5 text-white backdrop-blur-sm">
                  <PlayCircle className="h-4 w-4" />
                </span>
                See how it works
              </a>
            </div>
          </div>
        </div>

        {/* Trust strip — solid dark band below the photo (legible), honest value props */}
        <div className="relative border-t border-white/10 bg-[#05070d]">
          <div className="mx-auto grid max-w-7xl gap-x-8 gap-y-6 px-4 py-7 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [ShieldCheck, 'Private & secure', 'Videos never leave your private club workspace.'],
              [Target, 'Cues and drills, not dashboards', 'Feedback a swimmer can act on at the next session.'],
              [Waves, 'Built for swimming', 'Stroke-specific review, not a generic tool.'],
              [Users, 'Coach-first', 'The coach writes and approves every finding.'],
            ].map(([Icon, title, desc]) => (
              <div key={title} className="reveal flex items-center gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-cyan-300 ring-1 ring-white/10">
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </span>
                <div>
                  <div className="text-sm font-bold text-sky-100">{title}</div>
                  <div className="text-[11px] leading-4 text-slate-400">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-4 py-6">
        <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {proofPoints.map(([title, description]) => (
            <div key={title} className="reveal rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-950">{title}</div>
              <div className="mt-1 text-xs leading-5 text-slate-600">{description}</div>
            </div>
          ))}
        </div>
      </section>

      <Section eyebrow="How it works" title="Turn one video into a clear coaching plan." description="Video in, coach review, approved findings, swimmer report out." >
        <div id="how-it-works" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {workflowSteps.map(([title, description], index) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">{index + 1}</div>
              <h3 className="text-base font-bold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/features" className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">Explore features</Link>
          <Link to="/for-coaches" className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">For coaches</Link>
          <Link to="/for-clubs" className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">For clubs</Link>
        </div>
      </Section>

      <Section eyebrow="Human trust" title="Built for real coaching conversations." description="Built for the moment after a clip, when a coach needs to explain one clear change.">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-sky-600">From pool deck to plan</div>
            <div className="mt-5 grid gap-3">
              {[
                ['1', 'Coach captures a short clip', 'A race or training moment becomes the starting point, not a pile of scattered notes.'],
                ['2', 'Coach reviews the key moment', 'The coach slows the video, saves the timestamp, and decides what matters.'],
                ['3', 'Coach adds cue and drill', 'Feedback becomes practical: what happened, what to feel, and what to practise.'],
                ['4', 'Swimmer receives a clear plan', 'The final report is written for action, not for internal software complexity.'],
              ].map(([number, title, description]) => (
                <div key={title} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-cyan-200">{number}</div>
                  <div>
                    <div className="text-sm font-bold text-slate-950">{title}</div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-950/10">
            <div className="border-b border-slate-200 bg-slate-950 p-6 text-white">
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">Coach-to-swimmer output</div>
              <h3 className="mt-3 text-2xl font-bold">A report that sounds like coaching.</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The best report is simple enough for a swimmer to use at the next session and structured enough for a club to keep consistent.
              </p>
            </div>
            <div className="grid gap-3 p-6">
              {[
                ['What we saw', 'Knees widen during heel recovery.'],
                ['What to feel', 'Heels up first, then a late turn and strong kick back.'],
                ['This week', 'Hold the line for three seconds after every kick drill.'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{label}</div>
                  <div className="mt-2 text-sm font-semibold leading-6 text-slate-950">{value}</div>
                </div>
              ))}
              <Link to="/sample-report" className="mt-2 inline-flex w-fit items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                See the sample report <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </Section>

      <Section eyebrow="Why it is different" title="Better than loose video comments and scattered notes." description="Loose video comments vanish into chats and notes. This turns each moment into a structured record.">
        <div className="grid gap-4 md:grid-cols-3">
          <MiniCard icon={Clock3} title="Moments stay attached to feedback" description="Key timestamps and approximate frames can sit beside the finding, drill, and next focus." />
          <MiniCard icon={FileText} title="Feedback becomes a report" description="The coach output is a readable swimmer improvement plan, not a disconnected video clip." />
          <MiniCard icon={ShieldCheck} title="Only approved content is shared" description="Private coach notes and rejected findings stay out of public reports." />
        </div>
      </Section>

      <Section dark eyebrow="Coach Studio" title="The heart of the product is a structured coach review room." description="A professional workflow for turning video moments into clear feedback. Manual review is first-class, not a fallback.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MiniCard dark icon={PlayCircle} title="Fullscreen review" description="Review video in a focused workspace with slow motion and approximate frame stepping." />
          <MiniCard dark icon={Clock3} title="Key stamps" description="Capture timestamped moments for catch, breath, kick setup, line reset, turns, and more." />
          <MiniCard dark icon={PencilLine} title="Coach Draw" description="Draw on important frames with coach-created marks that can be included in reports." />
          <MiniCard dark icon={Target} title="Findings + drills" description="Create technical findings from moments and connect them to cues, drills, and next focus." />
        </div>
      </Section>

      <Section eyebrow="Coach control" title="Every finding is coach-created and coach-approved." description="Nothing reaches a swimmer report unless the coach marks it, writes it, and approves it. You stay in control of every word that goes to a swimmer or parent.">
        <div className="grid gap-4 md:grid-cols-3">
          <MiniCard icon={PencilLine} title="Coach-created findings" description="Every observation is written by the coach from the video, in your own words." />
          <MiniCard icon={ShieldCheck} title="Private by default" description="Videos stay in your private club workspace and are never shared without you." />
          <MiniCard icon={CheckCircle2} title="Coach final say" description="Reports only ever show the content you approved." />
        </div>
        <div className="mt-8">
          <Link to="/coach-approved-ai" className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Read about trust and privacy
          </Link>
        </div>
      </Section>

      <Section eyebrow="Key moments + Coach Draw" title="Mark the moment. Explain the correction. Share the plan." description="Capture the exact moment, annotate the frame, and turn it into a finding with a drill.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-sky-600">Moment workflow</div>
            <div className="mt-5 grid gap-3">
              {['Save timestamped key moment', 'Create finding from this moment', 'Draw body line or correction cue', 'Include selected moments in report'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-sky-600" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            role="img"
            aria-label="Coach Draw preview with line reset correction marks"
          >
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Coach Draw preview</div>
            <div className="mt-5 h-56 rounded-2xl border border-slate-200 bg-[linear-gradient(90deg,rgba(14,165,233,0.08)_1px,transparent_1px),linear-gradient(rgba(14,165,233,0.08)_1px,transparent_1px)] bg-[length:24px_24px] p-5">
              <div className="mt-16 h-1 w-56 rotate-[-7deg] rounded-full bg-sky-500" />
              <div className="ml-20 mt-8 h-1 w-32 rotate-[18deg] rounded-full bg-cyan-400" />
              <div className="mt-6 inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">Line reset cue</div>
            </div>
          </div>
        </div>
      </Section>

      <Section dark eyebrow="Swimmer improvement reports" title="The report is the product output." description="Reports are built so swimmers and parents understand the correction — without the app complexity.">
        <div className="grid gap-4 md:grid-cols-3">
          <MiniCard dark icon={FileText} title="What we saw" description="A clear, coach-approved observation from video." />
          <MiniCard dark icon={Layers3} title="Why it matters" description="A short explanation of how the fault affects stroke quality." />
          <MiniCard dark icon={Target} title="What to feel" description="Coach language the swimmer can take into the next set." />
          <MiniCard dark icon={PencilLine} title="Recommended drill" description="A practical correction linked to the finding." />
          <MiniCard dark icon={Clock3} title="Selected key moments" description="Approved timestamps and annotations that support the feedback." />
          <MiniCard dark icon={ShieldCheck} title="Secure sharing" description="Public links show approved content only, never private video paths." />
        </div>
      </Section>

      <Section eyebrow="Club workflow" title="For coaches, squads, and clubs that need consistency." description="Organise swimmers and reports across a coaching team — simple enough to run on pool deck.">
        <div className="grid gap-4 md:grid-cols-3">
          <MiniCard icon={Users} title="Squads + profiles" description="Keep swimmers, squad assignment, coach notes, and report history organised." />
          <MiniCard icon={Target} title="Shared technical language" description="Use consistent phases, fault tags, cues, drills, and final report structure." />
          <MiniCard icon={Lock} title="Private workspace" description="Club data and video access stay inside the authenticated app workflow." />
        </div>
      </Section>

      <Section eyebrow="Stroke coverage" title="Built around the strokes coaches review every week." description="Each stroke page shows the phase structure used for review and reporting.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {strokeCards.map(([title, href, description]) => (
            <Link key={title} to={href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-sky-300 hover:shadow-md">
              <div className="text-lg font-bold text-slate-950">{title}</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </Link>
          ))}
        </div>
        <div className="mt-6">
          <Link to="/stroke-analysis" className="text-sm font-bold text-sky-700 hover:text-sky-900">View all stroke analysis pages</Link>
        </div>
      </Section>

      <Section eyebrow="Sample report preview" title="See the improvement plan a swimmer receives." description="Demo content only — real reports come from coach-reviewed club data.">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-950/10">
          <div className="bg-slate-950 p-6 text-white">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">Demo report</div>
            <h3 className="mt-3 text-2xl font-bold">Breaststroke · Kick setup</h3>
            <p className="mt-2 text-sm text-slate-300">Every finding is coach-created. Final report content is coach-approved.</p>
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-2">
            {[
              ['Stroke', 'Breaststroke'],
              ['Key moment', '0:03.42 — Kick setup'],
              ['Finding', 'Knees widen during heel recovery.'],
              ['What to feel', 'Heels up, late turn, piston drive.'],
              ['Drill', 'Wall breaststroke kick with narrow knees.'],
              ['Next focus', 'Hold line after the kick.'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{label}</div>
                <div className="mt-2 text-base font-semibold text-slate-950">{value}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 p-6">
            <Link to="/sample-report" className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              View full sample report <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </Section>

      <Section eyebrow="FAQ preview" title="Quick answers before you log in.">
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map(([question, answer]) => (
            <div key={question} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-bold text-slate-950">{question}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{answer}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Link to="/faq" className="text-sm font-bold text-sky-700 hover:text-sky-900">Read the full FAQ</Link>
        </div>
      </Section>

      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-white/[0.045] p-8 md:p-10">
          <div className="reveal max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">Built for coaches, squads, and clubs</div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">Turn video into a clearer coaching plan.</h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Start with the sample report, then book a pilot for your club — we set it up with your coaching team.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href={PILOT_MAILTO} className="inline-flex items-center justify-center rounded-full bg-cyan-200 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-100">
              Book a pilot
            </a>
            <Link to="/sample-report" className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
              View Sample Report
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
