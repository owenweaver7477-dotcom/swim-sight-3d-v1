// Starting skeletons for the finding composer, by stroke and common fault.
//
// A template fills the shape of a finding, not its content — the coach still has to say
// what THIS swimmer did. Every field is phrased so that leaving it untouched would read
// as obviously unfinished, which is deliberate: a template that reads as publishable
// invites a coach to ship boilerplate to a parent, and coach-authored findings are
// approved by authorship the moment they are created.

export const FINDING_TEMPLATES = [
  {
    id: 'fr-catch',
    stroke: 'Freestyle',
    label: 'Catch',
    phase: 'catch',
    title: 'Elbow drops at the front of the catch',
    observation: 'At the front of the stroke the elbow drops below the hand, so the pull starts with the arm rather than the forearm.',
    why_it_matters: 'Loses hold of the water at the strongest part of the stroke.',
    cue: 'Lead with the elbow, not the hand',
    next_focus: 'Catch position on the next set',
  },
  {
    id: 'fr-breath',
    stroke: 'Freestyle',
    label: 'Breathing',
    phase: 'breathing',
    title: 'Head lifts before the breath',
    observation: 'The head lifts before it rotates, so the breath takes longer than one stroke.',
    why_it_matters: 'Breaks the body line and drops the hips, costing speed through the breath.',
    cue: 'Rotate to breathe, one goggle in the water',
    next_focus: 'Breathing rhythm every 3',
  },
  {
    id: 'br-kick',
    stroke: 'Breaststroke',
    label: 'Kick setup',
    phase: 'kick',
    title: 'Knees widen during heel recovery',
    observation: 'On recovery the knees draw wider than the hips before the heels come to the seat.',
    why_it_matters: 'Adds frontal drag and stalls the kick before it starts.',
    cue: 'Heels to the seat, knees inside the hips',
    next_focus: 'Narrow kick on 25s',
  },
  {
    id: 'bk-hips',
    stroke: 'Backstroke',
    label: 'Body position',
    phase: 'body_position',
    title: 'Hips sit low through the stroke',
    observation: 'The hips ride below the surface, so the swimmer is pushing water rather than travelling over it.',
    why_it_matters: 'Increases drag and makes every stroke work harder for the same distance.',
    cue: 'Press the chest, lift the hips',
    next_focus: 'Body line on kick sets',
  },
  {
    id: 'fly-timing',
    stroke: 'Butterfly',
    label: 'Timing',
    phase: 'timing',
    title: 'Second kick arrives late',
    observation: 'The second kick lands after the hands have entered, so the stroke loses its rhythm.',
    why_it_matters: 'The kick stops driving the hands forward and the stroke becomes flat.',
    cue: 'Kick the hands in',
    next_focus: 'Two-kick timing on short reps',
  },
  {
    id: 'uw-pushoff',
    stroke: 'Underwater',
    label: 'Push-off',
    phase: 'push_off',
    title: 'Push-off is shallow off the wall',
    observation: 'The push-off breaks towards the surface early instead of holding depth through the streamline.',
    why_it_matters: 'Gives up the fastest part of every length.',
    cue: 'Hold the streamline two more counts',
    next_focus: 'Streamline off every wall',
  },
];

/** Templates for a stroke, plus every template when the stroke is unknown. */
export function templatesForStroke(stroke) {
  const s = String(stroke || '').trim().toLowerCase();
  if (!s) return FINDING_TEMPLATES;
  const matching = FINDING_TEMPLATES.filter((t) => t.stroke.toLowerCase() === s);
  // Underwaters apply to every stroke, so they stay on offer regardless.
  const universal = FINDING_TEMPLATES.filter((t) => t.stroke === 'Underwater' && !matching.includes(t));
  return matching.length ? [...matching, ...universal] : FINDING_TEMPLATES;
}

/** The composer fields a template or a duplicated finding provides. */
export function templateToFields(template) {
  if (!template) return null;
  return {
    title: template.title || '',
    observation: template.observation || '',
    why: template.why_it_matters || '',
    cue: template.cue || '',
    nextFocus: template.next_focus || '',
    phase: template.phase || '',
  };
}

/**
 * Fields copied from an existing finding, for "duplicate last".
 *
 * The timestamp and the evidence/frame link are deliberately NOT copied: a duplicate is a
 * starting point for a DIFFERENT moment, and inheriting the original's frame would attach
 * the wrong screenshot to the new finding — a mismatch that surfaces first in the parent's
 * report.
 *
 * The recommended drill IS copied. It is one of the five content fields, not a
 * moment-anchor: a drill attachment is a reference to a library drill
 * (linked_drill_id/title/summary) and carries no per-swimmer or per-report state. The
 * commonest reason to duplicate is "same fault, different rep or swimmer", where the coach
 * wants the same drill — dropping it would force a re-pick in the exact case duplicate
 * exists for.
 */
export function findingToFields(finding) {
  if (!finding) return null;
  const drillTitle = finding.linked_drill_title || finding.drill || '';
  return {
    title: finding.title || '',
    observation: finding.observation || finding.coach_sees || '',
    why: finding.why_it_matters || '',
    cue: finding.correction_cue || finding.cue || '',
    nextFocus: finding.next_focus || '',
    phase: finding.stroke_phase || finding.phase || '',
    drills: drillTitle
      ? [{
        id: finding.linked_drill_id || null,
        title: drillTitle,
        summary: finding.linked_drill_summary || null,
        cue: null,
        // No library id means the coach wrote this drill by hand on the original.
        custom: !finding.linked_drill_id,
      }]
      : [],
  };
}
