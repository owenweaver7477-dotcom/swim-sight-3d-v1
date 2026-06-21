import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Brain, CheckCircle2, Edit3, Plus, ShieldAlert, ThumbsDown } from 'lucide-react';
import entities from '@/lib/data/entities';
import { useClubContext } from '@/lib/useClubContext';
import PageHeader from '@/components/shared/PageHeader';

const CALIBRATION_ROLES = ['owner', 'admin'];
const REVIEW_ACTIONS = ['approved', 'edited', 'rejected'];

function percent(part, total) {
  if (!total) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}

function countBy(rows, keyFn) {
  const counts = new Map();
  rows.forEach(row => {
    const key = keyFn(row) || 'Unknown';
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function actionCounts(rows) {
  return rows.reduce((acc, row) => {
    acc[row.coach_action] = (acc[row.coach_action] || 0) + 1;
    return acc;
  }, {});
}

function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold text-foreground mt-1">{value}</div>
        </div>
        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {detail && <div className="text-[10px] text-muted-foreground mt-2">{detail}</div>}
    </div>
  );
}

function RankedList({ title, rows, empty = 'No data yet.' }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="text-xs font-bold text-foreground uppercase tracking-wider">{title}</div>
      {rows.length === 0 ? (
        <div className="text-xs text-muted-foreground">{empty}</div>
      ) : (
        <div className="space-y-2">
          {rows.slice(0, 8).map(row => (
            <div key={row.label} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs text-foreground truncate capitalize">{String(row.label).replace(/_/g, ' ')}</div>
                {row.detail && <div className="text-[10px] text-muted-foreground">{row.detail}</div>}
              </div>
              <div className="text-xs font-bold text-primary">{row.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RateList({ title, groups }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="text-xs font-bold text-foreground uppercase tracking-wider">{title}</div>
      {groups.length === 0 ? (
        <div className="text-xs text-muted-foreground">Review more AI findings to unlock calibration trends.</div>
      ) : (
        <div className="space-y-3">
          {groups.slice(0, 8).map(group => {
            const approved = group.rows.filter(row => ['approved', 'edited'].includes(row.coach_action)).length;
            const reviewed = group.rows.filter(row => REVIEW_ACTIONS.includes(row.coach_action)).length;
            const pct = reviewed ? Math.round((approved / reviewed) * 100) : 0;
            return (
              <div key={group.label} className="space-y-1">
                <div className="flex justify-between gap-2 text-xs">
                  <span className="text-foreground capitalize truncate">{String(group.label).replace(/_/g, ' ')}</span>
                  <span className="text-muted-foreground">{pct}% accepted/edit · {reviewed} reviewed</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AICalibration() {
  const { club, memberRole } = useClubContext();
  const canView = CALIBRATION_ROLES.includes(memberRole);

  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ['ai-calibration', club?.id],
    queryFn: () => entities.AIFindingFeedback.list('-created_at', 500),
    enabled: !!club?.id && canView,
    staleTime: 60 * 1000,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['ai-calibration-jobs', club?.id],
    queryFn: () => entities.AIProcessingJob.filter({ club_id: club.id }, '-created_date', 250),
    enabled: !!club?.id && canView,
    staleTime: 60 * 1000,
  });

  if (!canView) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <ShieldAlert className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <div className="text-sm font-medium text-foreground">Coach access required</div>
        <p className="text-xs text-muted-foreground mt-1">AI calibration data is internal to the coaching team.</p>
      </div>
    );
  }

  const counts = actionCounts(feedback);
  const reviewed = feedback.filter(row => REVIEW_ACTIONS.includes(row.coach_action));
  const approvedOrEdited = reviewed.filter(row => ['approved', 'edited'].includes(row.coach_action)).length;
  const rejected = reviewed.filter(row => row.coach_action === 'rejected');
  const manualReviews = jobs.filter(job => ['manual_review_recommended', 'unreliable_pose', 'error'].includes(job.status));
  const enoughData = reviewed.length >= 5;

  const rejectedFaultTags = countBy(rejected, row => row.fault_tag);
  const rejectionReasons = countBy(rejected, row => row.coach_rejection_reason);
  const manualReviewFlags = countBy(
    manualReviews.flatMap(job => {
      const flags = Array.isArray(job.quality_flags)
        ? job.quality_flags
        : typeof job.quality_flags === 'string'
        ? job.quality_flags.split(',').map(flag => flag.trim()).filter(Boolean)
        : [];
      return flags.map(flag => ({ flag }));
    }),
    row => row.flag,
  );

  const byStroke = countBy(reviewed, row => row.stroke)
    .map(group => ({
      label: group.label,
      rows: reviewed.filter(row => (row.stroke || 'Unknown') === group.label),
    }));

  const byConfidence = countBy(reviewed, row => row.ai_confidence || (
    Number(row.ai_confidence_score) >= 0.75 ? 'high' : Number(row.ai_confidence_score) >= 0.55 ? 'medium' : 'unknown'
  )).map(group => ({
    label: group.label,
    rows: reviewed.filter(row => {
      const confidence = row.ai_confidence || (
        Number(row.ai_confidence_score) >= 0.75 ? 'high' : Number(row.ai_confidence_score) >= 0.55 ? 'medium' : 'unknown'
      );
      return confidence === group.label;
    }),
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <PageHeader
        eyebrow="Internal AI Calibration"
        title="AI Calibration"
        subtitle="Coach feedback trends from real approved, edited, rejected, and manual findings. No automatic model retraining happens here."
      />

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        AI findings remain draft evidence. This page helps evaluate future threshold tuning and training readiness after coaches verify findings on video.
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-xs text-muted-foreground">
          Loading calibration feedback...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCard icon={Brain} label="Reviewed AI findings" value={reviewed.length} detail="Approved, edited, or rejected" />
            <StatCard icon={CheckCircle2} label="Accepted / edited" value={percent(approvedOrEdited, reviewed.length)} detail={`${approvedOrEdited} accepted or corrected`} />
            <StatCard icon={ThumbsDown} label="Rejected" value={counts.rejected || 0} detail="Dismissed by coach" />
            <StatCard icon={Edit3} label="Edited" value={counts.edited || 0} detail="Coach changed text/cue/drill" />
            <StatCard icon={Plus} label="Manual added" value={counts.manual_added || 0} detail="Coach-created findings" />
          </div>

          {!enoughData && (
            <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
              Review more AI findings to unlock calibration trends. Early data is shown below, but treat it as directional until more coach decisions are captured.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RateList title="Approval Rate By Stroke" groups={byStroke} />
            <RateList title="Approval Rate By Confidence" groups={byConfidence} />
            <RankedList title="Top Rejected Fault Tags" rows={rejectedFaultTags} empty="No rejected fault tags yet." />
            <RankedList title="Top Rejection Reasons" rows={rejectionReasons} empty="No rejection reasons yet." />
            <RankedList title="Manual Review Quality Flags" rows={manualReviewFlags} empty="No manual-review quality flags yet." />
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-primary" /> Recent Feedback
              </div>
              {feedback.length === 0 ? (
                <div className="text-xs text-muted-foreground">No feedback rows yet.</div>
              ) : (
                <div className="space-y-2">
                  {feedback.slice(0, 8).map(row => (
                    <div key={row.id} className="rounded-lg border border-border bg-secondary/30 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-foreground capitalize">{row.coach_action?.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] text-muted-foreground">{row.ai_confidence || row.ai_confidence_score || 'no confidence'}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {[row.stroke, row.phase, row.fault_tag, row.coach_rejection_reason].filter(Boolean).join(' · ') || 'No tags recorded'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 text-[10px] text-muted-foreground">
            Export readiness: feedback rows preserve stable fault tags, phase labels, original AI text, coach final text, rejection reason, confidence, and quality flags. CSV export is intentionally deferred until pilot data shape is confirmed.
          </div>
        </>
      )}
    </div>
  );
}
