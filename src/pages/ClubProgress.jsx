import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import entities from '@/lib/data/entities';
import { useClubContext } from '@/lib/useClubContext';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import TeamLeaderboard from '@/components/leaderboard/TeamLeaderboard';
import {
  activeCompletedReports,
  approvedFindings,
  buildFaultFrequency,
  buildPhaseFrequency,
  buildSeverityDistribution,
  formatShortDate,
  reportDate,
  reportMode,
  reportStroke,
  swimmerName,
} from '@/components/analytics/analyticsHelpers';
import { Activity, BarChart2, FileText, Loader2, Shield, Target, TrendingUp, Trophy, Users, Waves } from 'lucide-react';

const STROKES = ['All', 'Freestyle', 'Breaststroke', 'Backstroke', 'Butterfly', 'General'];

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="p-4 rounded-xl bg-white border border-border">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</div>
      </div>
      <div className="text-2xl font-black text-foreground">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-10 rounded-xl bg-white border border-border text-center space-y-3">
      <Waves className="w-9 h-9 text-muted-foreground mx-auto opacity-50" />
      <div className="text-sm font-semibold text-foreground">Not enough finalised reports yet</div>
      <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
        Club progress uses real coach-approved reports only. Charts unlock after at least three finalised reports exist.
      </p>
      <Link to="/ai-reviews">
        <Button size="sm" className="mt-2">Open Coach Studio</Button>
      </Link>
    </div>
  );
}

export default function ClubProgress() {
  const { club, loading } = useClubContext();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'leaderboard' ? 'leaderboard' : 'analytics');
  const [strokeFilter, setStrokeFilter] = useState('All');
  const [squadFilter, setSquadFilter] = useState('all');

  const { data: swimmers = [], isLoading: swimmersLoading } = useQuery({
    queryKey: ['progress-swimmers', club?.id],
    queryFn: () => entities.Swimmer.filter({ club_id: club.id }, 'last_name', 400),
    enabled: !!club?.id,
  });

  const { data: squads = [] } = useQuery({
    queryKey: ['progress-squads', club?.id],
    queryFn: () => entities.Squad.filter({ club_id: club.id }, 'name', 100),
    enabled: !!club?.id,
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['progress-reports', club?.id],
    queryFn: () => entities.Report.filter({ club_id: club.id }, '-created_date', 700),
    enabled: !!club?.id,
  });

  const { data: findings = [], isLoading: findingsLoading } = useQuery({
    queryKey: ['progress-findings', club?.id],
    queryFn: () => entities.Finding.filter({ club_id: club.id }, '-created_date', 1500),
    enabled: !!club?.id,
  });

  const isLoading = loading || swimmersLoading || reportsLoading || findingsLoading;

  const progress = useMemo(() => {
    const completed = activeCompletedReports(reports);
    const swimmerMap = new Map(swimmers.map(swimmer => [swimmer.id, swimmer]));
    const squadMap = new Map(squads.map(squad => [squad.id, squad]));

    const allowedSwimmerIds = new Set(
      swimmers
        .filter(swimmer => squadFilter === 'all' || swimmer.squad_id === squadFilter)
        .map(swimmer => swimmer.id)
    );

    const filteredReports = completed.filter(report => {
      const strokeOk = strokeFilter === 'All' || reportStroke(report).toLowerCase().includes(strokeFilter.toLowerCase());
      return allowedSwimmerIds.has(report.swimmer_id) && strokeOk;
    });

    const approved = approvedFindings(findings, filteredReports.map(report => report.id));
    const scoredReports = filteredReports.filter(report => report.overall_score !== null && report.overall_score !== undefined);
    const avgScore = scoredReports.length
      ? Math.round(scoredReports.reduce((sum, report) => sum + Number(report.overall_score), 0) / scoredReports.length)
      : null;

    const reviewedSwimmerIds = new Set(filteredReports.map(report => report.swimmer_id).filter(Boolean));

    const reportsByStroke = Object.values(filteredReports.reduce((map, report) => {
      const stroke = reportStroke(report);
      map[stroke] = map[stroke] || { name: stroke, reports: 0 };
      map[stroke].reports += 1;
      return map;
    }, {})).sort((a, b) => b.reports - a.reports);

    const reportsBySquad = squads.map(squad => {
      const squadSwimmerIds = new Set(swimmers.filter(swimmer => swimmer.squad_id === squad.id).map(swimmer => swimmer.id));
      const squadReports = filteredReports.filter(report => squadSwimmerIds.has(report.swimmer_id));
      return { name: squad.name, reports: squadReports.length };
    }).filter(item => item.reports > 0);

    const modeCounts = Object.values(filteredReports.reduce((map, report) => {
      const mode = reportMode(report);
      map[mode] = map[mode] || { name: mode, reports: 0 };
      map[mode].reports += 1;
      return map;
    }, {}));

    const recentReports = [...filteredReports]
      .sort((a, b) => new Date(reportDate(b)) - new Date(reportDate(a)))
      .slice(0, 6)
      .map(report => ({
        report,
        swimmer: swimmerMap.get(report.swimmer_id),
        squad: squadMap.get(swimmerMap.get(report.swimmer_id)?.squad_id),
      }));

    return {
      completed,
      filteredReports,
      approved,
      reviewedSwimmerIds,
      avgScore,
      reportsByStroke,
      reportsBySquad,
      modeCounts,
      commonFindings: buildFaultFrequency(approved, 8),
      phaseFocus: buildPhaseFrequency(approved, 8),
      severity: buildSeverityDistribution(approved),
      recentReports,
    };
  }, [findings, reports, squadFilter, squads, strokeFilter, swimmers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
        <span className="text-sm text-muted-foreground">Loading club progress...</span>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="p-10 rounded-xl bg-white border border-border text-center">
          <Waves className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <div className="text-sm font-medium text-foreground mb-1">No club workspace selected</div>
          <p className="text-xs text-muted-foreground">Create or join a club to view progress.</p>
        </div>
      </div>
    );
  }

  const severityTotal = Object.values(progress.severity).reduce((sum, count) => sum + count, 0);
  const canChart = progress.completed.length >= 3;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-20">
      <PageHeader
        eyebrow={club.name}
        title="Club Progress"
        subtitle="Real progress from finalised reports and approved findings only."
        action={
          <Link to="/performance">
            <Button size="sm" variant="outline" className="h-8 text-xs">
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> Performance Hub
            </Button>
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
        <Shield className="w-4 h-4 text-primary mt-0.5" />
        <p className="text-[10px] text-muted-foreground flex-1 leading-relaxed">
          No fake charts here. Pending reports, rejected findings, and deleted reports are excluded.
        </p>
      </div>

      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-secondary/50 border border-border w-fit">
        {[
          ['analytics', BarChart2, 'Analytics'],
          ['leaderboard', Trophy, 'Leaderboard'],
        ].map(([key, Icon, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${
              activeTab === key ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'leaderboard' ? (
        <TeamLeaderboard />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={FileText} label="Finalised reports" value={progress.completed.length} />
            <StatCard icon={Users} label="Swimmers reviewed" value={progress.reviewedSwimmerIds.size} sub={`of ${swimmers.length} swimmers`} />
            <StatCard icon={Activity} label="Approved findings" value={progress.approved.length} />
            <StatCard icon={TrendingUp} label="Average score" value={progress.avgScore ?? '—'} sub={progress.avgScore == null ? 'needs scored reports' : 'coach finalised'} />
          </div>

          {!canChart ? <EmptyState /> : (
            <>
              <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-white border border-border">
                <span className="text-[10px] text-muted-foreground self-center mr-1">Stroke</span>
                {STROKES.map(stroke => (
                  <button
                    key={stroke}
                    type="button"
                    onClick={() => setStrokeFilter(stroke)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold ${
                      strokeFilter === stroke ? 'bg-primary text-white border-primary' : 'bg-secondary text-muted-foreground border-border'
                    }`}
                  >
                    {stroke}
                  </button>
                ))}
                {squads.length > 0 && (
                  <>
                    <span className="text-[10px] text-muted-foreground self-center ml-2 mr-1">Squad</span>
                    {[{ id: 'all', name: 'All' }, ...squads].map(squad => (
                      <button
                        key={squad.id}
                        type="button"
                        onClick={() => setSquadFilter(squad.id)}
                        className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold ${
                          squadFilter === squad.id ? 'bg-primary text-white border-primary' : 'bg-secondary text-muted-foreground border-border'
                        }`}
                      >
                        {squad.name}
                      </button>
                    ))}
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-border">
                  <div className="text-xs font-bold text-foreground mb-3">Reports by Stroke</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={progress.reportsByStroke}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="reports" fill="#0077b6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-4 rounded-xl bg-white border border-border">
                  <div className="text-xs font-bold text-foreground mb-3">Reviews</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={progress.modeCounts}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="reports" fill="#00a6c8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {progress.commonFindings.length > 0 && (
                  <div className="p-4 rounded-xl bg-white border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-primary" />
                      <div className="text-xs font-bold text-foreground">Common Approved Findings</div>
                    </div>
                    <div className="space-y-2">
                      {progress.commonFindings.map(item => (
                        <div key={item.name}>
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-muted-foreground truncate pr-2">{item.name}</span>
                            <span className="font-semibold text-foreground">{item.count}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full bg-amber-400" style={{ width: `${Math.max(8, (item.count / progress.commonFindings[0].count) * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {progress.phaseFocus.length > 0 && (
                  <div className="p-4 rounded-xl bg-white border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Waves className="w-4 h-4 text-primary" />
                      <div className="text-xs font-bold text-foreground">Stroke Phases Needing Attention</div>
                    </div>
                    <div className="space-y-2">
                      {progress.phaseFocus.map(item => (
                        <div key={item.name} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 border border-border">
                          <span className="text-xs font-medium text-foreground">{item.name}</span>
                          <span className="text-[10px] text-muted-foreground">{item.count} finding{item.count !== 1 ? 's' : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {progress.reportsBySquad.length > 0 && (
                  <div className="p-4 rounded-xl bg-white border border-border">
                    <div className="text-xs font-bold text-foreground mb-3">Reports by Squad</div>
                    <div className="space-y-2">
                      {progress.reportsBySquad.map(item => (
                        <div key={item.name} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 border border-border">
                          <span className="text-xs font-medium text-foreground">{item.name}</span>
                          <span className="text-[10px] text-muted-foreground">{item.reports} report{item.reports !== 1 ? 's' : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {severityTotal > 0 && (
                  <div className="p-4 rounded-xl bg-white border border-border">
                    <div className="text-xs font-bold text-foreground mb-3">Severity Mix</div>
                    <div className="space-y-2">
                      {Object.entries(progress.severity).filter(([, count]) => count > 0).map(([severity, count]) => (
                        <div key={severity}>
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="capitalize text-muted-foreground">{severity}</span>
                            <span className="font-semibold text-foreground">{count}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${(count / severityTotal) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-white border border-border">
                <div className="text-xs font-bold text-foreground mb-3">Recent Finalised Reports</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {progress.recentReports.map(({ report, swimmer, squad }) => (
                    <Link key={report.id} to={`/ai-review?report_id=${report.id}`} className="p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 transition-colors">
                      <div className="text-xs font-semibold text-foreground">{swimmerName(swimmer)}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {reportStroke(report)} · {formatShortDate(reportDate(report))}{squad ? ` · ${squad.name}` : ''}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
