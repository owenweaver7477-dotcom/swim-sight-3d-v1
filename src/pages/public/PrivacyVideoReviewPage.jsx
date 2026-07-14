import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileText, Lock, ShieldCheck, Users, Video, XCircle } from 'lucide-react';
import PublicLayout, { PublicHero, PublicSection } from '@/components/public/PublicLayout';
import StructuredData from '@/components/seo/StructuredData';
import usePublicMeta from './usePublicMeta';
import { publicSeoMetadata } from './publicSeoMetadata';
import { breadcrumbStructuredData } from './publicStructuredData';

const workflow = [
  ['Upload inside the club workspace', 'Coaches upload swim footage into the authenticated app, connected to a swimmer and club workspace.'],
  ['Review privately', 'Coaches review the clip in Coach Studio, with manual review always available.'],
  ['Approve the report content', 'Findings, key moments, drills, and notes are checked by the coach before finalising.'],
  ['Share a report link', 'The shared link shows the approved improvement plan, not the private video storage details.'],
];

const publicReportItems = [
  'Coach-approved findings',
  'Selected key moments',
  'Coach-created annotations chosen for the report',
  'Correction cues and next focus',
  'Recommended drills',
  'Swimmer-friendly report summary',
];

const excludedItems = [
  'Private video paths',
  'Signed video URLs',
  'Internal review notes',
  'Rejected findings',
  'Calibration feedback',
  'Internal coach notes not selected for the report',
  'Authentication tokens or service keys',
];

export default function PrivacyVideoReviewPage() {
  usePublicMeta(publicSeoMetadata.privacyVideoReview);

  return (
    <PublicLayout>
      <StructuredData
        data={breadcrumbStructuredData([
          { name: 'Home', path: '/' },
          { name: 'Privacy and video review', path: '/privacy-video-review' },
        ])}
      />
      <PublicHero
        eyebrow="Privacy + video handling"
        title="Private swim video review. Coach-approved shared reports."
        description="Swim Sight 3D is designed so coaches can review uploaded swim footage inside the app, finalise approved feedback, and share a swimmer-friendly report without exposing private video paths or raw review output."
        actions={
          <>
            <Link to="/sample-report" className="rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">View sample report</Link>
            <Link to="/coach-approved-ai" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">Coach-approved AI</Link>
          </>
        }
      >
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-cyan-200">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-sky-600">Public trust rule</div>
              <h2 className="text-xl font-bold text-slate-950">Coaches control what is finalised and shared.</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-2">
            {['Shared reports only show coach-approved content.', 'Private video paths and signed URLs are not included in public reports.', 'Rejected findings and internal review notes stay out of swimmer-facing reports.'].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-800">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-600" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </PublicHero>

      <PublicSection title="Private video workflow" description="The review flow is built around an authenticated coach workspace first, then a separate shared report only after the coach finalises the content.">
        <div className="grid gap-4 md:grid-cols-4">
          {workflow.map(([title, description], index) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-cyan-200">{index + 1}</div>
              <h2 className="mt-4 text-base font-bold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </PublicSection>

      <PublicSection subtle title="Who can access uploaded videos?" description="Uploaded videos are part of the logged-in club workflow. Access depends on club membership and role-based permissions inside Swim Sight 3D.">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Users className="h-5 w-5 text-sky-600" />
            <h2 className="mt-4 text-2xl font-bold text-slate-950">Club workspace access</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Owners, admins, coaches, and approved staff use the app according to their club role. Swimmers and parents receive the shared report link when the coach chooses to share it.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Coaches review video', 'Video review, key stamps, Coach Draw, findings, and drills happen inside the app.'],
              ['Reports are separate', 'The shared report is a public-safe summary of approved feedback, not a public video library.'],
              ['Links can be managed', 'Shared report links can be created, copied, and managed from the finalised report workflow.'],
              ['Manual review is the workflow', 'Coaches create the full report by hand — mark moments, add findings, finalise.'],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </PublicSection>

      <PublicSection title="What appears in shared reports?" description="Shared reports are intended to be swimmer-friendly improvement plans. They show the content the coach has selected and approved.">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-700" />
              <h2 className="text-xl font-bold text-slate-950">Included when approved</h2>
            </div>
            <div className="mt-5 grid gap-2">
              {publicReportItems.map(item => (
                <div key={item} className="rounded-2xl bg-white p-3 text-sm font-semibold text-slate-800 shadow-sm">{item}</div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Video className="h-5 w-5 text-sky-600" />
              <h2 className="text-xl font-bold text-slate-950">Report output, not raw system output</h2>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              A shared report is meant to answer what the coach saw, why it matters, what the swimmer should feel, which drill to use, and what to focus on next.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link to="/sample-report" className="rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">See sample report</Link>
              <Link to="/for-coaches" className="rounded-full border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">Explore features</Link>
            </div>
          </div>
        </div>
      </PublicSection>

      <PublicSection subtle title="What never appears publicly by default?" description="Public report links are designed to avoid exposing internal review data and private video storage details.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {excludedItems.map(item => (
            <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-800 shadow-sm">
              <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
              {item}
            </div>
          ))}
        </div>
      </PublicSection>

      <PublicSection title="Coach-approved content rule" description="Swim Sight 3D is built around the coach deciding what belongs in the final swimmer-facing report.">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">Coach-created. Coach-approved.</div>
              <h2 className="mt-3 text-3xl font-bold">The coach controls what is finalised and shared.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Rejected findings and private coach notes are not intended for the public report. Coaches write, approve, and edit the final findings before sharing.
              </p>
            </div>
            <div className="grid gap-3">
              {[
                ['Draft evidence', 'Coach findings start as review material, not public report content.'],
                ['Coach review', 'The coach checks the video, edits language, and selects what belongs.'],
                ['Shared report', 'The swimmer or parent sees the final approved improvement plan.'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <h3 className="text-sm font-bold text-white">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PublicSection>

      <PublicSection subtle title="Club and parent trust" description="Swim Sight 3D is designed to help coaches communicate more clearly while keeping public report links focused on approved swimmer feedback.">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ['For coaches', 'Keep the review private until the report is ready to share.'],
            ['For clubs', 'Use a consistent reporting structure across squads and coaches.'],
            ['For swimmers and parents', 'Receive a clear improvement plan without internal review clutter.'],
          ].map(([title, description]) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <FileText className="h-5 w-5 text-sky-600" />
              <h2 className="mt-4 text-base font-bold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to="/coach-approved-ai" className="rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">
            Trust and privacy <ArrowRight className="ml-2 inline h-4 w-4" />
          </Link>
          <Link to="/sample-report" className="rounded-full border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-white">View sample report</Link>
          <Link to="/for-coaches" className="rounded-full border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-white">Clubs & coaches</Link>
        </div>
      </PublicSection>
    </PublicLayout>
  );
}
