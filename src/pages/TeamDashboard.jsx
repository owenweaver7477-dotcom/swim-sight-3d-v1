import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import entities from '@/lib/data/entities';
import { setReviewSession } from '@/lib/swimState';
import { useClubContext } from '@/lib/useClubContext';
import PageHeader from '@/components/shared/PageHeader';
import {
  Users, Waves, FileText, Video, Plus, ChevronRight,
  AlertCircle, Loader2, Brain, Upload, CheckCircle2,
  TrendingUp, Zap, BarChart3, Target, Activity, ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { activeCompletedReports } from '@/components/analytics/analyticsHelpers';
import { format, subDays } from 'date-fns';
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
      <PageHeader eyebrow={club.name} title="Getting Started" subtitle="Complete these steps to set up your workspace." />
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
  const navigate = useNavigate();
  const enabled = !!club?.id;

  const { data: swimmers = [] } = useQuery({ queryKey: ['swimmers', club?.id], queryFn: () => base44.entities.Swimmer.filter({ club_id: club.id }), enabled, staleTime: 5 * 60 * 1000 });
  const { data: videos = [] } = useQuery({ queryKey: ['videos', club?.id], queryFn: () => base44.entities.VideoUpload.filter({ club_id: club.id }, '-created_date', 50), enabled, staleTime: 60 * 1000 });
  const { data: reports = [] } = useQuery({ queryKey: ['reports-dashboard', club?.id], queryFn: () => base44.entities.Report.filter({ club_id: club.id }, '-created_date', 50), enabled, staleTime: 2 * 60 * 1000 });
  const { data: findings = [] } = useQuery({ queryKey: ['findings-dashboard', club?.id], queryFn: () => base44.entities.Finding.filter({ club_id: club.id }, '-created_date', 100), enabled, staleTime: 2 * 60 * 1000 });
  const { data: dragItems = [] } = useQuery({ queryKey: ['drag-dashboard', club?.id], queryFn: () => base44.entities.DragAnalysis.filter({ club_id: club.id }, '-created_date', 100), enabled, staleTime: 2 * 60 * 1000 });
  const { data: aiJobs = [] } = useQuery({ queryKey: ['ai-jobs-dashboard', club?.id], queryFn: () => entities.AIProcessingJob.filter({ club_id: club.id }, '-created_date', 5), enabled, staleTime: 2 * 60 * 1000 });

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;
  if (!club) return <NoClubDashboard />;

  const hasData = swimmers.length > 0 || videos.length > 0 || reports.length > 0;
  if (!hasData) return <SetupDashboard club={club} />;

  const activeReports = reports.filter(r => !r.is_deleted);
  const aiReports = activeReports.filter(r => r.source === 'ai');
  const awaitingReview = aiReports.filter(r => r.status !== 'published');
  const publishedReports = activeReports.filter(r => r.status === 'published');

  const processingVideos = videos.filter(v => v.processing_status === 'pending_ai' || v.processing_status === 'processing');
  const errorVideos = videos.filter(v => v.processing_status === 'error');

  const pendingAIFindings = findings.filter(f => f.source === 'ai' && f.approval_status === 'pending');
  const highDragRisk = dragItems.filter(d => d.drag_risk_level === 'high' && d.approval_status === 'approved');

  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentlyReviewedIds = new Set(publishedReports.filter(r => r.swimmer_id && new Date(r.updated_date || r.created_date) > thirtyDaysAgo).map(r => r.swimmer_id));
  const dueForReview = swimmers.filter(s => !recentlyReviewedIds.has(s.id));

  const faultCounts = {};
  findings.filter(f => f.approval_status === 'approved' && f.included_in_report).forEach(f => {
    if (f.finding_name) faultCounts[f.finding_name] = (faultCounts[f.finding_name] || 0) + 1;
  });
  const topFaults = Object.entries(faultCounts).sort(([,a],[,b]) => b - a).slice(0, 4);

  const recentReports = publishedReports.slice(0, 5).map(r => ({ ...r, swimmerName: swimmers.find(s => s.id === r.swimmer_id)?.name || 'Unknown' }));

  const priorityItems = [
    awaitingReview.length > 0 && {
      icon: Brain, iconColor: 'text-amber-500', urgent: true,
      label: `${awaitingReview.length} AI report${awaitingReview.length > 1 ? 's' : ''} awaiting coach review`,
      meta: `${pendingAIFindings.length} finding${pendingAIFindings.length !== 1 ? 's' : ''} need approval`,
      cta: 'Open AI Reviews', onClick: () => navigate('/ai-reviews'),
    },
    errorVideos.length > 0 && {
      icon: AlertCircle, iconColor: 'text-red-500', urgent: true,
      label: `${errorVideos.length} video${errorVideos.length > 1 ? 's' : ''} failed processing`,
      meta: 'Retry or check video format',
      cta: 'Check Videos', onClick: () => navigate('/analyse'),
    },
    processingVideos.length > 0 && {
      icon: Loader2, iconColor: 'text-blue-500', urgent: false,
      label: `${processingVideos.length} video${processingVideos.length > 1 ? 's' : ''} processing`,
      meta: 'AI analysis in progress',
      cta: 'Monitor', onClick: () => navigate('/analyse'),
    },
    highDragRisk.length > 0 && {
      icon: Zap, iconColor: 'text-amber-500', urgent: true,
      label: `${highDragRisk.length} high drag-risk observation${highDragRisk.length > 1 ? 's' : ''}`,
      meta: 'Coach-approved items across the squad',
      cta: 'Performance Hub', onClick: () => navigate('/performance'),
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
    <div className="max-w-5xl mx-auto px-4 py-8 pb-20">

      <PageHeader
        title="Dashboard"
        subtitle={`${club.name} · today's review priorities and club status`}
        action={
          <Button size="sm" className="bg-primary text-white text-xs h-8" onClick={() => { setReviewSession(null); navigate('/analyse'); }}>
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Video
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat label="Swimmers" value={swimmers.length} />
        <Stat label="Videos" value={videos.length} />
        <Stat label="AI Reports" value={aiReports.length} highlight={awaitingReview.length > 0} />
        <Stat label="Finalised" value={publishedReports.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — priorities + quick actions */}
        <div className="lg:col-span-2 space-y-6">

          {/* Priorities */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Today's Priorities</div>
            {allClear ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-green-200 bg-green-50">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-green-800">All clear</div>
                  <div className="text-[10px] text-green-700">No pending reviews, failed videos, or high-risk items.</div>
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
                { label: 'AI Reviews', icon: Brain, to: '/ai-reviews' },
                { label: 'Performance Hub', icon: BarChart3, to: '/performance' },
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
                    <Link to="/ai-reviews" className="text-[10px] text-primary font-semibold hover:underline">+{awaitingReview.length - 4} more in AI Reviews</Link>
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
                <Link to="/performance" className="text-[10px] text-primary font-semibold hover:underline">Hub</Link>
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

          {/* Performance Hub CTA */}
          <button onClick={() => navigate('/performance')}
            className="w-full flex items-center gap-3 px-4 py-4 bg-white rounded-xl border border-slate-200 hover:border-primary/30 hover:bg-primary/5 transition-colors text-left">
            <TrendingUp className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-800">Performance Hub</div>
              <div className="text-[10px] text-slate-500">Trends, leaderboard, standards</div>
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
  );
}
