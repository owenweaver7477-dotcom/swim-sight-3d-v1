/**
 * Shared helpers for V1 progress analytics.
 * All public helpers intentionally use finalised/coach-approved reports and
 * approved findings only. Pending AI output is excluded from progress metrics.
 */

export const COMPLETED_STATUSES = ['published', 'coach_approved', 'finalised', 'shared'];
export const PENDING_STATUSES = ['draft', 'in_review', 'queued_ai', 'processing_ai', 'manual_review', 'error'];

export function reportDate(report) {
  return report?.finalised_at || report?.ai_completed_at || report?.updated_date || report?.updated_at || report?.created_date || report?.created_at;
}

export function parseDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export function formatShortDate(value) {
  const date = parseDate(value);
  return date ? date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' }) : 'No date';
}

export function swimmerName(swimmer) {
  if (!swimmer) return 'Unknown swimmer';
  return swimmer.name || [swimmer.first_name, swimmer.last_name].filter(Boolean).join(' ') || 'Unnamed swimmer';
}

export function reportStroke(report) {
  return report?.stroke_type || report?.stroke || report?.title?.split(' ')[0] || 'Unspecified';
}

export function reportMode(report) {
  if (report?.analysis_mode === 'real_pose' && report?.real_pose_detected === true) return 'AI-assisted';
  if (report?.real_pose_detected === false || report?.analysis_mode === 'manual_review') return 'Manual review';
  if (report?.source === 'ai') return 'AI-assisted';
  return 'Coach review';
}

export function reportSourceLabel(report) {
  if (report?.analysis_mode === 'real_pose' && report?.real_pose_detected === true) return 'AI-assisted coach report';
  if (report?.real_pose_detected === false || report?.analysis_mode === 'manual_review') return 'Manual coach report';
  if (report?.source === 'ai') return 'AI-assisted coach report';
  return 'Coach report';
}

export function activeCompletedReports(reports = []) {
  return reports.filter(report =>
    !report.is_deleted &&
    COMPLETED_STATUSES.includes(report.status)
  );
}

export function approvedFindings(findings = [], activeReportIds = []) {
  const idSet = new Set(activeReportIds);
  return findings.filter(finding =>
    !finding.is_deleted &&
    finding.approval_status === 'approved' &&
    finding.included_in_report !== false &&
    idSet.has(finding.report_id)
  );
}

export function findingLabel(finding) {
  return finding.finding_name || finding.observation || finding.linked_standard_title || finding.next_focus || 'Coach finding';
}

export function findingPhase(finding) {
  return finding.phase || finding.stroke_phase || 'Unspecified';
}

export function buildFrequency(items, getLabel, limit = 8) {
  const counts = new Map();
  items.forEach(item => {
    const raw = getLabel(item);
    const label = raw && String(raw).trim();
    if (!label) return;
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

export function buildFaultFrequency(findings = [], limit = 8) {
  return buildFrequency(findings, findingLabel, limit);
}

export function buildPhaseFrequency(findings = [], limit = 6) {
  return buildFrequency(findings, findingPhase, limit);
}

export function buildSeverityDistribution(findings = []) {
  const dist = { low: 0, medium: 0, high: 0, critical: 0 };
  findings.forEach(finding => {
    const severity = finding.severity || 'low';
    if (dist[severity] !== undefined) dist[severity] += 1;
  });
  return dist;
}

export function latestNextFocusItems(findings = [], limit = 5) {
  const seen = new Set();
  const items = [];
  findings.forEach(finding => {
    const focus = finding.next_focus || finding.correction_cue || finding.drill;
    if (!focus || seen.has(focus)) return;
    seen.add(focus);
    items.push(focus);
  });
  return items.slice(0, limit);
}

export function reportsBySwimmer(reports = []) {
  return reports.reduce((map, report) => {
    if (!report.swimmer_id) return map;
    if (!map[report.swimmer_id]) map[report.swimmer_id] = [];
    map[report.swimmer_id].push(report);
    return map;
  }, {});
}

export function scoreTrendForSwimmer(reports = [], minReports = 3) {
  const scored = reports
    .filter(report => report.overall_score !== null && report.overall_score !== undefined)
    .sort((a, b) => (parseDate(reportDate(a))?.getTime() || 0) - (parseDate(reportDate(b))?.getTime() || 0));

  if (scored.length < minReports) {
    return { hasTrend: false, count: scored.length, points: scored };
  }

  const first = scored[0];
  const latest = scored[scored.length - 1];
  return {
    hasTrend: true,
    count: scored.length,
    points: scored,
    firstScore: Number(first.overall_score),
    latestScore: Number(latest.overall_score),
    delta: Number(latest.overall_score) - Number(first.overall_score),
    latestReportId: latest.id,
  };
}

export function buildScoreSeries(reports = []) {
  return reports
    .filter(report => report.overall_score !== null && report.overall_score !== undefined)
    .sort((a, b) => (parseDate(reportDate(a))?.getTime() || 0) - (parseDate(reportDate(b))?.getTime() || 0))
    .map(report => ({
      date: reportDate(report),
      label: formatShortDate(reportDate(report)),
      score: Number(report.overall_score),
      reportId: report.id,
      stroke: reportStroke(report),
    }));
}
