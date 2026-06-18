import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileText, Target } from 'lucide-react';
import PublicLayout, { PublicHero, PublicSection } from '@/components/public/PublicLayout';
import StructuredData from '@/components/seo/StructuredData';
import usePublicMeta from './usePublicMeta';
import { publicSeoMetadata } from './publicSeoMetadata';
import { breadcrumbStructuredData } from './publicStructuredData';
import { strokePages } from './strokePageData';

export default function StrokeAnalysisPage() {
  usePublicMeta(publicSeoMetadata.strokeAnalysis);

  return (
    <PublicLayout>
      <StructuredData data={breadcrumbStructuredData([{ name: 'Home', path: '/' }, { name: 'Stroke Analysis', path: '/stroke-analysis' }])} />
      <PublicHero
        eyebrow="Stroke analysis"
        title="Swimming stroke analysis for coach-approved reports."
        description="Swim Sight 3D organises swimming stroke analysis around video review, stroke phases, key moments, common faults, coach cues, drills, and report-ready findings. AI can assist, but coaches approve the final content."
        actions={
          <>
            <Link to="/sample-report" className="rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">View sample report</Link>
            <Link to="/features" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">Explore features</Link>
          </>
        }
      />
      <PublicSection title="What swimming stroke analysis means in Swim Sight 3D" description="Stroke analysis is not an automatic verdict. It is a coach-led video review workflow that turns a technical moment into a clear swimmer improvement plan.">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-sky-600">Coach workflow</div>
            <h2 className="mt-3 text-2xl font-bold text-slate-950">Tag the phase. Mark the moment. Share the plan.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Coaches can use Swim Sight 3D to review footage, save key timestamps, document technique faults, attach cues and drills, and create coach-approved swimmer reports.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Phase tagging', 'Organise review around entry, catch, breath, kick, recovery, rhythm, or line reset.'],
              ['Key moments', 'Save the timestamp that shows the correction clearly.'],
              ['Coach findings', 'Write or approve the technical observation before it reaches the report.'],
              ['Report output', 'Give swimmers a practical plan with cue, drill, and next focus.'],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-bold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </PublicSection>
      <PublicSection title="Choose a stroke" description="Each stroke page introduces the review phases and common faults coaches can document inside Coach Studio.">
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(strokePages).map(([slug, page]) => (
            <Link key={slug} to={`/stroke-analysis/${slug}`} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:border-sky-200 hover:shadow-md">
              <div className="h-2 bg-gradient-to-r from-sky-500 via-cyan-300 to-slate-950" />
              <div className="p-5">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-600">Stroke page</div>
                <div className="mt-3 flex items-start justify-between gap-4">
                  <h2 className="text-xl font-bold text-slate-950">{page.navLabel}</h2>
                  <ArrowRight className="mt-1 h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-sky-600" />
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{page.intro}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {page.phases.slice(0, 4).map(phase => (
                    <span key={phase} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{phase}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </PublicSection>
      <PublicSection subtle title="What stroke analysis means here" description="It means a structured coaching workflow, not an unsupported automatic verdict.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [Target, 'Review the phase', 'Tag the stroke phase and save the moments that support the correction.'],
            [CheckCircle2, 'Approve the finding', 'Coach-created or AI-assisted findings are reviewed before they reach a report.'],
            [FileText, 'Share the plan', 'The final output is a swimmer improvement report with cues, drills, and next focus.'],
          ].map(([Icon, title, description]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="h-5 w-5 text-sky-600" />
              <h2 className="mt-4 text-base font-bold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to="/sample-report" className="rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">View sample report</Link>
          <Link to="/features" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-white">Explore features</Link>
          <Link to="/for-coaches" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-white">For coaches</Link>
        </div>
      </PublicSection>
    </PublicLayout>
  );
}
