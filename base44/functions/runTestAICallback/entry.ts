import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Dev-only helper: runs the full AI ingestion flow with stroke-specific fake data.
// All findings are labelled source: 'ai', approval_status: 'pending'.

const STROKE_DATA = {
  Freestyle: {
    overall_score: 81,
    technical_summary: '[TEST DATA — Pending Coach Review] AI pattern analysis detected three technique areas for coach review on this freestyle session. Early vertical forearm position, breathing timing, and body-line tension were flagged. All findings are AI-suggested and must be verified by a coach before use.',
    phase_breakdown: { body_line: 82, catch: 74, pull: 85, breathing: 71, kick_timing: 78 },
    key_frames: [
      { timestamp: 6.2,  label: 'Elbow drops at catch entry',  description: 'Elbow drops early before forearm rotates into vertical catch position.' },
      { timestamp: 12.4, label: 'Late breath — head lifts',    description: 'Head rises above body line as breath starts late in the rotation cycle.' },
      { timestamp: 18.6, label: 'Hips drop through body line', description: 'Hips sink slightly during breathing recovery, increasing drag.' },
    ],
    findings: [
      {
        severity: 'High',
        stroke_phase: 'Catch',
        finding_title: 'Dropped elbow during catch',
        finding_description: 'The elbow appears to drop early as the swimmer begins the catch, reducing the vertical forearm position.',
        why_it_matters: 'A dropped elbow reduces the ability to hold water and shortens the effective pull path, costing propulsion per stroke.',
        coach_should_check: 'Confirm whether the hand slips downward before the forearm rotates into a strong catch position.',
        recommended_correction: 'Fingertips down, elbow high, press water back, and hold the forearm earlier in the catch.',
        recommended_drill: 'Scull to high-elbow catch / single-arm freestyle with pause at catch.',
        next_focus: 'Establish a stronger early vertical forearm before increasing stroke rate.',
        timestamp_start: 6.2,
        timestamp_end: 8.1,
        confidence_score: 0.88,
      },
      {
        severity: 'Medium',
        stroke_phase: 'Breathing',
        finding_title: 'Late breathing timing',
        finding_description: 'The breath appears to start late, causing the head to lift and slightly interrupt the body line.',
        why_it_matters: 'Late breathing creates drag, disrupts body rotation, and delays the recovering arm entering the water.',
        coach_should_check: 'Confirm whether the swimmer turns the head after the body has already rotated past the breathing window.',
        recommended_correction: 'One goggle in, rotate to breathe earlier, and return the head before the recovering hand enters.',
        recommended_drill: '6-kick switch breathing / single-arm freestyle breathing timing drill.',
        next_focus: 'Keep the breath low and connected to body rotation, not separate from it.',
        timestamp_start: 12.4,
        timestamp_end: 14.0,
        confidence_score: 0.84,
      },
      {
        severity: 'Medium',
        stroke_phase: 'Body Line',
        finding_title: 'Hips dropping through body line',
        finding_description: 'The hips appear to sit slightly low during parts of the stroke cycle, particularly around breathing.',
        why_it_matters: 'Low hips increase frontal drag and force the kick to work harder without improving propulsion.',
        coach_should_check: 'Confirm whether the swimmer is lifting the head or losing trunk tension during breathing or arm recovery.',
        recommended_correction: 'Eyes down, ribs tight, light kick pressure, long posture through the crown of the head.',
        recommended_drill: 'Freestyle body-line kick / side-kick body position drill.',
        next_focus: 'Maintain a flatter, longer body line during breathing and recovery phases.',
        timestamp_start: 18.6,
        timestamp_end: 20.4,
        confidence_score: 0.81,
      },
    ],
  },

  Breaststroke: {
    overall_score: 84,
    technical_summary: '[TEST DATA — Pending Coach Review] AI pattern analysis flagged five breaststroke technique areas. Knee recovery width, foot-turn timing, kick timing, glide body line, and hand recovery were identified. All findings are AI-suggested and must be verified by a coach before use.',
    phase_breakdown: { body_line: 86, catch: 80, kick_recovery: 72, kick_drive: 83, timing: 79, glide: 77 },
    key_frames: [
      { timestamp: 7.4,  label: 'Knees wide on recovery',   description: 'Knees separate beyond hip width during breaststroke kick recovery.' },
      { timestamp: 13.1, label: 'Kick timing late',          description: 'Kick completes after upper body has begun settling into glide.' },
      { timestamp: 19.8, label: 'Hands recovering too slow', description: 'Hand recovery under the chin is slow, shortening the glide window.' },
    ],
    findings: [
      {
        severity: 'High',
        stroke_phase: 'Kick Recovery',
        finding_title: 'Knees recovering too wide',
        finding_description: "The swimmer's knees separate beyond hip width during the recovery phase, increasing drag before the propulsive kick.",
        why_it_matters: 'Wide knees create significant frontal drag during recovery and reduce the leverage available for the kick drive.',
        coach_should_check: 'Confirm knee width relative to hip width and whether the feet are turning out too early.',
        recommended_correction: 'Cue heels up, narrow knees, late foot turn, then straight-back piston drive.',
        recommended_drill: 'Breaststroke kick on back / vertical breaststroke kick for knee alignment.',
        next_focus: 'Narrow the recovery before working on kick speed.',
        timestamp_start: 7.4,
        timestamp_end: 9.2,
        confidence_score: 0.91,
      },
      {
        severity: 'Medium',
        stroke_phase: 'Kick Recovery',
        finding_title: 'Feet turning out too early',
        finding_description: 'The feet appear to dorsiflex and rotate outward before the knees reach the recovery position.',
        why_it_matters: 'Early foot turn reduces the surface area available for the propulsive drive phase and can cause the knees to splay wider.',
        coach_should_check: 'Watch for foot rotation starting before the heels reach full recovery height.',
        recommended_correction: 'Cue toes point back until heels are fully loaded, then snap feet out and drive back together.',
        recommended_drill: 'Breaststroke kick with a pull buoy / slow-motion kick focus sets.',
        next_focus: 'Delay the foot turn until the kick is fully loaded.',
        timestamp_start: 7.4,
        timestamp_end: 8.6,
        confidence_score: 0.83,
      },
      {
        severity: 'Medium',
        stroke_phase: 'Timing',
        finding_title: 'Kick timing slightly late',
        finding_description: 'The kick appears to finish after the upper body has already started settling into the glide phase.',
        why_it_matters: 'Late kick timing breaks the coordinated overlap between pull and kick, reducing momentum transfer and glide efficiency.',
        coach_should_check: 'Confirm whether the hands are shooting forward as the kick is still loading, or after it has already begun.',
        recommended_correction: 'Cue hands shoot forward as the feet snap together, then hold a short controlled line.',
        recommended_drill: '2-kick 1-pull breaststroke timing drill / full-stroke slow-motion tempo work.',
        next_focus: 'Time the hand extension to overlap with the kick snap.',
        timestamp_start: 13.1,
        timestamp_end: 15.0,
        confidence_score: 0.84,
      },
      {
        severity: 'Medium',
        stroke_phase: 'Body Line',
        finding_title: 'Hips dropping during glide',
        finding_description: "The swimmer's hips appear to sit lower during the glide phase, reducing forward line and increasing resistance.",
        why_it_matters: 'Dropped hips in the glide position significantly increase drag and can also disrupt the timing of the next pull.',
        coach_should_check: 'Confirm whether the swimmer is gliding with the head up or whether the kick is not finishing into a flat position.',
        recommended_correction: 'Cue eyes down, ribs tight, hips high, and finish each kick into a long narrow line.',
        recommended_drill: 'Breaststroke glide position hold / kick to glide with underwater video check.',
        next_focus: 'Hold the glide position for a full beat before initiating the next pull.',
        timestamp_start: 18.6,
        timestamp_end: 20.4,
        confidence_score: 0.81,
      },
      {
        severity: 'Low',
        stroke_phase: 'Catch',
        finding_title: 'Hands recovering too low or slow',
        finding_description: 'The hands appear to recover under the body rather than close to the surface, adding recovery drag.',
        why_it_matters: 'A low or slow hand recovery extends the time the arms spend in a non-propulsive position and can shorten the glide.',
        coach_should_check: 'Confirm whether the hands recover along the chest or drop below the body line during the sweep-in.',
        recommended_correction: 'Cue hands recover flat and forward close to the chest, elbows in tight, shoot quickly into extension.',
        recommended_drill: 'Breaststroke catch-up / finger-drag hand recovery drill.',
        next_focus: 'Speed up hand recovery to protect the glide window.',
        timestamp_start: 19.8,
        timestamp_end: 21.2,
        confidence_score: 0.76,
      },
    ],
  },

  Backstroke: {
    overall_score: 78,
    technical_summary: '[TEST DATA — Pending Coach Review] AI pattern analysis detected five backstroke technique areas. Hand crossing midline, shoulder rotation flatness, catch depth, kick pressure consistency, and head position were flagged. All findings are AI-suggested and must be verified by a coach before use.',
    phase_breakdown: { entry: 74, rotation: 72, catch: 76, kick: 81, head_position: 69 },
    key_frames: [
      { timestamp: 5.1,  label: 'Hand crosses midline',         description: 'Entry hand crosses the midline of the body on entry.' },
      { timestamp: 11.3, label: 'Flat shoulder rotation',       description: 'Shoulders rotate less than expected during the pull phase.' },
      { timestamp: 17.8, label: 'Head position elevated',       description: 'Head appears raised above neutral alignment.' },
    ],
    findings: [
      {
        severity: 'High',
        stroke_phase: 'Entry',
        finding_title: 'Hand crossing midline on entry',
        finding_description: 'The entry hand appears to cross the body centreline, placing it inside the shoulder line.',
        why_it_matters: 'Crossing the midline causes the body to snake and generates lateral drag, and forces the shoulder to roll excessively.',
        coach_should_check: 'Confirm whether the hand enters inside the shoulder line or directly above the shoulder.',
        recommended_correction: 'Cue pinky first, enter outside the shoulder line, extend long before beginning the catch.',
        recommended_drill: 'Single-arm backstroke with alignment pole / catch-up backstroke.',
        next_focus: 'Establish consistent entry width before working on catch depth.',
        timestamp_start: 5.1,
        timestamp_end: 6.8,
        confidence_score: 0.87,
      },
      {
        severity: 'Medium',
        stroke_phase: 'Rotation',
        finding_title: 'Flat shoulder rotation',
        finding_description: 'The shoulders appear to rotate less than ideal, keeping the body relatively flat during the pull phase.',
        why_it_matters: 'Reduced rotation limits the reach on entry, shortens the pull path, and reduces power generated from the core.',
        coach_should_check: 'Confirm rotation angle at catch and whether the hip-shoulder connection is driving the stroke.',
        recommended_correction: 'Cue roll into the stroking side, drive rotation from the hip, and let the shoulder lead the arm into the pull.',
        recommended_drill: 'Backstroke side-kick / quarter-body rotation drill.',
        next_focus: 'Increase hip-shoulder rotation before focusing on pull mechanics.',
        timestamp_start: 11.3,
        timestamp_end: 13.1,
        confidence_score: 0.82,
      },
      {
        severity: 'Medium',
        stroke_phase: 'Catch',
        finding_title: 'Weak catch depth',
        finding_description: 'The catch appears shallow, with the hand not fully pressing into a vertical forearm position before the pull begins.',
        why_it_matters: 'A shallow catch reduces the amount of water held during the pull and shortens the effective stroke length.',
        coach_should_check: 'Confirm whether the elbow bends to 90 degrees and the forearm points toward the wall before the pull begins.',
        recommended_correction: 'Cue reach long, bend the elbow early, and feel the forearm press water before pulling.',
        recommended_drill: 'Single-arm backstroke with catch pause / backstroke sculling at catch.',
        next_focus: 'Build a deeper, earlier catch before adding stroke rate.',
        timestamp_start: 14.6,
        timestamp_end: 16.2,
        confidence_score: 0.79,
      },
      {
        severity: 'Low',
        stroke_phase: 'Kick',
        finding_title: 'Inconsistent kick pressure',
        finding_description: 'Kick tempo and pressure appear to vary across stroke cycles, suggesting the kick is not consistently connected to the stroke rhythm.',
        why_it_matters: 'An inconsistent kick reduces body line stability and can disrupt the rotation timing on each stroke cycle.',
        coach_should_check: 'Confirm whether kick slows during the breathing cycle or during arm entry.',
        recommended_correction: 'Cue 6-beat kick, maintain consistent tempo, and connect kick drive to shoulder rotation.',
        recommended_drill: 'Backstroke kick on back / kick-count sets to build rhythm.',
        next_focus: 'Maintain a steady 6-beat kick rhythm throughout the length.',
        timestamp_start: 9.0,
        timestamp_end: 22.0,
        confidence_score: 0.74,
      },
      {
        severity: 'Medium',
        stroke_phase: 'Head Position',
        finding_title: 'Head position too high',
        finding_description: 'The head appears elevated above the neutral water-line position, causing the hips to drop.',
        why_it_matters: 'A high head on backstroke directly drops the hips, increasing drag and forcing the kick to work against a negative body angle.',
        coach_should_check: 'Confirm whether the swimmer is looking at the ceiling or slightly past vertical.',
        recommended_correction: 'Cue chin slightly tucked, ears in the water, eyes to the ceiling, keep the head still.',
        recommended_drill: 'Backstroke kick with a kickboard on the forehead / head-still backstroke sets.',
        next_focus: 'Lock in the head position before addressing rotation.',
        timestamp_start: 17.8,
        timestamp_end: 19.4,
        confidence_score: 0.86,
      },
    ],
  },

  Butterfly: {
    overall_score: 77,
    technical_summary: '[TEST DATA — Pending Coach Review] AI pattern analysis detected five butterfly technique areas. Breath height, hand entry width, kick-stroke timing, post-breath hip position, and arm recovery tension were flagged. All findings are AI-suggested and must be verified by a coach before use.',
    phase_breakdown: { body_wave: 75, catch: 79, breath_timing: 68, kick_timing: 80, recovery: 72 },
    key_frames: [
      { timestamp: 4.8,  label: 'Breath too high',           description: 'Head rises significantly above the surface on the breath.' },
      { timestamp: 9.3,  label: 'Hands entering too wide',   description: 'Hands enter outside shoulder width on recovery.' },
      { timestamp: 15.6, label: 'Hip drop after breath',     description: 'Hips sink following the breath, breaking the body wave.' },
    ],
    findings: [
      {
        severity: 'High',
        stroke_phase: 'Breath Timing',
        finding_title: 'Breath too high',
        finding_description: 'The head rises well above the waterline during the breath, causing the hips and legs to sink.',
        why_it_matters: 'A high breath interrupts the body wave, creates significant frontal drag, and delays the recovery.',
        coach_should_check: 'Confirm the chin position at peak breath — it should clear the surface by only a few centimetres.',
        recommended_correction: 'Cue chin skims the water, breathe forward not up, return head before the hands enter.',
        recommended_drill: 'Butterfly with a snorkel / 1-breath per 3-strokes breath control sets.',
        next_focus: 'Lower the breath height before focusing on stroke rate.',
        timestamp_start: 4.8,
        timestamp_end: 6.2,
        confidence_score: 0.89,
      },
      {
        severity: 'Medium',
        stroke_phase: 'Catch',
        finding_title: 'Hands entering too wide',
        finding_description: 'The hands appear to enter outside shoulder width, reducing the efficiency of the catch setup.',
        why_it_matters: 'Wide entry reduces the ability to load a strong catch and can cause the elbows to drop early in the pull.',
        coach_should_check: 'Confirm hand entry width relative to shoulder line at full reach.',
        recommended_correction: 'Cue hands enter shoulder-width, thumbs slightly angled down, press out then back.',
        recommended_drill: 'Single-arm butterfly / butterfly with exaggerated narrow entry focus.',
        next_focus: 'Narrow the entry before working on pull power.',
        timestamp_start: 9.3,
        timestamp_end: 10.8,
        confidence_score: 0.83,
      },
      {
        severity: 'High',
        stroke_phase: 'Kick Timing',
        finding_title: 'Kick timing mismatch',
        finding_description: 'The second kick appears to be misaligned with hand entry, reducing the body wave connection.',
        why_it_matters: 'Without the second kick driving the hips up as the hands enter, the wave is broken and the catch loses power.',
        coach_should_check: 'Confirm whether the second kick fires as the hands enter or is delayed until after entry.',
        recommended_correction: 'Cue drive the second kick as the hands spear forward, connect the kick to the entry.',
        recommended_drill: '1-arm butterfly kick timing drill / dolphin kick underwater connection sets.',
        next_focus: 'Time the second kick to coincide exactly with hand entry.',
        timestamp_start: 12.1,
        timestamp_end: 13.9,
        confidence_score: 0.86,
      },
      {
        severity: 'Medium',
        stroke_phase: 'Body Wave',
        finding_title: 'Hips dropping after breath',
        finding_description: 'The hips appear to sink following the breathing cycle, interrupting the continuous body wave.',
        why_it_matters: 'A hip drop post-breath breaks the wave and increases drag, making the following stroke less efficient.',
        coach_should_check: 'Confirm whether hip drop correlates with the breath or with a delay in the second kick.',
        recommended_correction: 'Cue hips stay up after the breath, press chest down to drive hips, maintain wave continuity.',
        recommended_drill: 'Dolphin kick on back / body wave undulation drills.',
        next_focus: 'Maintain wave continuity through the breathing cycle.',
        timestamp_start: 15.6,
        timestamp_end: 17.1,
        confidence_score: 0.80,
      },
      {
        severity: 'Low',
        stroke_phase: 'Recovery',
        finding_title: 'Recovery too low or tense',
        finding_description: 'The arm recovery appears to swing low with some tension, rather than swinging freely above the water.',
        why_it_matters: 'A low or tense recovery slows the stroke cycle and adds unnecessary energy cost per stroke.',
        coach_should_check: 'Confirm elbow height during recovery and whether the shoulders appear relaxed or braced.',
        recommended_correction: 'Cue relax the arms on recovery, swing wide and low is fine but let it be loose, land softly.',
        recommended_drill: 'Butterfly recovery with closed fists / relaxed arm swing recovery focus.',
        next_focus: 'Reduce tension through the recovery phase.',
        timestamp_start: 7.5,
        timestamp_end: 9.0,
        confidence_score: 0.72,
      },
    ],
  },

  IM: {
    overall_score: 76,
    technical_summary: '[TEST DATA — Pending Coach Review] AI pattern analysis detected five IM technique areas. Stroke transition timing, rhythm disruption, turn breakout weakness, fatigue-related body-line drop, and tempo management were flagged. All findings are AI-suggested and must be verified by a coach before use.',
    phase_breakdown: { stroke_transitions: 73, turns: 71, underwaters: 68, rhythm_control: 78, fatigue_management: 74 },
    key_frames: [
      { timestamp: 8.4,  label: 'Butterfly to backstroke transition', description: 'Stroke transition shows timing lag between final butterfly kick and backstroke entry.' },
      { timestamp: 22.1, label: 'Turn breakout position',             description: 'Breakout from backstroke-to-breaststroke turn shows early surface entry.' },
      { timestamp: 36.5, label: 'Body line drop — breaststroke lap',  description: 'Body line drops noticeably in the third stroke group, consistent with fatigue pattern.' },
    ],
    findings: [
      {
        severity: 'High',
        stroke_phase: 'Stroke Transitions',
        finding_title: 'Transition timing lag — fly to back',
        finding_description: 'There appears to be a timing lag at the butterfly-to-backstroke transition, with a hesitation before the first backstroke rotation.',
        why_it_matters: 'Transition hesitation costs momentum and allows the body to decelerate unnecessarily, adding time at the pivot point of the race.',
        coach_should_check: 'Confirm whether the final butterfly pull transitions cleanly into the backstroke rotation or pauses at the wall.',
        recommended_correction: 'Cue final fly kick drives the rotation into the turn, push off in backstroke streamline with no pause.',
        recommended_drill: 'Fly-to-back transition practice sets / IM turn entry and exit drills.',
        next_focus: 'Remove the hesitation at the fly-to-back transition.',
        timestamp_start: 8.4,
        timestamp_end: 10.2,
        confidence_score: 0.85,
      },
      {
        severity: 'Medium',
        stroke_phase: 'Rhythm Control',
        finding_title: 'Stroke rhythm disruption',
        finding_description: 'Stroke rate appears to drop noticeably during the transition from one stroke group to the next, disrupting overall race rhythm.',
        why_it_matters: 'Rhythm disruption compounds across each transition and makes it harder to maintain tempo going into the final stroke group.',
        coach_should_check: 'Confirm whether rate drops are consistent at each transition or isolated to specific strokes.',
        recommended_correction: 'Cue maintain stroke rate into the wall, fast feet on turns, carry the rhythm out of each breakout.',
        recommended_drill: 'IM transition pace sets / broken IM with focus on consistent tempo between strokes.',
        next_focus: 'Maintain stroke rhythm through each transition.',
        timestamp_start: 15.0,
        timestamp_end: 18.5,
        confidence_score: 0.79,
      },
      {
        severity: 'High',
        stroke_phase: 'Turns',
        finding_title: 'Turn breakout too early — back to breast',
        finding_description: 'The swimmer appears to surface too early from the backstroke-to-breaststroke turn, losing the underwater phase advantage.',
        why_it_matters: 'Surfacing early sacrifices the fastest phase of the post-turn (underwater dolphin kick) and increases drag through the breakout stroke.',
        coach_should_check: 'Confirm breakout distance from the wall and whether the swimmer is taking a full dolphin kick before surfacing.',
        recommended_correction: 'Cue stay down, one strong dolphin kick, hold the streamline, only surface when natural momentum allows.',
        recommended_drill: 'Back-to-breast turn breakout sets with distance markers / underwater breakout timing practice.',
        next_focus: 'Extend the underwater phase at back-to-breast turns.',
        timestamp_start: 22.1,
        timestamp_end: 24.0,
        confidence_score: 0.88,
      },
      {
        severity: 'Medium',
        stroke_phase: 'Fatigue Management',
        finding_title: 'Fatigue-related body-line drop',
        finding_description: 'Body line appears to deteriorate in the third stroke group, with hips dropping and stroke length shortening.',
        why_it_matters: 'Fatigue-related body-line drop in the third stroke group increases drag exactly when the swimmer is already working hardest.',
        coach_should_check: 'Confirm whether the body-line drop correlates with breaststroke and whether core tension is maintained.',
        recommended_correction: 'Cue maintain posture into the third stroke group, ribs tight, glide holds firm even when fatigued.',
        recommended_drill: 'IM descending pace sets / breaststroke-in-IM pace management practice.',
        next_focus: 'Build core endurance to hold body line in the back half of the IM.',
        timestamp_start: 36.5,
        timestamp_end: 42.0,
        confidence_score: 0.77,
      },
      {
        severity: 'Low',
        stroke_phase: 'Underwaters',
        finding_title: 'Inconsistent underwater tempo change between strokes',
        finding_description: 'Dolphin kick tempo on underwater phases varies inconsistently between stroke transitions.',
        why_it_matters: 'Inconsistent underwater tempo reduces the efficiency of each breakout and can set a poor rhythm for the first stroke cycle.',
        coach_should_check: 'Count kick cycles taken off each wall and compare between stroke groups.',
        recommended_correction: 'Cue standardise underwater kick count — aim for a consistent 2–3 full kicks off every wall.',
        recommended_drill: 'Underwater breakout count sets / IM breakout consistency training.',
        next_focus: 'Standardise the number and quality of underwater kicks off each wall.',
        timestamp_start: 5.0,
        timestamp_end: 8.0,
        confidence_score: 0.73,
      },
    ],
  },
};

// Fallback for unmapped stroke types — use breaststroke data (the original test set)
const DEFAULT_STROKE = 'Breaststroke';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'owner'].includes(user.role)) {
      return Response.json({ success: false, error: 'Forbidden: admin/owner only' }, { status: 403 });
    }

    const body = await req.json();
    const { video_upload_id } = body;
    if (!video_upload_id) return Response.json({ success: false, error: 'video_upload_id required' }, { status: 400 });

    // Load video
    const uploads = await base44.asServiceRole.entities.VideoUpload.filter({ id: video_upload_id });
    if (!uploads || uploads.length === 0) {
      return Response.json({ success: false, error: 'VideoUpload not found' }, { status: 404 });
    }
    const upload = uploads[0];

    const strokeType = upload.stroke_type || DEFAULT_STROKE;
    const strokeData = STROKE_DATA[strokeType] || STROKE_DATA[DEFAULT_STROKE];
    const { overall_score, technical_summary, phase_breakdown, findings, key_frames } = strokeData;

    const now = new Date().toISOString();

    // Update video status
    await base44.asServiceRole.entities.VideoUpload.update(upload.id, {
      processing_status: 'completed',
      ai_error_message: null,
      ai_completed_at: now,
    });

    // Create or update linked Report
    const existingReports = await base44.asServiceRole.entities.Report.filter({ video_upload_id: upload.id, source: 'ai' });
    const reportData = {
      club_id: upload.club_id,
      swimmer_id: upload.swimmer_id,
      video_upload_id: upload.id,
      title: `AI Technique Report — ${strokeType} [TEST DATA]`,
      status: 'awaiting_review',
      source: 'ai',
      analysis_mode: 'placeholder',
      ai_engine_version: 'test-placeholder-1.0',
      model_name: 'test_data',
      real_pose_detected: false,
      frame_count_processed: 0,
      detected_keypoints_count: 0,
      overall_score,
      technical_summary,
      phase_breakdown: JSON.stringify(phase_breakdown),
      ai_completed_at: now,
      ai_error_message: null,
    };

    let reportId;
    if (existingReports && existingReports.length > 0) {
      await base44.asServiceRole.entities.Report.update(existingReports[0].id, reportData);
      reportId = existingReports[0].id;
      // Delete old findings and key frames so they are replaced cleanly
      const oldFindings = await base44.asServiceRole.entities.Finding.filter({ report_id: reportId });
      for (const of_ of oldFindings) {
        await base44.asServiceRole.entities.Finding.delete(of_.id);
      }
      const oldFrames = await base44.asServiceRole.entities.KeyFrame.filter({ report_id: reportId });
      for (const kf of oldFrames) {
        await base44.asServiceRole.entities.KeyFrame.delete(kf.id);
      }
    } else {
      const created = await base44.asServiceRole.entities.Report.create(reportData);
      reportId = created.id;
    }

    // Ingest findings with all fields
    const severityMap = { High: 'high', Medium: 'medium', Low: 'low', Critical: 'critical' };
    let findingsCreated = 0;
    for (const f of findings) {
      const findingName  = f.finding_title;
      const findingPhase = f.stroke_phase;
      const coachSees    = f.finding_description + (f.coach_should_check ? `\n\nCoach should check: ${f.coach_should_check}` : '');
      const normalizedSeverity = severityMap[f.severity] || 'medium';

      await base44.asServiceRole.entities.Finding.create({
        report_id: reportId,
        video_upload_id: upload.id,
        club_id: upload.club_id,
        swimmer_id: upload.swimmer_id,
        finding_name: findingName,
        phase: findingPhase,
        coach_sees: coachSees,
        why_it_matters: f.why_it_matters,
        cue: f.recommended_correction,
        drill: f.recommended_drill,
        next_focus: f.next_focus,
        severity: normalizedSeverity,
        evidence_type: 'insufficient_evidence',
        measurement_summary: 'Test data — no real pose measurement performed.',
        source: 'ai',
        approval_status: 'pending',
        included_in_report: false,
        timestamp_start: f.timestamp_start,
        timestamp_end: f.timestamp_end,
        confidence_score: f.confidence_score,
        // Preserve originals
        original_finding_name: findingName,
        original_coach_sees: coachSees,
        original_why_it_matters: f.why_it_matters,
        original_cue: f.recommended_correction,
        original_drill: f.recommended_drill,
        original_next_focus: f.next_focus,
        original_severity: normalizedSeverity,
        original_phase: findingPhase,
      });
      findingsCreated++;
    }

    // Ingest key frames
    for (const kf of key_frames) {
      await base44.asServiceRole.entities.KeyFrame.create({
        report_id: reportId,
        video_upload_id: upload.id,
        club_id: upload.club_id,
        swimmer_id: upload.swimmer_id,
        timestamp_seconds: kf.timestamp,
        label: kf.label,
        note: kf.description,
      });
    }

    return Response.json({
      success: true,
      video_upload_id: upload.id,
      report_id: reportId,
      stroke_type: strokeType,
      findings_created: findingsCreated,
    });

  } catch (error) {
    return Response.json({ success: false, error: error.message || 'Unexpected error' }, { status: 500 });
  }
});