import { createServiceClient, handleApiError, isUuid, readJsonBody, sendJson } from '../_lib/server.js';

function isReliableRealPose(payload) {
  return (
    payload.analysis_mode === 'real_pose' &&
    payload.real_pose_detected === true
  );
}

function normaliseSeverity(value) {
  if (!value) return null;
  return String(value).toLowerCase();
}

function normaliseArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map(item => item.trim()).filter(Boolean);
  return [];
}

function isCoachLockedReport(status) {
  return ['coach_approved', 'finalised', 'published', 'shared'].includes(status);
}

async function findJob(service, payload) {
  if (payload.app_job_id && isUuid(payload.app_job_id)) {
    const { data, error } = await service
      .from('ai_processing_jobs')
      .select('*')
      .eq('id', payload.app_job_id)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
  }

  if (payload.job_id && isUuid(payload.job_id)) {
    const { data, error } = await service
      .from('ai_processing_jobs')
      .select('*')
      .eq('id', payload.job_id)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
  }

  if (payload.job_id) {
    const { data, error } = await service
      .from('ai_processing_jobs')
      .select('*')
      .eq('server_job_id', payload.job_id)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
  }

  if (payload.video_upload_id) {
    const { data, error } = await service
      .from('ai_processing_jobs')
      .select('*')
      .eq('video_upload_id', payload.video_upload_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const payload = await readJsonBody(req);
    const webhookSecret = process.env.AI_WEBHOOK_SECRET;
    const authorization = req.headers.authorization || '';
    const incomingSecret = req.headers['x-ai-webhook-secret']
      || (authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : null);
    if (!webhookSecret || incomingSecret !== webhookSecret) {
      return sendJson(res, 403, { error: 'Forbidden: invalid or missing webhook secret' });
    }

    const service = createServiceClient();
    const job = await findJob(service, payload);

    const videoUploadId = payload.video_upload_id || job?.video_upload_id;
    if (!videoUploadId) return sendJson(res, 400, { error: 'video_upload_id is required' });

    const { data: upload, error: uploadError } = await service
      .from('video_uploads')
      .select('*')
      .eq('id', videoUploadId)
      .maybeSingle();

    if (uploadError) throw uploadError;
    if (!upload) return sendJson(res, 404, { error: 'VideoUpload not found' });

    const now = new Date().toISOString();
    const callbackStatus = String(payload.status || 'completed').toLowerCase();
    const callbackError = callbackStatus === 'error';
    const realPose = isReliableRealPose(payload);
    const jobStatus = callbackError ? 'error' : realPose ? 'completed' : 'unreliable_pose';
    const videoStatus = callbackError ? 'error' : realPose ? 'completed' : 'unreliable_pose';
    const reportStatus = callbackError ? 'error' : 'in_review';
    const analysisMode = realPose ? 'real_pose' : (payload.analysis_mode || (callbackError ? 'error' : 'manual_review'));
    const fallbackNextAction = realPose ? null : 'manual_review_recommended';
    const callbackMessage = callbackError
      ? payload.error_message || 'AI processing failed. Manual coach review is required.'
      : payload.error_message || 'Pose detection was not reliable enough for automated findings. Manual coach review is required.';
    const unreliableMessage = realPose
      ? null
      : callbackMessage;

    await service.from('video_uploads').update({
      processing_status: videoStatus,
      ai_error_message: unreliableMessage,
    }).eq('id', upload.id);

    if (job) {
      await service.from('ai_processing_jobs').update({
        status: jobStatus,
        stage: callbackError
          ? 'error'
          : realPose
          ? 'completed'
          : 'unreliable_pose',
        progress_percent: 100,
        pose_reliability: payload.pose_reliability || null,
        quality_flags: normaliseArray(payload.quality_flags),
        recommended_next_action: payload.recommended_next_action || fallbackNextAction,
        detection_ratio: payload.detection_ratio ?? null,
        frame_count_processed: payload.frame_count_processed ?? null,
        detected_keypoints_count: payload.detected_keypoints_count ?? null,
        stage_history: normaliseArray(payload.stage_history),
        error_message: unreliableMessage,
        callback_received: true,
        callback_received_at: now,
        completed_at: now,
      }).eq('id', job.id);
    }

    const reportPayload = {
      club_id: upload.club_id,
      swimmer_id: upload.swimmer_id,
      video_upload_id: upload.id,
      ai_processing_job_id: job?.id || null,
      status: reportStatus,
      stroke_type: upload.stroke_type,
      analysis_type: upload.analysis_type,
      analysis_mode: analysisMode,
      real_pose_detected: realPose,
      overall_score: realPose ? payload.overall_score ?? null : null,
      phase_breakdown: realPose && payload.phase_breakdown ? payload.phase_breakdown : {},
      technical_summary: realPose ? payload.technical_summary || null : unreliableMessage,
      next_focus: realPose ? payload.next_focus || null : payload.recommended_next_action || fallbackNextAction,
      review_context: upload.review_context || {},
      created_by: upload.created_by,
    };

    const { data: existingReports, error: reportLookupError } = await service
      .from('reports')
      .select('*')
      .eq('video_upload_id', upload.id)
      .eq('is_deleted', false)
      .limit(1);

    if (reportLookupError) throw reportLookupError;

    const existingReport = existingReports?.[0];
    if (existingReport && isCoachLockedReport(existingReport.status)) {
      return sendJson(res, 200, {
        success: true,
        report_id: existingReport.id,
        analysis_mode: existingReport.analysis_mode,
        real_pose_detected: existingReport.real_pose_detected,
        findings_created: 0,
        key_frames_created: 0,
        skipped_report_update: true,
      });
    }

    let report;
    if (existingReport) {
      const { data, error } = await service
        .from('reports')
        .update(reportPayload)
        .eq('id', existingReport.id)
        .select('*')
        .single();
      if (error) throw error;
      report = data;
    } else {
      const { data, error } = await service
        .from('reports')
        .insert(reportPayload)
        .select('*')
        .single();
      if (error) throw error;
      report = data;
    }

    await service.from('video_uploads').update({ ai_report_id: report.id }).eq('id', upload.id);
    if (job) await service.from('ai_processing_jobs').update({ report_id: report.id }).eq('id', job.id);

    let findingsCreated = 0;
    if (!realPose) {
      const { error: deletePendingAiError } = await service
        .from('findings')
        .delete()
        .eq('report_id', report.id)
        .eq('source', 'ai')
        .eq('approval_status', 'pending');

      if (deletePendingAiError) throw deletePendingAiError;
    }

    if (realPose && Array.isArray(payload.findings)) {
      const { data: existingAiFindings, error: existingFindingsError } = await service
        .from('findings')
        .select('id,approval_status')
        .eq('report_id', report.id)
        .eq('source', 'ai');

      if (existingFindingsError) throw existingFindingsError;

      const hasCoachReviewedAiFindings = (existingAiFindings || []).some(
        (finding) => finding.approval_status !== 'pending'
      );

      if (!hasCoachReviewedAiFindings) {
        const { error: deletePendingError } = await service
          .from('findings')
          .delete()
          .eq('report_id', report.id)
          .eq('source', 'ai')
          .eq('approval_status', 'pending');

        if (deletePendingError) throw deletePendingError;

        const rows = payload.findings.map((finding) => ({
          club_id: upload.club_id,
          report_id: report.id,
          swimmer_id: upload.swimmer_id,
          video_upload_id: upload.id,
          source: 'ai',
          approval_status: 'pending',
          severity: normaliseSeverity(finding.severity),
          stroke_phase: finding.stroke_phase || finding.phase || null,
          timestamp_seconds: finding.timestamp_seconds ?? finding.timestamp_start ?? null,
          observation: finding.finding_description || finding.coach_sees || finding.finding_title || finding.finding_name || 'AI draft finding',
          why_it_matters: finding.why_it_matters || null,
          correction_cue: finding.recommended_correction || finding.cue || null,
          drill: finding.recommended_drill || finding.drill || null,
          next_focus: finding.next_focus || null,
          ai_confidence: finding.confidence_score ?? null,
          raw_ai_payload: finding,
        }));

        if (rows.length) {
          const { error } = await service.from('findings').insert(rows);
          if (error) throw error;
          findingsCreated = rows.length;
        }
      }
    }

    let keyFramesCreated = 0;
    const keyFrames = Array.isArray(payload.key_frames)
      ? payload.key_frames
      : Array.isArray(payload.key_moments)
      ? payload.key_moments
      : [];

    if (keyFrames.length) {
      const { error: deleteFramesError } = await service
        .from('key_frames')
        .delete()
        .eq('report_id', report.id)
        .eq('video_upload_id', upload.id);

      if (deleteFramesError) throw deleteFramesError;

      const keyFrameRows = keyFrames
        .filter((frame) => frame.timestamp != null || frame.timestamp_seconds != null)
        .map((frame) => ({
          club_id: upload.club_id,
          report_id: report.id,
          video_upload_id: upload.id,
          timestamp_seconds: frame.timestamp_seconds ?? frame.timestamp,
          label: frame.label || null,
          note: frame.description || frame.note || null,
        }));

      if (keyFrameRows.length) {
        const { error } = await service.from('key_frames').insert(keyFrameRows);
        if (error) throw error;
        keyFramesCreated = keyFrameRows.length;
      }
    }

    return sendJson(res, 200, {
      success: true,
      report_id: report.id,
      analysis_mode: analysisMode,
      real_pose_detected: realPose,
      findings_created: findingsCreated,
      key_frames_created: keyFramesCreated,
      manual_review_required: !realPose,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
