function words(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function textBlob(values) {
  return values
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function drillSummary(drill) {
  if (!drill) return '';
  const cue = drill.coaching_cue || drill.coaching_cues || '';
  if (drill.report_summary) return drill.report_summary;
  if (drill.purpose && cue) return `${drill.purpose} Cue: ${String(cue).split('|')[0].trim()}`;
  return drill.purpose || cue || '';
}

function includesAny(text, terms = []) {
  return terms.some(term => text.includes(term));
}

function ruleBoost({ findingText, drillText, stroke, drill }) {
  const drillStroke = String(drill.stroke || '').toLowerCase();
  const isStroke = !stroke || drillStroke === stroke || drillStroke === 'general';
  if (!isStroke) return 0;

  let score = 0;
  const rules = [
    {
      finding: ['wide knee', 'wide knees', 'knee width', 'knees outside', 'knees too wide'],
      drill: ['narrow', 'knee', 'pull buoy', 'on back'],
      score: 9,
    },
    {
      finding: ['early foot turn', 'foot turn', 'low heel', 'heel recovery', 'heels up'],
      drill: ['heel', '2-count', 'two count', 'turn late', 'foot'],
      score: 9,
    },
    {
      finding: ['kick pressing down', 'pressing down', 'circular kick', 'weak snap', 'kick finish'],
      drill: ['snap', 'drive back', 'line hold', 'back breaststroke'],
      score: 7,
    },
    {
      finding: ['weak line reset', 'line reset', 'rushed glide', 'glide timing', 'timing break'],
      drill: ['line hold', 'glide timing', 'kick-glide', 'two kicks', 'line reset'],
      score: 9,
    },
    {
      finding: ['slow hands', 'hand recovery', 'hands stuck', 'shoot forward'],
      drill: ['shoot', 'fast hand', 'hand recovery', 'small pull'],
      score: 8,
    },
    {
      finding: ['poor breath timing', 'high breath', 'head lift', 'late breath'],
      drill: ['low breath', 'breath', 'one-goggle', 'side-kick'],
      score: 7,
    },
    {
      finding: ['dropped elbow', 'weak catch', 'catch setup', 'slipping water', 'forearm'],
      drill: ['scull', 'catch pressure', 'evf', 'fist', 'forearm', 'single arm catch'],
      score: 9,
    },
    {
      finding: ['crossover', 'crossing midline', 'short extension', 'entry line'],
      drill: ['catch-up', 'controlled rotation', 'body line to catch', 'entry'],
      score: 8,
    },
    {
      finding: ['head lifting on breath', 'head lift', 'legs dropping', 'lead arm dropping'],
      drill: ['side-kick breathing', 'one-goggle', 'breath reset', 'low-breath'],
      score: 9,
    },
    {
      finding: ['flat rotation', 'over rotation', 'over-rotation', 'under rotation', 'under-rotation'],
      drill: ['6-kick', 'side kick switch', 'rotation', '6-1-6'],
      score: 8,
    },
    {
      finding: ['hips dropping', 'dropped hips', 'low hips', 'body line'],
      drill: ['hip', 'body line', 'streamline', 'kick line'],
      score: 7,
    },
    {
      finding: ['moving head', 'head moving', 'head stability'],
      drill: ['cup', 'balance', 'still head', 'streamline back'],
      score: 8,
    },
    {
      finding: ['shallow catch', 'straight-arm pull', 'backstroke catch'],
      drill: ['backstroke catch scull', 'catch scull', 'single-arm backstroke'],
      score: 9,
    },
    {
      finding: ['late second kick', 'weak second kick', 'kick timing'],
      drill: ['kick-pull-kick', 'single-arm butterfly', '3-3-3'],
      score: 9,
    },
    {
      finding: ['flat body wave', 'body wave', 'weak dolphin', 'low hips'],
      drill: ['body dolphin', 'kick on side', 'side dolphin', 'body wave'],
      score: 8,
    },
    {
      finding: ['low recovery', 'wide recovery', 'rushed rhythm', 'butterfly rhythm'],
      drill: ['3-3-3', 'single-arm butterfly', 'rhythm'],
      score: 7,
    },
    // New backstroke/butterfly drills. Finding terms below are real faults the
    // system already produces (backstroke catch/rotation/body-line; butterfly
    // rhythm/second-kick/breath). No starts/turns/underwater matching is added
    // because the worker does not detect those.
    {
      finding: ['backstroke catch', 'dropped elbow', 'shallow catch', 'straight-arm', 'short extension', 'flat shoulders', 'late rotation'],
      drill: ['catch scull setup', 'catch scull', 'hip-rotation connect', 'single-arm backstroke', 'backstroke catch', 'rotation'],
      score: 8,
    },
    {
      finding: ['butterfly rhythm', 'body wave', 'late second kick', 'weak second kick', 'second kick', 'high breath', 'head lift', 'dropped hips'],
      drill: ['two-kick connect', 'pull keyhole', 'press back to the hips', 'relaxed recovery', 'single-arm butterfly', 'kick-pull-kick'],
      score: 8,
    },
  ];

  rules.forEach(rule => {
    if (includesAny(findingText, rule.finding) && includesAny(drillText, rule.drill)) {
      score += rule.score;
    }
  });

  return score;
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
    finding.fault_tag,
    finding.fault_tags,
    finding.severity,
  ]);
  const drillText = textBlob([
    drill.title,
    drill.stroke,
    drill.phase,
    drill.fault_tags,
    drill.purpose,
    drill.coaching_cue,
    drill.coaching_cues,
    drill.report_summary,
    drill.instructions,
    drill.common_mistakes,
  ]);

  let score = 0;
  const stroke = strokeType || finding.stroke_type || finding.stroke || '';
  const normalizedStroke = String(stroke || '').toLowerCase();
  if (stroke && drill.stroke && drill.stroke.toLowerCase() === normalizedStroke) score += 7;
  if (drill.stroke === 'General') score += 2;
  if (normalizedStroke && drill.stroke && drill.stroke !== 'General' && drill.stroke.toLowerCase() !== normalizedStroke) score -= 4;

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
  score += ruleBoost({ findingText, drillText, stroke: normalizedStroke, drill });

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

// Search + rank drills for the coach drill picker. Free-text query filters across
// title/stroke/phase/fault/summary/cue; the surviving pool is then ranked by the same
// stroke + phase + note relevance used for suggestions. If the query matches nothing,
// fall back to the full ranked pool so the coach always has options (weak-match fallback).
export function searchAndRankDrills(drills, { query = '', finding = {}, strokeType = '', limit = 30 } = {}) {
  const pool = Array.isArray(drills) ? drills : [];
  const q = String(query || '').trim().toLowerCase();
  let filtered = pool;
  if (q) {
    filtered = pool.filter((drill) => textBlob([
      drill.title,
      drill.stroke,
      drill.phase,
      drill.fault_tags,
      drill.report_summary,
      drill.purpose,
      drill.coaching_cue,
      drill.coaching_cues,
      drill.instructions,
    ]).includes(q));
    if (!filtered.length) filtered = pool;
  }
  return filtered
    .map((drill) => ({ drill, score: scoreDrillForFinding(drill, finding, strokeType) }))
    .sort((a, b) => b.score - a.score || String(a.drill.title).localeCompare(String(b.drill.title)))
    .slice(0, limit)
    .map(({ drill }) => drill);
}
