import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, CheckCircle2, FileText, ShieldCheck, Video, Waves } from 'lucide-react';
import PublicLayout, { PublicCard, PublicHero, PublicSection } from '@/components/public/PublicLayout';
import usePublicMeta from './usePublicMeta';

const steps = [
  ['Upload footage', 'Add race or training video to a private club workspace.'],
  ['Review technique', 'Use Coach Studio, key moments, Coach Draw, and AI-assisted draft evidence where suitable.'],
  ['Approve findings', 'Coaches edit, approve, reject, or create manual findings before anything is shared.'],
  ['Share the plan', 'Create a clear swimmer improvement report with cues, drills, and next focus.'],
];

export default function HomePage() {
  usePublicMeta(
    'AI-assisted swimming analysis reports',
    'Swim Sight 3D helps coaches upload swim footage, review stroke phases, approve findings, assign drills, and share swimmer improvement reports.'
  );

  return (
    <PublicLayout>
      <PublicHero
        eyebrow="Swim Sight 3D"
        title="AI-assisted swimming analysis reports for serious coaches."
        description="Upload training or race footage, review stroke phases, add coach-approved findings, assign drills, and create clear swimmer improvement reports."
        actions={
          <>
            <Link to="/login" className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800">
              Open App <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link to="/sample-report" className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
              View Sample Report
            </Link>
          </>
        }
      >
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-2xl shadow-slate-950/10 backdrop-blur-xl">
          <div className="rounded-2xl bg-slate-950 p-5 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-cyan-200">Coach Studio</div>
                <div className="mt-1 text-lg font-bold">Breaststroke review</div>
              </div>
              <Waves className="h-7 w-7 text-cyan-200" />
            </div>
            <div className="mt-5 grid gap-3">
              {['Key moment saved at 0:03.42', 'Draft AI evidence marked pending', 'Coach-created finding approved', 'Kick timing drill assigned'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-cyan-200" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </PublicHero>

      <PublicSection eyebrow="How it works" title="One golden workflow from video to improvement plan.">
        <div className="grid gap-4 md:grid-cols-4">
          {steps.map(([title, description], index) => (
            <PublicCard key={title} title={`${index + 1}. ${title}`} description={description} />
          ))}
        </div>
      </PublicSection>

      <PublicSection subtle eyebrow="Coach Studio" title="Manual review is a first-class workflow, not a fallback." description="Coaches can slow video down, save key moments, draw on frames, create findings from timestamps, assign drills, and finalise reports even when AI recommends manual review." >
        <div className="grid gap-4 md:grid-cols-3">
          <PublicCard title="Key moments" description="Capture timestamps, approximate frames, labels, stroke phases, and notes for report-ready review points." />
          <PublicCard title="Coach Draw" description="Mark frames with body lines, arrows, angles, and coach notes for clearer swimmer feedback." />
          <PublicCard title="Manual findings" description="Create coach-approved observations, cues, drills, and next-focus items directly from the video moment." />
        </div>
      </PublicSection>

      <PublicSection eyebrow="Coach-approved AI" title="AI suggests. Coaches decide." description="AI-assisted evidence is treated as draft review support. Findings stay pending until a coach verifies them on video, edits where needed, and approves them for the report.">
        <div className="grid gap-4 md:grid-cols-3">
          <PublicCard title="Draft evidence" description="AI can identify possible technical issues when pose quality is strong enough." />
          <PublicCard title="Manual review available" description="Weak or unreliable evidence becomes a manual review state with zero fake findings." />
          <PublicCard title="Coach control" description="Coaches approve, edit, reject, or add findings before swimmers or parents see anything." />
        </div>
      </PublicSection>

      <PublicSection subtle eyebrow="Reports" title="Clear swimmer improvement reports." description="Reports are designed to explain what was seen, why it matters, what to feel, which drill to use, and what to focus on next.">
        <div className="grid gap-4 md:grid-cols-3">
          <PublicCard title="Coach findings" description="Approved AI-assisted and manual findings can sit in one clean report." />
          <PublicCard title="Drill direction" description="Findings can connect to corrective drills by stroke, phase, and fault tag." />
          <PublicCard title="Secure sharing" description="Public report links use secure tokens and never expose private video URLs." />
        </div>
      </PublicSection>

      <PublicSection eyebrow="Club workflow" title="Built for squads, coaches, and private workspaces.">
        <div className="grid gap-4 md:grid-cols-3">
          <PublicCard title="Swimmer profiles" description="Organise swimmers by club, squad, stroke focus, notes, and report history." />
          <PublicCard title="Role-based access" description="Owners, admins, coaches, assistant coaches, swimmers, and parents can be separated by permissions." />
          <PublicCard title="Progress tracking" description="Club and swimmer progress views use real finalised reports and approved findings." />
        </div>
      </PublicSection>

      <PublicSection subtle eyebrow="Stroke coverage" title="Start with the core strokes." description="Swim Sight 3D structures review around the stroke phases coaches already use on deck.">
        <div className="grid gap-4 md:grid-cols-4">
          {['Breaststroke', 'Freestyle', 'Backstroke', 'Butterfly'].map((stroke) => (
            <Link key={stroke} to={`/stroke-analysis/${stroke.toLowerCase()}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-sky-200 hover:shadow-md">
              <div className="text-base font-bold text-slate-950">{stroke}</div>
              <div className="mt-2 text-sm text-slate-600">Review phases, common faults, cues, and report structure.</div>
            </Link>
          ))}
        </div>
      </PublicSection>

      <PublicSection eyebrow="Next step" title="See what a report can look like.">
        <div className="flex flex-wrap gap-3">
          <Link to="/sample-report" className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Open Sample Report <FileText className="ml-2 h-4 w-4" />
          </Link>
          <Link to="/faq" className="inline-flex items-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            Read FAQ
          </Link>
        </div>
      </PublicSection>

      <PublicSection subtle eyebrow="Trust boundaries" title="Private videos stay private.">
        <div className="grid gap-4 md:grid-cols-3">
          <PublicCard title="Private storage" description="Uploaded videos are stored privately and accessed through short-lived signed URLs inside the app." />
          <PublicCard title="Safe public reports" description="Shared reports include approved public-safe content only, not private video paths or raw AI data." />
          <PublicCard title="Honest AI language" description="The platform avoids unsupported claims about exact drag, perfect biomechanics, or automatic coaching." />
        </div>
      </PublicSection>
    </PublicLayout>
  );
}
