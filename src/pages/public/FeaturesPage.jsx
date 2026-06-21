import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Clock3, FileText, Lock, PencilLine, Target, Users, Video } from 'lucide-react';
import PublicLayout, { PublicHero, PublicSection } from '@/components/public/PublicLayout';
import StructuredData from '@/components/seo/StructuredData';
import usePublicMeta from './usePublicMeta';
import { publicSeoMetadata } from './publicSeoMetadata';
import { breadcrumbStructuredData } from './publicStructuredData';

const workflow = ['Upload', 'Review', 'Mark moments', 'Add findings', 'Share report'];

const featureGroups = [
  {
    title: 'Video Review',
    icon: Video,
    description: 'Upload race or training footage into a private club workspace and review the moments that matter.',
    points: ['Private club video library', 'Short clip guidance', 'Signed playback inside the app'],
  },
  {
    title: 'Coach Studio',
    icon: PencilLine,
    description: 'Slow video down, save key moments, draw on frames, and create findings from timestamps.',
    points: ['Fullscreen review', 'Coach Draw', 'Manual findings from moments'],
  },
  {
    title: 'AI-Assisted Evidence',
    icon: Brain,
    description: 'AI can suggest draft findings when evidence quality is strong enough, while coaches keep final control.',
    points: ['Draft findings only', 'Quality-gated review', 'Manual review when evidence is weak'],
  },
  {
    title: 'Reports + Sharing',
    icon: FileText,
    description: 'Turn approved findings into swimmer-friendly improvement reports with cues, drills, and selected key moments.',
    points: ['Approved content only', 'Secure shared links', 'Printable report structure'],
  },
  {
    title: 'Club Workflow',
    icon: Users,
    description: 'Organise swimmers, squads, and reports without exposing private video.',
    points: ['Squads and profiles', 'Role-based workspace', 'Club progress direction'],
  },
];

export default function FeaturesPage() {
  usePublicMeta(publicSeoMetadata.features);

  return (
    <PublicLayout>
      <StructuredData data={breadcrumbStructuredData([{ name: 'Home', path: '/' }, { name: 'Features', path: '/features' }])} />
      <PublicHero
        eyebrow="Features"
        title="Video review, coach findings, and swimmer reports in one workflow."
        description="Private video review, Coach Studio, AI-assisted evidence, and swimmer reports — one workflow."
        actions={
          <>
            <Link to="/sample-report" className="rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">View sample report</Link>
            <Link to="/coach-approved-ai" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">How AI works</Link>
            <Link to="/login" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">Open App</Link>
          </>
        }
      />
      <PublicSection title="One review line from footage to plan" description="One connected flow, not a dozen disconnected tools.">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10 sm:p-6">
          <div className="grid gap-3 md:grid-cols-5">
            {workflow.map((step, index) => (
              <div key={step} className="relative rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Step {index + 1}</div>
                <div className="mt-2 text-base font-bold">{step}</div>
                {index < workflow.length - 1 && (
                  <ArrowRight className="absolute right-4 top-5 hidden h-4 w-4 text-cyan-200/60 md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </PublicSection>
      <PublicSection subtle title="Feature groups" description="Each group maps to a practical part of the coach workflow.">
        <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <Target className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-950">Built around coach decisions.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Video, AI, findings, drills, and reports follow one rule: the coach reviews evidence before it's shared.
            </p>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-800">
              AI suggests. Coaches decide. <Link to="/coach-approved-ai" className="text-sky-700 hover:text-sky-900">Read the trust explanation.</Link>
            </div>
          </div>
          <div className="grid gap-4">
            {featureGroups.map(({ title, icon: Icon, description, points }) => (
              <article key={title} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[auto_1fr]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-cyan-200">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-950">{title}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {points.map(point => (
                      <span key={point} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">{point}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </PublicSection>
      <PublicSection title="Privacy and approval stay built in" description="Not raw software output — coach-approved, swimmer-friendly feedback.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [Lock, 'Private video handling', 'Shared reports do not expose private video paths or signed playback links.'],
            [Clock3, 'Timestamped evidence', 'Key moments stay connected to the finding, drill, and next focus.'],
            [FileText, 'Clear report output', 'Reports use swimmer-facing language: what we saw, why it matters, what to feel, and what to practise.'],
          ].map(([Icon, title, description]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="h-5 w-5 text-sky-600" />
              <h3 className="mt-4 text-base font-bold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </PublicSection>
    </PublicLayout>
  );
}
