import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useClubContext } from '@/lib/useClubContext';
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

const CARD_DEFS = [
  {
    key: 'navigation_clarity',
    title: 'Navigation Clarity',
    description: 'Coach can find Dashboard, Analyse, AI Reviews, and Settings without guidance.',
    items: ['create_club','add_swimmer','upload_video','swimmer_profile','club_settings'],
  },
  {
    key: 'ai_workflow',
    title: 'AI Workflow Clarity',
    description: 'Coach understands what the AI reliability label means and can proceed with or without pose data.',
    items: ['send_ai_review','ai_reliability','manual_fallback'],
  },
  {
    key: 'manual_review',
    title: 'Manual Review Fallback',
    description: 'Coach can complete a full review even when AI pose is unreliable.',
    items: ['approve_finding','manual_finding','add_annotation','link_drill'],
  },
  {
    key: 'report_quality',
    title: 'Report Quality',
    description: 'Reports contain approved findings, cues, drills, and a coach summary before finalisation.',
    items: ['link_standard','finalise_report','export_pdf'],
  },
  {
    key: 'public_sharing',
    title: 'Public Sharing Safety',
    description: 'Shared reports show only approved content. No private video URLs or coach notes exposed.',
    items: ['create_share_link','open_shared_report'],
  },
  {
    key: 'feedback_captured',
    title: 'Coach Feedback Captured',
    description: 'At least one piece of feedback or bug report has been collected from a coach tester.',
    items: [], // computed separately
  },
  {
    key: 'critical_bugs',
    title: 'Critical Bugs Resolved',
    description: 'No critical or high-severity bugs remain unresolved.',
    items: [], // computed separately
  },
  {
    key: 'next_test_ready',
    title: 'Ready for Next Coach Test',
    description: 'At least one test session completed and no blockers outstanding.',
    items: [], // computed separately
  },
];

const STATUS_CONFIG = {
  ready:        { icon: CheckCircle2, label: 'Ready',        cls: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  needs_review: { icon: AlertTriangle, label: 'Needs review', cls: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  blocked:      { icon: XCircle,       label: 'Blocked',      cls: 'text-red-600',   bg: 'bg-red-50 border-red-200' },
};

function ReadinessCard({ title, description, status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.needs_review;
  const Icon = cfg.icon;
  return (
    <div className={`p-4 rounded-xl border ${cfg.bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-800 mb-0.5">{title}</div>
          <p className="text-[11px] text-slate-600 leading-relaxed">{description}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Icon className={`w-4 h-4 ${cfg.cls}`} />
          <span className={`text-[10px] font-bold ${cfg.cls}`}>{cfg.label}</span>
        </div>
      </div>
    </div>
  );
}

export default function ReadinessTab() {
  const { club } = useClubContext();

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['testing-sessions', club?.id],
    queryFn: () => base44.entities.CoachTestingSession.filter({ club_id: club.id }, '-created_date', 20),
    enabled: !!club?.id,
  });

  const { data: allItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['testing-items', club?.id],
    queryFn: () => base44.entities.CoachTestingItem.filter({ club_id: club.id }, 'checklist_key', 100),
    enabled: !!club?.id,
  });

  const { data: feedback = [], isLoading: loadingFeedback } = useQuery({
    queryKey: ['coach-feedback', club?.id],
    queryFn: () => base44.entities.CoachFeedback.filter({ club_id: club.id }, '-created_date', 100),
    enabled: !!club?.id,
  });

  if (loadingSessions || loadingItems || loadingFeedback) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
  }

  // Build a map of all tested/skipped item keys across all sessions
  const testedKeys = new Set(
    allItems.filter(i => i.status === 'tested' || i.status === 'skipped').map(i => i.checklist_key)
  );
  const issueKeys = new Set(allItems.filter(i => i.status === 'issue_found').map(i => i.checklist_key));

  const criticalBugsOpen = feedback.filter(f =>
    f.feedback_type === 'bug' &&
    (f.severity === 'critical' || f.severity === 'high') &&
    f.status !== 'resolved' && f.status !== 'wont_fix'
  ).length;

  const completedSessions = sessions.filter(s => s.status === 'completed').length;

  const highBugsOpen = feedback.filter(f =>
    f.feedback_type === 'bug' &&
    f.severity === 'high' &&
    f.status !== 'resolved' && f.status !== 'wont_fix'
  ).length;

  const getStatus = (def) => {
    if (def.key === 'feedback_captured') {
      // Only assesses whether feedback has been captured — not blocked by bugs (that's critical_bugs card)
      return feedback.length > 0 ? 'ready' : 'needs_review';
    }
    if (def.key === 'critical_bugs') {
      if (criticalBugsOpen > 0) return 'blocked';
      if (highBugsOpen > 0) return 'needs_review';
      return 'ready';
    }
    if (def.key === 'next_test_ready') {
      if (criticalBugsOpen > 0) return 'blocked';
      if (completedSessions === 0 || highBugsOpen > 0) return 'needs_review';
      return 'ready';
    }
    // For item-based checks
    const relevant = def.items;
    if (relevant.length === 0) return 'needs_review';
    const hasIssues = relevant.some(k => issueKeys.has(k));
    if (hasIssues) return 'needs_review';
    const allTested = relevant.every(k => testedKeys.has(k));
    if (allTested) return 'ready';
    return 'needs_review';
  };

  const statuses = CARD_DEFS.map(d => getStatus(d));
  const hasBlocked = statuses.includes('blocked');
  const overallStatus = hasBlocked ? 'blocked' : statuses.every(s => s === 'ready') ? 'ready' : 'needs_review';
  const OverallCfg = STATUS_CONFIG[overallStatus];
  const OverallIcon = OverallCfg.icon;

  return (
    <div className="space-y-4">
      {/* Overall status */}
      <div className={`p-5 rounded-xl border-2 ${OverallCfg.bg}`}>
        <div className="flex items-center gap-3">
          <OverallIcon className={`w-6 h-6 ${OverallCfg.cls}`} />
          <div>
            <div className="text-sm font-bold text-slate-900">V1 Readiness: {OverallCfg.label}</div>
            <div className="text-xs text-slate-600 mt-0.5">
              {overallStatus === 'blocked' && 'Critical issues must be resolved before the next coach test.'}
              {overallStatus === 'needs_review' && 'Some areas need attention before V1 launch.'}
              {overallStatus === 'ready' && 'All readiness checks passed. Ready for V1 coach trials.'}
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Sessions', val: sessions.length },
            { label: 'Completed', val: completedSessions },
            { label: 'Feedback items', val: feedback.length },
          ].map(s => (
            <div key={s.label} className="p-2 rounded-lg bg-white/60">
              <div className="text-lg font-bold text-slate-900">{s.val}</div>
              <div className="text-[10px] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Individual cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CARD_DEFS.map(d => (
          <ReadinessCard key={d.key} title={d.title} description={d.description} status={getStatus(d)} />
        ))}
      </div>

      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-500 leading-relaxed">
        Readiness is assessed from test session checklist items, coach feedback, and open bug severity — not from production analytics.
      </div>
    </div>
  );
}