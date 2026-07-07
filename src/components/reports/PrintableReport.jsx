import React from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Star, Target, Dumbbell, Download, Pencil, Camera, Activity, ClipboardCheck, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTimestamp } from '@/lib/annotationRender';
import { sanitizePublicAnnotations, sanitizePublicFindings } from '@/lib/sanitizeAIReport';

const LOGO_SRC = '/brand/swim-sight-logo.png';

const SEVERITY_STYLES = {
  low:      { label: 'Low',      cls: 'text-sky-700 bg-sky-50 border-sky-200' },
  medium:   { label: 'Medium',   cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  high:     { label: 'High',     cls: 'text-orange-700 bg-orange-50 border-orange-200' },
  critical: { label: 'Critical', cls: 'text-red-700 bg-red-50 border-red-200' },
};

function SeverityBadge({ severity }) {
  const cfg = SEVERITY_STYLES[severity] || SEVERITY_STYLES.medium;
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>{cfg.label}</span>;
}

function uniqueTruthy(items = []) {
  return Array.from(new Set(items.filter(Boolean).map(item => String(item).trim()).filter(Boolean)));
}

function clubInitials(club) {
  if (club?.initials) return String(club.initials).slice(0, 3).toUpperCase();
  const derived = (club?.name || '').split(/\s+/).filter(Boolean).map(word => word[0]).join('').slice(0, 3).toUpperCase();
  return derived || 'SC';
}

function SectionHeading({ icon: Icon, children, count }) {
  return (
    <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
      {Icon && (
        <span className="w-6 h-6 rounded-md bg-blue-600/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-blue-600" />
        </span>
      )}
      {children}
      {count != null && <span className="text-xs font-semibold text-slate-400">({count})</span>}
    </h2>
  );
}

function MetaItem({ label, value, strong }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">{label}</div>
      <div className={strong ? 'text-base font-bold text-slate-900' : 'text-sm text-slate-800'}>{value}</div>
    </div>
  );
}

function Field({ label, children, strong, small }) {
  return (
    <div>
      <div className="text-[9px] font-bold uppercase tracking-wider text-blue-600 mb-0.5">{label}</div>
      <p className={`leading-relaxed ${strong ? 'text-sm font-semibold text-slate-900' : small ? 'text-xs text-slate-600' : 'text-sm text-slate-700'}`}>{children}</p>
    </div>
  );
}

// The frame image: video-frame thumbnail (with drawing overlay when present), or the
// drawing SVG for a marks-only coach drawing, or a CLEAN light placeholder — never a
// dark strip for a missing phase-moment frame.
function FrameImage({ annotation }) {
  const safeThumbnail = typeof annotation.thumbnail_data_url === 'string' && annotation.thumbnail_data_url.startsWith('data:image/')
    ? annotation.thumbnail_data_url
    : null;
  const isDrawing = annotation.annotation_type === 'coach_draw' || annotation.annotation_type === 'body_line';
  const stamp = annotation.frame_label || annotation.video_frame_time_label || (annotation.timestamp_seconds != null ? formatTimestamp(annotation.timestamp_seconds) : null);
  const aspect = `${annotation.canvas_width || 16}/${annotation.canvas_height || 9}`;

  let media;
  if (safeThumbnail) {
    media = (
      <div className="relative bg-slate-950">
        <img src={safeThumbnail} alt="" className="w-full object-contain" />
        {annotation.rendered_svg && (
          <div className="pointer-events-none absolute inset-0 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: annotation.rendered_svg }} />
        )}
      </div>
    );
  } else if (isDrawing && annotation.rendered_svg) {
    media = (
      <div className="bg-slate-950 [&>svg]:block [&>svg]:h-full [&>svg]:w-full" style={{ aspectRatio: aspect }} dangerouslySetInnerHTML={{ __html: annotation.rendered_svg }} />
    );
  } else {
    media = (
      <div className="flex flex-col items-center justify-center gap-1 bg-slate-100 text-slate-400" style={{ aspectRatio: aspect }}>
        <Camera className="w-5 h-5 opacity-50" />
        <span className="text-[10px] font-medium">Phase image unavailable</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {media}
      {stamp && <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-mono text-white">{stamp}</span>}
    </div>
  );
}

function FindingCard({ finding, index, image }) {
  const observation = (finding.coach_sees || finding.observation || finding.finding_name || '').split('\n\nCoach should check: ')[0];
  const drillTitle = finding.drill || finding.linked_drill_title;
  const stamp = finding.timestamp_start != null ? formatTimestamp(finding.timestamp_start) : null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden print:break-inside-avoid">
      <div className={`grid grid-cols-1 ${image ? 'md:grid-cols-[minmax(0,220px)_1fr] print:grid-cols-[220px_1fr]' : ''}`}>
        {image && (
          <div className="bg-slate-950 md:border-r print:border-r border-slate-200">
            <FrameImage annotation={image} />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{index}</div>
            {finding.phase && <span className="text-sm font-bold text-slate-900">{finding.phase}</span>}
            {stamp && <span className="text-[10px] font-mono text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">{stamp}</span>}
            {finding.severity && <SeverityBadge severity={finding.severity} />}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-5 gap-y-2.5">
            <div className="space-y-2.5">
              {observation && <Field label="Observation">{observation}</Field>}
              {finding.cue && <Field label="Coaching Cue">{finding.cue}</Field>}
              {finding.why_it_matters && <Field label="Why it matters">{finding.why_it_matters}</Field>}
            </div>
            <div className="space-y-2.5">
              {drillTitle && <Field label="Recommended Drill" strong>{drillTitle}</Field>}
              {finding.linked_drill_summary && <Field label="Why it helps" small>{finding.linked_drill_summary}</Field>}
              {finding.next_focus && <Field label="Next Focus">{finding.next_focus}</Field>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GalleryCard({ annotation, findingNumber, kind }) {
  const title = annotation.title || (kind === 'drawing' ? 'Coach drawing' : 'Phase moment');
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden print:break-inside-avoid">
      <FrameImage annotation={annotation} />
      <div className="p-3">
        <div className="text-sm font-bold text-slate-900">{title}</div>
        {annotation.phase && <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 mt-0.5">{annotation.phase}</div>}
        {annotation.note && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{annotation.note}</p>}
        {findingNumber && <div className="text-[10px] text-slate-500 mt-1.5">Linked to Finding #{findingNumber}</div>}
      </div>
    </div>
  );
}

function DrillCard({ drill }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 print:break-inside-avoid">
      <div className="flex items-start gap-2 mb-1.5">
        <Dumbbell className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm font-bold text-blue-700 leading-snug">{drill.title}</div>
      </div>
      {drill.summary && <p className="text-xs text-slate-600 leading-relaxed mb-2">{drill.summary}</p>}
      {drill.focus && <div className="text-[10px] text-slate-600"><span className="font-bold text-slate-700">Focus:</span> {drill.focus}</div>}
      {drill.cue && <div className="text-[10px] text-slate-600 mt-0.5"><span className="font-bold text-slate-700">Cue:</span> {drill.cue}</div>}
    </div>
  );
}

export default function PrintableReport({ report, swimmer, club, video_meta, findings: inputFindings = [], annotations: inputAnnotations = [], showPrintButton = false, isManualReview = false, aiUsed = false }) {
  const findings = sanitizePublicFindings(inputFindings);
  const annotations = sanitizePublicAnnotations(inputAnnotations);
  const reportDate = report.ai_completed_at || report.created_date;

  const phaseMoments = annotations.filter(a => a.annotation_type === 'key_frame');
  const coachDrawings = annotations.filter(a => a.annotation_type === 'coach_draw' || a.annotation_type === 'body_line');
  const findingNumberById = new Map(findings.map((finding, index) => [finding.id, index + 1]));

  // Linked images per finding — prefer the marked-up coach drawing, else the phase moment.
  const linkedByFinding = new Map();
  annotations.forEach(a => {
    if (!a.finding_id || !findingNumberById.has(a.finding_id)) return;
    const group = linkedByFinding.get(a.finding_id) || [];
    group.push(a);
    linkedByFinding.set(a.finding_id, group);
  });
  const findingImage = (finding) => {
    const linked = linkedByFinding.get(finding.id) || [];
    return linked.find(a => a.annotation_type === 'coach_draw' || a.annotation_type === 'body_line')
      || linked.find(a => a.annotation_type === 'key_frame')
      || null;
  };

  const reportType = isManualReview ? 'Coach Manual Review' : 'Coach-Reviewed AI Analysis';
  const reportSubtitle = isManualReview ? 'Coach-created technical report' : 'Coach-reviewed AI analysis';

  const focusAreas = uniqueTruthy(findings.map(finding => finding.next_focus || finding.finding_name)).slice(0, 4);
  const nextSessionFocus = report.next_focus || findings.find(finding => finding.next_focus)?.next_focus || '';

  const drillPlan = [];
  const drillSeen = new Set();
  findings.forEach(finding => {
    const title = finding.linked_drill_title || finding.drill;
    if (!title) return;
    const key = title.toLowerCase();
    if (drillSeen.has(key)) return;
    drillSeen.add(key);
    drillPlan.push({ title, summary: finding.linked_drill_summary || '', focus: finding.phase || '', cue: finding.cue || '' });
  });

  const handlePrint = () => {
    window.scrollTo(0, 0);
    setTimeout(() => window.print(), 100);
  };

  return (
    <div className="printable-report-area-content">
      {showPrintButton && (
        <div className="print:hidden mb-8 flex justify-end">
          <Button onClick={handlePrint} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg" size="lg">
            <Download className="w-5 h-5 mr-2" /> Download PDF
          </Button>
        </div>
      )}

      <div className="print-report max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none print:max-w-none text-slate-900">
        {/* Header */}
        <div className="px-8 py-6 border-b-2 border-slate-900">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img src={LOGO_SRC} alt="Swim Sight 3D" className="h-11 w-11 object-contain flex-shrink-0" />
              <div>
                <div className="text-sm font-black tracking-wide text-slate-900">Swim Sight 3D</div>
                <div className="text-[10px] font-semibold text-blue-600">Powered by Swim Sight 3D</div>
              </div>
            </div>

            <div className="flex-1 text-center">
              <h1 className="text-2xl font-black text-slate-900 leading-tight">{reportType}</h1>
              <div className="text-xs font-semibold text-blue-600">{reportSubtitle}</div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900 uppercase leading-tight">{club?.name || 'Swim Club'}</div>
                {club?.head_coach_name && <div className="text-[10px] text-slate-500">Head Coach: {club.head_coach_name}</div>}
                <div className="text-[10px] text-slate-500">Date: {reportDate ? format(new Date(reportDate), 'dd MMMM yyyy') : '—'}</div>
              </div>
              <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-white text-xs font-black flex-shrink-0">{clubInitials(club)}</div>
            </div>
          </div>
        </div>

        {/* Athlete / review details */}
        <div className="mx-8 my-5 rounded-xl border border-blue-100 bg-blue-50/60 px-5 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-4">
            <MetaItem label="Swimmer" value={swimmer?.name || 'N/A'} strong />
            <MetaItem label="Stroke" value={video_meta?.stroke_type || '—'} strong />
            <MetaItem label="Analysis Type" value={video_meta?.analysis_type || (isManualReview ? 'Manual Review' : 'AI Review')} />
            <MetaItem label="Video Source" value={video_meta?.camera_angle || 'Coach recording'} />
          </div>
        </div>

        {/* Coach Summary */}
        <div className="px-8 pb-2">
          <SectionHeading icon={ClipboardCheck}>Coach Summary</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-6">
            <div className="md:col-span-2 print:col-span-2 space-y-3">
              <p className="text-sm text-slate-700 leading-relaxed">
                {report.coach_summary || 'Coach review of the swimmer’s technique, with focus points and drills to work on in the next training block.'}
              </p>
              {nextSessionFocus && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-blue-600" /> Next Session Focus
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{nextSessionFocus}</p>
                </div>
              )}
            </div>
            {focusAreas.length > 0 && (
              <div className="md:col-span-1 print:col-span-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Key Focus Areas</div>
                <ul className="space-y-1.5">
                  {focusAreas.map(area => (
                    <li key={area} className="flex items-start gap-2 text-sm text-slate-700 leading-snug">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* AI technique score — only when AI content is in the report */}
          {aiUsed && report.overall_score != null && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 print:break-inside-avoid">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex flex-col items-center justify-center text-white flex-shrink-0">
                  <span className="text-2xl font-black">{report.overall_score}</span>
                  <span className="text-[8px] font-semibold uppercase tracking-wider opacity-90">Score</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Overall Technique Score</div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.round(report.overall_score / 20) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                    ))}
                  </div>
                </div>
              </div>
              {report.technical_summary && <p className="text-xs text-slate-600 leading-relaxed mt-3">{report.technical_summary}</p>}
            </div>
          )}
        </div>

        {/* Key Findings — visual-first, image beside each finding */}
        <div className="px-8 py-6">
          <SectionHeading icon={Activity} count={findings.length || null}>Key Findings</SectionHeading>
          {findings.length ? (
            <div className="space-y-4">
              {findings.map((finding, index) => (
                <FindingCard key={finding.id} finding={finding} index={index + 1} image={findingImage(finding)} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Coach findings will appear here once added to the review.</p>
          )}
        </div>

        {/* Drill Plan */}
        {drillPlan.length > 0 && (
          <div className="border-t border-slate-200 px-8 py-6">
            <SectionHeading icon={Dumbbell} count={drillPlan.length}>Drill Plan</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-4">
              {drillPlan.map(drill => <DrillCard key={drill.title} drill={drill} />)}
            </div>
          </div>
        )}

        {/* Phase Moments gallery — larger thumbnails */}
        {phaseMoments.length > 0 && (
          <div className="border-t border-slate-200 px-8 py-6">
            <SectionHeading icon={Camera} count={phaseMoments.length}>Phase Moments</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4">
              {phaseMoments.map(annotation => (
                <GalleryCard key={annotation.id} annotation={annotation} findingNumber={findingNumberById.get(annotation.finding_id)} kind="moment" />
              ))}
            </div>
          </div>
        )}

        {/* Coach Drawings gallery */}
        {coachDrawings.length > 0 && (
          <div className="border-t border-slate-200 px-8 py-6">
            <SectionHeading icon={Pencil} count={coachDrawings.length}>Coach Drawings</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4">
              {coachDrawings.map(annotation => (
                <GalleryCard key={annotation.id} annotation={annotation} findingNumber={findingNumberById.get(annotation.finding_id)} kind="drawing" />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-8 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={LOGO_SRC} alt="Swim Sight 3D" className="h-9 w-9 object-contain flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-700">
                  {aiUsed ? 'AI-assisted suggestions were reviewed, edited, or approved by a coach before sharing.' : 'Prepared by the coach using Swim Sight 3D.'}
                </div>
                <div className="text-[10px] text-slate-500">{aiUsed ? 'Coach-reviewed AI analysis.' : 'Coach-created technical review.'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Coach Approved</span>
              </div>
              <Share2 className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
