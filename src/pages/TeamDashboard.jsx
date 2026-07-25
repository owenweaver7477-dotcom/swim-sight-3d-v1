import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import entities from '@/lib/data/entities';
import { AI_PILOT_LOCKED } from '@/lib/aiPilotLock';
import { setReviewSession } from '@/lib/swimState';
import { useClubContext } from '@/lib/useClubContext';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/shared/PageHeader';
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';
import {
  Users, Waves, Video, Plus, ChevronRight,
  AlertCircle, Loader2, Brain, Upload, CheckCircle2, ArrowRight, Share2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { subDays } from 'date-fns';
import FeedbackButton from '@/components/coach-testing/FeedbackButton';

// ── Status badge ─────────────────────────────────────────────────────────────────
const BADGE_TONES = {
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  sky: 'bg-sky-100 text-sky-700',
  blue: 'bg-blue-100 text-blue-700',
  slate: 'bg-slate-100 text-slate-600',
};
function Badge({ tone = 'slate', children }) {
  return <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${BADGE_TONES[tone] || BADGE_TONES.slate}`}>{children}</span>;
}

// ── Priority item row ────────────────────────────────────────────────────────────
function PriorityRow({ icon: Icon, iconColor, label, meta, cta, onClick, urgent, badge, badgeTone }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${urgent ? 'border-amber-200 bg-amber-50/50 dark:border-amber-500/30 dark:bg-amber-500/10' : 'border-border bg-card'}`}>
      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${urgent ? 'bg-amber-100 dark:bg-amber-500/15' : 'bg-muted'}`}>
        <Icon className={`h-4 w-4 ${iconColor || 'text-muted-foreground'}`} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          {badge && <Badge tone={badgeTone}>{badge}</Badge>}
        </div>
        {meta && <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{meta}</div>}
      </div>
      <button onClick={onClick} className="inline-flex flex-shrink-0 items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/15">
        {cta} <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── Highlighted "next best action" (top priority) ────────────────────────────────
function NextBestAction({ icon: Icon, label, meta, cta, onClick, badge, badgeTone }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/[0.04] px-4 py-3.5">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary text-white">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-wide text-primary">Next best action</span>
          {badge && <Badge tone={badgeTone}>{badge}</Badge>}
        </div>
        <div className="text-sm font-semibold text-foreground">{label}</div>
        {meta && <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{meta}</div>}
      </div>
      <Button size="sm" className="h-8 flex-shrink-0 bg-primary text-xs text-white hover:bg-primary/90" onClick={onClick}>
        {cta} <ChevronRight className="ml-0.5 h-3 w-3" />
      </Button>
    </div>
  );
}

// ── One of the three dashboard questions ─────────────────────────────────────────
function QuestionSection({ n, title, action, children }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">{n}</span>
          <h2 className="text-sm font-bold text-foreground">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// ── No club state ────────────────────────────────────────────────────────────────
function NoClubDashboard() {
  const navigate = useNavigate();
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="w-14 h-14 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
        <Waves className="w-7 h-7 text-primary" />
      </div>
      <h1 className="text-xl font-bold tracking-tight text-foreground mb-2">Welcome to Swim Sight 3D</h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">Create a club workspace to start managing swimmers, uploading footage, and running coach reviews.</p>
      <Button onClick={() => navigate('/club-onboarding')} className="bg-primary text-white">
        <Plus className="w-4 h-4 mr-2" /> Create Club Workspace
      </Button>
    </div>
  );
}

// ── Setup state (zero data) ──────────────────────────────────────────────────────
function SetupDashboard({ club }) {
  const navigate = useNavigate();
  const steps = [
    { label: 'Add your first swimmer', cta: 'Add Swimmer', action: () => navigate('/swimmers') },
    { label: 'Upload a video', cta: 'Upload Video', action: () => navigate('/analyse') },
    { label: AI_PILOT_LOCKED ? 'Start a coach review' : 'Send for AI Review', cta: 'Start', action: () => navigate('/analyse') },
    { label: 'Invite a coach', cta: 'Invite', action: () => navigate('/club-settings') },
  ];
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <PageHeader eyebrow={club.name} title="Coach Setup" subtitle="Get the workspace ready for the first swimmer review." />
      <div className="bg-card rounded-lg border border-border divide-y divide-border">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="w-6 h-6 rounded-full border-2 border-border text-[10px] font-bold text-muted-foreground flex items-center justify-center flex-shrink-0">{i + 1}</div>
            <span className="text-sm text-foreground flex-1">{s.label}</span>
            <Button size="sm" variant="outline" className="text-xs h-7 flex-shrink-0" onClick={s.action}>{s.cta}</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main dashboard — three questions ─────────────────────────────────────────────
export default function TeamDashboard() {
  const { club, loading } = useClubContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const enabled = !!club?.id;
  const [, forceRerender] = useState(0);

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

  const swimmerNameFor = (id) => swimmers.find(s => s.id === id)?.name || 'Unknown';

  // Continue last review — most recent UNFINISHED report (never finalised/shared).
  const lastUnfinished = activeReports
    .filter(r => !finalStatuses.includes(r.status))
    .slice()
    .sort((a, b) => new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0))[0];

  // Finished work — finalised + shared reports, newest first.
  const finishedList = publishedReports
    .slice()
    .sort((a, b) => new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0))
    .slice(0, 6)
    .map(r => ({ ...r, swimmerName: swimmerNameFor(r.swimmer_id), isShared: r.status === 'shared' }));

  // Real activity signal from the already-fetched aiJobs (recent window) — display only.
  const activeJobStatuses = ['queued', 'accepted', 'running', 'downloading_video', 'extracting_frames', 'running_pose_detection', 'analysing_stroke', 'generating_outputs', 'callback_sending'];
  const activeJobs = aiJobs.filter(j => activeJobStatuses.includes(j.status));

  // Real greeting + coach name (from auth).
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const coachName = (user?.full_name || '').trim().split(' ')[0];

  // Onboarding — real completion from data; dismissable per club (persisted).
  const onboardKey = `ssd_onboard_dismiss_${club.id}`;
  let onboardDismissed = false;
  try { onboardDismissed = typeof localStorage !== 'undefined' && localStorage.getItem(onboardKey) === '1'; } catch { onboardDismissed = false; }
  const onboardCompleted = {
    club: true,
    swimmer: swimmers.length > 0,
    video: videos.length > 0,
    ai_job: aiJobs.length > 0, // only shown by the checklist when AI is unlocked; keeps auto-hide working then
    finding: findings.length > 0,
    report: publishedReports.length > 0,
    share: activeReports.some(r => r.status === 'shared'),
  };
  const dismissOnboarding = () => {
    try { localStorage.setItem(onboardKey, '1'); } catch { /* private mode: dismissal is best-effort */ }
    forceRerender(n => n + 1);
  };

  const priorityItems = [
    awaitingReview.length > 0 && {
      icon: Brain, iconColor: 'text-amber-500', urgent: true, badge: 'Review needed', badgeTone: 'amber',
      label: `${awaitingReview.length} report${awaitingReview.length > 1 ? 's' : ''} awaiting coach review`,
      // Only mention findings when some are actually pending — otherwise this read
      // "1 report awaiting coach review / 0 findings need approval", a contradiction
      // (and always 0 while AI is locked for the manual-first pilot).
      meta: pendingAIFindings.length > 0
        ? `${pendingAIFindings.length} finding${pendingAIFindings.length !== 1 ? 's' : ''} to approve`
        : 'Mark moments, write findings, then finalise',
      cta: 'Open Coach Studio', onClick: () => navigate('/ai-reviews'),
    },
    errorVideos.length > 0 && {
      icon: AlertCircle, iconColor: 'text-red-500', urgent: true, badge: 'Retry', badgeTone: 'red',
      label: `${errorVideos.length} video${errorVideos.length > 1 ? 's' : ''} failed processing`,
      meta: 'Retry or check video format',
      cta: 'Check Videos', onClick: () => navigate('/analyse'),
    },
    readyVideos.length > 0 && {
      icon: Video, iconColor: 'text-sky-700', urgent: false, badge: 'Review suggested', badgeTone: 'sky',
      label: `${readyVideos.length} uploaded video${readyVideos.length > 1 ? 's' : ''} ready for review`,
      meta: 'Preview the clip, then use AI assistance or Coach Studio review',
      cta: 'Review Video', onClick: () => navigate('/analyse'),
    },
    manualReviewReports.length > 0 && {
      icon: AlertCircle, iconColor: 'text-orange-500', urgent: true, badge: 'Manual review', badgeTone: 'orange',
      label: `${manualReviewReports.length} report${manualReviewReports.length > 1 ? 's are' : ' is'} ready for your review`,
      meta: 'Open Coach Studio to mark moments and write your findings',
      cta: 'Open Coach Studio', onClick: () => navigate('/ai-reviews'),
    },
    processingVideos.length > 0 && {
      icon: Loader2, iconColor: 'text-blue-500', urgent: false, badge: 'Processing', badgeTone: 'blue',
      label: `${processingVideos.length} video${processingVideos.length > 1 ? 's' : ''} processing`,
      meta: 'Review in progress',
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
  // Bind the printed count to what is actually rendered (it previously summed four
  // categories while the list can render six, so the number contradicted the cards).
  const reviewTotal = priorityItems.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24 sm:px-6">

      {/* Lean header — greeting, club, primary actions */}
      <div className="mb-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{club.name}</div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
          {greeting},{' '}
          <span className="relative inline-block text-primary">
            Coach{coachName ? ` ${coachName}` : ''}
            <span aria-hidden="true" className="absolute -bottom-0.5 left-0 h-px w-full bg-primary" />
          </span>.
        </h1>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Review your findings, approve what you agree with, and share coach-approved reports.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" className="h-9 bg-primary text-xs text-white hover:bg-primary/90" onClick={() => { setReviewSession(null); navigate('/analyse'); }}>
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Start a new review
          </Button>
          <Button size="sm" variant="outline" className="h-9 text-xs" onClick={() => navigate('/ai-reviews')}>
            <Brain className="mr-1.5 h-3.5 w-3.5" /> Coach Studio
            {awaitingReview.length > 0 && <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-700">{awaitingReview.length}</span>}
          </Button>
        </div>
      </div>

      {/* Onboarding — new coaches only; self-hides when complete or dismissed */}
      {!onboardDismissed && <OnboardingChecklist completed={onboardCompleted} onDismiss={dismissOnboarding} />}

      <div className="space-y-8">

        {/* ── Question 1 — What needs your review? ───────────────────────────── */}
        <QuestionSection n="1" title="What needs your review?">
          {allClear ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-8 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"><CheckCircle2 className="h-6 w-6" /></span>
              <div>
                <div className="text-sm font-bold text-emerald-900 dark:text-emerald-200">You&apos;re all caught up</div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300">No reports are waiting for coach decisions right now.</div>
              </div>
              <Button size="sm" className="h-8 bg-primary text-xs text-white hover:bg-primary/90" onClick={() => { setReviewSession(null); navigate('/analyse'); }}>
                <Upload className="mr-1.5 h-3.5 w-3.5" /> Start a new analysis
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <NextBestAction {...priorityItems[0]} />
              {priorityItems.slice(1).map((item, i) => <PriorityRow key={i} {...item} />)}
              {reviewTotal > 0 && (
                <div className="pt-1 text-[11px] text-muted-foreground">
                  {reviewTotal} item{reviewTotal === 1 ? '' : 's'} in the review pipeline{activeJobs.length > 0 ? ` · ${activeJobs.length} in progress` : ''}.
                </div>
              )}
            </div>
          )}
        </QuestionSection>

        {/* ── Question 2 — What are you working on? ──────────────────────────── */}
        <QuestionSection n="2" title="What are you working on?">
          <div className="grid gap-3 sm:grid-cols-2">
            {lastUnfinished ? (
              <button
                onClick={() => navigate(`/ai-review?report_id=${lastUnfinished.id}`)}
                className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/[0.04] px-4 py-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/[0.07]"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary text-white"><Brain className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">Continue last review</div>
                  <div className="truncate text-xs font-semibold text-foreground">{swimmerNameFor(lastUnfinished.swimmer_id)}</div>
                </div>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary" />
              </button>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted px-4 py-4">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"><Brain className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">In progress</div>
                  <div className="text-xs font-medium text-muted-foreground">No review in progress</div>
                </div>
              </div>
            )}
            <button
              onClick={() => { setReviewSession(null); navigate('/analyse'); }}
              className="flex items-center gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/[0.03] px-4 py-4 text-left transition-colors hover:border-primary/60 hover:bg-primary/[0.06]"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary text-white"><Upload className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">Start new</div>
                <div className="truncate text-xs font-semibold text-foreground">Upload a swim clip to begin</div>
              </div>
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary" />
            </button>
          </div>
        </QuestionSection>

        {/* ── Question 3 — What have you finished? ───────────────────────────── */}
        <QuestionSection
          n="3"
          title="What have you finished?"
          action={finishedList.length > 0 && <Link to="/ai-reviews" className="flex items-center gap-0.5 text-[10px] font-semibold text-primary hover:underline">View all <ArrowRight className="h-3 w-3" /></Link>}
        >
          {finishedList.length > 0 ? (
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {finishedList.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${r.isShared ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-600'}`}>
                    {r.isShared ? <Share2 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-xs font-semibold text-foreground">{r.swimmerName}</div>
                      {r.isShared && <Badge tone="sky">Shared</Badge>}
                    </div>
                    <div className="truncate text-[10px] text-muted-foreground">{r.title || 'Coach review report'}</div>
                  </div>
                  <button onClick={() => navigate(`/ai-review?report_id=${r.id}`)} className="flex-shrink-0 text-[10px] font-semibold text-primary hover:underline">Open →</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted px-4 py-8 text-center text-[11px] text-muted-foreground">
              No finalised reports yet. Finish a coach review to see it here.
            </div>
          )}
        </QuestionSection>
      </div>

      <FeedbackButton pageRoute="/dashboard" />

      <div className="mt-8 flex items-center gap-1.5 border-t border-border pt-3 text-[10px] text-muted-foreground">
        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
        {club.name} · live
      </div>
    </div>
  );
}
