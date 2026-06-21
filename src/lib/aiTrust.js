export function normaliseConfidence(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(1, numeric > 1 ? numeric / 100 : numeric));
}

export function confidenceLabel(value) {
  const score = normaliseConfidence(value);
  if (score == null) return 'Unknown';
  if (score >= 0.8) return 'High';
  if (score >= 0.65) return 'Medium';
  return 'Low';
}

export function getFindingReviewState(finding = {}) {
  if (finding.approval_status === 'rejected') return 'rejected';

  const raw = finding.raw_ai_payload || {};
  const comparisons = [
    [finding.finding_name || finding.observation, finding.original_finding_name || raw.finding_title || raw.finding_name],
    [finding.cue || finding.correction_cue, finding.original_cue || raw.recommended_correction || raw.correction_cue || raw.cue],
    [finding.severity, finding.original_severity || raw.severity],
    [finding.phase || finding.stroke_phase, finding.original_phase || raw.phase || raw.stroke_phase],
    [finding.drill || finding.linked_drill_title, finding.original_drill || raw.drill || raw.recommended_drill],
    [finding.next_focus, finding.original_next_focus || raw.next_focus],
  ];
  const edited = comparisons.some(([current, original]) => {
    return original != null && current != null && String(current).trim() !== String(original).trim();
  });

  if (edited || finding.approval_status === 'edited') return 'edited';
  if (finding.approval_status === 'approved') return 'approved';
  return 'draft';
}

export function isAIFinding(finding = {}) {
  return String(finding.source || '').toLowerCase().startsWith('ai');
}
