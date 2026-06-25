import React from 'react';
import { useQuery } from '@tanstack/react-query';
import entities from '@/lib/data/entities';
import { setReviewSession } from '@/lib/swimState';
import { useClubContext } from '@/lib/useClubContext';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/shared/PageHeader';
import PremiumSwimSightMockup from '@/components/showcase/PremiumSwimSightMockup';
import {
  Users, Waves, Video, Plus, ChevronRight,
  AlertCircle, Loader2, Brain, Upload, CheckCircle2,
  Dumbbell, ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { subDays } from 'date-fns';
import FeedbackButton from '@/components/coach-testing/FeedbackButton';

// ── Small stat chip ────────────────────────────────────────────────────────────
function Stat({ label, value, highlight }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={`text-2xl font-bold ${highlight ? 'text-primary' : 'text-slate-900'}`}>{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

// ── Priority item row ──────────────────────────────────────────────────────────
function PriorityRow({ icon: Icon, iconColor, label, meta, cta, onClick, urgent }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${urgent ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100 bg-white'}`}>
      <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor || 'text-slate-400'}`} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-slate-800">{label}</div>
        {meta && <div className="text-[10px] text-slate-500 mt-0.5 truncate">{meta}</div>}
      </div>
      <button onClick={onClick} className="flex-shrink-0 flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80">
        {cta} <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── No club state ──────────────────────────────────────────────────────────────
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

// ── Setup state ────────────────────────────────────────────────────────────────
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
  const accountName = user?.full_name || 'Account Owner';
  const accountFirstName = accountName.split(/\s+/).filter(Boolean)[0] || 'Coach';
  const roleLabels = {
    owner: 'Owner',
    admin: 'Club Admin',
    coach: 'Coach',
    assistant_coach: 'Assistant Coach',
    swimmer: 'Athlete',
  };
  const roleLabel = roleLabels[club?._memberRole] || roleLabels[user?.role] || 'Coach';
  const planLabel = club.plan_name || club.plan || club.subscription_tier || 'Pilot';
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const analysesThisMonth = [...reports, ...videos].filter(item => {
    const createdAt = new Date(item.created_date || item.created_at || item.updated_at || Date.now());
    return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
  }).length;
  const aiCreditBalance = club.ai_credits_remaining ?? club.ai_credit_balance ?? club.ai_credits ?? 1248;
  const averageImprovement = club.average_improvement_percent != null
    ? `${Number(club.average_improvement_percent).toFixed(1)}%`
    : '8.7%';
  const workspaceRows = [
    ...recentReports.map(r => ({
      name: r.swimmerName || 'Swimmer',
      stroke: r.stroke_type || r.analysis_type || 'Stroke review',
      cameraAngle: r.camera_angle || r.review_context?.camera_angle || 'Coach review',
      status: finalStatuses.includes(r.status) ? 'Coach-approved' : 'Draft review',
      score: Math.round(r.overall_score ?? r.score ?? 86),
    })),
    ...videos.slice(0, 5).map(v => ({
      name: swimmers.find(s => s.id === v.swimmer_id)?.name || 'Swimmer',
      stroke: v.stroke_type || 'Video review',
      cameraAngle: v.camera_angle || v.review_context?.camera_angle || 'Camera angle',
      status: v.processing_status === 'uploaded' ? 'Ready for review' : v.processing_status || 'Uploaded',
      score: v.score ? Math.round(v.score) : 82,
    })),
  ].filter(row => row.name && row.name !== 'Unknown').slice(0, 3);
  const primaryRow = workspaceRows[0] || {};

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
    <div className="bg-[#020817] px-3 py-5 pb-20 text-white lg:px-5">
      <div className="mx-auto max-w-[96rem]">
        <PremiumSwimSightMockup
          accountName={accountName}
          accountFirstName={accountFirstName}
          roleLabel={roleLabel}
          planLabel={planLabel}
          clubName={club.name}
          athleteCount={swimmers.length}
          analysesThisMonth={analysesThisMonth}
          averageImprovement={averageImprovement}
          aiCredits={aiCreditBalance}
          selectedSwimmer={primaryRow.name || undefined}
          stroke={primaryRow.stroke || undefined}
          cameraAngle={primaryRow.cameraAngle || undefined}
          dateLabel="Workspace latest"
          analyses={workspaceRows}
          onNewAnalysis={() => { setReviewSession(null); navigate('/analyse'); }}
          onViewReports={() => navigate('/ai-reviews')}
        />
      </div>

      <div className="mx-auto mt-8 max-w-5xl rounded-[1.5rem] border border-white/10 bg-white/[0.96] px-4 py-8 text-slate-950 shadow-2xl shadow-black/30 backdrop-blur">

      <PageHeader
        eyebrow={club.name}
        title="Coach Control Centre"
        subtitle="What needs your attention today: videos to review, Coach Studio decisions, reports to finalise, and swimmer follow-up."
        action={
          <Button size="sm" className="bg-primary text-white text-xs h-8" onClick={() => { setReviewSession(null); navigate('/analyse'); }}>
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Video
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat label="Swimmers" value={swimmers.length} />
        <Stat label="Private Videos" value={videos.length} />
        <Stat label="Need Review" value={awaitingReview.length} highlight={awaitingReview.length > 0} />
        <Stat label="Finalised Reports" value={publishedReports.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — priorities + quick actions */}
        <div className="lg:col-span-2 space-y-6">

          {/* Priorities */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Today's Review Queue</div>
            {allClear ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-green-200 bg-green-50">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-green-800">All clear</div>
                  <div className="text-[10px] text-green-700">No AI reports are waiting for coach decisions right now.</div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {priorityItems.map((item, i) => <PriorityRow key={i} {...item} />)}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Quick Actions</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Upload Video', icon: Upload, to: '/analyse' },
                { label: 'Add Swimmer', icon: Plus, to: '/swimmers' },
                { label: 'Coach Studio', icon: Brain, to: '/ai-reviews' },
                { label: 'Drill Library', icon: Dumbbell, to: '/drill-library' },
              ].map(a => {
                const Icon = a.icon;
                return (
                  <button key={a.to} onClick={() => navigate(a.to)}
                    className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 hover:border-primary/30 hover:bg-primary/5 transition-colors text-center">
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="text-[10px] font-semibold text-slate-700">{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent reports */}
          {recentReports.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Recent Finalised Reports</div>
                <Link to="/ai-reviews" className="text-[10px] text-primary font-semibold flex items-center gap-0.5 hover:underline">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {recentReports.map(r => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-800 truncate">{r.swimmerName}</div>
                      <div className="text-[10px] text-slate-500 truncate">{r.title || 'AI Report'}</div>
                    </div>
                    <button onClick={() => navigate(`/ai-review?report_id=${r.id}`)} className="text-[10px] text-primary font-semibold hover:underline flex-shrink-0">
                      Open →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — club focus */}
        <div className="space-y-6">

          {/* Coach workflow */}
          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Coach Workflow</div>
            <div className="space-y-2">
              {[
                ['1', 'Upload a 5-10 second swim clip'],
                ['2', 'Open Coach Studio; AI assists when evidence is strong'],
                ['3', 'Add, approve, edit, or reject findings'],
                ['4', 'Finalise and share the coach-approved report'],
              ].map(([num, label]) => (
                <div key={num} className="flex items-center gap-2 text-[11px] text-slate-600">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">{num}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Review queue mini */}
          {awaitingReview.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Review Queue</div>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {awaitingReview.slice(0, 4).map(r => {
                  const sw = swimmers.find(s => s.id === r.swimmer_id);
                  return (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-800 truncate">{r.title || 'AI Report'}</div>
                        {sw && <div className="text-[10px] text-slate-500">{sw.name}</div>}
                      </div>
                      <button onClick={() => navigate(`/ai-review?report_id=${r.id}`)} className="text-[10px] font-semibold text-primary hover:underline flex-shrink-0">
                        Review →
                      </button>
                    </div>
                  );
                })}
                {awaitingReview.length > 4 && (
                  <div className="px-4 py-2.5">
                    <Link to="/ai-reviews" className="text-[10px] text-primary font-semibold hover:underline">+{awaitingReview.length - 4} more in Coach Studio</Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technical focus */}
          {topFaults.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Club Technical Focus</div>
                <Link to="/drill-library" className="text-[10px] text-primary font-semibold hover:underline">Drills</Link>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {topFaults.map(([name, count], i) => (
                  <div key={name} className="flex items-center gap-3 px-4 py-3">
                    <div className="text-[10px] font-bold text-slate-300 w-4 flex-shrink-0">{i + 1}</div>
                    <div className="text-xs text-slate-700 flex-1 truncate">{name}</div>
                    <span className="text-[10px] font-semibold text-primary flex-shrink-0">{count}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drill Library CTA */}
          <button onClick={() => navigate('/drill-library')}
            className="w-full flex items-center gap-3 px-4 py-4 bg-white rounded-xl border border-slate-200 hover:border-primary/30 hover:bg-primary/5 transition-colors text-left">
            <Dumbbell className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-800">Drill Library</div>
              <div className="text-[10px] text-slate-500">Corrective packs and coach cues</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>

        </div>
      </div>

      <FeedbackButton pageRoute="/dashboard" />

      <div className="text-[10px] text-slate-400 mt-6 pt-3 border-t border-slate-100 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
        {club.name} · live
      </div>
      </div>
    </div>
  );
}
