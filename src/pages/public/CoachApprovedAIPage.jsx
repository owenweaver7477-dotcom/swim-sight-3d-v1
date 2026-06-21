import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, CheckCircle2, Eye, FileText, Lock, ShieldCheck, Video } from 'lucide-react';
import PublicLayout, { PublicHero, PublicSection } from '@/components/public/PublicLayout';
import StructuredData from '@/components/seo/StructuredData';
import usePublicMeta from './usePublicMeta';
import { publicSeoMetadata } from './publicSeoMetadata';
import { breadcrumbStructuredData } from './publicStructuredData';

const reviewModes = [
  {
    title: 'Manual review',
    steps: ['Coach watches the video', 'Coach saves key moments', 'Coach adds findings and drills', 'Coach finalises the report'],
    description: 'Manual swimming video review remains available even when AI is not used or video quality is not strong enough for draft findings.',
  },
  {
    title: 'AI-assisted review',
    steps: ['AI may suggest draft findings', 'Coach reviews the evidence', 'Coach edits, approves, or rejects', 'Coach can add manual findings anytime'],
    description: 'AI-assisted swimming video review supports the coach workflow. It does not replace coaching judgement.',
  },
];

const qualityItems = [
  'Short swim clips',
  'Clear side, front, or back angle',
  'Swimmer visible through the stroke cycle',
  'Steady camera position',
  'Good lighting and limited obstruction',
  'Limited splash blocking the swimmer',
];

const safetyItems = [
  'Shared reports show coach-approved content only',
  'Rejected findings are not public',
  'Raw AI output is not shown to swimmers or parents',
  'Private video paths and signed URLs are not included',
  'Coaches choose what belongs in the final report',
];

export default function CoachApprovedAIPage() {
  usePublicMeta(publicSeoMetadata.coachApprovedAI);

  return (
    <PublicLayout>
      <StructuredData
        data={breadcrumbStructuredData([
          { name: 'Home', path: '/' },
          { name: 'Coach-approved AI', path: '/coach-approved-ai' },
        ])}
      />
      <PublicHero
        eyebrow="Coach-approved AI"
        title="AI-assisted swimming analysis, controlled by the coach."
        description="Draft AI evidence supports review; every report is coach-approved, manual-friendly, and public-safe."
        actions={
          <>
            <Link to="/sample-report" className="rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">View sample report</Link>
            <Link to="/features" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">Explore features</Link>
            <Link to="/privacy-video-review" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">Privacy + video review</Link>
          </>
        }
      />

      <PublicSection title="AI suggests. Coaches decide." description="AI output is draft evidence. The coach decides what's supported, what to edit, and what ships.">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
              <Brain className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-2xl font-bold">Draft evidence, not automatic truth.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              AI may suggest findings; coaches approve, edit, reject, or ignore them. Reports show only what the coach chose.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Review', 'The coach checks every AI-assisted finding against the video.'],
              ['Edit', 'The coach can rewrite observations, cues, drills, and next focus.'],
              ['Approve', 'Only approved content can move into the report.'],
              ['Add manual findings', 'The coach can always create their own findings from video moments.'],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-sky-600" />
                <h3 className="mt-4 text-base font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </PublicSection>

      <PublicSection subtle title="Manual review vs AI-assisted review" description="Both paths reach the same coach-approved report. AI assists; it doesn't replace the coach.">
        <div className="grid gap-5 lg:grid-cols-2">
          {reviewModes.map((mode) => (
            <article key={mode.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-950">{mode.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{mode.description}</p>
              <div className="mt-5 grid gap-3">
                {mode.steps.map((step, index) => (
                  <div key={step} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-800">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-cyan-200">{index + 1}</span>
                    {step}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </PublicSection>

      <PublicSection title="Video quality and manual fallback" description="AI works best when the swimmer is clearly visible. Weak evidence routes to manual review, not invented findings.">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Video className="h-5 w-5 text-sky-600" />
              <h2 className="text-xl font-bold text-slate-950">AI works best with clear video</h2>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {qualityItems.map(item => (
                <div key={item} className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-800">{item}</div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-sky-100 bg-sky-50 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
              <Eye className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-950">Weak evidence becomes coach review.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              If pose evidence is unclear, the coach reviews manually — key moments, findings, drills — and still finalises a useful report.
            </p>
          </div>
        </div>
      </PublicSection>

      <PublicSection subtle title="Privacy and report safety" description="Useful to swimmers and parents — without exposing private video or internal review details.">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-sky-600" />
              <h2 className="text-xl font-bold text-slate-950">Private swim video review</h2>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Videos stay inside the authenticated club workflow. Shared reports show the approved plan — never storage paths or playback URLs.
            </p>
          </div>
          <div className="grid gap-3">
            {safetyItems.map(item => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-800 shadow-sm">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-600" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </PublicSection>

      <PublicSection title="Why this matters for clubs" description="Trust comes from consistent language, coach-approved reports, and a private workspace — without overclaiming AI.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Consistent technical language', 'Coaches can use shared phases, fault tags, cues, and drills across the club.'],
            ['Clear swimmer communication', 'Reports translate video review into a practical swimmer improvement plan.'],
            ['Coach-led quality control', 'The final report reflects the coach’s judgement, not an unreviewed AI output.'],
          ].map(([title, description]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <FileText className="h-5 w-5 text-sky-600" />
              <h2 className="mt-4 text-base font-bold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to="/for-clubs" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">For clubs</Link>
          <Link to="/for-coaches" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">For coaches</Link>
          <Link to="/privacy-video-review" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">Privacy + video review</Link>
          <Link to="/login" className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Open App <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </PublicSection>
    </PublicLayout>
  );
}
