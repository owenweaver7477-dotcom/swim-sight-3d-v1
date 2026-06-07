import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  // 1. Validate webhook secret
  const webhookSecret = Deno.env.get('AI_WEBHOOK_SECRET');
  const headerSecret = req.headers.get('X-AI-WEBHOOK-SECRET');

  let payload;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const incomingSecret = headerSecret || payload._test_webhook_secret;
  if (!webhookSecret || !incomingSecret || incomingSecret !== webhookSecret) {
    return Response.json({ error: 'Forbidden: invalid or missing webhook secret' }, { status: 403 });
  }

  const base44 = createClientFromRequest(req);

  const {
    video_upload_id,
    job_id,
    status,
    analysis_mode,
    ai_engine_version,
    model_name,
    real_pose_detected,
    frame_count_processed,
    detected_keypoints_count,
    detection_ratio,
    pose_reliability,
    quality_flags,
    recommended_next_action,
    video_duration_seconds,
    video_fps,
    processing_duration_seconds,
    stage_history,
    processed_video_url,
    pose_data_file_url,
    overall_score,
    technical_summary,
    phase_breakdown,
    findings = [],
    key_frames = [],
    drag_analysis = [],
    error_message,
  } = payload;

  if (!video_upload_id) {
    return Response.json({ error: 'video_upload_id is required' }, { status: 400 });
  }
  if (!['completed', 'error', 'unreliable_pose'].includes(status)) {
    return Response.json({ error: 'status must be completed, unreliable_pose, or error' }, { status: 400 });
  }

  const now = new Date().toISOString();

  // 2. Load the VideoUpload record
  const uploads = await base44.asServiceRole.entities.VideoUpload.filter({ id: video_upload_id });
  if (!uploads || uploads.length === 0) {
    return Response.json({ error: 'VideoUpload not found' }, { status: 404 });
  }
  const upload = uploads[0];

  // 3. Find the AIProcessingJob for this video (match by job_id if provided, else latest)
  let job = null;
  if (job_id) {
    const jobs = await base44.asServiceRole.entities.AIProcessingJob.filter({ job_id });
    job = jobs[0] || null;
  }
  if (!job) {
    const jobs = await base44.asServiceRole.entities.AIProcessingJob.filter({ video_upload_id });
    // Find latest non-completed job
    jobs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    job = jobs[0] || null;
  }

  // 4. Handle error/unreliable statuses
  if (status === 'error') {
    const errMsg = error_message || 'AI processing failed';
    await base44.asServiceRole.entities.VideoUpload.update(upload.id, {
      processing_status: 'error',
      ai_error_message: errMsg,
    });
    if (job) {
      await base44.asServiceRole.entities.AIProcessingJob.update(job.id, {
        status: 'error',
        error_message: errMsg,
        failed_at: now,
        callback_received: true,
        processing_duration_seconds: processing_duration_seconds || null,
      });
    }
    // Mark existing report as error if present
    const existingReports = await base44.asServiceRole.entities.Report.filter({ video_upload_id: upload.id });
    if (existingReports && existingReports.length > 0) {
      await base44.asServiceRole.entities.Report.update(existingReports[0].id, {
        analysis_mode: 'error',
        ai_error_message: errMsg,
        status: 'awaiting_review',
      });
    }
    return Response.json({ success: true, status: 'error recorded' });
  }

  // 5. Strict real_pose gate — ALL four conditions must be true
  const isRealPose = (
    analysis_mode === 'real_pose' &&
    real_pose_detected === true &&
    frame_count_processed > 0 &&
    detected_keypoints_count > 0
  );
  const resolvedAnalysisMode = isRealPose ? 'real_pose' : 'placeholder';

  // 6. Build unreliable pose message
  const unreliableMessage = !isRealPose
    ? (error_message || `Pose detection was not reliable enough for automated analysis. ${frame_count_processed || 0} frames processed, ${detected_keypoints_count || 0} avg keypoints. Please upload a clearer video or use manual coach review.`)
    : null;

  // 7. Update VideoUpload
  await base44.asServiceRole.entities.VideoUpload.update(upload.id, {
    processing_status: 'completed',
    ai_error_message: unreliableMessage,
    ai_completed_at: now,
  });

  // 8. Update AIProcessingJob
  if (job) {
    const jobStatus = isRealPose ? 'completed' : 'unreliable_pose';
    await base44.asServiceRole.entities.AIProcessingJob.update(job.id, {
      status: jobStatus,
      stage: isRealPose ? 'Completed — AI review ready' : 'Pose unreliable — manual review recommended',
      progress_percent: 100,
      message: isRealPose ? 'AI analysis complete. Findings ready for coach review.' : unreliableMessage,
      analysis_mode: resolvedAnalysisMode,
      real_pose_detected: isRealPose,
      frame_count_processed: frame_count_processed ?? null,
      detected_keypoints_count: detected_keypoints_count ?? null,
      detection_ratio: detection_ratio ?? null,
      pose_reliability: pose_reliability || null,
      quality_flags: Array.isArray(quality_flags) ? quality_flags.join(',') : (quality_flags || null),
      recommended_next_action: recommended_next_action || null,
      video_duration_seconds: video_duration_seconds ?? null,
      video_fps: video_fps ?? null,
      processing_duration_seconds: processing_duration_seconds ?? null,
      ai_engine_version: ai_engine_version || null,
      model_name: model_name || null,
      completed_at: now,
      callback_received: true,
      error_message: unreliableMessage,
    });
  }

  // 9. Create or update linked Report
  const existingReports = await base44.asServiceRole.entities.Report.filter({ video_upload_id: upload.id });
  const reportData = {
    club_id: upload.club_id,
    swimmer_id: upload.swimmer_id,
    video_upload_id: upload.id,
    title: `AI Technique Report — ${upload.stroke_type || upload.original_filename || 'Video'}`,
    status: 'awaiting_review',
    source: 'ai',
    analysis_mode: resolvedAnalysisMode,
    ai_engine_version: ai_engine_version || undefined,
    model_name: model_name || undefined,
    real_pose_detected: isRealPose,
    frame_count_processed: frame_count_processed ?? undefined,
    detected_keypoints_count: detected_keypoints_count ?? undefined,
    overall_score: isRealPose && overall_score != null ? overall_score : undefined,
    technical_summary: technical_summary || undefined,
    phase_breakdown: phase_breakdown ? JSON.stringify(phase_breakdown) : undefined,
    processed_video_url: processed_video_url || undefined,
    pose_data_file_url: pose_data_file_url || undefined,
    ai_completed_at: now,
    ai_error_message: unreliableMessage,
  };

  let report;
  if (existingReports && existingReports.length > 0) {
    await base44.asServiceRole.entities.Report.update(existingReports[0].id, reportData);
    report = { ...existingReports[0], ...reportData };
  } else {
    report = await base44.asServiceRole.entities.Report.create(reportData);
  }
  const reportId = report.id;

  // 10. Update job with report_id
  if (job) {
    await base44.asServiceRole.entities.AIProcessingJob.update(job.id, { report_id: reportId });
  }

  // 11. Ingest findings — only for real_pose
  const findingIds = [];
  const severityMap = { High: 'high', Medium: 'medium', Low: 'low', Critical: 'critical' };

  if (isRealPose) {
    for (const f of findings) {
      const normalizedSeverity = severityMap[f.severity] || (f.severity ? f.severity.toLowerCase() : 'medium');
      const findingName  = f.finding_title || f.finding_name || 'AI Draft Finding';
      const findingPhase = f.stroke_phase || f.phase || undefined;
      const coachSees    = f.finding_description || f.coach_sees || undefined;
      const whyItMatters = f.why_it_matters || undefined;
      const cue          = f.recommended_correction || f.cue || undefined;
      const drill        = f.drill || undefined;
      const nextFocus    = f.next_focus || undefined;

      const finding = await base44.asServiceRole.entities.Finding.create({
        report_id: reportId,
        video_upload_id: upload.id,
        club_id: upload.club_id,
        swimmer_id: upload.swimmer_id,
        finding_name: findingName,
        phase: findingPhase,
        coach_sees: coachSees,
        why_it_matters: whyItMatters,
        cue,
        drill,
        next_focus: nextFocus,
        severity: normalizedSeverity,
        evidence_type: f.evidence_type || undefined,
        measurement_summary: f.measurement_summary || undefined,
        frame_reference: f.frame_reference || undefined,
        source: 'ai',
        approval_status: 'pending',
        included_in_report: false,
        timestamp_start: f.timestamp_start != null ? f.timestamp_start : undefined,
        timestamp_end: f.timestamp_end != null ? f.timestamp_end : undefined,
        confidence_score: f.confidence_score != null ? f.confidence_score : undefined,
        original_finding_name: findingName,
        original_coach_sees: coachSees,
        original_why_it_matters: whyItMatters,
        original_cue: cue,
        original_drill: drill,
        original_next_focus: nextFocus,
        original_severity: normalizedSeverity,
        original_phase: findingPhase,
      });
      findingIds.push(finding.id);
    }
  }

  // 12. Ingest key frames
  for (const kf of key_frames) {
    await base44.asServiceRole.entities.KeyFrame.create({
      report_id: reportId,
      video_upload_id: upload.id,
      club_id: upload.club_id,
      swimmer_id: upload.swimmer_id,
      timestamp_seconds: kf.timestamp ?? kf.timestamp_seconds ?? 0,
      label: kf.label || undefined,
      note: kf.description || kf.note || undefined,
      phase: kf.phase || undefined,
    });
  }

  // 13. Ingest drag_analysis — only for real_pose
  let dragItemsCreated = 0;
  if (isRealPose && Array.isArray(drag_analysis) && drag_analysis.length > 0) {
    for (const da of drag_analysis) {
      await base44.asServiceRole.entities.DragAnalysis.create({
        club_id: upload.club_id,
        swimmer_id: upload.swimmer_id,
        report_id: reportId,
        video_upload_id: upload.id,
        analysis_session_id: upload.analysis_session_id || undefined,
        created_by: 'ai',
        source: 'ai_pose',
        analysis_mode: 'real_pose',
        drag_risk_level: da.drag_risk_level || 'unknown',
        drag_zone: da.drag_zone || 'full_body',
        overlay_type: da.overlay_type || 'body_line',
        stroke_phase: da.stroke_phase || undefined,
        timestamp_start: da.timestamp_start != null ? da.timestamp_start : undefined,
        timestamp_end: da.timestamp_end != null ? da.timestamp_end : undefined,
        risk_score: da.risk_score != null ? da.risk_score : undefined,
        measurement_summary: da.measurement_summary || undefined,
        evidence_type: da.evidence_type || 'pose_measurement',
        coordinates_json: da.coordinates_json ? JSON.stringify(da.coordinates_json) : undefined,
        approval_status: 'pending',
        included_in_report: false,
      });
      dragItemsCreated++;
    }
  }

  return Response.json({
    success: true,
    report_id: reportId,
    analysis_mode: resolvedAnalysisMode,
    real_pose_detected: isRealPose,
    findings_created: findingIds.length,
    key_frames_created: key_frames.length,
    drag_items_created: dragItemsCreated,
  });
});