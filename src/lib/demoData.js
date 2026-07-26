// Example ("demo squad") dataset — FRONT-END ONLY.
//
// A brand-new coach otherwise meets a wall of zeros: no swimmers, no reports, and
// three analytics hubs that all say "finalise a report first" (design audit S2/S6).
// This gives them a believable, populated club to explore in one click.
//
// Hard rules, enforced by demoMode.js and the entities layer:
//   * NOTHING here is ever written to the database — these objects only ever exist
//     in memory and are served in place of a query result.
//   * Every record is scoped to DEMO_CLUB_ID, which is not a real club id, so demo
//     data can never mix into a real club's roster, reports or analytics.
//   * Demo records carry `is_demo: true` so any surface can label them.

export const DEMO_CLUB_ID = 'demo-club';

const day = 24 * 60 * 60 * 1000;
/** Dates are relative to "now" so the demo never looks stale. */
const daysAgo = (n) => new Date(Date.now() - n * day).toISOString();

export const DEMO_CLUB = {
  id: DEMO_CLUB_ID,
  name: 'Coastline Swimming',
  initials: 'CS',
  location: 'Example club',
  head_coach_name: 'Coach Owen',
  primary_color: '#0077B6',
  accent_color: '#00A6C8',
  plan_key: 'coach_studio',
  default_training_focus: 'Technique-first development and race-skill consistency.',
  is_demo: true,
};

export const DEMO_SQUADS = [
  { id: 'demo-squad-gold', club_id: DEMO_CLUB_ID, name: 'Gold', is_demo: true },
  { id: 'demo-squad-silver', club_id: DEMO_CLUB_ID, name: 'Silver', is_demo: true },
];

const swimmer = (id, name, squad, stroke, reviewedDaysAgo) => ({
  id: `demo-swimmer-${id}`,
  club_id: DEMO_CLUB_ID,
  name,
  first_name: name.split(' ')[0],
  last_name: name.split(' ').slice(1).join(' '),
  squad_id: squad === 'Gold' ? 'demo-squad-gold' : 'demo-squad-silver',
  squad_name: squad,
  primary_stroke: stroke,
  last_reviewed_at: reviewedDaysAgo == null ? null : daysAgo(reviewedDaysAgo),
  created_date: daysAgo(90),
  created_at: daysAgo(90),
  is_demo: true,
});

export const DEMO_SWIMMERS = [
  swimmer('maya', 'Maya Reynolds', 'Gold', 'Breaststroke', 2),
  swimmer('jai', 'Jai Patel', 'Gold', 'Freestyle', 5),
  swimmer('ava', 'Ava Lombardi', 'Silver', 'Butterfly', 9),
  swimmer('noah', 'Noah Chen', 'Gold', 'IM', 12),
  swimmer('isla', 'Isla Murphy', 'Silver', 'Backstroke', 16),
  swimmer('liam', "Liam O'Brien", 'Gold', 'Freestyle', 21),
  swimmer('sophie', 'Sophie Nguyen', 'Silver', 'Breaststroke', 28),
  swimmer('ethan', 'Ethan Walker', 'Gold', 'Butterfly', 34),
  swimmer('chloe', 'Chloe Adams', 'Silver', 'Freestyle', null),
  swimmer('marcus', 'Marcus Silva', 'Gold', 'IM', null),
];

// ── Two finalised reports, using the full coaching content model ──────────────
export const DEMO_REPORTS = [
  {
    id: 'demo-report-maya', club_id: DEMO_CLUB_ID, swimmer_id: 'demo-swimmer-maya',
    title: 'Breaststroke · Kick setup', status: 'shared', source: 'coach',
    stroke_type: 'Breaststroke', analysis_type: 'Technique Review', analysis_mode: 'manual_review',
    overall_score: 78, is_deleted: false,
    coach_summary: 'Strong front-end rhythm. The kick setup is where the next second is hiding.',
    next_focus: 'Hold the line for three seconds after every kick drill.',
    finalised_at: daysAgo(2), created_date: daysAgo(3), updated_date: daysAgo(2),
    created_at: daysAgo(3), updated_at: daysAgo(2), is_demo: true,
  },
  {
    id: 'demo-report-jai', club_id: DEMO_CLUB_ID, swimmer_id: 'demo-swimmer-jai',
    title: 'Freestyle · Catch', status: 'finalised', source: 'coach',
    stroke_type: 'Freestyle', analysis_type: 'Technique Review', analysis_mode: 'manual_review',
    overall_score: 82, is_deleted: false,
    coach_summary: 'Good rotation. Getting the elbow up earlier will add free speed.',
    next_focus: 'Front scull before every main set this week.',
    finalised_at: daysAgo(5), created_date: daysAgo(6), updated_date: daysAgo(5),
    created_at: daysAgo(6), updated_at: daysAgo(5), is_demo: true,
  },
];

const finding = (id, reportId, o) => ({
  id: `demo-finding-${id}`,
  report_id: reportId,
  club_id: DEMO_CLUB_ID,
  approval_status: 'approved',
  included_in_report: true,
  source: 'coach',
  severity: o.severity || 'medium',
  phase: o.phase,
  stroke_phase: o.phase,
  timestamp_start: o.at,
  timestamp_seconds: o.at,
  finding_name: o.title,
  observation: o.saw,
  coach_sees: o.saw,
  why_it_matters: o.matters,
  cue: o.feel,
  correction_cue: o.feel,
  drill: o.drill,
  linked_drill_title: o.drill,
  next_focus: o.next,
  created_date: o.created,
  created_at: o.created,
  is_demo: true,
});

export const DEMO_FINDINGS = [
  finding('maya-1', 'demo-report-maya', {
    phase: 'Kick setup', at: 3.42, severity: 'medium', created: daysAgo(3),
    title: 'Knees widen during heel recovery',
    saw: 'During the kick setup the knees move wider than the hips before the feet turn out.',
    matters: 'A wide recovery increases resistance and makes it harder to finish the kick backwards into a clean line.',
    feel: 'Bring the heels up first while keeping the knees inside the hips.',
    drill: 'Wall breaststroke kick with narrow knees',
    next: 'Keep the recovery compact before turning the feet.',
  }),
  finding('maya-2', 'demo-report-maya', {
    phase: 'Line reset', at: 5.25, severity: 'low', created: daysAgo(3),
    title: 'Line reset needs a stronger finish',
    saw: 'After the kick the body line does not fully lock into a long streamlined position.',
    matters: 'A weak line reset lets speed leak away in the moment right after the kick.',
    feel: 'Finish the kick back and snap into a long, quiet line.',
    drill: 'Breaststroke kick into 3-second line hold',
    next: 'Hold the line after every kick before starting the next stroke.',
  }),
  finding('jai-1', 'demo-report-jai', {
    phase: 'Catch', at: 1.10, severity: 'medium', created: daysAgo(6),
    title: 'Elbow drops at the front of the catch',
    saw: 'The elbow drops below the wrist as the hand starts to press back.',
    matters: 'A dropped elbow reduces the surface pressing water backwards, so the pull loses power.',
    feel: 'Keep the elbow high and press with the whole forearm.',
    drill: 'Front scull',
    next: 'Front scull before every main set.',
  }),
];

/** Every demo record, keyed by the entity name used in the data layer. */
export const DEMO_TABLES = {
  Club: [DEMO_CLUB],
  Squad: DEMO_SQUADS,
  Swimmer: DEMO_SWIMMERS,
  Report: DEMO_REPORTS,
  Finding: DEMO_FINDINGS,
  VideoUpload: [],
  VideoAnnotation: [],
  KeyFrame: [],
  AIProcessingJob: [],
  SharedReportLink: [],
  NotificationLog: [],
};
