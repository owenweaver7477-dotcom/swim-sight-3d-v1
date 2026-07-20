import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import entities from '@/lib/data/entities';
import { useClubContext } from '@/lib/useClubContext';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import {
  activeCompletedReports,
  approvedFindings,
  buildAvgScoreSeries,
  buildFaultFrequency,
  buildFrequency,
  buildScoreSeries,
  findingLabel,
  findingPhase,
  formatShortDate,
  reportDate,
  reportStroke,
  reportsBySwimmer,
  reportsWithinDays,
  scoreTrendForSwimmer,
  scoredReports,
  swimmerName,
} from '@/components/analytics/analyticsHelpers';
import { AlertTriangle, FileText, Loader2, Shield, Target, TrendingUp, Users, Waves } from 'lucide-react';

const MIN_TREND_REPORTS = 3;

// ── Individual swimmer trend card (preserved from the original page) ──────────────
function TrendCard({ swimmer, squad, reports, findings }) {
  const series = buildScoreSeries(reports);
  const trend = scoreTrendForSwimmer(reports, MIN_TREND_REPORTS);
  const reportIds = reports.map(report => report.id);
  const swimmerFindings = approvedFindings(findings, reportIds);
  const focusItems = latestFocus(swimmerFindings, 3);
  const repeatedFocus = buildFrequency(swimmerFindings, findingPhase, 3);
  const latestReport = [...reports].sort((a, b) => new Date(reportDate(b)) - new Date(reportDate(a)))[0];

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Waves className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-foreground">{swimmerName(swimmer)}</div>
          <div className="text-[10px] text-muted-foreground">
            {squad?.name || 'No squad'} · {reports.length} finalised report{reports.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex gap-2">
          {latestReport && (
            <Link to={`/ai-review?report_id=${latestReport.id}`}>
              <Button size="sm" variant="outline" className="h-8 text-xs">Latest Report</Button>
            </Link>
          )}
        </div>
      </div>

      {trend.hasTrend ? (
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-secondary/40 border border-border text-center">
            <div className="text-[10px] text-muted-foreground">First</div>
            <div className="text-lg font-black text-foreground">{Math.round(trend.firstScore)}</div>
          </div>
          <div className="p-2 rounded-lg bg-secondary/40 border border-border text-center">
            <div className="text-[10px] text-muted-foreground">Latest</div>
            <div className="text-lg font-black text-primary">{Math.round(trend.latestScore)}</div>
          </div>
          <div className="p-2 rounded-lg bg-secondary/40 border border-border text-center">
            <div className="text-[10px] text-muted-foreground">Change</div>
            <div className={`text-lg font-black ${trend.delta >= 0 ? 'text-green-600' : 'text-amber-600'}`}>
              {trend.delta > 0 ? '+' : ''}{Math.round(trend.delta)}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-3 rounded-lg bg-muted border border-border">
          <div className="text-xs font-semibold text-foreground">Trend appears after {MIN_TREND_REPORTS} scored finalised reports</div>
          <p className="text-[10px] text-muted-foreground mt-1">Current scored reports: {trend.count}. The app will not infer improvement from insufficient data.</p>
        </div>
      )}

      {series.length >= 2 && (
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={series} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#0077b6" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Recent Focus</div>
          {focusItems.length ? (
            <div className="space-y-1.5">
              {focusItems.map(item => <div key={item} className="text-xs text-foreground">{item}</div>)}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No approved focus notes yet.</div>
          )}
        </div>
        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Repeated Phases</div>
          {repeatedFocus.length ? (
            <div className="space-y-1.5">
              {repeatedFocus.map(item => (
                <div key={item.name} className="flex justify-between text-xs">
                  <span className="text-foreground">{item.name}</span>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No repeated technical focus yet.</div>
          )}
        </div>
      </div>

      {latestReport && (
        <div className="mt-3 text-[10px] text-muted-foreground">
          Latest: {reportStroke(latestReport)} · {formatShortDate(reportDate(latestReport))}
        </div>
      )}
    </div>
  );
}

// Local wrapper so TrendCard keeps its existing focus behaviour without a new import.
function latestFocus(findings, limit) {
  const seen = new Set();
  const out = [];
  findings.forEach(finding => {
    const focus = finding.next_focus || finding.correction_cue || finding.drill;
    if (!focus || seen.has(focus)) return;
    seen.add(focus);
    out.push(focus);
  });
  return out.slice(0, limit);
}

// ── Small metric card ─────────────────────────────────────────────────────────
function Metric({ icon: Icon, label, value, sub }) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <Icon className="w-4 h-4 text-primary mb-2" />
      <div className="text-2xl font-black text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      {sub && <div className="text-[10px] text-primary mt-1">{sub}</div>}
    </div>
  );
}

// ── Honest low-data state for aggregate scopes ────────────────────────────────────
function LowDataState({ scopeLabel, scoredCount }) {
  return (
    <div className="p-6 rounded-xl bg-muted border border-border text-center">
      <AlertTriangle className="w-7 h-7 text-amber-500 mx-auto mb-2" />
      <div className="text-sm font-semibold text-foreground">Not enough data for a {scopeLabel} trend yet</div>
      <p className="text-[11px] text-muted-foreground mt-1 max-w-md mx-auto">
        A trend line appears after {MIN_TREND_REPORTS}+ scored, coach-approved reports in this view. Currently {scoredCount}. The app will not infer progress from insufficient data.
      </p>
    </div>
  );
}

// ── Aggregate trend (Squad / Club) — real overall_score + approved findings only ──
function AggregateTrend({ scopeLabel, reports, findings, swimmerCount, membershipNote }) {
  const scored = scoredReports(reports);
  const series = buildAvgScoreSeries(reports);
  const avg = scored.length
    ? Math.round(scored.reduce((sum, report) => sum + Number(report.overall_score), 0) / scored.length)
    : null;
  const reviewedSwimmers = new Set(reports.map(report => report.swimmer_id).filter(Boolean)).size;
  const approved = approvedFindings(findings, reports.map(report => report.id));
  const topFaults = buildFaultFrequency(approved, 6);
  const enough = scored.length >= MIN_TREND_REPORTS;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric icon={FileText} label="Scored reports" value={scored.length} />
        <Metric icon={Users} label="Reviewed swimmers" value={reviewedSwimmers} sub={swimmerCount != null ? `of ${swimmerCount}` : undefined} />
        <Metric icon={TrendingUp} label="Average score" value={avg != null ? avg : '—'} />
        <Metric icon={Target} label="Approved findings" value={approved.length} />
      </div>

      {membershipNote && <div className="text-[10px] text-muted-foreground">{membershipNote}</div>}

      {enough ? (
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Average overall score over time</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={series} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#0077b6" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-1 text-[10px] text-muted-foreground">Each point is the average of that month&apos;s scored, coach-approved reports.</div>
        </div>
      ) : (
        <LowDataState scopeLabel={scopeLabel} scoredCount={scored.length} />
      )}

      {topFaults.length > 0 && (
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Top approved findings</div>
          <div className="space-y-1.5">
            {topFaults.map((fault, index) => (
              <div key={fault.name} className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground w-3 flex-shrink-0">{index + 1}.</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-foreground truncate">{fault.name}</span>
                    <span className="text-primary font-semibold ml-2 flex-shrink-0">{fault.count}×</span>
                  </div>
                  <div className="h-1 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary/70 rounded-full" style={{ width: `${(fault.count / topFaults[0].count) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const STROKE_OPTIONS = [
  ['all', 'All strokes'],
  ['freestyle', 'Freestyle'],
  ['breaststroke', 'Breaststroke'],
  ['backstroke', 'Backstroke'],
  ['butterfly', 'Butterfly'],
  ['general', 'General'],
];

const RANGE_OPTIONS = [
  ['all', 'All time'],
  ['90', 'Last 90 days'],
  ['30', 'Last 30 days'],
];

export default function SwimmerTrends() {
  const { club } = useClubContext();
  const [scope, setScope] = useState('individual');
  const [squadFilter, setSquadFilter] = useState('all');
  const [strokeFilter, setStrokeFilter] = useState('all');
  const [rangeFilter, setRangeFilter] = useState('all');

  const { data: swimmers = [], isLoading: swimmersLoading } = useQuery({
    queryKey: ['trends-swimmers', club?.id],
    queryFn: () => entities.Swimmer.filter({ club_id: club.id }, 'last_name', 400),
    enabled: !!club?.id,
  });

  const { data: squads = [] } = useQuery({
    queryKey: ['trends-squads', club?.id],
    queryFn: () => entities.Squad.filter({ club_id: club.id }, 'name', 100),
    enabled: !!club?.id,
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['trends-reports', club?.id],
    queryFn: () => entities.Report.filter({ club_id: club.id }, '-created_date', 700),
    enabled: !!club?.id,
  });

  const { data: findings = [], isLoading: findingsLoading } = useQuery({
    queryKey: ['trends-findings', club?.id],
    queryFn: () => entities.Finding.filter({ club_id: club.id }, '-created_date', 1500),
    enabled: !!club?.id,
  });

  const isLoading = swimmersLoading || reportsLoading || findingsLoading;
  const rangeDays = rangeFilter === '30' ? 30 : rangeFilter === '90' ? 90 : null;

  const data = useMemo(() => {
    const completedAll = activeCompletedReports(reports);
    const squadMap = new Map(squads.map(squad => [squad.id, squad]));
    const swimmerSquad = new Map(swimmers.map(swimmer => [swimmer.id, swimmer.squad_id]));

    // Shared filters: date range + stroke, applied to finalised reports only.
    const matchesStroke = report => strokeFilter === 'all' || reportStroke(report).toLowerCase().includes(strokeFilter);
    const baseReports = reportsWithinDays(completedAll, rangeDays).filter(matchesStroke);

    // Individual scope
    const grouped = reportsBySwimmer(baseReports);
    const filteredSwimmers = swimmers.filter(swimmer => squadFilter === 'all' || swimmer.squad_id === squadFilter);
    const individualVisible = filteredSwimmers
      .map(swimmer => ({
        swimmer,
        squad: squadMap.get(swimmer.squad_id),
        reports: (grouped[swimmer.id] || []).sort((a, b) => new Date(reportDate(b)) - new Date(reportDate(a))),
      }))
      .filter(item => item.reports.length > 0);
    const individualNoReports = filteredSwimmers.filter(swimmer => !(grouped[swimmer.id] || []).length);
    const scoredWithTrend = individualVisible.filter(item => scoreTrendForSwimmer(item.reports, MIN_TREND_REPORTS).hasTrend).length;
    const focusLabels = buildFrequency(approvedFindings(findings, completedAll.map(report => report.id)), findingLabel, 5);

    // Squad scope (current membership)
    const squadReports = squadFilter === 'all' ? [] : baseReports.filter(report => swimmerSquad.get(report.swimmer_id) === squadFilter);
    const squadSwimmerCount = swimmers.filter(swimmer => swimmer.squad_id === squadFilter).length;

    return {
      completedCount: completedAll.length,
      individualVisible,
      individualNoReports,
      scoredWithTrend,
      focusLabels,
      squadReports,
      squadSwimmerCount,
      clubReports: baseReports,
    };
  }, [reports, findings, squads, swimmers, squadFilter, strokeFilter, rangeDays]);

  if (!club) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="p-10 rounded-xl bg-card border border-border text-center">
          <Waves className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <div className="text-sm font-medium text-foreground mb-1">No club workspace selected</div>
          <p className="text-xs text-muted-foreground">Create or join a club to view swimmer trends.</p>
        </div>
      </div>
    );
  }

  const scopes = [['individual', 'Individual'], ['squad', 'Squad'], ['club', 'Club']];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-20">
      <PageHeader
        eyebrow="Progress"
        title="Swimmer Trends"
        subtitle="Progress by swimmer, squad, or whole club — from real finalised reports only. Trends appear only when there is enough data."
        action={
          <Link to="/club-progress">
            <Button size="sm" variant="outline" className="h-8 text-xs">
              <Users className="w-3.5 h-3.5 mr-1" /> Club Progress
            </Button>
          </Link>
        }
      />

      <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20">
        <Shield className="w-4 h-4 text-primary mt-0.5" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          These are coaching progress indicators, not race predictions. No scores are invented. Weak-pose or draft reports stay out of trend charts until a coach finalises them.
        </p>
      </div>

      {/* Scope selector */}
      <div className="mb-5 inline-flex rounded-xl bg-muted p-1">
        {scopes.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setScope(id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              scope === id ? 'bg-card text-primary shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2 p-3 rounded-xl bg-card border border-border">
        {scope !== 'club' && (
          <select value={squadFilter} onChange={event => setSquadFilter(event.target.value)} className="text-xs px-3 py-2 rounded-lg border border-border bg-card">
            <option value="all">{scope === 'squad' ? 'Select a squad…' : 'All squads'}</option>
            {squads.map(squad => <option key={squad.id} value={squad.id}>{squad.name}</option>)}
          </select>
        )}
        <select value={strokeFilter} onChange={event => setStrokeFilter(event.target.value)} className="text-xs px-3 py-2 rounded-lg border border-border bg-card">
          {STROKE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={rangeFilter} onChange={event => setRangeFilter(event.target.value)} className="text-xs px-3 py-2 rounded-lg border border-border bg-card">
          {RANGE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">Loading swimmer trends...</span>
        </div>
      ) : scope === 'individual' ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Metric icon={FileText} label="Finalised reports" value={data.completedCount} />
            <Metric icon={Users} label="Swimmers with data" value={data.individualVisible.length} />
            <Metric icon={TrendingUp} label="Score trends ready" value={data.scoredWithTrend} />
            <Metric icon={Target} label="Common focus areas" value={data.focusLabels.length} />
          </div>

          {data.individualVisible.length === 0 ? (
            <div className="p-10 rounded-xl bg-card border border-border text-center">
              <Waves className="w-9 h-9 text-muted-foreground mx-auto mb-3 opacity-50" />
              <div className="text-sm font-semibold text-foreground">No finalised reports in this view</div>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                Add swimmers, upload videos, complete coach review, and finalise reports to unlock trends. Try widening the date range or clearing filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.individualVisible.map(item => (
                <TrendCard key={item.swimmer.id} swimmer={item.swimmer} squad={item.squad} reports={item.reports} findings={findings} />
              ))}
            </div>
          )}

          {data.individualNoReports.length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 dark:bg-amber-500/10 dark:border-amber-500/30">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 dark:text-amber-400" />
              <p className="text-[10px] text-amber-800 leading-relaxed dark:text-amber-300">
                {data.individualNoReports.length} swimmer{data.individualNoReports.length !== 1 ? 's' : ''} in this filter have no finalised reports yet.
              </p>
            </div>
          )}
        </>
      ) : scope === 'squad' ? (
        squadFilter === 'all' ? (
          <div className="p-10 rounded-xl bg-card border border-border text-center">
            <Users className="w-9 h-9 text-muted-foreground mx-auto mb-3 opacity-50" />
            <div className="text-sm font-semibold text-foreground">Select a squad</div>
            <p className="text-xs text-muted-foreground mt-1">
              Choose a squad above to view its aggregate progress.
              {squads.length === 0 && ' No squads exist yet — create squads in Club Settings.'}
            </p>
          </div>
        ) : (
          <AggregateTrend
            scopeLabel="squad"
            reports={data.squadReports}
            findings={findings}
            swimmerCount={data.squadSwimmerCount}
            membershipNote="Squad trends are based on current squad membership, not historical membership."
          />
        )
      ) : (
        <AggregateTrend
          scopeLabel="club"
          reports={data.clubReports}
          findings={findings}
          swimmerCount={swimmers.length}
        />
      )}
    </div>
  );
}
