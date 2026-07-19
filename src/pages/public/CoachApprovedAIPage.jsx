import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Eye, FileText, Lock, PencilLine, ShieldCheck, Video } from 'lucide-react';
import PublicLayout, { PublicHero, PublicSection } from '@/components/public/PublicLayout';
import StructuredData from '@/components/seo/StructuredData';
import { PILOT_MAILTO } from '@/lib/supportConfig';
import usePublicMeta from './usePublicMeta';
import { publicSeoMetadata } from './publicSeoMetadata';
import { breadcrumbStructuredData, faqStructuredData } from './publicStructuredData';

// Route path stays /coach-approved-ai so existing links and the sitemap keep working;
// the page is now a combined Trust & Privacy + FAQ page (no AI framing). /faq redirects here.

// FAQ groups merged in from the retired /faq page.
const faqGroups = [
  {
    category: 'Coach review',
    items: [
      ['Does Swim Sight 3D replace the coach?', 'No. It is a manual review tool. The coach marks moments, writes every finding, and decides what appears in a report.'],
      ['How are findings created?', 'The coach creates every finding by hand from the video — mark the moment, draw on the frame, and write the observation, cue, and drill.'],
      ['Can coaches edit findings?', 'Yes. Coaches write, edit, reject, or reorder findings before finalising a report.'],
      ['What video length works best?', 'For pilot testing, short 5–15 second clips, side view, and 720p or compressed 1080p footage are recommended.'],
    ],
  },
  {
    category: 'Privacy',
    items: [
      ['Are videos private?', 'Videos stay inside the authenticated club workflow. Shared reports never expose private paths or signed URLs.'],
      ['What is excluded from shared reports?', 'Shared reports exclude private paths, signed URLs, rejected findings, and internal coach notes.'],
    ],
  },
  {
    category: 'Clubs & reports',
    items: [
      ['Is this for clubs or individual coaches?', 'Both. Individual coaches can review swimmers, and clubs can use workspaces, squads, roles, reports, and progress views.'],
      ['Can reports be shared with swimmers or parents?', 'Yes. Coaches can create secure shared report links with approved public-safe content only.'],
    ],
  },
];
const faqs = faqGroups.flatMap(group => group.items);

const reviewSteps = [
  'The coach watches the clip in a focused review workspace',
  'The coach saves the key moments that matter',
  'The coach draws on frames and writes the findings',
  'The coach attaches cues and drills, then finalises the report',
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
  'Rejected findings and private coach notes are never public',
  'Private video paths and signed URLs are not included',
  'Coaches choose exactly what belongs in the final report',
];

export default function CoachApprovedAIPage() {
  usePublicMeta(publicSeoMetadata.coachApprovedAI);

  return (
    <PublicLayout>
      <StructuredData
        data={[
          faqStructuredData(faqs),
          breadcrumbStructuredData([
            { name: 'Home', path: '/' },
            { name: 'Trust and privacy', path: '/coach-approved-ai' },
          ]),
        ]}
      />
      <PublicHero
        eyebrow="Trust & Privacy + FAQ"
        title="Coach-led review. You control every finding."
        description="Every finding is written and approved by the coach, videos stay private, and shared reports show approved content only."
        actions={
          <>
            <Link to="/sample-report" className="rounded-lg bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">View sample report</Link>
            <Link to="/for-coaches" className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">Explore features</Link>
            <Link to="/privacy-video-review" className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">Privacy + video review</Link>
          </>
        }
      />

      <PublicSection title="You write every finding." description="Swim Sight 3D is a manual review workspace. Nothing reaches a swimmer report unless the coach marks it, writes it, and approves it.">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
            <PencilLine className="h-6 w-6 text-sky-700" />
            <h2 className="mt-4 text-2xl font-bold text-slate-950">Coach-created, coach-approved.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              You mark the moment, draw on the frame, and write the observation in your own words. Reports show only what you approved.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Mark', 'Save the exact moments that matter in the stroke.'],
              ['Draw', 'Annotate the paused frame with coach-created marks.'],
              ['Write', 'Add findings, cues, drills, and next focus in your words.'],
              ['Approve', 'Only approved content moves into the shared report.'],
            ].map(([title, description]) => (
              <div key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-sky-700" />
                <h3 className="mt-4 text-base font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </PublicSection>

      <PublicSection subtle title="How coach review works" description="One clear workflow, from clip to shareable report — all coach-controlled.">
        <div className="mx-auto grid max-w-3xl gap-3">
          {reviewSteps.map((step, index) => (
            <div key={step} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white">{index + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </PublicSection>

      <PublicSection title="Best clips for coach review" description="Clear footage makes review faster. There are no minimum-quality gates — you can review any clip you can see.">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Video className="h-5 w-5 text-sky-700" />
              <h2 className="text-xl font-bold text-slate-950">What reviews best</h2>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {qualityItems.map(item => (
                <div key={item} className="rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-800">{item}</div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-sky-100 bg-sky-50 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-sky-700 shadow-sm">
              <Eye className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-950">Your eyes, your call.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              You decide what the video shows and what belongs in the report — key moments, findings, and drills — and finalise a useful plan for the swimmer.
            </p>
          </div>
        </div>
      </PublicSection>

      <PublicSection subtle title="Privacy and report safety" description="Useful to swimmers and parents — without exposing private video or internal review details.">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-sky-700" />
              <h2 className="text-xl font-bold text-slate-950">Private swim video review</h2>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Videos stay inside the authenticated club workflow. Shared reports show the approved plan — never storage paths or playback URLs.
            </p>
          </div>
          <div className="grid gap-3">
            {safetyItems.map(item => (
              <div key={item} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-800 shadow-sm">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-700" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </PublicSection>

      <PublicSection title="Why this matters for clubs" description="Trust comes from consistent language, coach-approved reports, and a private workspace.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Consistent technical language', 'Coaches can use shared phases, fault tags, cues, and drills across the club.'],
            ['Clear swimmer communication', 'Reports translate video review into a practical swimmer improvement plan.'],
            ['Coach-led quality control', 'The final report reflects the coach’s judgement — every finding is coach-created.'],
          ].map(([title, description]) => (
            <div key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <FileText className="h-5 w-5 text-sky-700" />
              <h2 className="mt-4 text-base font-bold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to="/for-coaches" className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">Clubs &amp; coaches</Link>
          <a href={PILOT_MAILTO} className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Book a pilot <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </div>
      </PublicSection>

      {/* Merged FAQ (was /faq — now redirects here) */}
      <PublicSection id="faq" subtle title="Frequently asked questions" description="Short, honest answers about coach control, privacy, clubs, and reports.">
        <div className="grid gap-5">
          {faqGroups.map((group) => (
            <section key={group.category} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-200 pb-4">
                <h3 className="text-lg font-bold text-slate-950">{group.category}</h3>
                <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{group.items.length} questions</span>
              </div>
              <div className="grid gap-3">
                {group.items.map(([question, answer]) => (
                  <div key={question} className="rounded-lg bg-slate-50 p-4">
                    <h4 className="text-base font-bold text-slate-950">{question}</h4>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{answer}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </PublicSection>
    </PublicLayout>
  );
}
