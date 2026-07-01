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
  Dumbbell, ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { subDays } from 'date-fns';
import FeedbackButton from '@/components/coach-testing/FeedbackButton';

// ── KPI card (real data only) ───────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, accent = 'bg-primary/10 text-primary', highlight }) {
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm shadow-slate-950/[0.03] ${highlight ? 'border-amber-200' : 'border-slate-200'}`}>
      <div className="flex items-center justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-4 w-4" />
        </span>
        {highlight && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-600">Action</span>}
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
      {sub && <div className="mt-1 text-[10px] font-semibold text-emerald-600">{sub}</div>}
    </div>
  );
}

// ── Priority item row ────────────────────────────────────────────────────────────
function PriorityRow({ icon: Icon, iconColor, label, meta, cta, onClick, urgent }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 shadow-sm shadow-slate-950/[0.02] ${urgent ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-white'}`}>
      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${urgent ? 'bg-amber-100' : 'bg-slate-100'}`}>
        <Icon className={`h-4 w-4 ${iconColor || 'text-slate-400'}`} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-slate-800">{label}</div>
        {meta && <div className="mt-0.5 truncate text-[11px] text-slate-500">{meta}</div>}
      </div>
      <button onClick={onClick} className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/15">
        {cta} <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────────────────
function SectionCard({ title, action, children }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
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

  // Real "new this week" deltas from created_date — no fabricated percentages.
  const sevenDaysAgo = subDays(new Date(), 7);
  const newSince = (arr, field = 'created_date') => arr.filter(x => x[field] && new Date(x[field]) >= sevenDaysAgo).length;
  const swimmersNew = newSince(swimmers);
  const videosNew = newSince(videos);
  const reportsNew = publishedReports.filter(r => new Date(r.updated_date || r.created_date) >= sevenDaysAgo).length;

  // Real greeting + coach name (from auth).
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const coachName = (user?.full_name || '').trim().split(' ')[0];

  const priorityItems = [
    awaitingReview.length > 0 && {
      icon: Brain, iconColor: 'text-amber-500', urgent: true,
      label: `${awaitingReview.length} AI report${awaitingReview.length > 1 ? 's' : ''} awaiting coach review`,
      meta: `${pendingAIFindings.length} finding${pendingAIFindings.length !== 1 ? 's' : ''} need approval`,
      cta: 'Open Coach Studio', onClick: () => navigate('/ai-reviews'),
    },
    errorVideos.length > 0 && {
      icon: AlertCircle, iconColor: 'text-red-500', urgent: true,
      label: `${errorVideos.length} video${errorVideos.length > 1 ? 's' : ''} failed processing`,
      meta: 'Retry or check video format',
      cta: 'Check Videos', onClick: () => navigate('/analyse'),
    },
    readyVideos.length > 0 && {
      icon: Video, iconColor: 'text-cyan-600', urgent: false,
      label: `${readyVideos.length} uploaded video${readyVideos.length > 1 ? 's' : ''} ready for AI Review`,
      meta: 'Preview the clip, then use AI assistance or Coach Studio review',
      cta: 'Review Video', onClick: () => navigate('/analyse'),
    },
    manualReviewReports.length > 0 && {
      icon: AlertCircle, iconColor: 'text-orange-500', urgent: true,
      label: `${manualReviewReports.length} report${manualReviewReports.length > 1 ? 's' : ''} need manual coach review`,
      meta: 'AI evidence was weak, filtered, or unavailable',
      cta: 'Open Coach Studio', onClick: () => navigate('/ai-reviews'),
    },
    processingVideos.length > 0 && {
      icon: Loader2, iconColor: 'text-blue-500', urgent: false,
      label: `${processingVideos.length} video${processingVideos.length > 1 ? 's' : ''} processing`,
      meta: 'AI analysis in progress',
      cta: 'Monitor', onClick: () => navigate('/analyse'),
    },
    dueForReview.length > 0 && {
      icon: Users, iconColor: 'text-slate-500', urgent: false,
      label: `${dueForReview.length} swimmer${dueForReview.length > 1 ? 's' : ''} not reviewed in 30 days`,
      meta: dueForReview.slice(0, 3).map(s => s.name).join(', ') + (dueForReview.length > 3 ? ` +${dueForReview.length - 3} more` : ''),
      cta: 'Upload Video', onClick: () => { setReviewSession(null); navigate('/analyse'); },
    },
  ].filter(Boolean);

  const allClear = priorityItems.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24 sm:px-6">

      {/* Welcome banner — real club, greeting, and coach name */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-sky-50 via-white to-white p-6">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-2/3 bg-[radial-gradient(circle_at_85%_20%,rgba(0,119,182,0.10),transparent_60%)]" />
        <Waves className="pointer-events-none absolute -bottom-6 right-4 h-32 w-32 text-primary/[0.06]" />
        <div className="relative">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{club.name}</div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {greeting}, <span className="text-primary">Coach{coachName ? ` ${coachName}` : ''}</span>.
          </h1>
          <p className="mt-1.5 max-w-lg text-sm text-slate-500">
            Review AI-assisted findings, approve what you agree with, and share coach-approved reports.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" className="h-9 bg-primary text-xs text-white hover:bg-primary/90" onClick={() => { setReviewSession(null); navigate('/analyse'); }}>
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Start New Analysis
            </Button>
            <Button size="sm" variant="outline" className="h-9 text-xs" onClick={() => navigate('/ai-reviews')}>
              <Brain className="mr-1.5 h-3.5 w-3.5" /> Coach Studio
              {awaitingReview.length > 0 && <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-700">{awaitingReview.length}</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* KPI row — real fetched counts, real "new this week" deltas */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={Users} label="Swimmers" value={swimmers.length} accent="bg-primary/10 text-primary" sub={swimmersNew > 0 ? `+${swimmersNew} this week` : null} />
        <KpiCard icon={Video} label="Private Videos" value={videos.length} accent="bg-sky-100 text-sky-600" sub={videosNew > 0 ? `+${videosNew} this week` : null} />
        <KpiCard icon={Brain} label="Awaiting coach review" value={awaitingReview.length} accent="bg-amber-100 text-amber-600" highlight={awaitingReview.length > 0} />
        <KpiCard icon={CheckCircle2} label="Finalised Reports" value={publishedReports.length} accent="bg-emerald-100 text-emerald-600" sub={reportsNew > 0 ? `+${reportsNew} this week` : null} />
      </div>

      {/* Start analysis — CTA that navigates to /analyse only (not an uploader) */}
      <button
        onClick={() => { setReviewSession(null); navigate('/analyse'); }}
        className="group mb-6 flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/[0.03] px-5 py-5 text-left transition-colors hover:border-primary/50 hover:bg-primary/[0.06] sm:px-6"
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Left — priorities + recent reports */}
        <div className="space-y-6 lg:col-span-2">

          <SectionCard title="What needs your attention today">
            {allClear ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                <div>
                  <div className="text-sm font-semibold text-emerald-800">All clear</div>
                  <div className="text-[11px] text-emerald-700">No AI reports are waiting for coach decisions right now.</div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {priorityItems.map((item, i) => <PriorityRow key={i} {...item} />)}
              </div>
            )}
          </SectionCard>

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
        <div className="space-y-6">

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
                    className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-sm shadow-slate-950/[0.02] transition-colors hover:border-primary/30 hover:bg-primary/5">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-semibold text-slate-700">{a.label}</span>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {awaitingReview.length > 0 && (
            <SectionCard title="Review Queue">
              <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.02]">
                {awaitingReview.slice(0, 4).map(r => {
                  const sw = swimmers.find(s => s.id === r.swimmer_id);
                  return (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-slate-800">{r.title || 'AI Report'}</div>
                        {sw && <div className="text-[10px] text-slate-500">{sw.name}</div>}
                      </div>
                      <button onClick={() => navigate(`/ai-review?report_id=${r.id}`)} className="flex-shrink-0 text-[10px] font-semibold text-primary hover:underline">Review →</button>
                    </div>
                  );
                })}
                {awaitingReview.length > 4 && (
                  <div className="px-4 py-2.5">
                    <Link to="/ai-reviews" className="text-[10px] font-semibold text-primary hover:underline">+{awaitingReview.length - 4} more in Coach Studio</Link>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.02]">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Coach Workflow</div>
            <div className="space-y-2">
              {[
                ['1', 'Upload a 5-10 second swim clip'],
                ['2', 'Open Coach Studio; AI assists when evidence is strong'],
                ['3', 'Add, approve, edit, or reject findings'],
                ['4', 'Finalise and share the coach-approved report'],
              ].map(([num, label]) => (
                <div key={num} className="flex items-center gap-2 text-[11px] text-slate-600">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{num}</span>
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
            <Dumbbell className="h-5 w-5 flex-shrink-0 text-primary" />
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
