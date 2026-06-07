import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useClubContext } from '@/lib/useClubContext';
import PageHeader from '@/components/shared/PageHeader';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from 'recharts';
import {
  BarChart2, TrendingUp, Target, Users, FileText, Activity, Waves, Loader2, CheckCircle2, Trophy
} from 'lucide-react';
import {
  activeCompletedReports, approvedFindings,
  buildFaultFrequency, buildPhaseFrequency, buildSeverityDistribution
} from '@/components/analytics/analyticsHelpers';
import TeamLeaderboard from '@/components/leaderboard/TeamLeaderboard';

const CHART_STYLE = {
  contentStyle: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 },
  labelStyle: { color: '#0b1f33' },
  itemStyle: { color: '#0077b6' },
};

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="p-4 rounded-xl bg-white border border-border text-center">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      {sub && <div className="text-[10px] text-primary mt-0.5">{sub}</div>}
    </div>
  );
}

export default function ClubProgress() {
  const { club, loading } = useClubContext();
  const [activeTab, setActiveTab] = useState('analytics');
  const [strokeFilter, setStrokeFilter] = useState('all');
  const [squadFilter, setSquadFilter] = useState('all');

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
    queryKey: ['reports-progress', club?.id],
    queryFn: () => base44.entities.Report.filter({ club_id: club.id }, '-created_date', 500),
    enabled: !!club?.id,
  });

  const { data: allFindings = [], isLoading: loadingFindings } = useQuery({
    queryKey: ['findings-progress', club?.id],
    queryFn: () => base44.entities.Finding.filter({ club_id: club.id }, '-created_date', 1000),
    enabled: !!club?.id,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="p-10 rounded-xl bg-white border border-border text-center">
          <Waves className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <div className="text-sm font-medium text-foreground mb-1">No club workspace selected</div>
          <p className="text-xs text-muted-foreground">Create or join a club to view progress data.</p>
        </div>
      </div>
    );
  }

  // ── Filter to only active, coach-finalised reports ──
  const completedReports = activeCompletedReports(allReports);
  const completedIds = completedReports.map(r => r.id);
  const goodFindings = approvedFindings(allFindings, completedIds);

  // Apply filters
  const filteredSwimmers = squadFilter === 'all'
    ? swimmers
    : swimmers.filter(s => s.squad_id === squadFilter);

  const filteredSwimmerIds = new Set(filteredSwimmers.map(s => s.id));

  const filteredReports = completedReports.filter(r => {
    const matchSquad = filteredSwimmerIds.has(r.swimmer_id);
    const matchStroke = strokeFilter === 'all' || (r.title || '').toLowerCase().includes(strokeFilter.toLowerCase());
    return matchSquad && matchStroke;
  });

  const filteredIds = new Set(filteredReports.map(r => r.id));
  const filteredFindings = goodFindings.filter(f => filteredIds.has(f.report_id));

  // Swimmers with at least 1 completed report
  const reviewedSwimmerIds = new Set(filteredReports.map(r => r.swimmer_id).filter(Boolean));
  const reviewedCount = reviewedSwimmerIds.size;

  // Average score
  const scoredReports = filteredReports.filter(r => r.overall_score != null);
  const avgScore = scoredReports.length > 0
    ? Math.round(scoredReports.reduce((a, r) => a + r.overall_score, 0) / scoredReports.length)
    : null;

  // Score over time (monthly average, last 6 months)
  const now = new Date();
  const monthlyScoreData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleString('en-AU', { month: 'short' });
    const monthReports = filteredReports.filter(r => {
      const rd = new Date(r.ai_completed_at || r.updated_date || r.created_date);
      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth() && r.overall_score != null;
    });
    const avg = monthReports.length > 0
      ? Math.round(monthReports.reduce((a, r) => a + r.overall_score, 0) / monthReports.length)
      : null;
    const count = filteredReports.filter(r => {
      const rd = new Date(r.ai_completed_at || r.updated_date || r.created_date);
      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
    }).length;
    return { month: label, avgScore: avg, reports: count };
  });

  // Faults + phases
  const faultData = buildFaultFrequency(filteredFindings, 8);
  const phaseData = buildPhaseFrequency(filteredFindings, 6);
  const severityDist = buildSeverityDistribution(filteredFindings);
  const totalSeverity = Object.values(severityDist).reduce((a, b) => a + b, 0);

  // Per-swimmer report counts (leaderboard)
  const swimmerReportCounts = filteredSwimmers
    .map(s => ({
      ...s,
      count: filteredReports.filter(r => r.swimmer_id === s.id).length,
      avgScore: (() => {
        const rs = filteredReports.filter(r => r.swimmer_id === s.id && r.overall_score != null);
        return rs.length > 0 ? Math.round(rs.reduce((a, r) => a + r.overall_score, 0) / rs.length) : null;
      })(),
    }))
    .filter(s => s.count > 0)
    .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0));

  const strokeOptions = ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'IM'];

  const isEmpty = completedReports.length < 3;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-20">
      <PageHeader
        eyebrow={club.name}
        title="Club Progress"
        subtitle="Coach-approved report trends, fault patterns, and team leaderboard."
        action={
          <Link to="/ai-reviews">
            <Button size="sm" variant="outline" className="text-xs h-8">
              <FileText className="w-3.5 h-3.5 mr-1" /> AI Review Queue
            </Button>
          </Link>
        }
      />

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-secondary/50 border border-border w-fit">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'analytics' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <BarChart2 className="w-3.5 h-3.5" /> Analytics
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'leaderboard' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Trophy className="w-3.5 h-3.5" /> Team Leaderboard
        </button>
      </div>

      {activeTab === 'leaderboard' && <TeamLeaderboard />}
      {activeTab === 'analytics' && <div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={FileText} label="Completed Reports" value={completedReports.length} />
        <StatCard icon={Users} label="Swimmers Reviewed" value={reviewedCount} sub={`of ${swimmers.length} total`} />
        <StatCard icon={Activity} label="Approved Findings" value={goodFindings.length} />
        {avgScore != null
          ? <StatCard icon={TrendingUp} label="Avg Score" value={avgScore} sub="coach-reviewed" />
          : <StatCard icon={TrendingUp} label="Avg Score" value="—" sub="no scored reports yet" />
        }
      </div>

      {/* Empty state */}
      {isEmpty ? (
        <div className="p-10 rounded-xl bg-white border border-border text-center space-y-3">
          <Waves className="w-8 h-8 text-muted-foreground mx-auto" />
          <div className="text-sm font-medium text-foreground">Not enough data yet</div>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Club progress charts appear after at least <strong>3 coach-approved, finalised reports</strong> exist across your club.
            Complete and finalise AI review sessions to start seeing trends.
          </p>
          <Link to="/ai-reviews">
            <Button size="sm" className="bg-primary text-primary-foreground mt-2">
              Go to AI Review Queue
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-5 p-3 rounded-xl bg-secondary/40 border border-border">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">Stroke:</span>
              {['all', ...strokeOptions].map(s => (
                <button key={s} onClick={() => setStrokeFilter(s)}
                  className={`text-[10px] px-2 py-1 rounded border transition-colors font-medium ${
                    strokeFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-white text-muted-foreground border-border hover:border-primary/40'
                  }`}>
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
            {squads.length > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">Squad:</span>
                {[{ id: 'all', name: 'All' }, ...squads].map(sq => (
                  <button key={sq.id} onClick={() => setSquadFilter(sq.id)}
                    className={`text-[10px] px-2 py-1 rounded border transition-colors font-medium ${
                      squadFilter === sq.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-white text-muted-foreground border-border hover:border-primary/40'
                    }`}>
                    {sq.name}
                  </button>
                ))}
              </div>
            )}
            {filteredReports.length !== completedReports.length && (
              <span className="text-[10px] text-muted-foreground self-center ml-auto">
                Showing {filteredReports.length} of {completedReports.length} reports
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Score trend over time */}
            {monthlyScoreData.some(d => d.avgScore != null) && (
              <div className="p-4 rounded-xl bg-white border border-border">
                <div className="flex items-center gap-1.5 mb-4">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Avg Score Trend (6 months)</span>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={monthlyScoreData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748b' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} />
                    <Tooltip {...CHART_STYLE} formatter={(v) => v != null ? [v, 'Avg Score'] : ['—', 'No data']} />
                    <Line type="monotone" dataKey="avgScore" stroke="#0077b6" strokeWidth={2}
                      dot={{ r: 3, fill: '#0077b6' }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Completed reports per month */}
            <div className="p-4 rounded-xl bg-white border border-border">
              <div className="flex items-center gap-1.5 mb-4">
                <BarChart2 className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">Completed Reports (6 months)</span>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={monthlyScoreData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip {...CHART_STYLE} />
                  <Bar dataKey="reports" fill="#0077b6" radius={[3, 3, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Common faults */}
            {faultData.length > 0 && (
              <div className="p-4 rounded-xl bg-white border border-border md:col-span-2">
                <div className="flex items-center gap-1.5 mb-4">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Most Common Approved Faults</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">from coach-approved findings only</span>
                </div>
                <ResponsiveContainer width="100%" height={Math.max(160, faultData.length * 26)}>
                  <BarChart data={faultData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: '#64748b' }} width={150} />
                    <Tooltip {...CHART_STYLE} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[0, 3, 3, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Phase frequency */}
            {phaseData.length > 0 && (
              <div className="p-4 rounded-xl bg-white border border-border">
                <div className="flex items-center gap-1.5 mb-4">
                  <Waves className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Phases Needing Attention</span>
                </div>
                <div className="space-y-2">
                  {phaseData.map(p => {
                    const pct = Math.round((p.count / phaseData[0].count) * 100);
                    return (
                      <div key={p.name}>
                        <div className="flex justify-between text-[10px] mb-0.5">
                          <span className="text-muted-foreground">{p.name}</span>
                          <span className="text-foreground font-medium">{p.count}</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Severity distribution */}
            {totalSeverity > 0 && (
              <div className="p-4 rounded-xl bg-white border border-border">
                <div className="flex items-center gap-1.5 mb-4">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Severity Distribution</span>
                </div>
                <div className="space-y-2">
                  {[
                    { key: 'low',      label: 'Low',      color: 'bg-green-400',  textColor: 'text-green-700' },
                    { key: 'medium',   label: 'Medium',   color: 'bg-amber-400',  textColor: 'text-amber-700' },
                    { key: 'high',     label: 'High',     color: 'bg-orange-400', textColor: 'text-orange-700' },
                    { key: 'critical', label: 'Critical', color: 'bg-red-500',    textColor: 'text-red-700' },
                  ].filter(s => severityDist[s.key] > 0).map(s => {
                    const pct = Math.round((severityDist[s.key] / totalSeverity) * 100);
                    return (
                      <div key={s.key}>
                        <div className="flex justify-between text-[10px] mb-0.5">
                          <span className="text-muted-foreground">{s.label}</span>
                          <span className={`font-medium ${s.textColor}`}>{severityDist[s.key]} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${s.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Swimmer leaderboard */}
            {swimmerReportCounts.length > 0 && (
              <div className="p-4 rounded-xl bg-white border border-border md:col-span-2">
                <div className="flex items-center gap-1.5 mb-4">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Swimmer Activity</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">coach-approved reports only</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {swimmerReportCounts.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-secondary/30">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">{s.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {s.count} report{s.count !== 1 ? 's' : ''}
                        </div>
                      </div>
                      {s.avgScore != null && (
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-black text-primary">{s.avgScore}</div>
                          <div className="text-[9px] text-muted-foreground">avg score</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground mt-4 border-t border-border pt-3">
            All data sourced from coach-approved, finalised reports only. Pending AI reports, deleted reports, and rejected findings are excluded.
          </p>
        </>
      )}
      </div>}
    </div>
  );
}