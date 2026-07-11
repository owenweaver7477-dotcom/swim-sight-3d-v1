import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout, { PublicHero, PublicSection } from '@/components/public/PublicLayout';
import StructuredData from '@/components/seo/StructuredData';
import usePublicMeta from './usePublicMeta';
import { publicSeoMetadata } from './publicSeoMetadata';
import { breadcrumbStructuredData, faqStructuredData } from './publicStructuredData';

const faqGroups = [
  {
    category: 'Product',
    items: [
      ['Does Swim Sight 3D replace the coach?', 'No. Swim Sight 3D is a manual review tool. The coach marks moments, writes every finding, and decides what appears in a report.'],
      ['Is this a manual review tool?', 'Yes. Coach Studio is a manual video-review workspace — timestamps, key moments, drawing, coach findings, drills, and reports, all created by the coach.'],
      ['What does the "3D" in the name mean?', 'Swim Sight 3D is built around coach-reviewed video and visual evidence. It is the product name; pilot reports are video-based coach reviews, not lab-grade 3D measurement.'],
      ['What video length works best?', 'For pilot testing, short 5–15 second clips, side view, and 720p or compressed 1080p footage are recommended.'],
    ],
  },
  {
    category: 'Coach review',
    items: [
      ['How are findings created?', 'The coach creates every finding by hand from the video — mark the moment, draw on the frame, and write the observation, cue, and drill.'],
      ['Can coaches edit findings?', 'Yes. Coaches write, edit, reject, or reorder findings before finalising a report.'],
    ],
  },
  {
    category: 'Privacy',
    items: [
      ['Are videos private?', 'Videos stay inside the authenticated club workflow. Shared reports never expose private paths or signed URLs — see the privacy page.'],
      ['What is excluded from shared reports?', 'Shared reports exclude private paths, signed URLs, rejected findings, and internal coach notes.'],
    ],
  },
  {
    category: 'Clubs',
    items: [
      ['Can clubs manage squads?', 'Yes. The logged-in app supports club workspaces, squads, swimmer profiles, and role-based access.'],
      ['Is this for clubs or individual coaches?', 'Both. Individual coaches can review swimmers, and clubs can use workspaces, squads, roles, reports, and progress views.'],
    ],
  },
  {
    category: 'Reports',
    items: [
      ['Can reports be shared with swimmers or parents?', 'Yes. Coaches can create secure shared report links with approved public-safe content.'],
      ['What strokes are supported?', 'The public structure covers breaststroke, freestyle, backstroke, and butterfly. The app review workflow is designed around stroke phases and coach findings.'],
    ],
  },
];

const faqs = faqGroups.flatMap(group => group.items);

export default function FAQPage() {
  usePublicMeta(publicSeoMetadata.faq);

  return (
    <PublicLayout>
      <StructuredData
        data={[
          faqStructuredData(faqs),
          breadcrumbStructuredData([
            { name: 'Home', path: '/' },
            { name: 'FAQ', path: '/faq' },
          ]),
        ]}
      />
      <PublicHero
        eyebrow="FAQ"
        title="Swim Sight 3D frequently asked questions."
        description="Short, honest answers about AI, coach approval, privacy, reports, supported strokes, and pilot access."
        actions={
          <>
            <Link to="/features" className="rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">Explore features</Link>
            <Link to="/coach-approved-ai" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">AI + trust</Link>
          </>
        }
      />
      <PublicSection title="Frequently asked questions">
        <div className="grid gap-5">
          {faqGroups.map((group) => (
            <section key={group.category} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold text-slate-950">{group.category}</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{group.items.length} questions</span>
              </div>
              <div className="grid gap-3">
                {group.items.map(([question, answer]) => (
                  <div key={question} className="rounded-2xl bg-slate-50 p-4">
                    <h3 className="text-base font-bold text-slate-950">{question}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{answer}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </PublicSection>
      <PublicSection subtle title="Useful next pages">
        <div className="flex flex-wrap gap-3">
          <Link to="/sample-report" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-white">View sample report</Link>
          <Link to="/coach-approved-ai" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-white">Coach-approved AI</Link>
          <Link to="/privacy-video-review" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-white">Privacy + video review</Link>
          <Link to="/features" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-white">Explore features</Link>
          <Link to="/login" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Log in</Link>
        </div>
      </PublicSection>
    </PublicLayout>
  );
}
