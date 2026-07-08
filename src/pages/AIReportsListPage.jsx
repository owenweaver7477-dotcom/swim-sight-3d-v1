import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import entities from '@/lib/data/entities';
import functions from '@/lib/data/functions';
import { useClubContext } from '@/lib/useClubContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/shared/PageHeader';
import {
  Brain, ArrowRight,
  Loader2, Upload, Trash2, X, Search, PlayCircle
} from 'lucide-react';
import FeedbackButton from '@/components/coach-testing/FeedbackButton';
import PilotReadinessWarning from '@/components/status/PilotReadinessWarning';
import { format } from 'date-fns';
import { isPilotRole } from '@/lib/permissions';

// ── Reliability label ──────────────────────────────────────────────────────────
const PROCESSING_JOB_STATUSES = [
  'queued',
  'accepted',
  'running',
  'downloading_video',
  'extracting_frames',
  'running_pose_detection',
  'analysing_stroke',
  'generating_outputs',
  'callback_sending',
];

// Short labels for the "continue where you left off" cards, keyed by classify() group.
const GROUP_LABELS = {
  needs_review: 'Needs review',
  processing: 'Processing',
  manual_review: 'Manual review',
  in_review: 'In progress',
  finalised: 'Finalised',
};

function ReliabilityLabel({ report, job }) {
  const summary = job?.callback_summary || {};
  if (PROCESSING_JOB_STATUSES.includes(job?.status)) {
    return <span className="text-[10px] font-medium text-blue-700">AI processing in progress</span>;
  }
  if (['error', 'timed_out'].includes(job?.status) || report.analysis_mode === 'error') {
    return <span className="text-[10px] font-medium text-red-600">Processing failed — retry or complete manual review</span>;
  }
  if (summary.quality_gate_passed === true || (report.analysis_mode === 'real_pose' && report.real_pose_detected)) {
    return <span className="text-[10px] font-medium text-green-700">Coach-grade pose evidence — approval required</span>;
  }
  if (job?.pose_reliability === 'partial') {
    return <span className="text-[10px] font-medium text-amber-700">Partial pose evidence — manual review first</span>;
  }
  if (report.real_pose_detected === false || job?.status === 'manual_review_recommended') {
    return <span className="text-[10px] font-medium text-amber-700">Quality gate failed — manual review recommended</span>;
  }
  return <span className="text-[10px] font-medium text-amber-600">Evidence requires coach verification</span>;
}

// ── Status label ───────────────────────────────────────────────────────────────
function CoachStatusLabel({ report, pending, approved }) {
  if (['coach_approved', 'finalised', 'published', 'shared'].includes(report.status)) return <span className="text-[10px] font-semibold text-green-700">Final report ready</span>;
  if (pending > 0) return <span className="text-[10px] font-semibold text-amber-700">Coach review required</span>;
  if (approved > 0) return <span className="text-[10px] font-semibold text-slate-600">In review</span>;
  return <span className="text-[10px] text-slate-400">No findings yet</span>;
}

// ── Delete modal ───────────────────────────────────────────────────────────────
function DeleteModal({ report, onConfirm, onCancel, isDeleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onCancel}>
      <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <div className="text-sm font-semibold text-slate-900">Delete AI Report?</div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed mb-4">
          Removes <strong>"{report.title || 'AI Report'}"</strong> from review queues and sharing. The video can be re-analysed. This cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onCancel}>Cancel</Button>
          <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Deleting…</> : <><Trash2 className="w-3 h-3 mr-1" />Delete</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Report row ─────────────────────────────────────────────────────────────────
function ReportRow({ report, swimmer, video, job, findings, onDelete, canDelete }) {
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);

  const pending  = findings.filter(f => f.approval_status === 'pending').length;
  const approved = findings.filter(f => f.approval_status === 'approved').length;
  const isFinalised = ['coach_approved', 'finalised', 'published', 'shared'].includes(report.status);
  const needsReview = pending > 0;

  return (
    <>
      {showDelete && (
        <DeleteModal report={report} onCancel={() => setShowDelete(false)} onConfirm={() => { onDelete(report.id); setShowDelete(false); }} isDeleting={false} />
      )}
      <div
        className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors"
        onClick={() => navigate(`/ai-review?report_id=${report.id}`)}
      >
        {/* Status indicator strip */}
        <div className={`w-1 h-10 rounded-full flex-shrink-0 ${isFinalised ? 'bg-green-400' : needsReview ? 'bg-amber-400' : 'bg-slate-200'}`} />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-900 truncate">
              {swimmer?.name || '—'}
            </span>
            {video?.stroke_type && (
              <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">{video.stroke_type}</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <CoachStatusLabel report={report} pending={pending} approved={approved} />
            <span className="text-slate-200 text-[10px]">·</span>
            <ReliabilityLabel report={report} job={job} />
            {(report.ai_completed_at || report.created_date) && (
              <>
                <span className="text-slate-200 text-[10px]">·</span>
                <span className="text-[10px] text-slate-400">{format(new Date(report.ai_completed_at || report.created_date), 'dd MMM yyyy')}</span>
              </>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {canDelete && (
            <button
              className="p-1 text-slate-300 hover:text-red-500 transition-colors"
              onClick={() => setShowDelete(true)}
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <Button
            size="sm"
            className={`h-7 text-[11px] px-3 font-semibold ${isFinalised ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-primary text-white'}`}
            onClick={() => navigate(`/ai-review?report_id=${report.id}`)}
          >
            {isFinalised ? 'View Report' : needsReview ? 'Review' : 'Open'}
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </>
  );
}

// ── Section heading ────────────────────────────────────────────────────────────
function QueueSection({ title, count, children }) {
  if (count === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{count}</span>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
        {children}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function AIReportsListPage() {
  const { club } = useClubContext();
  const queryClient = useQueryClient();

  const { data: allReports = [], isLoading } = useQuery({
    queryKey: ['ai-reports', club?.id],
    queryFn: () => entities.Report.filter({ club_id: club.id }, '-created_date', 200),
    enabled: !!club?.id,
    staleTime: 15 * 1000,
    refetchInterval: 15 * 1000,
  });
  const reports = allReports.filter(r => !r.is_deleted);

  const deleteReport = useMutation({
    mutationFn: (report_id) => functions.deleteAIReport(report_id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-reports', club?.id] }),
  });

  const { data: swimmers = [] } = useQuery({ queryKey: ['swimmers', club?.id], queryFn: () => entities.Swimmer.filter({ club_id: club.id }), enabled: !!club?.id, staleTime: 5 * 60 * 1000 });
  const { data: videos = [] } = useQuery({ queryKey: ['videos-for-reports', club?.id], queryFn: () => entities.VideoUpload.filter({ club_id: club.id }, '-created_date', 200), enabled: !!club?.id, staleTime: 30 * 1000, refetchInterval: 20 * 1000 });
  const { data: jobs = [] } = useQuery({ queryKey: ['jobs-for-reports', club?.id], queryFn: () => entities.AIProcessingJob.filter({ club_id: club.id }, '-created_date', 200), enabled: !!club?.id, staleTime: 10 * 1000, refetchInterval: 10 * 1000, refetchOnWindowFocus: true });
  const { data: allFindings = [] } = useQuery({ queryKey: ['ai-reports-findings', club?.id], queryFn: () => entities.Finding.filter({ club_id: club.id }, '-created_date', 300), enabled: !!club?.id, staleTime: 15 * 1000, refetchInterval: 15 * 1000 });

  const swimmerMap = Object.fromEntries(swimmers.map(s => [s.id, s]));
  const videoMap   = Object.fromEntries(videos.map(v => [v.id, v]));
  const latestJobForReport = (report) => jobs.find(job => job.report_id === report.id)
    || jobs.find(job => job.video_upload_id === report.video_upload_id)
    || null;
  const findingsByReport = allFindings.reduce((acc, f) => {
    if (!acc[f.report_id]) acc[f.report_id] = [];
    acc[f.report_id].push(f);
    return acc;
  }, {});

  const canDelete = isPilotRole(club?._memberRole);

  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [swimmerFilter, setSwimmerFilter] = useState('all');
  const [strokeFilter, setStrokeFilter] = useState('all');

  // Classify each report once — single source of truth for both the grouped sections
  // and the status filter (mirrors the previous mutually-exclusive grouping order).
  const finalisedStatuses = ['coach_approved', 'finalised', 'published', 'shared'];
  const isManualReviewReport = (r) => r.analysis_mode === 'error'
    || r.analysis_mode === 'placeholder'
    || r.analysis_mode === 'manual_review'
    || r.real_pose_detected === false;
  const isProcessingReport = (r) => PROCESSING_JOB_STATUSES.includes(latestJobForReport(r)?.status);
  const classify = (r) => {
    if (finalisedStatuses.includes(r.status)) return 'finalised';
    if ((findingsByReport[r.id] || []).some(f => f.approval_status === 'pending')) return 'needs_review';
    if (isProcessingReport(r)) return 'processing';
    if (isManualReviewReport(r)) return 'manual_review';
    return 'in_review';
  };
  const grouped = { needs_review: [], processing: [], manual_review: [], in_review: [], finalised: [] };
  reports.forEach(r => grouped[classify(r)].push(r));

  const strokeOf = (r) => videoMap[r.video_upload_id]?.stroke_type || r.stroke_type || '';
  const availableStrokes = Array.from(new Set(reports.map(strokeOf).filter(Boolean))).sort();
  const swimmersWithReports = Array.from(new Set(reports.map(r => r.swimmer_id).filter(Boolean)))
    .map(id => swimmerMap[id]).filter(Boolean)
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));

  const searchText = search.trim().toLowerCase();
  const isFiltering = Boolean(searchText) || statusFilter !== 'all' || swimmerFilter !== 'all' || strokeFilter !== 'all';
  const matchesFilters = (r) => {
    if (statusFilter !== 'all' && classify(r) !== statusFilter) return false;
    if (swimmerFilter !== 'all' && r.swimmer_id !== swimmerFilter) return false;
    if (strokeFilter !== 'all' && strokeOf(r).toLowerCase() !== strokeFilter.toLowerCase()) return false;
    if (searchText) {
      const haystack = `${swimmerMap[r.swimmer_id]?.name || ''} ${strokeOf(r)} ${r.title || ''}`.toLowerCase();
      if (!haystack.includes(searchText)) return false;
    }
    return true;
  };
  const filteredReports = reports.filter(matchesFilters);
  const clearFilters = () => { setSearch(''); setStatusFilter('all'); setSwimmerFilter('all'); setStrokeFilter('all'); };

  // Continue where you left off — most recent UNFINISHED reports (never finalised/shared).
  const continueQueue = reports
    .filter(r => !finalisedStatuses.includes(r.status))
    .slice()
    .sort((a, b) => new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0))
    .slice(0, 4);

  const statusChips = [
    { key: 'all', label: 'All' },
    { key: 'needs_review', label: 'Needs review' },
    { key: 'processing', label: 'Processing' },
    { key: 'manual_review', label: 'Manual review' },
    { key: 'in_review', label: 'In progress' },
    { key: 'finalised', label: 'Finalised / Shared' },
  ].filter(c => c.key === 'all' || grouped[c.key].length > 0);

  const showFacets = availableStrokes.length > 1 || swimmersWithReports.length > 1;

  const rowProps = (r) => ({
    report: r,
    swimmer: swimmerMap[r.swimmer_id],
    video: videoMap[r.video_upload_id],
    job: latestJobForReport(r),
    findings: findingsByReport[r.id] || [],
    canDelete,
    onDelete: (id) => deleteReport.mutate(id),
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
      <PageHeader
        title="Coach Studio"
        subtitle="Open video reviews, approve AI-assisted drafts, or complete premium manual analysis."
        action={
          <Link to="/analyse">
            <Button size="sm" className="bg-primary text-white text-xs h-8">
              <Upload className="w-3 h-3 mr-1.5" /> Upload Video
            </Button>
          </Link>
        }
      />

      <PilotReadinessWarning className="mb-4" />

      <div className="mb-5 text-[11px] text-slate-500 bg-white border border-slate-200 rounded-lg px-4 py-2.5">
        AI assists when evidence is strong. Coach Studio remains the main review workspace.
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
          <span className="text-sm text-slate-500">Loading reports…</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="p-10 rounded-xl border border-dashed border-slate-300 bg-white text-center">
          <Brain className="w-9 h-9 text-slate-300 mx-auto mb-3" />
          <div className="text-sm font-semibold text-slate-700 mb-1">No coach reviews yet</div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto mb-4">
            Upload a video in Analyse, then open Coach Studio with AI assistance or manual review.
          </p>
          <Link to="/analyse">
            <Button size="sm" className="bg-primary text-white">
              <Upload className="w-3 h-3 mr-1.5" /> Go to Analyse
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Continue where you left off — unfinished reports only */}
          {continueQueue.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2 px-1">
                <PlayCircle className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Continue where you left off</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {continueQueue.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => navigate(`/ai-review?report_id=${r.id}`)}
                    className="w-56 flex-shrink-0 rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-primary/40 hover:bg-slate-50"
                  >
                    <div className="truncate text-sm font-semibold text-slate-900">{swimmerMap[r.swimmer_id]?.name || '—'}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      {strokeOf(r) && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{strokeOf(r)}</span>}
                      <span className="text-[10px] text-slate-400">{GROUP_LABELS[classify(r)]}</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">Resume <ArrowRight className="h-3 w-3" /></div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search + filters */}
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by swimmer, stroke, or report…"
                className="h-10 pl-9 text-sm"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Clear search">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {statusChips.map(chip => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setStatusFilter(chip.key)}
                  className={`h-8 rounded-full border px-3 text-xs font-semibold transition-colors ${statusFilter === chip.key ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40'}`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            {(showFacets || isFiltering) && (
              <div className="flex flex-wrap items-center gap-2">
                {swimmersWithReports.length > 1 && (
                  <select
                    value={swimmerFilter}
                    onChange={e => setSwimmerFilter(e.target.value)}
                    className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700"
                  >
                    <option value="all">All swimmers</option>
                    {swimmersWithReports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
                {availableStrokes.length > 1 && (
                  <select
                    value={strokeFilter}
                    onChange={e => setStrokeFilter(e.target.value)}
                    className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700"
                  >
                    <option value="all">All strokes</option>
                    {availableStrokes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
                {isFiltering && (
                  <button type="button" onClick={clearFilters} className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700">
                    <X className="h-3.5 w-3.5" /> Clear filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Filtered results, or the default grouped sections */}
          {isFiltering ? (
            filteredReports.length === 0 ? (
              <div className="p-10 rounded-xl border border-dashed border-slate-300 bg-white text-center">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <div className="text-sm font-semibold text-slate-700 mb-1">No reports match</div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto mb-4">Try a different swimmer, stroke, or status.</p>
                <Button size="sm" variant="outline" onClick={clearFilters}><X className="w-3 h-3 mr-1.5" /> Clear filters</Button>
              </div>
            ) : (
              <QueueSection title="Results" count={filteredReports.length}>
                {filteredReports.map(r => <ReportRow key={r.id} {...rowProps(r)} />)}
              </QueueSection>
            )
          ) : (
            <div className="space-y-6">
              <QueueSection title="Coach Review Required" count={grouped.needs_review.length}>
                {grouped.needs_review.map(r => <ReportRow key={r.id} {...rowProps(r)} />)}
              </QueueSection>

              <QueueSection title="Processing" count={grouped.processing.length}>
                {grouped.processing.map(r => <ReportRow key={r.id} {...rowProps(r)} />)}
              </QueueSection>

              <QueueSection title="Manual Review Recommended" count={grouped.manual_review.length}>
                {grouped.manual_review.map(r => <ReportRow key={r.id} {...rowProps(r)} />)}
              </QueueSection>

              <QueueSection title="In Review" count={grouped.in_review.length}>
                {grouped.in_review.map(r => <ReportRow key={r.id} {...rowProps(r)} />)}
              </QueueSection>

              <QueueSection title="Finalised" count={grouped.finalised.length}>
                {grouped.finalised.map(r => <ReportRow key={r.id} {...rowProps(r)} />)}
              </QueueSection>
            </div>
          )}
        </div>
      )}

      <FeedbackButton pageRoute="/ai-reviews" />
    </div>
  );
}
