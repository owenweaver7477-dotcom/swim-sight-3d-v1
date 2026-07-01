import React from 'react';
import { useQuery } from '@tanstack/react-query';
import entities from '@/lib/data/entities';
import { setReviewSession } from '@/lib/swimState';
import { useClubContext } from '@/lib/useClubContext';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/shared/PageHeader';
import {
  Users, Waves, Video, Plus, ChevronRight,
  AlertCircle, Loader2, Brain, Upload, CheckCircle2,
  Dumbbell, ArrowRight, TrendingUp, Target
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { subDays, startOfDay, differenceInCalendarDays } from 'date-fns';
import FeedbackButton from '@/components/coach-testing/FeedbackButton';

// ── Real 7-day activity histogram from created_date values ───────────────────────
function buildSpark(dates) {
  const start = startOfDay(subDays(new Date(), 6));
  const buckets = Array(7).fill(0);
  dates.forEach((v) => {
    if (!v) return;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return;
    const idx = differenceInCalendarDays(d, start);
    if (idx >= 0 && idx <= 6) buckets[idx] += 1;
  });
  return buckets;
}

// ── Tiny real sparkline (only rendered when there is real recent activity) ───────
function Sparkline({ data }) {
  const max = Math.max(1, ...data);
  return (
    <svg viewBox="0 0 60 20" className="h-5 w-16" preserveAspectRatio="none" aria-hidden="true">
      {data.map((v, i) => {
        const h = Math.max(1.5, (v / max) * 18);
        return <rect key={i} x={i * 8.6} y={20 - h} width="5" height={h} rx="1" className="fill-primary/40" />;
      })}
    </svg>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────────
const BADGE_TONES = {
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  cyan: 'bg-cyan-100 text-cyan-700',
  blue: 'bg-blue-100 text-blue-700',
  slate: 'bg-slate-100 text-slate-600',
};
function Badge({ tone = 'slate', children }) {
  return <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${BADGE_TONES[tone] || BADGE_TONES.slate}`}>{children}</span>;
}

// ── KPI card (real data only) ───────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, spark, accent = 'bg-gradient-to-br from-primary/15 to-primary/5 text-primary', highlight }) {
  const showSpark = Array.isArray(spark) && spark.reduce((a, b) => a + b, 0) > 0;
  return (
    <div className={`group rounded-2xl border bg-white p-4 shadow-sm shadow-slate-950/[0.04] transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-950/[0.07] ${highlight ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </span>
        {highlight
          ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">Action</span>
          : (showSpark ? <Sparkline data={spark} /> : null)}
      </div>
      <div className="mt-3 text-[26px] font-bold leading-none text-slate-900">{value}</div>
      <div className="mt-1.5 text-[11px] font-medium text-slate-500">{label}</div>
      {sub && <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600"><TrendingUp className="h-3 w-3" />{sub}</div>}
    </div>
  );
}

// ── Coach Review Queue chip (real counts) ────────────────────────────────────────
const CHIP_TONES = {
  amber: 'text-amber-600 bg-amber-50',
  blue: 'text-blue-600 bg-blue-50',
  orange: 'text-orange-600 bg-orange-50',
  red: 'text-red-600 bg-red-50',
};
function ReviewChip({ icon: Icon, label, count, tone, onClick }) {
  const active = count > 0;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${active ? 'border-slate-200 bg-white hover:border-primary/30 hover:bg-primary/[0.03]' : 'border-slate-100 bg-slate-50/60'}`}
    >
      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${active ? CHIP_TONES[tone] : 'bg-slate-100 text-slate-400'}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className={`text-base font-bold leading-none ${active ? 'text-slate-900' : 'text-slate-400'}`}>{count}</div>
        <div className="mt-0.5 truncate text-[10px] font-medium text-slate-500">{label}</div>
      </div>
    </button>
  );
}

// ── Priority item row ────────────────────────────────────────────────────────────
function PriorityRow({ icon: Icon, iconColor, label, meta, cta, onClick, urgent, badge, badgeTone }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm shadow-slate-950/[0.02] ${urgent ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200 bg-white'}`}>
      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${urgent ? 'bg-amber-100' : 'bg-slate-100'}`}>
        <Icon className={`h-4 w-4 ${iconColor || 'text-slate-400'}`} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">{label}</span>
          {badge && <Badge tone={badgeTone}>{badge}</Badge>}
        </div>
        {meta && <div className="mt-0.5 truncate text-[11px] text-slate-500">{meta}</div>}
      </div>
      <button onClick={onClick} className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/15">
        {cta} <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── Highlighted "next best action" (top priority) ────────────────────────────────
function NextBestAction({ icon: Icon, label, meta, cta, onClick, badge, badgeTone }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/[0.07] to-transparent px-4 py-3.5">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow shadow-primary/25">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-wide text-primary">Next best action</span>
          {badge && <Badge tone={badgeTone}>{badge}</Badge>}
        </div>
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        {meta && <div className="mt-0.5 truncate text-[11px] text-slate-500">{meta}</div>}
      </div>
      <Button size="sm" className="h-8 flex-shrink-0 bg-primary text-xs text-white hover:bg-primary/90" onClick={onClick}>
        {cta} <ChevronRight className="ml-0.5 h-3 w-3" />
      </Button>
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────────────────
function SectionCard({ title, action, children }) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── No club state ────────────────────────────────────────────────────────────────
function NoClubDashboard() {
  const navigate = useNavigate();
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
        <Waves className="w-7 h-7 text-primary" />
      </div>
      <h1 className="text-xl font-bold text-slate-900 mb-2">Welcome to Swim Sight 3D</h1>
      <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">Create a club workspace to start managing swimmers, uploading footage, and running AI-assisted reviews.</p>
      <Button onClick={() => navigate('/club-onboarding')} className="bg-primary text-white">
        <Plus className="w-4 h-4 mr-2" /> Create Club Workspace
      </Button>
    </div>
  );
}

// ── Setup state ──────────────────────────────────────────────────────────────────
function SetupDashboard({ club }) {
  const navigate = useNavigate();
  const steps = [
    { label: 'Add your first swimmer', cta: 'Add Swimmer', action: () => navigate('/swimmers') },
    { label: 'Upload a video', cta: 'Upload Video', action: () => navigate('/analyse') },
    { label: 'Send for AI Review', cta: 'Start', action: () => navigate('/analyse') },
    { label: 'Invite a coach', cta: 'Invite', action: () => navigate('/club-settings') },
  ];
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <PageHeader eyebrow={club.name} title="Coach Setup" subtitle="Get the workspace ready for the first swimmer review." />
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="w-6 h-6 rounded-full border-2 border-slate-200 text-[10px] font-bold text-slate-400 flex items-center justify-center flex-shrink-0">{i + 1}</div>
            <span className="text-sm text-slate-700 flex-1">{s.label}</span>
            <Button size="sm" variant="outline" className="text-xs h-7 flex-shrink-0" onClick={s.action}>{s.cta}</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────────
export default function TeamDashboard() {
  const { club, loading } = useClubContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const enabled = !!club?.id;

  const { data: swimmers = [] } = useQuery({ queryKey: ['swimmers', club?.id], queryFn: () => entities.Swimmer.filter({ club_id: club.id }), enabled, staleTime: 5 * 60 * 1000 });
  const { data: videos = [] } = useQuery({ queryKey: ['videos', club?.id], queryFn: () => entities.VideoUpload.filter({ club_id: club.id }, '-created_date', 50), enabled, staleTime: 60 * 1000 });
  const { data: reports = [] } = useQuery({ queryKey: ['reports-dashboard', club?.id], queryFn: () => entities.Report.filter({ club_id: club.id }, '-created_date', 50), enabled, staleTime: 2 * 60 * 1000 });
  const { data: findings = [] } = useQuery({ queryKey: ['findings-dashboard', club?.id], queryFn: () => entities.Finding.filter({ club_id: club.id }, '-created_date', 100), enabled, staleTime: 2 * 60 * 1000 });
  const { data: aiJobs = [] } = useQuery({ queryKey: ['ai-jobs-dashboard', club?.id], queryFn: () => entities.AIProcessingJob.filter({ club_id: club.id }, '-created_date', 5), enabled, staleTime: 2 * 60 * 1000 });

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;
  if (!club) return <NoClubDashboard />;

  const hasData = swimmers.length > 0 || videos.length > 0 || reports.length > 0;
  if (!hasData) return <SetupDashboard club={club} />;

  const activeReports = reports.filter(r => !r.is_deleted);
  const aiReports = activeReports.filter(r => r.source === 'ai');
  const finalStatuses = ['coach_approved', 'finalised', 'published', 'shared'];
  const awaitingReview = aiReports.filter(r => !finalStatuses.includes(r.status));
  const publishedReports = activeReports.filter(r => finalStatuses.includes(r.status));

  const processingVideos = videos.filter(v => ['pending_ai', 'queued_ai', 'processing', 'processing_ai'].includes(v.processing_status));
  const readyVideos = videos.filter(v => v.processing_status === 'uploaded');
  const errorVideos = videos.filter(v => v.processing_status === 'error');
  const manualReviewReports = awaitingReview.filter(r =>
    r.analysis_mode === 'manual_review'
    || r.analysis_mode === 'error'
    || r.real_pose_detected === false
  );

  const pendingAIFindings = findings.filter(f => f.source === 'ai' && f.approval_status === 'pending');

  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentlyReviewedIds = new Set(publishedReports.filter(r => r.swimmer_id && new Date(r.updated_date || r.created_date) > thirtyDaysAgo).map(r => r.swimmer_id));
  const dueForReview = swimmers.filter(s => !recentlyReviewedIds.has(s.id));

  const faultCounts = {};
  findings.filter(f => f.approval_status === 'approved' && f.included_in_report).forEach(f => {
    if (f.finding_name) faultCounts[f.finding_name] = (faultCounts[f.finding_name] || 0) + 1;
  });
  const topFaults = Object.entries(faultCounts).sort(([,a],[,b]) => b - a).slice(0, 4);

  const recentReports = publishedReports.slice(0, 5).map(r => ({ ...r, swimmerName: swimmers.find(s => s.id === r.swimmer_id)?.name || 'Unknown' }));

  // Real "new this week" deltas + sparklines from created_date — no fabricated numbers.
  const sevenDaysAgo = subDays(new Date(), 7);
  const newSince = (arr, field = 'created_date') => arr.filter(x => x[field] && new Date(x[field]) >= sevenDaysAgo).length;
  const swimmersNew = newSince(swimmers);
  const videosNew = newSince(videos);
  const reportsNew = publishedReports.filter(r => new Date(r.updated_date || r.created_date) >= sevenDaysAgo).length;
  const swimmerSpark = buildSpark(swimmers.map(s => s.created_date));
  const videoSpark = buildSpark(videos.map(v => v.created_date));
  const reportSpark = buildSpark(publishedReports.map(r => r.updated_date || r.created_date));

  // Real activity signal from the already-fetched aiJobs (recent window) — display only.
  const activeJobStatuses = ['queued', 'accepted', 'running', 'downloading_video', 'extracting_frames', 'running_pose_detection', 'analysing_stroke', 'generating_outputs', 'callback_sending'];
  const activeJobs = aiJobs.filter(j => activeJobStatuses.includes(j.status));

  // Real greeting + coach name (from auth).
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const coachName = (user?.full_name || '').trim().split(' ')[0];

  const priorityItems = [
    awaitingReview.length > 0 && {
      icon: Brain, iconColor: 'text-amber-500', urgent: true, badge: 'Review needed', badgeTone: 'amber',
      label: `${awaitingReview.length} AI report${awaitingReview.length > 1 ? 's' : ''} awaiting coach review`,
      meta: `${pendingAIFindings.length} finding${pendingAIFindings.length !== 1 ? 's' : ''} need approval`,
      cta: 'Open Coach Studio', onClick: () => navigate('/ai-reviews'),
    },
    errorVideos.length > 0 && {
      icon: AlertCircle, iconColor: 'text-red-500', urgent: true, badge: 'Retry', badgeTone: 'red',
      label: `${errorVideos.length} video${errorVideos.length > 1 ? 's' : ''} failed processing`,
      meta: 'Retry or check video format',
      cta: 'Check Videos', onClick: () => navigate('/analyse'),
    },
    readyVideos.length > 0 && {
      icon: Video, iconColor: 'text-cyan-600', urgent: false, badge: 'Review suggested', badgeTone: 'cyan',
      label: `${readyVideos.length} uploaded video${readyVideos.length > 1 ? 's' : ''} ready for AI Review`,
      meta: 'Preview the clip, then use AI assistance or Coach Studio review',
      cta: 'Review Video', onClick: () => navigate('/analyse'),
    },
    manualReviewReports.length > 0 && {
      icon: AlertCircle, iconColor: 'text-orange-500', urgent: true, badge: 'Manual review', badgeTone: 'orange',
      label: `${manualReviewReports.length} report${manualReviewReports.length > 1 ? 's' : ''} need manual coach review`,
      meta: 'AI evidence was weak, filtered, or unavailable',
      cta: 'Open Coach Studio', onClick: () => navigate('/ai-reviews'),
    },
    processingVideos.length > 0 && {
      icon: Loader2, iconColor: 'text-blue-500', urgent: false, badge: 'Processing', badgeTone: 'blue',
      label: `${processingVideos.length} video${processingVideos.length > 1 ? 's' : ''} processing`,
      meta: 'AI analysis in progress',
      cta: 'Monitor', onClick: () => navigate('/analyse'),
    },
    dueForReview.length > 0 && {
      icon: Users, iconColor: 'text-slate-500', urgent: false, badge: 'Follow-up', badgeTone: 'slate',
      label: `${dueForReview.length} swimmer${dueForReview.length > 1 ? 's' : ''} not reviewed in 30 days`,
      meta: dueForReview.slice(0, 3).map(s => s.name).join(', ') + (dueForReview.length > 3 ? ` +${dueForReview.length - 3} more` : ''),
      cta: 'Upload Video', onClick: () => { setReviewSession(null); navigate('/analyse'); },
    },
  ].filter(Boolean);

  const allClear = priorityItems.length === 0;
  const reviewTotal = awaitingReview.length + processingVideos.length + manualReviewReports.length + errorVideos.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6">

      {/* Welcome banner — real club, greeting, coach name; static swimming motif */}
      <div className="relative mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-white p-6 shadow-lg shadow-primary/[0.06] sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-2/3">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_18%,rgba(0,119,182,0.14),transparent_58%)]" />
          <svg viewBox="0 0 400 220" preserveAspectRatio="xMaxYMid slice" className="absolute right-0 top-0 h-full w-full text-primary">
            <g fill="none" strokeWidth="2.5">
              <path d="M0,70 Q100,40 200,70 T400,70" stroke="currentColor" opacity="0.07" />
              <path d="M0,110 Q100,80 200,110 T400,110" stroke="currentColor" opacity="0.06" />
              <path d="M0,150 Q100,120 200,150 T400,150" stroke="currentColor" opacity="0.05" />
            </g>
          </svg>
        </div>
        <div className="relative">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{club.name}</div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-[26px]">
            {greeting},{' '}
            <span className="relative inline-block text-primary">
              Coach{coachName ? ` ${coachName}` : ''}
              <span aria-hidden="true" className="absolute -bottom-0.5 left-0 h-1 w-full rounded-full bg-gradient-to-r from-primary to-cyan-400" />
            </span>.
          </h1>
          <p className="mt-2 max-w-lg text-sm text-slate-500">
            Review AI-assisted findings, approve what you agree with, and share coach-approved reports.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" className="h-9 bg-primary text-xs text-white shadow-md shadow-primary/20 hover:bg-primary/90" onClick={() => { setReviewSession(null); navigate('/analyse'); }}>
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Start New Analysis
            </Button>
            <Button size="sm" variant="outline" className="h-9 text-xs" onClick={() => navigate('/ai-reviews')}>
              <Brain className="mr-1.5 h-3.5 w-3.5" /> Coach Studio
              {awaitingReview.length > 0 && <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-700">{awaitingReview.length}</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* KPI row — real counts, real deltas, real sparklines (omitted when no recent activity) */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={Users} label="Swimmers" value={swimmers.length} spark={swimmerSpark} sub={swimmersNew > 0 ? `+${swimmersNew} this week` : null} />
        <KpiCard icon={Video} label="Private Videos" value={videos.length} accent="bg-gradient-to-br from-sky-100 to-sky-50 text-sky-600" spark={videoSpark} sub={videosNew > 0 ? `+${videosNew} this week` : null} />
        <KpiCard icon={Brain} label="Awaiting coach review" value={awaitingReview.length} accent="bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600" highlight={awaitingReview.length > 0} />
        <KpiCard icon={CheckCircle2} label="Finalised Reports" value={publishedReports.length} accent="bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600" spark={reportSpark} sub={reportsNew > 0 ? `+${reportsNew} this week` : null} />
      </div>

      {/* Start analysis — CTA that navigates to /analyse only (not an uploader) */}
      <button
        onClick={() => { setReviewSession(null); navigate('/analyse'); }}
        className="group mb-5 flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/[0.03] px-5 py-5 text-left shadow-sm shadow-primary/[0.04] transition-colors hover:border-primary/50 hover:bg-primary/[0.06] sm:px-6"
      >
        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/25">
          <Upload className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-slate-900">Start a new AI analysis</div>
          <div className="text-xs text-slate-500">Upload a short swim clip to begin — the coach reviews and approves every finding.</div>
        </div>
        <span className="hidden flex-shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors group-hover:bg-primary/90 sm:inline-flex">
          Start analysis <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </button>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Left — the coach's core workflow */}
        <div className="space-y-5 lg:col-span-2">

          {/* HERO: what needs attention */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.04] sm:p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
                <Target className="h-5 w-5" />
              </span>
              <h2 className="text-base font-bold text-slate-900">What needs your attention today</h2>
              {!allClear && <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">{priorityItems.length}</span>}
            </div>
            {allClear ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-6 w-6" /></span>
                <div>
                  <div className="text-sm font-bold text-emerald-900">You&apos;re all caught up</div>
                  <div className="text-[11px] text-emerald-700">No AI reports are waiting for coach decisions right now.</div>
                </div>
                <Button size="sm" className="h-8 bg-primary text-xs text-white hover:bg-primary/90" onClick={() => { setReviewSession(null); navigate('/analyse'); }}>
                  <Upload className="mr-1.5 h-3.5 w-3.5" /> Start a new analysis
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <NextBestAction {...priorityItems[0]} />
                {priorityItems.slice(1).map((item, i) => <PriorityRow key={i} {...item} />)}
              </div>
            )}
          </div>

          {/* Coach Review Queue — real category counts */}
          <SectionCard
            title="Coach Review Queue"
            action={<Link to="/ai-reviews" className="flex items-center gap-0.5 text-[10px] font-semibold text-primary hover:underline">Open Coach Studio <ArrowRight className="h-3 w-3" /></Link>}
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-950/[0.02]">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <ReviewChip icon={Brain} label="Awaiting approval" count={awaitingReview.length} tone="amber" onClick={() => navigate('/ai-reviews')} />
                <ReviewChip icon={Loader2} label="Processing" count={processingVideos.length} tone="blue" onClick={() => navigate('/analyse')} />
                <ReviewChip icon={AlertCircle} label="Manual review" count={manualReviewReports.length} tone="orange" onClick={() => navigate('/ai-reviews')} />
                <ReviewChip icon={AlertCircle} label="Failed / retry" count={errorVideos.length} tone="red" onClick={() => navigate('/analyse')} />
              </div>
              <div className="mt-2.5 border-t border-slate-100 pt-2.5 text-[10px] text-slate-400">
                {reviewTotal === 0
                  ? 'Nothing in the review pipeline right now.'
                  : `${reviewTotal} item${reviewTotal === 1 ? '' : 's'} in the review pipeline${activeJobs.length > 0 ? ` · ${activeJobs.length} AI job${activeJobs.length === 1 ? '' : 's'} active` : ''}.`}
              </div>
            </div>
          </SectionCard>

          {/* Recent finalised reports */}
          {recentReports.length > 0 && (
            <SectionCard
              title="Recent Finalised Reports"
              action={<Link to="/ai-reviews" className="flex items-center gap-0.5 text-[10px] font-semibold text-primary hover:underline">View all <ArrowRight className="h-3 w-3" /></Link>}
            >
              <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.02]">
                {recentReports.map(r => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-slate-800">{r.swimmerName}</div>
                      <div className="truncate text-[10px] text-slate-500">{r.title || 'AI Report'}</div>
                    </div>
                    <button onClick={() => navigate(`/ai-review?report_id=${r.id}`)} className="flex-shrink-0 text-[10px] font-semibold text-primary hover:underline">Open →</button>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Right — actions + workflow + focus */}
        <div className="space-y-5">

          <SectionCard title="Quick Actions">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Upload Video', icon: Upload, to: '/analyse' },
                { label: 'Add Swimmer', icon: Plus, to: '/swimmers' },
                { label: 'Coach Studio', icon: Brain, to: '/ai-reviews' },
                { label: 'Drill Library', icon: Dumbbell, to: '/drill-library' },
              ].map(a => {
                const Icon = a.icon;
                return (
                  <button key={a.to} onClick={() => navigate(a.to)}
                    className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-sm shadow-slate-950/[0.02] transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
                    <span className="text-[10px] font-semibold text-slate-700">{a.label}</span>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.02]">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Coach Workflow</div>
            <div className="space-y-2.5">
              {[
                ['1', 'Upload a 5-10 second swim clip'],
                ['2', 'Open Coach Studio; AI assists when evidence is strong'],
                ['3', 'Add, approve, edit, or reject findings'],
                ['4', 'Finalise and share the coach-approved report'],
              ].map(([num, label]) => (
                <div key={num} className="flex items-center gap-2.5 text-[11px] text-slate-600">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{num}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {topFaults.length > 0 && (
            <SectionCard title="Club Technical Focus" action={<Link to="/drill-library" className="text-[10px] font-semibold text-primary hover:underline">Drills</Link>}>
              <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.02]">
                {topFaults.map(([name, count], i) => (
                  <div key={name} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-4 flex-shrink-0 text-[10px] font-bold text-slate-300">{i + 1}</div>
                    <div className="flex-1 truncate text-xs text-slate-700">{name}</div>
                    <span className="flex-shrink-0 text-[10px] font-semibold text-primary">{count}×</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          <button onClick={() => navigate('/drill-library')}
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm shadow-slate-950/[0.02] transition-colors hover:border-primary/30 hover:bg-primary/5">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Dumbbell className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-800">Drill Library</div>
              <div className="text-[10px] text-slate-500">Corrective packs and coach cues</div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </button>
        </div>
      </div>

      <FeedbackButton pageRoute="/dashboard" />

      <div className="mt-6 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[10px] text-slate-400">
        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
        {club.name} · live
      </div>
    </div>
  );
}
