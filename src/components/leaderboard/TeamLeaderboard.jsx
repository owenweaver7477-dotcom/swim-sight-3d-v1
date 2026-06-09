import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import entities from '@/lib/data/entities';
import { useClubContext } from '@/lib/useClubContext';
import {
  activeCompletedReports,
  approvedFindings,
  buildFrequency,
  findingPhase,
  formatShortDate,
  reportDate,
  reportStroke,
  reportsBySwimmer,
  scoreTrendForSwimmer,
  swimmerName,
} from '@/components/analytics/analyticsHelpers';
import { AlertCircle, BarChart2, CheckCircle2, Loader2, Shield, Target, Trophy, Users, Waves } from 'lucide-react';

const MIN_IMPROVEMENT_REPORTS = 3;

function LeaderRow({ rank, title, subtitle, metric, badgeTone = 'primary' }) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-white">
      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold flex-shrink-0">
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-foreground truncate">{title}</div>
        {subtitle && <div className="text-[10px] text-muted-foreground truncate">{subtitle}</div>}
      </div>
      {metric && (
        <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${tones[badgeTone] || tones.primary}`}>
          {metric}
        </div>
      )}
    </div>
  );
}

export default function TeamLeaderboard() {
  const { club } = useClubContext();
  const [period, setPeriod] = useState('all');

  const { data: swimmers = [] } = useQuery({
    queryKey: ['leaderboard-swimmers', club?.id],
    queryFn: () => entities.Swimmer.filter({ club_id: club.id }, 'last_name', 300),
    enabled: !!club?.id,
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['leaderboard-reports', club?.id],
    queryFn: () => entities.Report.filter({ club_id: club.id }, '-created_date', 700),
    enabled: !!club?.id,
  });

  const { data: findings = [], isLoading: findingsLoading } = useQuery({
    queryKey: ['leaderboard-findings', club?.id],
    queryFn: () => entities.Finding.filter({ club_id: club.id }, '-created_date', 1500),
    enabled: !!club?.id,
  });

  const isLoading = reportsLoading || findingsLoading;

  const data = useMemo(() => {
    const completed = activeCompletedReports(reports);
    const cutoff = period === 'all'
      ? null
      : new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000);

    const rangedReports = cutoff
      ? completed.filter(report => {
        const date = new Date(reportDate(report));
        return !Number.isNaN(date.getTime()) && date >= cutoff;
      })
      : completed;

    const approved = approvedFindings(findings, rangedReports.map(report => report.id));
    const grouped = reportsBySwimmer(rangedReports);
    const byId = new Map(swimmers.map(swimmer => [swimmer.id, swimmer]));

    const reviewCounts = Object.entries(grouped)
      .map(([swimmerId, swimmerReports]) => {
        const latest = [...swimmerReports].sort((a, b) => new Date(reportDate(b)) - new Date(reportDate(a)))[0];
        return {
          swimmer: byId.get(swimmerId),
          count: swimmerReports.length,
          latest,
        };
      })
      .filter(item => item.swimmer)
      .sort((a, b) => b.count - a.count || swimmerName(a.swimmer).localeCompare(swimmerName(b.swimmer)))
      .slice(0, 6);

    const improvements = Object.entries(grouped)
      .map(([swimmerId, swimmerReports]) => ({
        swimmer: byId.get(swimmerId),
        trend: scoreTrendForSwimmer(swimmerReports, MIN_IMPROVEMENT_REPORTS),
      }))
      .filter(item => item.swimmer && item.trend.hasTrend)
      .sort((a, b) => b.trend.delta - a.trend.delta)
      .slice(0, 6);

    const recent = rangedReports
      .filter(report => byId.has(report.swimmer_id))
      .sort((a, b) => new Date(reportDate(b)) - new Date(reportDate(a)))
      .slice(0, 6)
      .map(report => ({ report, swimmer: byId.get(report.swimmer_id) }));

    const phaseFocus = buildFrequency(approved, findingPhase, 6);

    return { rangedReports, approved, reviewCounts, improvements, recent, phaseFocus };
  }, [findings, period, reports, swimmers]);

  if (!club) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
        <span className="text-sm text-muted-foreground">Loading progress leaderboard...</span>
      </div>
    );
  }

  if (data.rangedReports.length === 0) {
    return (
      <div className="p-10 rounded-xl bg-white border border-border text-center space-y-3">
        <Waves className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
        <div className="text-sm font-semibold text-foreground">No finalised progress data yet</div>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Leaderboards appear after coaches finalise reports. Pending AI reviews and draft reports are not counted.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
        <Shield className="w-4 h-4 text-primary" />
        <p className="text-[10px] text-muted-foreground flex-1">
          Uses finalised reports and approved findings only. Improvement needs {MIN_IMPROVEMENT_REPORTS}+ scored reports.
        </p>
        {[
          ['all', 'All time'],
          ['180', 'Season'],
          ['90', '90 days'],
          ['30', '30 days'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setPeriod(value)}
            className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold ${
              period === value ? 'bg-primary text-white border-primary' : 'bg-white text-muted-foreground border-border'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-primary" />
            <div>
              <div className="text-xs font-bold text-foreground">Most Reviews Completed</div>
              <div className="text-[10px] text-muted-foreground">Simple activity count, not a talent ranking.</div>
            </div>
          </div>
          <div className="space-y-2">
            {data.reviewCounts.map((item, index) => (
              <LeaderRow
                key={item.swimmer.id}
                rank={index + 1}
                title={swimmerName(item.swimmer)}
                subtitle={`Latest: ${formatShortDate(reportDate(item.latest))}`}
                metric={`${item.count} report${item.count !== 1 ? 's' : ''}`}
              />
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-border">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-4 h-4 text-primary" />
            <div>
              <div className="text-xs font-bold text-foreground">Most Improved</div>
              <div className="text-[10px] text-muted-foreground">Only shown with {MIN_IMPROVEMENT_REPORTS}+ comparable scores.</div>
            </div>
          </div>
          <div className="space-y-2">
            {data.improvements.length > 0 ? data.improvements.map((item, index) => (
              <LeaderRow
                key={item.swimmer.id}
                rank={index + 1}
                title={swimmerName(item.swimmer)}
                subtitle={`${item.trend.firstScore} to ${item.trend.latestScore} across ${item.trend.count} reports`}
                metric={`${item.trend.delta > 0 ? '+' : ''}${Math.round(item.trend.delta)}`}
                badgeTone={item.trend.delta > 0 ? 'green' : item.trend.delta < 0 ? 'amber' : 'slate'}
              />
            )) : (
              <div className="py-8 text-center">
                <AlertCircle className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No swimmer has enough scored finalised reports yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-border">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <div>
              <div className="text-xs font-bold text-foreground">Recent Finalised Reports</div>
              <div className="text-[10px] text-muted-foreground">Latest coach-approved work.</div>
            </div>
          </div>
          <div className="space-y-2">
            {data.recent.map((item, index) => (
              <LeaderRow
                key={item.report.id}
                rank={index + 1}
                title={swimmerName(item.swimmer)}
                subtitle={`${reportStroke(item.report)} · ${formatShortDate(reportDate(item.report))}`}
                metric={item.report.overall_score != null ? `${item.report.overall_score}` : 'No score'}
                badgeTone="slate"
              />
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <div>
              <div className="text-xs font-bold text-foreground">Common Technical Focus</div>
              <div className="text-[10px] text-muted-foreground">From approved findings only.</div>
            </div>
          </div>
          <div className="space-y-2">
            {data.phaseFocus.length > 0 ? data.phaseFocus.map((item, index) => (
              <LeaderRow
                key={item.name}
                rank={index + 1}
                title={item.name}
                subtitle="Approved finding phase"
                metric={`${item.count}`}
                badgeTone="amber"
              />
            )) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No approved findings yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
