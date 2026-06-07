/**
 * Shared helpers for swimmer/club progress analytics.
 * IMPORTANT: All functions filter ONLY coach-approved/finalised reports and approved findings.
 */

// Statuses that count as "coach-approved / finalised"
export const COMPLETED_STATUSES = ['published', 'coach_approved', 'finalised', 'shared'];

// Statuses that count as "pending / not yet reviewed"
export const PENDING_STATUSES = ['awaiting_review', 'ai_complete', 'pending_ai', 'draft'];

/**
 * Filter reports to only active, coach-finalised ones.
 */
export function activeCompletedReports(reports) {
  return reports.filter(r =>
    !r.is_deleted &&
    COMPLETED_STATUSES.includes(r.status)
  );
}

/**
 * Filter findings to only approved, included, non-deleted ones
 * whose parent report is also active+completed.
 */
export function approvedFindings(findings, activeReportIds) {
  const idSet = new Set(activeReportIds);
  return findings.filter(f =>
    !f.is_deleted &&
    f.approval_status === 'approved' &&
    f.included_in_report !== false &&
    idSet.has(f.report_id)
  );
}

/**
 * Is a report a placeholder that was coach-finalised?
 * Returns appropriate label for display.
 */
export function reportSourceLabel(report) {
  if (report.analysis_mode === 'placeholder') return 'Coach-reviewed report';
  if (report.source === 'ai') return 'AI-assisted coach report';
  return 'Coach report';
}

/**
 * Build a score-over-time series for a swimmer from their completed reports.
 * Returns [{ date, score, label }] sorted ascending.
 */
export function buildScoreSeries(completedReports) {
  return completedReports
    .filter(r => r.overall_score != null)
    .map(r => ({
      date: r.ai_completed_at || r.updated_date || r.created_date,
      score: r.overall_score,
      label: new Date(r.ai_completed_at || r.updated_date || r.created_date)
        .toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * Tally fault frequency from approved findings.
 * Returns [{ name, count }] sorted by count descending.
 */
export function buildFaultFrequency(approvedFindingsList, limit = 8) {
  const map = {};
  approvedFindingsList.forEach(f => {
    if (f.finding_name) map[f.finding_name] = (map[f.finding_name] || 0) + 1;
  });
  return Object.entries(map)
    .sort(([,a],[,b]) => b - a)
    .slice(0, limit)
    .map(([name, count]) => ({ name: name.length > 24 ? name.slice(0, 24) + '…' : name, count }));
}

/**
 * Tally phase frequency from approved findings.
 * Returns [{ name, count }] sorted by count descending.
 */
export function buildPhaseFrequency(approvedFindingsList, limit = 6) {
  const map = {};
  approvedFindingsList.forEach(f => {
    if (f.phase) map[f.phase] = (map[f.phase] || 0) + 1;
  });
  return Object.entries(map)
    .sort(([,a],[,b]) => b - a)
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

/**
 * Severity distribution from approved findings.
 * Returns { low, medium, high, critical } counts.
 */
export function buildSeverityDistribution(approvedFindingsList) {
  const dist = { low: 0, medium: 0, high: 0, critical: 0 };
  approvedFindingsList.forEach(f => {
    if (f.severity && dist[f.severity] !== undefined) dist[f.severity]++;
  });
  return dist;
}

/**
 * Collect unique next-focus items from approved findings (most recent first).
 */
export function latestNextFocusItems(approvedFindingsList, limit = 5) {
  return approvedFindingsList
    .filter(f => f.next_focus)
    .slice(0, limit)
    .map(f => f.next_focus);
}