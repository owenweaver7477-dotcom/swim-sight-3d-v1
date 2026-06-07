/**
 * SwimmerTrends.jsx
 * Enhanced with stroke/squad/date filters, biggest improvement panel, and drag-risk priority.
 */
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useClubContext } from '@/lib/useClubContext';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { format, subDays } from 'date-fns';
import { Loader2, Users, AlertTriangle, Award, AlertCircle, Waves, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { activeCompletedReports } from '@/components/analytics/analyticsHelpers';

const RISK_NUM = { high: 3, medium: 2, low: 1, unknown: 0 };
const RISK_LABEL = { 3: 'High', 2: 'Medium', 1: 'Low', 0: 'Unknown' };
const STROKE_OPTIONS = ['All strokes', 'Freestyle', 'Breaststroke', 'Backstroke', 'Butterfly', 'IM'];

function trendIcon(delta) {
  if (delta == null) return <Minus className="w-3.5 h-3.5 text-slate-400" />;
  if (delta > 0) return <TrendingUp className="w-3.5 h-3.5 text-green-600" />;
  if (delta < 0) return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
  return <Minus className="w-3.5 h-3.5 text-slate-400" />;
}

function delta(arr, key) {
  if (!arr || arr.length < 2) return null;
  return (arr[arr.length - 1][key] ?? 0) - (arr[0][key] ?? 0);
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2.5 text-xs">
      <div className="font-semibold text-slate-700 mb-1.5">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-800">
            {p.dataKey === 'dragRisk'
              ? (RISK_LABEL[Math.round(p.value)] || p.value)
              : p.value != null ? Math.round(p.value) : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Single Swimmer Trend Card ─────────────────────────────────────────────

function SwimmerTrendCard({ swimmer, reports, dragItems, squads }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const squad = squads.find(s => s.id === swimmer.squad_id);

  const chartData = useMemo(() => {
    const swimmerReports = reports
      .filter(r =>
        r.swimmer_id === swimmer.id &&
        r.status === 'published' &&
        !r.is_deleted
      )
      .sort((a, b) => new Date(a.ai_completed_at || a.created_date) - new Date(b.ai_completed_at || b.created_date));

    return swimmerReports.map(r => {
      const coachScore = r.overall_score != null ? r.overall_score : null;
      const aiPoseScore =
        r.analysis_mode === 'real_pose' &&
        r.real_pose_detected === true &&
        r.overall_score != null
          ? r.overall_score
          : null;

      const repDrag = dragItems.filter(d =>
        d.swimmer_id === swimmer.id &&
        d.report_id === r.id &&
        d.approval_status === 'approved'
      );
      const avgDrag = repDrag.length > 0
        ? repDrag.reduce((sum, d) => sum + (RISK_NUM[d.drag_risk_level] ?? 0), 0) / repDrag.length
        : null;

      return {
        date: format(new Date(r.ai_completed_at || r.created_date), 'dd MMM yy'),
        coachScore,
        aiPoseScore,
        dragRisk: avgDrag,
        reportId: r.id,
        stroke: r.stroke_type,
      };
    });
  }, [reports, dragItems, swimmer.id]);

  const coachScorePoints = chartData.filter(d => d.coachScore != null);
  const aiPosePoints = chartData.filter(d => d.aiPoseScore != null);
  const dragPoints = chartData.filter(d => d.dragRisk != null);

  const hasCoachTrend = coachScorePoints.length >= 2;
  const hasAiPoseTrend = aiPosePoints.length >= 2;
  const hasDragTrend = dragPoints.length >= 2;

  const hasCoachScore = coachScorePoints.length > 0;
  const hasAiPoseScore = aiPosePoints.length > 0;
  const hasDrag = dragPoints.length > 0;

  const coachDelta = hasCoachTrend ? delta(coachScorePoints, 'coachScore') : null;
  const aiPoseDelta = hasAiPoseTrend ? delta(aiPosePoints, 'aiPoseScore') : null;
  const dragDelta = hasDragTrend ? delta(dragPoints, 'dragRisk') : null;

  const latestCoachScore = [...coachScorePoints].reverse()[0]?.coachScore ?? null;
  const latestAiPoseScore = [...aiPosePoints].reverse()[0]?.aiPoseScore ?? null;
  const latestDrag = [...dragPoints].reverse()[0]?.dragRisk ?? null;

  const reportCount = chartData.length;
  const strokes = [...new Set(chartData.map(d => d.stroke).filter(Boolean))];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Waves className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-slate-900">{swimmer.name}</div>
          <div className="text-[10px] text-slate-400">
            {squad?.name || 'No squad'} · {reportCount} report{reportCount !== 1 ? 's' : ''}
            {strokes.length > 0 && ` · ${strokes.join(', ')}`}
          </div>
        </div>

        {latestCoachScore != null && (
          <div className="text-center hidden sm:block" title="Coach-reviewed technical score">
            <div className="text-lg font-black text-primary">{Math.round(latestCoachScore)}</div>
            <div className="text-[10px] text-slate-400">Coach Score</div>
          </div>
        )}

        {coachDelta != null && (
          <div className="flex items-center gap-1 hidden sm:flex" title="Change in coach-reviewed score">
            {trendIcon(coachDelta)}
            <span className={`text-xs font-semibold ${coachDelta > 0 ? 'text-green-600' : coachDelta < 0 ? 'text-red-500' : 'text-slate-400'}`}>
              {coachDelta > 0 ? '+' : ''}{Math.round(coachDelta)}
            </span>
          </div>
        )}

        {latestDrag != null && (
          <div className="text-center hidden sm:block">
            <div className={`text-sm font-bold ${latestDrag >= 2.5 ? 'text-red-600' : latestDrag >= 1.5 ? 'text-amber-600' : 'text-green-600'}`}>
              {RISK_LABEL[Math.round(latestDrag)]}
            </div>
            <div className="text-[10px] text-slate-400">Drag Risk</div>
          </div>
        )}

        {!(hasCoachScore || hasAiPoseScore || hasDrag) && (
          <span className="text-[10px] text-slate-400 italic">No data yet</span>
        )}

        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-5">
          {!(hasCoachScore || hasAiPoseScore || hasDrag) ? (
            <div className="py-6 text-center">
              <p className="text-xs text-slate-500 font-medium">No data available</p>
              <p className="text-[10px] text-slate-400 mt-1">Finalised reports will populate these charts.</p>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Coach-reviewed technical score</div>
                  {hasCoachTrend && coachDelta != null && (
                    <div className={`flex items-center gap-1 text-xs font-semibold ${coachDelta > 0 ? 'text-green-600' : coachDelta < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                      {trendIcon(coachDelta)} {coachDelta > 0 ? '+' : ''}{Math.round(coachDelta)}
                    </div>
                  )}
                </div>
                {!hasCoachScore ? (
                  <div className="py-6 text-center rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">No coach-reviewed scores yet</div>
                    <p className="text-[10px] text-slate-400 mt-1">Scores appear after a coach finalises a report.</p>
                  </div>
                ) : !hasCoachTrend ? (
                  <div className="py-6 text-center rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">Not enough trend data</div>
                    <p className="text-[10px] text-slate-400 mt-1">At least 2 reports needed. Currently: {coachScorePoints.length}.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={coachScorePoints} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={70} stroke="#e2e8f0" strokeDasharray="4 4" label={{ value: 'Target', position: 'insideTopRight', fontSize: 9, fill: '#94a3b8' }} />
                      <Line type="monotone" dataKey="coachScore" name="Coach Score" stroke="#0077B6" strokeWidth={2.5} dot={{ r: 4, fill: '#0077B6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">AI pose-assisted score</div>
                  {hasAiPoseTrend && aiPoseDelta != null && (
                    <div className={`flex items-center gap-1 text-xs font-semibold ${aiPoseDelta > 0 ? 'text-green-600' : aiPoseDelta < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                      {trendIcon(aiPoseDelta)} {aiPoseDelta > 0 ? '+' : ''}{Math.round(aiPoseDelta)}
                    </div>
                  )}
                </div>
                {!hasAiPoseScore ? (
                  <div className="py-6 text-center rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">No AI pose scores yet</div>
                    <p className="text-[10px] text-slate-400 mt-1">AI pose scores require reliable pose detection.</p>
                  </div>
                ) : !hasAiPoseTrend ? (
                  <div className="py-6 text-center rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">Not enough reliable pose data</div>
                    <p className="text-[10px] text-slate-400 mt-1">At least 2 reports with confirmed pose detection needed.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={aiPosePoints} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={70} stroke="#e2e8f0" strokeDasharray="4 4" label={{ value: 'Target', position: 'insideTopRight', fontSize: 9, fill: '#94a3b8' }} />
                      <Line type="monotone" dataKey="aiPoseScore" name="AI Pose Score" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 4, fill: '#06b6d4', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Drag risk estimate (coach-reviewed)</div>
                  {hasDragTrend && dragDelta != null && (
                    <div className={`flex items-center gap-1 text-xs font-semibold ${dragDelta < 0 ? 'text-green-600' : dragDelta > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                      {trendIcon(-dragDelta)} {dragDelta < 0 ? 'Improving' : dragDelta > 0 ? 'Worsening' : 'Stable'}
                    </div>
                  )}
                </div>
                {!hasDrag ? (
                  <div className="py-6 text-center rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">No drag risk data yet</div>
                    <p className="text-[10px] text-slate-400 mt-1">Drag risk appears after coach approves resistance overlays.</p>
                  </div>
                ) : !hasDragTrend ? (
                  <div className="py-6 text-center rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">Not enough trend data</div>
                    <p className="text-[10px] text-slate-400 mt-1">At least 2 reports with drag data needed.</p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={dragPoints} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} tickFormatter={v => ['—', 'Low', 'Med', 'High'][v] || ''} tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="dragRisk" name="Drag Risk" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 4, fill: '#F59E0B', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                    <p className="text-[10px] text-slate-400 mt-1">Lower is better. Averaged from coach-approved overlays. Not a measured drag force.</p>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Insight Card: Biggest Improvement ─────────────────────────────────────

function BiggestImprovementCard({ swimmers, reports, squads }) {
  const navigate = useNavigate();

  const improvementData = useMemo(() => {
    const results = [];

    swimmers.forEach(swimmer => {
      const swimmerReports = reports
        .filter(r =>
          r.swimmer_id === swimmer.id &&
          !r.is_deleted &&
          r.overall_score != null
        )
        .sort((a, b) => new Date(a.ai_completed_at || a.created_date) - new Date(b.ai_completed_at || b.created_date));

      if (swimmerReports.length < 2) return;

      const first = swimmerReports[0];
      const last = swimmerReports[swimmerReports.length - 1];
      const improvement = last.overall_score - first.overall_score;

      if (improvement <= 0) return;

      const squad = squads.find(s => s.id === swimmer.squad_id);

      results.push({
        swimmer,
        squadName: squad?.name || 'No squad',
        improvement,
        startScore: first.overall_score,
        endScore: last.overall_score,
        reportCount: swimmerReports.length,
        latestReportDate: new Date(last.ai_completed_at || last.created_date),
        latestReportId: last.id,
      });
    });

    return results.sort((a, b) => b.improvement - a.improvement).slice(0, 1);
  }, [swimmers, reports, squads]);

  const top = improvementData[0];

  if (!top) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center">
        <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <div className="text-sm font-semibold text-slate-700 mb-1">Not enough data yet</div>
        <p className="text-xs text-slate-400">At least 2 coach-reviewed reports are needed to calculate improvement.</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
          <Award className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold uppercase tracking-wider text-green-700 mb-0.5">Biggest Technical Improvement</div>
          <div className="text-lg font-black text-green-900">{top.swimmer.name}</div>
          <div className="text-[10px] text-green-600">{top.squadName}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="text-[10px] text-green-600 mb-1">Starting Score</div>
          <div className="text-lg font-bold text-green-900">{Math.round(top.startScore)}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-green-600 mb-1">Latest Score</div>
          <div className="text-lg font-bold text-green-900">{Math.round(top.endScore)}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-green-600 mb-1">Improvement</div>
          <div className="text-lg font-black text-green-700">+{Math.round(top.improvement)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-green-700 mb-4">
        <span>{top.reportCount} reports · {format(top.latestReportDate, 'dd MMM yyyy')}</span>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs flex-1 border-green-300 text-green-700 hover:bg-green-100"
          onClick={() => navigate(`/swimmers?swimmer_id=${top.swimmer.id}`)}
        >
          View Swimmer
        </Button>
        <Button
          size="sm"
          className="h-8 text-xs flex-1 bg-green-600 hover:bg-green-700 text-white"
          onClick={() => navigate(`/ai-review?report_id=${top.latestReportId}`)}
        >
          Open Latest Report
        </Button>
      </div>
    </div>
  );
}

// ── Insight Card: Highest Drag-Risk Priority ──────────────────────────────

function DragRiskPriorityCard({ swimmers, dragItems, squads }) {
  const navigate = useNavigate();

  const dragPriorityData = useMemo(() => {
    const results = [];

    swimmers.forEach(swimmer => {
      const swimmerDrag = dragItems.filter(d =>
        d.swimmer_id === swimmer.id &&
        d.approval_status === 'approved' &&
        (d.included_in_report !== false)
      );

      if (swimmerDrag.length === 0) return;

      const priorityScores = swimmerDrag.map(d => RISK_NUM[d.drag_risk_level] ?? 0);
      const avgPriority = priorityScores.reduce((a, b) => a + b, 0) / priorityScores.length;
      const maxPriority = Math.max(...priorityScores);

      if (maxPriority < 2) return;

      const zoneCounts = {};
      swimmerDrag.forEach(d => {
        zoneCounts[d.drag_zone] = (zoneCounts[d.drag_zone] || 0) + 1;
      });
      const mostCommonZone = Object.entries(zoneCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

      const sortedDrag = swimmerDrag.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      const latest = sortedDrag[0];

      const squad = squads.find(s => s.id === swimmer.squad_id);

      results.push({
        swimmer,
        squadName: squad?.name || 'No squad',
        avgPriority,
        maxPriority,
        dragCount: swimmerDrag.length,
        mostCommonZone,
        latestDate: new Date(latest.created_date),
        latestReportId: latest.report_id,
      });
    });

    return results.sort((a, b) => b.avgPriority - a.avgPriority).slice(0, 1);
  }, [swimmers, dragItems, squads]);

  const top = dragPriorityData[0];

  if (!top) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center">
        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <div className="text-sm font-semibold text-slate-700 mb-1">No drag-risk observations yet</div>
        <p className="text-xs text-slate-400">Coach-approved drag risk overlays will appear here.</p>
      </div>
    );
  }

  const riskLabel = RISK_LABEL[Math.round(top.maxPriority)] || 'Unknown';
  const riskColor = top.maxPriority >= 3 ? 'text-red-700 bg-red-100 border-red-200' :
                    top.maxPriority >= 2 ? 'text-amber-700 bg-amber-100 border-amber-200' :
                    'text-slate-700 bg-slate-100 border-slate-200';

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-0.5">Highest Drag-Risk Priority</div>
          <div className="text-lg font-black text-amber-900">{top.swimmer.name}</div>
          <div className="text-[10px] text-amber-600">{top.squadName}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="text-[10px] text-amber-600 mb-1">Risk Level</div>
          <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${riskColor}`}>
            {riskLabel}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-amber-600 mb-1">Drag Zone</div>
          <div className="text-sm font-bold text-amber-900 truncate">{top.mostCommonZone}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-amber-600 mb-1">Observations</div>
          <div className="text-lg font-bold text-amber-900">{top.dragCount}</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-amber-700 mb-4">
        <span>Last: {format(top.latestDate, 'dd MMM yyyy')}</span>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs flex-1 border-amber-300 text-amber-700 hover:bg-amber-100"
          onClick={() => navigate(`/swimmers?swimmer_id=${top.swimmer.id}`)}
        >
          View Swimmer
        </Button>
        {top.latestReportId && (
          <Button
            size="sm"
            className="h-8 text-xs flex-1 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => navigate(`/ai-review?report_id=${top.latestReportId}`)}
          >
            Open Latest Report
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function SwimmerTrends() {
  const { club } = useClubContext();

  // Filters
  const [squadFilter, setSquadFilter] = useState('all');
  const [strokeFilter, setStrokeFilter] = useState('All strokes');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [minDataFilter, setMinDataFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });

  const { data: swimmers = [], isLoading: loadingSwimmers } = useQuery({
    queryKey: ['swimmers', club?.id],
    queryFn: () => base44.entities.Swimmer.filter({ club_id: club.id }),
    enabled: !!club?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: squads = [] } = useQuery({
    queryKey: ['squads', club?.id],
    queryFn: () => base44.entities.Squad.filter({ club_id: club.id }),
    enabled: !!club?.id,
    staleTime: 10 * 60 * 1000,
  });

  const { data: reports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['reports-trends', club?.id],
    queryFn: () => base44.entities.Report.filter({ club_id: club.id, is_deleted: false }, '-created_date', 500),
    enabled: !!club?.id,
    staleTime: 2 * 60 * 1000,
  });

  const { data: dragItems = [] } = useQuery({
    queryKey: ['drag-trends', club?.id],
    queryFn: () => base44.entities.DragAnalysis.filter({ club_id: club.id, approval_status: 'approved' }, '-created_date', 500),
    enabled: !!club?.id,
    staleTime: 2 * 60 * 1000,
  });

  const loading = loadingSwimmers || loadingReports;

  // Compute date range cutoff
  const dateCutoff = useMemo(() => {
    if (dateRangeFilter === 'all') return null;
    if (dateRangeFilter === '30d') return subDays(new Date(), 30);
    if (dateRangeFilter === '90d') return subDays(new Date(), 90);
    if (dateRangeFilter === 'season') return subDays(new Date(), 180);
    if (dateRangeFilter === 'custom' && customDateRange.start) return new Date(customDateRange.start);
    return null;
  }, [dateRangeFilter, customDateRange.start]);

  // Filter reports by date and completed status
  const filteredReports = useMemo(() => {
    const completedReports = activeCompletedReports(reports);
    return completedReports.filter(r => {
      if (dateCutoff) {
        const reportDate = new Date(r.ai_completed_at || r.created_date);
        if (reportDate < dateCutoff) return false;
      }
      return true;
    });
  }, [reports, dateCutoff]);

  // Filter swimmers by squad
  const filteredSwimmers = useMemo(() => {
    if (squadFilter === 'all') return swimmers;
    return swimmers.filter(s => s.squad_id === squadFilter);
  }, [swimmers, squadFilter]);

  // Determine which swimmers have data in filtered range
  const swimmerIdsWithReports = new Set(filteredReports.map(r => r.swimmer_id).filter(Boolean));
  
  const activeSwimmers = useMemo(() => {
    let result = filteredSwimmers.filter(s => swimmerIdsWithReports.has(s.id));
    
    if (minDataFilter === 'trend') {
      result = result.filter(s => {
        const swimmerReports = filteredReports.filter(r => r.swimmer_id === s.id && r.overall_score != null);
        return swimmerReports.length >= 2;
      });
    } else if (minDataFilter === 'attention') {
      result = result.filter(s => {
        const swimmerDrag = dragItems.filter(d => d.swimmer_id === s.id && d.approval_status === 'approved' && (RISK_NUM[d.drag_risk_level] ?? 0) >= 2);
        return swimmerDrag.length > 0;
      });
    }
    
    return result;
  }, [filteredSwimmers, filteredReports, dragItems, minDataFilter, swimmerIdsWithReports]);

  const noDataSwimmers = filteredSwimmers.filter(s => !swimmerIdsWithReports.has(s.id));

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <PageHeader
        eyebrow="Analytics"
        title="Swimmer Trends"
        subtitle="Coach-reviewed technical progress, AI pose-assisted score trends, and drag-risk estimates over time."
      />

      <div className="mb-6 p-3 rounded-lg bg-blue-50 border border-blue-200">
        <p className="text-[10px] text-blue-800 leading-relaxed">
          Coach-reviewed scores and AI pose-assisted scores are tracked separately because not every video produces reliable pose data.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 rounded-xl bg-white border border-slate-200 space-y-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Filters</div>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={squadFilter}
            onChange={(e) => setSquadFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Squads</option>
            {squads.map(sq => (
              <option key={sq.id} value={sq.id}>{sq.name}</option>
            ))}
          </select>

          <select
            value={strokeFilter}
            onChange={(e) => setStrokeFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled
            title="Stroke filter coming soon - stroke data is on video uploads"
          >
            {STROKE_OPTIONS.map(stroke => (
              <option key={stroke} value={stroke}>{stroke}</option>
            ))}
          </select>

          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Time</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="season">This Season (6 months)</option>
            <option value="custom">Custom Range</option>
          </select>

          <select
            value={minDataFilter}
            onChange={(e) => setMinDataFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Show All Swimmers</option>
            <option value="trend">Only Swimmers with Trends</option>
            <option value="attention">Only Needs Attention</option>
          </select>
        </div>

        {dateRangeFilter === 'custom' && (
          <div className="flex gap-2 items-center pt-2 border-t border-slate-100">
            <label className="text-[10px] text-slate-500">From:</label>
            <input
              type="date"
              value={customDateRange.start}
              onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="text-xs px-2 py-1 rounded border border-slate-200"
            />
            <label className="text-[10px] text-slate-500">To:</label>
            <input
              type="date"
              value={customDateRange.end}
              onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="text-xs px-2 py-1 rounded border border-slate-200"
            />
          </div>
        )}
      </div>

      {/* Insight cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <BiggestImprovementCard swimmers={filteredSwimmers} reports={filteredReports} squads={squads} />
        <DragRiskPriorityCard swimmers={filteredSwimmers} dragItems={dragItems} squads={squads} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading trends…</span>
        </div>
      ) : filteredSwimmers.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <div className="text-sm font-semibold text-slate-700 mb-1">No swimmers yet</div>
          <p className="text-xs text-slate-400">Add swimmers to your club to start tracking trends.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeSwimmers.length > 0 && (
            <>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {activeSwimmers.length} swimmer{activeSwimmers.length !== 1 ? 's' : ''} in filtered range
              </div>
              {activeSwimmers.map(swimmer => (
                <SwimmerTrendCard
                  key={swimmer.id}
                  swimmer={swimmer}
                  reports={filteredReports}
                  dragItems={dragItems}
                  squads={squads}
                />
              ))}
            </>
          )}

          {minDataFilter === 'all' && noDataSwimmers.length > 0 && (
            <div className="mt-6">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {noDataSwimmers.length} swimmer{noDataSwimmers.length !== 1 ? 's' : ''} — no finalised reports yet
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {noDataSwimmers.map(s => (
                  <div key={s.id} className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-medium truncate">
                    {s.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSwimmers.length === 0 && minDataFilter !== 'all' && (
            <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <div className="text-sm font-semibold text-slate-700 mb-1">No swimmers match filters</div>
              <p className="text-xs text-slate-400">Try adjusting your filters to see more results.</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-700 leading-relaxed">
          <strong>Coaching estimates only.</strong> Coach-reviewed scores reflect a coach's final assessment. AI pose-assisted scores require confirmed pose detection.
          Drag risk values are averaged from coach-approved resistance overlays. None of these values are measured drag forces or race performance predictions.
          Trend lines require at least 2 data points.
        </p>
      </div>
    </div>
  );
}