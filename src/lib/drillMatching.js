function words(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function textBlob(values) {
  return values.filter(Boolean).join(' ').toLowerCase();
}

export function drillSummary(drill) {
  if (!drill) return '';
  return drill.purpose || drill.coaching_cue || drill.coaching_cues || '';
}

export function scoreDrillForFinding(drill, finding, strokeType) {
  if (!drill || !finding) return 0;
  const findingText = textBlob([
    finding.finding_name,
    finding.observation,
    finding.coach_sees,
    finding.why_it_matters,
    finding.correction_cue,
    finding.cue,
    finding.next_focus,
    finding.stroke_phase,
    finding.phase,
  ]);
  const drillText = textBlob([
    drill.title,
    drill.stroke,
    drill.phase,
    drill.fault_tags,
    drill.purpose,
    drill.coaching_cue,
    drill.coaching_cues,
  ]);

  let score = 0;
  const stroke = strokeType || finding.stroke_type || finding.stroke || '';
  if (stroke && drill.stroke && drill.stroke.toLowerCase() === stroke.toLowerCase()) score += 5;
  if (drill.stroke === 'General') score += 2;

  const phase = finding.stroke_phase || finding.phase || '';
  if (phase && drill.phase && drill.phase.toLowerCase() === phase.toLowerCase()) score += 4;
  if (phase && drillText.includes(phase.toLowerCase())) score += 2;

  const tokens = new Set(words(findingText).filter(token => token.length > 3));
  tokens.forEach(token => {
    if (drillText.includes(token)) score += 1;
  });

  if (findingText.includes('breath') && drillText.includes('breath')) score += 2;
  if (findingText.includes('kick') && drillText.includes('kick')) score += 2;
  if ((findingText.includes('body line') || findingText.includes('hip')) && drillText.includes('body line')) score += 2;
  if ((findingText.includes('catch') || findingText.includes('pull')) && (drillText.includes('catch') || drillText.includes('pull'))) score += 2;

  return score;
}

export function suggestDrillsForFinding(drills, finding, strokeType, limit = 4) {
  return (drills || [])
    .map((drill) => ({ drill, score: scoreDrillForFinding(drill, finding, strokeType) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || String(a.drill.title).localeCompare(String(b.drill.title)))
    .slice(0, limit)
    .map(({ drill }) => drill);
}
