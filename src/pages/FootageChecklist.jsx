import React from 'react';
import { CheckCircle2, FileVideo, ShieldAlert } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { useClubContext } from '@/lib/useClubContext';

const ADMIN_ROLES = ['owner', 'admin'];

const CAPTURE_RULES = [
  'Two swimmers are enough for the first comparison set.',
  'A front view and left-side view are enough for the first pass.',
  'Keep each clip between 5 and 15 seconds.',
  'Use raw MP4 where possible and avoid screen recordings.',
  'Use participant codes rather than real names in filenames.',
  'Keep footage private and obtain permission before recording or testing.',
  'Store local test clips only in the worker samples/videos folder.',
];

const MINIMUM_SET = [
  'Swimmer A - breaststroke - front',
  'Swimmer A - breaststroke - left side',
  'Swimmer A - freestyle - front',
  'Swimmer A - freestyle - left side',
  'Swimmer B - breaststroke - front',
  'Swimmer B - breaststroke - left side',
  'Swimmer B - freestyle - front',
  'Swimmer B - freestyle - left side',
];

const FILE_EXAMPLES = [
  'SS3D_001_breaststroke_side_left_swimmerA_2026-06-20.mp4',
  'SS3D_002_breaststroke_front_swimmerA_2026-06-20.mp4',
  'SS3D_003_freestyle_side_left_swimmerB_2026-06-20.mp4',
];

function ChecklistBlock({ title, description, items }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
      {description && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>}
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
export default function FootageChecklist() {
  const { club } = useClubContext();
  const canView = ADMIN_ROLES.includes(club?._memberRole);

  if (!canView) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <div className="text-sm font-medium text-foreground">Coach access required</div>
        <p className="mt-1 text-xs text-muted-foreground">Private test-footage guidance is for coaching staff.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <PageHeader
        eyebrow="Internal AI evaluation"
        title="Footage Collection Checklist"
        subtitle="Collect a small, permissioned comparison set before changing any AI quality flag. Clips remain local and must not be committed."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChecklistBlock title="Capture rules" items={CAPTURE_RULES} />
        <ChecklistBlock
          title="Minimum set - 8 clips"
          description="Two swimmers x two strokes x two angles. This is enough to begin a cautious comparison."
          items={MINIMUM_SET}
        />
        <ChecklistBlock
          title="Preferred set - 16 clips"
          description="Two swimmers x breaststroke, freestyle, backstroke, and butterfly x two angles."
          items={[
            'Repeat front and left-side views for all four strokes.',
            'Include ordinary pool lighting and realistic splash or occlusion.',
            'Record the coach-observed fault before reviewing worker output.',
            'Include suitable clips expected to pass and difficult clips expected to fall back to manual review.',
          ]}
        />
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <FileVideo className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-bold text-foreground">Filename examples</h2>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Use swimmer codes, not real names.</p>
          <div className="mt-4 space-y-2">
            {FILE_EXAMPLES.map((filename) => (
              <code key={filename} className="block overflow-x-auto rounded-md bg-secondary px-3 py-2 text-[11px] text-foreground">
                {filename}
              </code>
            ))}
          </div>
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
            Local path: worker repository <code>samples/videos/</code>. Never commit athlete footage, local labels, or generated evaluation reports.
          </div>
        </section>
      </div>
    </div>
  );
}
