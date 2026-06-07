/**
 * TeamLeaderboard — shows improvement, consistency, severity reduction,
 * focus leaders, and squad overview. Uses coach-approved finalised reports only.
 */
import React, { useState, useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useClubContext } from '@/lib/useClubContext';
import { activeCompletedReports, approvedFindings } from '@/components/analytics/analyticsHelpers';
import { TrendingUp, Users, Target, BarChart2, Loader2, AlertCircle, Waves, Shield } from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';

const DATE_RANGES = [
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
  { label: 'Season', days: 180 },
  { label: 'All Time', days: 0 },
];

function InsuffBadge({ msg }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full border border-border">
      <AlertCircle className="w-2.5 h-2.5" />{msg}
    </span>
  );
}

function LeaderboardCard({ rank, name, main, sub, badge }) {
  const rankColors = ['bg-yellow-400 text-yellow-900', 'bg-slate-300 text-slate-700', 'bg-amber-600 text-white'];
  const rankBg = rankColors[rank - 1] || 'bg-primary/10 text-primary';
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-white">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${rankBg}`}>
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-foreground truncate">{name}</div>
        {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
      </div>
      {badge && <div className="flex-shrink-0">{badge}</div>}
      {main != null && (
        <div className="flex-shrink-0 text-right">
          <div className="text-sm font-bold text-primary">{main}</div>
        </div>
      )}
    </div>
  );
}

export default function TeamLeaderboard() {
  const { club } = useClubContext();
  const [dateRange, setDateRange] = useState(90);
  const [strokeFilter, setStrokeFilter] = useState('all');
  const [squadFilter, setSquadFilter] = useState('all');
  const [minReports, setMinReports] = useState(3);

  const { data: swimmers = [] } = useQuery({
    queryKey: ['swimmers', club?.id],
    queryFn: () => base44.entities.Swimmer.filter({ club_id: club.id }),
    enabled: !!club?.id,
  });
  const { data: squads = [] } = useQuery({
    queryKey: ['squads', club?.id],
    queryFn: () => base44.entities.Squad.filter({ club_id: club.id }),
    enabled: !!club?.id,
  });
  const { data: allReports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['reports-leaderboard', club?.id],
    queryFn: () => base44.entities.Report.filter({ club_id: club.id }, '-created_date', 500),
    enabled: !!club?.id,
  });
  const { data: allFindings = [], isLoading: loadingFindings } = useQuery({
    queryKey: ['findings-leaderboard', club?.id],
    queryFn: () => base44.entities.Finding.filter({ club_id: club.id }, '-created_date', 1000),
    enabled: !!club?.id,
  });

  const isLoading = loadingReports || loadingFindings;

  // Strict filter: only active coach-approved finalised reports
  const completedReports = useMemo(() => activeCompletedReports(allReports), [allReports]);
  const completedFindings = useMemo(() => {
    const ids = new Set(completedReports.map(r => r.id));
    return approvedFindings(allFindings, [...ids]);
  }, [allFindings, completedReports]);

  // Date filter
  const cutoff = dateRange > 0 ? subDays(new Date(), dateRange) : null;
  const rangedReports = useMemo(() =>
    cutoff
      ? completedReports.filter(r => new Date(r.ai_completed_at || r.updated_date || r.created_date) >= cutoff)
      : completedReports,
    [completedReports, cutoff]);

  // Squad/stroke filter on swimmers
  const filteredSwimmers = useMemo(() => {
    let s = swimmers;
    if (squadFilter !== 'all') s = s.filter(sw => sw.squad_id === squadFilter);
    return s;
  }, [swimmers, squadFilter]);
  const filteredSwimmerIds = new Set(filteredSwimmers.map(s => s.id));

  const filteredReports = useMemo(() =>
    rangedReports.filter(r => {
      const inSquad = filteredSwimmerIds.has(r.swimmer_id);
      const inStroke = strokeFilter === 'all' || (r.title || '').toLowerCase().includes(strokeFilter.toLowerCase());
      return inSquad && inStroke;
    }), [rangedReports, filteredSwimmerIds, strokeFilter]);

  const rangedFindings = useMemo(() => {
    const ids = new Set(filteredReports.map(r => r.id));
    return completedFindings.filter(f => ids.has(f.report_id));
  }, [completedFindings, filteredReports]);

  // ── A: Most Improved Technical Score ──────────────────────────────────────
  const improvementData = useMemo(() => {
    return filteredSwimmers.map(sw => {
      const swReports = filteredReports
        .filter(r => r.swimmer_id === sw.id && r.overall_score != null)
        .sort((a, b) => new Date(a.ai_completed_at || a.created_date) - new Date(b.ai_completed_at || b.created_date));
      if (swReports.length < minReports) return { ...sw, insufficient: true, reportCount: swReports.length };
      const first = swReports[0].overall_score;
      const latest = swReports[swReports.length - 1].overall_score;
      const improvement = latest - first;
      return { ...sw, insufficient: false, firstScore: first, latestScore: latest, improvement, reportCount: swReports.length };
    }).sort((a, b) => {
      if (a.insufficient && b.insufficient) return 0;
      if (a.insufficient) return 1;
      if (b.insufficient) return -1;
      return b.improvement - a.improvement;
    });
  }, [filteredSwimmers, filteredReports, minReports]);

  // ── B: Most Consistent Review Completion ─────────────────────────────────
  const consistencyData = useMemo(() => {
    return filteredSwimmers.map(sw => {
      const swReports = filteredReports.filter(r => r.swimmer_id === sw.id);
      const latest = swReports.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
      return {
        ...sw,
        count: swReports.length,
        latestDate: latest ? format(new Date(latest.ai_completed_at || latest.created_date), 'dd MMM yy') : null,
      };
    }).filter(s => s.count > 0).sort((a, b) => b.count - a.count);
  }, [filteredSwimmers, filteredReports]);

  // ── C: Biggest Reduction in High-Severity Findings ───────────────────────
  const severityReductionData = useMemo(() => {
    return filteredSwimmers.map(sw => {
      const swReports = filteredReports
        .filter(r => r.swimmer_id === sw.id)
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      if (swReports.length < 2) return { ...sw, insufficient: true };
      const half = Math.max(1, Math.floor(swReports.length / 2));
      const earlyIds = new Set(swReports.slice(0, half).map(r => r.id));
      const lateIds = new Set(swReports.slice(half).map(r => r.id));
      const earlyHigh = rangedFindings.filter(f => earlyIds.has(f.report_id) && ['high', 'critical'].includes(f.severity)).length;
      const lateHigh = rangedFindings.filter(f => lateIds.has(f.report_id) && ['high', 'critical'].includes(f.severity)).length;
      const reduction = earlyHigh - lateHigh;
      return { ...sw, insufficient: false, earlyHigh, lateHigh, reduction, reportCount: swReports.length };
    }).sort((a, b) => {
      if (a.insufficient && b.insufficient) return 0;
      if (a.insufficient) return 1;
      if (b.insufficient) return -1;
      return b.reduction - a.reduction;
    });
  }, [filteredSwimmers, filteredReports, rangedFindings]);

  // ── D: Technical Focus Leaders ────────────────────────────────────────────
  const focusData = useMemo(() => {
    const map = {};
    rangedFindings.forEach(f => {
      if (!f.next_focus || !f.swimmer_id) return;
      const sw = filteredSwimmers.find(s => s.id === f.swimmer_id);
      if (!sw) return;
      if (!map[f.next_focus]) map[f.next_focus] = [];
      if (!map[f.next_focus].find(s => s.id === sw.id)) map[f.next_focus].push(sw);
    });
    return Object.entries(map)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 6);
  }, [rangedFindings, filteredSwimmers]);

  // ── E: Squad Overview ─────────────────────────────────────────────────────
  const squadOverview = useMemo(() => {
    return squads.map(sq => {
      const sqSwimmers = swimmers.filter(s => s.squad_id === sq.id);
      const sqIds = new Set(sqSwimmers.map(s => s.id));
      const sqReports = filteredReports.filter(r => sqIds.has(r.swimmer_id));
      const reviewed = new Set(sqReports.map(r => r.swimmer_id)).size;
      const scored = sqReports.filter(r => r.overall_score != null);
      const avgScore = scored.length > 0 ? Math.round(scored.reduce((a, r) => a + r.overall_score, 0) / scored.length) : null;
      const sqFindings = rangedFindings.filter(f => sqIds.has(f.swimmer_id));
      const phaseCounts = {};
      sqFindings.forEach(f => { if (f.phase) phaseCounts[f.phase] = (phaseCounts[f.phase] || 0) + 1; });
      const topPhase = Object.entries(phaseCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      return { ...sq, swimmerCount: sqSwimmers.length, reviewed, avgScore, topPhase, reportCount: sqReports.length };
    });
  }, [squads, swimmers, filteredReports, rangedFindings]);

  if (!club) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
        <span className="text-sm text-muted-foreground">Loading leaderboard…</span>
      </div>
    );
  }

  if (completedReports.length === 0) {
    return (
      <div className="p-10 rounded-xl bg-white border border-border text-center space-y-3">
        <Waves className="w-8 h-8 text-muted-foreground mx-auto opacity-40" />
        <div className="text-sm font-medium text-foreground">No coach-approved reports yet</div>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">Finalise AI review sessions to start seeing leaderboard data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fairness note */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Coach-Approved Data Only.</strong> This leaderboard uses only finalised, coach-reviewed reports.
          Pending AI reports, deleted reports, placeholder analyses, and rejected findings are excluded.
          Swimmers need at least {minReports} completed reports to appear in the improvement leaderboard.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-secondary/40 border border-border">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">Period:</span>
          {DATE_RANGES.map(dr => (
            <button key={dr.label} onClick={() => setDateRange(dr.days)}
              className={`text-[10px] px-2 py-1 rounded border font-medium ${dateRange === dr.days ? 'bg-primary text-primary-foreground border-primary' : 'bg-white text-muted-foreground border-border hover:border-primary/40'}`}>
              {dr.label}
            </button>
          ))}
        </div>
        {squads.length > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Squad:</span>
            {[{ id: 'all', name: 'All' }, ...squads].map(sq => (
              <button key={sq.id} onClick={() => setSquadFilter(sq.id)}
                className={`text-[10px] px-2 py-1 rounded border font-medium ${squadFilter === sq.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-white text-muted-foreground border-border hover:border-primary/40'}`}>
                {sq.name}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[10px] text-muted-foreground">Min reports:</span>
          {[2, 3, 5].map(n => (
            <button key={n} onClick={() => setMinReports(n)}
              className={`text-[10px] px-2 py-1 rounded border font-medium ${minReports === n ? 'bg-primary text-primary-foreground border-primary' : 'bg-white text-muted-foreground border-border hover:border-primary/40'}`}>
              {n}+
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* A: Technical Improvement */}
        <div className="p-4 rounded-xl bg-white border border-border">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <div>
              <div className="text-xs font-bold text-foreground">Technical Improvement</div>
              <div className="text-[10px] text-muted-foreground">First vs latest coach-reviewed score · {minReports}+ reports required</div>
            </div>
          </div>
          <div className="space-y-2">
            {improvementData.filter(s => !s.insufficient).length === 0 ? (
              <div className="text-[10px] text-muted-foreground py-4 text-center">
                No swimmers have {minReports}+ scored reports in this period yet.
              </div>
            ) : (
              improvementData.filter(s => !s.insufficient).slice(0, 5).map((s, i) => (
                <LeaderboardCard
                  key={s.id}
                  rank={i + 1}
                  name={s.name}
                  sub={`${s.firstScore} → ${s.latestScore} · ${s.reportCount} reports`}
                  main={s.improvement >= 0 ? `+${s.improvement}` : `${s.improvement}`}
                  badge={
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.improvement > 0 ? 'text-green-700 bg-green-100' : s.improvement < 0 ? 'text-red-700 bg-red-100' : 'text-muted-foreground bg-secondary'}`}>
                      {s.improvement > 0 ? '↑ Improving' : s.improvement < 0 ? '↓ Declined' : '→ Stable'}
                    </span>
                  }
                />
              ))
            )}
            {improvementData.filter(s => s.insufficient).length > 0 && (
              <div className="pt-1 border-t border-border mt-1">
                {improvementData.filter(s => s.insufficient).map(s => (
                  <div key={s.id} className="flex items-center justify-between py-1.5 text-xs text-muted-foreground">
                    <span>{s.name}</span>
                    <InsuffBadge msg={`Needs more reports (${s.reportCount || 0})`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* B: Review Consistency */}
        <div className="p-4 rounded-xl bg-white border border-border">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-4 h-4 text-primary" />
            <div>
              <div className="text-xs font-bold text-foreground">Review Consistency</div>
              <div className="text-[10px] text-muted-foreground">Coach-approved reports in selected period</div>
            </div>
          </div>
          <div className="space-y-2">
            {consistencyData.slice(0, 8).map((s, i) => (
              <LeaderboardCard
                key={s.id}
                rank={i + 1}
                name={s.name}
                sub={s.latestDate ? `Latest: ${s.latestDate}` : 'No recent review'}
                main={s.count}
                badge={
                  <span className="text-[10px] text-muted-foreground">{s.count === 1 ? 'report' : 'reports'}</span>
                }
              />
            ))}
            {consistencyData.length === 0 && (
              <div className="text-[10px] text-muted-foreground py-4 text-center">No completed reports in this period.</div>
            )}
          </div>
        </div>

        {/* C: High-Severity Reduction */}
        <div className="p-4 rounded-xl bg-white border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <div>
              <div className="text-xs font-bold text-foreground">High-Severity Reduction</div>
              <div className="text-[10px] text-muted-foreground">Approved high/critical findings: early vs latest reports</div>
            </div>
          </div>
          <div className="space-y-2">
            {severityReductionData.filter(s => !s.insufficient && s.reduction > 0).length === 0 ? (
              <div className="text-[10px] text-muted-foreground py-4 text-center">
                Not enough data for comparison yet. Needs 2+ reports per swimmer.
              </div>
            ) : (
              severityReductionData.filter(s => !s.insufficient).slice(0, 5).map((s, i) => (
                <LeaderboardCard
                  key={s.id}
                  rank={i + 1}
                  name={s.name}
                  sub={`${s.earlyHigh} early → ${s.lateHigh} recent · ${s.reportCount} reports`}
                  main={s.reduction >= 0 ? `-${s.reduction}` : `+${Math.abs(s.reduction)}`}
                  badge={
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.reduction > 0 ? 'text-green-700 bg-green-100' : s.reduction < 0 ? 'text-amber-700 bg-amber-100' : 'text-muted-foreground bg-secondary'}`}>
                      {s.reduction > 0 ? '↓ Fewer issues' : s.reduction < 0 ? '↑ More issues' : '→ Same'}
                    </span>
                  }
                />
              ))
            )}
          </div>
        </div>

        {/* D: Technical Focus Areas */}
        <div className="p-4 rounded-xl bg-white border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <div>
              <div className="text-xs font-bold text-foreground">Current Focus Areas</div>
              <div className="text-[10px] text-muted-foreground">Swimmers grouped by coach-assigned next focus</div>
            </div>
          </div>
          {focusData.length === 0 ? (
            <div className="text-[10px] text-muted-foreground py-4 text-center">No focus areas assigned yet in approved findings.</div>
          ) : (
            <div className="space-y-2.5">
              {focusData.map(([focus, swList]) => (
                <div key={focus} className="p-2.5 rounded-lg border border-border bg-secondary/20">
                  <div className="text-xs font-semibold text-foreground mb-1">{focus}</div>
                  <div className="flex flex-wrap gap-1">
                    {swList.map(s => (
                      <span key={s.id} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{s.name}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* E: Squad Overview */}
      {squads.length > 0 && (
        <div className="p-4 rounded-xl bg-white border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary" />
            <div className="text-xs font-bold text-foreground">Squad Overview</div>
            <span className="text-[10px] text-muted-foreground ml-auto">coach-approved data only</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Squad</th>
                  <th className="text-center py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Reviewed</th>
                  <th className="text-center py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Reports</th>
                  <th className="text-center py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Avg Score</th>
                  <th className="text-left py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Top Focus Phase</th>
                </tr>
              </thead>
              <tbody>
                {squadOverview.map(sq => (
                  <tr key={sq.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-2.5 font-medium text-foreground">{sq.name}</td>
                    <td className="py-2.5 text-center text-muted-foreground">{sq.reviewed}/{sq.swimmerCount}</td>
                    <td className="py-2.5 text-center text-muted-foreground">{sq.reportCount}</td>
                    <td className="py-2.5 text-center">
                      {sq.avgScore != null
                        ? <span className="font-bold text-primary">{sq.avgScore}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {sq.topPhase || <span className="text-muted-foreground/50">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground border-t border-border pt-3">
        All leaderboard data sourced from coach-approved, finalised reports only.
        Pending, deleted, and placeholder-only reports are excluded. No race time predictions or talent rankings.
      </p>
    </div>
  );
}