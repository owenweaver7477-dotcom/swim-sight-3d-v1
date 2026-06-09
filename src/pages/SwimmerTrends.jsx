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
  buildFrequency,
  buildScoreSeries,
  findingLabel,
  findingPhase,
  formatShortDate,
  latestNextFocusItems,
  reportDate,
  reportStroke,
  reportsBySwimmer,
  scoreTrendForSwimmer,
  swimmerName,
} from '@/components/analytics/analyticsHelpers';
import { AlertTriangle, FileText, Loader2, Shield, Target, TrendingUp, Users, Waves } from 'lucide-react';

const MIN_TREND_REPORTS = 3;

function TrendCard({ swimmer, squad, reports, findings }) {
  const series = buildScoreSeries(reports);
  const trend = scoreTrendForSwimmer(reports, MIN_TREND_REPORTS);
  const reportIds = reports.map(report => report.id);
  const swimmerFindings = approvedFindings(findings, reportIds);
  const focusItems = latestNextFocusItems(swimmerFindings, 3);
  const repeatedFocus = buildFrequency(swimmerFindings, findingPhase, 3);
  const latestReport = [...reports].sort((a, b) => new Date(reportDate(b)) - new Date(reportDate(a)))[0];

  return (
    <div className="p-4 rounded-xl bg-white border border-border">
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
        <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div className="text-xs font-semibold text-slate-700">Trend appears after {MIN_TREND_REPORTS} scored finalised reports</div>
          <p className="text-[10px] text-slate-500 mt-1">Current scored reports: {trend.count}. The app will not infer improvement from insufficient data.</p>
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

export default function SwimmerTrends() {
  const { club } = useClubContext();
  const [squadFilter, setSquadFilter] = useState('all');
  const [strokeFilter, setStrokeFilter] = useState('all');

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

  const trendData = useMemo(() => {
    const completed = activeCompletedReports(reports);
    const grouped = reportsBySwimmer(completed);
    const squadMap = new Map(squads.map(squad => [squad.id, squad]));

    const filteredSwimmers = swimmers.filter(swimmer => squadFilter === 'all' || swimmer.squad_id === squadFilter);
    const visible = filteredSwimmers
      .map(swimmer => {
        const swimmerReports = (grouped[swimmer.id] || []).filter(report =>
          strokeFilter === 'all' || reportStroke(report).toLowerCase().includes(strokeFilter)
        );
        return {
          swimmer,
          squad: squadMap.get(swimmer.squad_id),
          reports: swimmerReports.sort((a, b) => new Date(reportDate(b)) - new Date(reportDate(a))),
        };
      })
      .filter(item => item.reports.length > 0);

    const noReports = filteredSwimmers.filter(swimmer => !(grouped[swimmer.id] || []).length);
    const scoredWithTrend = visible.filter(item => scoreTrendForSwimmer(item.reports, MIN_TREND_REPORTS).hasTrend).length;
    const focusLabels = buildFrequency(
      approvedFindings(findings, completed.map(report => report.id)),
      findingLabel,
      5
    );

    return { completed, visible, noReports, scoredWithTrend, focusLabels };
  }, [findings, reports, squadFilter, squads, strokeFilter, swimmers]);

  if (!club) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="p-10 rounded-xl bg-white border border-border text-center">
          <Waves className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <div className="text-sm font-medium text-foreground mb-1">No club workspace selected</div>
          <p className="text-xs text-muted-foreground">Create or join a club to view swimmer trends.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-20">
      <PageHeader
        eyebrow="Progress"
        title="Swimmer Trends"
        subtitle="Individual progress from real finalised reports. Trends appear only when there is enough data."
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-white border border-border">
          <FileText className="w-4 h-4 text-primary mb-2" />
          <div className="text-2xl font-black text-foreground">{trendData.completed.length}</div>
          <div className="text-[10px] text-muted-foreground">Finalised reports</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-border">
          <Users className="w-4 h-4 text-primary mb-2" />
          <div className="text-2xl font-black text-foreground">{trendData.visible.length}</div>
          <div className="text-[10px] text-muted-foreground">Swimmers with data</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-border">
          <TrendingUp className="w-4 h-4 text-primary mb-2" />
          <div className="text-2xl font-black text-foreground">{trendData.scoredWithTrend}</div>
          <div className="text-[10px] text-muted-foreground">Score trends ready</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-border">
          <Target className="w-4 h-4 text-primary mb-2" />
          <div className="text-2xl font-black text-foreground">{trendData.focusLabels.length}</div>
          <div className="text-[10px] text-muted-foreground">Common focus areas</div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 p-3 rounded-xl bg-white border border-border">
        <select value={squadFilter} onChange={event => setSquadFilter(event.target.value)} className="text-xs px-3 py-2 rounded-lg border border-border bg-white">
          <option value="all">All squads</option>
          {squads.map(squad => <option key={squad.id} value={squad.id}>{squad.name}</option>)}
        </select>
        <select value={strokeFilter} onChange={event => setStrokeFilter(event.target.value)} className="text-xs px-3 py-2 rounded-lg border border-border bg-white">
          <option value="all">All strokes</option>
          <option value="freestyle">Freestyle</option>
          <option value="breaststroke">Breaststroke</option>
          <option value="backstroke">Backstroke</option>
          <option value="butterfly">Butterfly</option>
          <option value="general">General</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">Loading swimmer trends...</span>
        </div>
      ) : trendData.visible.length === 0 ? (
        <div className="p-10 rounded-xl bg-white border border-border text-center">
          <Waves className="w-9 h-9 text-muted-foreground mx-auto mb-3 opacity-50" />
          <div className="text-sm font-semibold text-foreground">No finalised reports yet</div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
            Add swimmers, upload videos, complete coach review, and finalise reports to unlock trends.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {trendData.visible.map(item => (
            <TrendCard
              key={item.swimmer.id}
              swimmer={item.swimmer}
              squad={item.squad}
              reports={item.reports}
              findings={findings}
            />
          ))}
        </div>
      )}

      {trendData.noReports.length > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
          <p className="text-[10px] text-amber-800 leading-relaxed">
            {trendData.noReports.length} swimmer{trendData.noReports.length !== 1 ? 's' : ''} in this filter have no finalised reports yet.
          </p>
        </div>
      )}
    </div>
  );
}
