import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { TrendingUp, Target, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  activeCompletedReports, approvedFindings, reportSourceLabel,
  buildScoreSeries, buildFaultFrequency, buildPhaseFrequency,
  buildSeverityDistribution, latestNextFocusItems
} from './analyticsHelpers';
import { format } from 'date-fns';

const CHART_STYLE = {
  contentStyle: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 },
  labelStyle: { color: '#0b1f33' },
  itemStyle: { color: '#0077b6' },
};

const SEVERITY_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#dc2626' };

function ScoreGauge({ score }) {
  const color = score >= 80 ? '#22c55e' : score >= 65 ? '#f59e0b' : '#f97316';
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r="32" fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle
            cx="40" cy="40" r="32" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${(score / 100) * 201} 201`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className="text-xl font-black text-foreground">{score}</span>
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Score</span>
        </div>
      </div>
    </div>
  );
}

function SeverityBar({ dist }) {
  const total = Object.values(dist).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  const items = [
    { key: 'low', label: 'Low', color: SEVERITY_COLORS.low },
    { key: 'medium', label: 'Medium', color: SEVERITY_COLORS.medium },
    { key: 'high', label: 'High', color: SEVERITY_COLORS.high },
    { key: 'critical', label: 'Critical', color: SEVERITY_COLORS.critical },
  ].filter(i => dist[i.key] > 0);

  return (
    <div className="space-y-1.5">
      {items.map(i => {
        const pct = Math.round((dist[i.key] / total) * 100);
        return (
          <div key={i.key}>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-muted-foreground">{i.label}</span>
              <span className="font-medium" style={{ color: i.color }}>{dist[i.key]} ({pct}%)</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: i.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SwimmerProgressAnalytics({ swimmer }) {
  const navigate = useNavigate();
  const [strokeFilter, setStrokeFilter] = useState('all');
  const [expanded, setExpanded] = useState(true);

  const { data: allReports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['reports-swimmer-analytics', swimmer.id],
    queryFn: () => base44.entities.Report.filter({ swimmer_id: swimmer.id }, '-created_date', 100),
    enabled: !!swimmer.id,
  });

  // Active, coach-finalised reports only
  const completedReports = activeCompletedReports(allReports);

  const { data: allFindings = [], isLoading: loadingFindings } = useQuery({
    queryKey: ['findings-swimmer-analytics', swimmer.id],
    queryFn: () => base44.entities.Finding.filter({ swimmer_id: swimmer.id }, '-created_date', 500),
    enabled: !!swimmer.id && completedReports.length > 0,
  });

  const completedIds = completedReports.map(r => r.id);
  const goodFindings = approvedFindings(allFindings, completedIds);

  // Stroke options from completed reports
  const strokesAvailable = [...new Set(completedReports.map(r => r.title?.match(/Freestyle|Backstroke|Breaststroke|Butterfly|IM/i)?.[0]).filter(Boolean))];

  // Apply stroke filter
  const filteredReports = strokeFilter === 'all'
    ? completedReports
    : completedReports.filter(r => r.title?.toLowerCase().includes(strokeFilter.toLowerCase()));

  const filteredReportIds = new Set(filteredReports.map(r => r.id));
  const filteredFindings = goodFindings.filter(f => filteredReportIds.has(f.report_id));

  // Analytics data
  const scoreSeries = buildScoreSeries(filteredReports);
  const avgScore = scoreSeries.length > 0
    ? Math.round(scoreSeries.reduce((a, b) => a + b.score, 0) / scoreSeries.length)
    : null;
  const latestScore = scoreSeries.length > 0 ? scoreSeries[scoreSeries.length - 1].score : null;
  const prevScore = scoreSeries.length > 1 ? scoreSeries[scoreSeries.length - 2].score : null;
  const scoreTrend = latestScore != null && prevScore != null ? latestScore - prevScore : null;

  const faultFreq = buildFaultFrequency(filteredFindings, 6);
  const phaseFreq = buildPhaseFrequency(filteredFindings, 5);
  const severityDist = buildSeverityDistribution(filteredFindings);
  const nextFocusItems = latestNextFocusItems(filteredFindings, 4);
  const latestReport = filteredReports[0];

  if (loadingReports || loadingFindings) {
    return (
      <div className="p-5 rounded-xl bg-white border border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-3 h-3 border border-primary/40 border-t-primary rounded-full animate-spin" />
          Loading progress data…
        </div>
      </div>
    );
  }

  // Fewer than 1 completed report — no data at all
  if (completedReports.length === 0) {
    return (
      <div className="p-5 rounded-xl bg-white border border-border">
        <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">Progress Analytics</div>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/60">
          <TrendingUp className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-medium text-foreground mb-0.5">No completed reports yet</div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Progress analytics appear once at least one coach-approved report has been finalised for this swimmer.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 1–2 completed reports — simple history, no charts
  if (completedReports.length < 3) {
    return (
      <div className="p-5 rounded-xl bg-white border border-border space-y-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-primary">Progress Analytics</div>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-700 leading-relaxed">
            Full analytics appear after <strong>3+ completed coach-approved reviews</strong>. {completedReports.length === 1 ? '1 report' : `${completedReports.length} reports`} so far.
          </p>
        </div>
        {/* Simple report list */}
        <div className="space-y-2">
          {completedReports.map(r => (
            <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
              <div>
                <div className="text-xs font-medium text-foreground">{r.title || 'Coach Report'}</div>
                <div className="text-[10px] text-muted-foreground">
                  {reportSourceLabel(r)} · {format(new Date(r.updated_date || r.created_date), 'dd MMM yyyy')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {r.overall_score != null && (
                  <span className="text-lg font-black text-primary">{r.overall_score}</span>
                )}
                <Button size="sm" variant="outline" className="h-6 text-[10px] px-2"
                  onClick={() => navigate(`/ai-review?report_id=${r.id}`)}>
                  Open <ExternalLink className="w-2.5 h-2.5 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        {nextFocusItems.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-foreground mb-1.5">Latest Next-Focus Items</div>
            <div className="space-y-1">
              {nextFocusItems.map((item, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full analytics (3+ completed reports)
  return (
    <div className="rounded-xl bg-white border border-border overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-3 border-b border-border hover:bg-secondary/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-foreground">Progress Analytics</span>
          <span className="text-[10px] text-muted-foreground">({completedReports.length} coach-approved reports)</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="p-5 space-y-5">
          {/* Stroke filter */}
          {strokesAvailable.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-muted-foreground">Filter stroke:</span>
              {['all', ...strokesAvailable].map(s => (
                <button key={s} onClick={() => setStrokeFilter(s)}
                  className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors font-medium ${
                    strokeFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:border-primary/40'
                  }`}>
                  {s === 'all' ? 'All Strokes' : s}
                </button>
              ))}
            </div>
          )}

          {/* Score summary row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-secondary/50 text-center">
              <div className="text-2xl font-black text-primary">{filteredReports.length}</div>
              <div className="text-[10px] text-muted-foreground">Completed Reports</div>
            </div>
            {avgScore != null && (
              <div className="p-3 rounded-lg bg-secondary/50 text-center">
                <div className="text-2xl font-black text-foreground">{avgScore}</div>
                <div className="text-[10px] text-muted-foreground">Avg Score</div>
              </div>
            )}
            {latestReport && (
              <div className="p-3 rounded-lg bg-secondary/50 text-center">
                <div className="text-xs font-semibold text-foreground">
                  {format(new Date(latestReport.updated_date || latestReport.created_date), 'dd MMM')}
                </div>
                <div className="text-[10px] text-muted-foreground">Latest Report</div>
              </div>
            )}
          </div>

          {/* Score trend */}
          {scoreSeries.length >= 2 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Technical Score Over Time</span>
                {scoreTrend != null && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    scoreTrend > 0 ? 'text-green-700 bg-green-100' :
                    scoreTrend < 0 ? 'text-red-700 bg-red-100' : 'text-muted-foreground bg-secondary'
                  }`}>
                    {scoreTrend > 0 ? `↑ +${scoreTrend}` : scoreTrend < 0 ? `↓ ${scoreTrend}` : '→ No change'}
                  </span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={scoreSeries} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} />
                  <Tooltip {...CHART_STYLE} />
                  <Line type="monotone" dataKey="score" stroke="#0077b6" strokeWidth={2} dot={{ r: 3, fill: '#0077b6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Fault frequency */}
          {faultFreq.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">Most Common Approved Faults</div>
              <div className="space-y-1.5">
                {faultFreq.map((f, i) => (
                  <div key={f.name} className="flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground w-3 flex-shrink-0">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-foreground truncate">{f.name}</span>
                        <span className="text-primary font-semibold ml-2 flex-shrink-0">{f.count}×</span>
                      </div>
                      <div className="h-1 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary/70 rounded-full"
                          style={{ width: `${(f.count / faultFreq[0].count) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phase + Severity row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {phaseFreq.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">Phases Needing Work</div>
                <div className="space-y-1.5">
                  {phaseFreq.map(p => (
                    <div key={p.name} className="flex justify-between items-center text-[10px]">
                      <span className="text-muted-foreground">{p.name}</span>
                      <span className="text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">{p.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {Object.values(severityDist).some(v => v > 0) && (
              <div>
                <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">Severity Distribution</div>
                <SeverityBar dist={severityDist} />
              </div>
            )}
          </div>

          {/* Next focus */}
          {nextFocusItems.length > 0 && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/15">
              <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Latest Coach Next-Focus Items</div>
              <div className="space-y-1">
                {nextFocusItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}