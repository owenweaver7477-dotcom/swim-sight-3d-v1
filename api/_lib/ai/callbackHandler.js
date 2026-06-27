import { createServiceClient, handleApiError, isUuid, readJsonBody, sendJson } from '../server.js';
import { dispatchNextQueuedAIJob, markJobQueueComplete } from '../aiQueue.js';
import {
  METADATA_PROGRESS_STATUSES,
  buildSafeVideoProbeCallbackSummary,
  isMetadataProgressStatus,
  jobStatusForMetadataProgress,
} from './metadataCallback.js';
import {
  POSE_2D_PROGRESS_STATUSES,
  buildSafePose2DArtifactSummary,
  buildSafePose2DCallbackSummary,
  isPose2DProgressStatus,
  jobStatusForPose2DProgress,
} from './pose2dCallback.js';
import {
  POSE_3D_PROGRESS_STATUSES,
  buildSafePose3DArtifactSummary,
  buildSafePose3DCallbackSummary,
  isPose3DProgressStatus,
  jobStatusForPose3DProgress,
} from './pose3dCallback.js';

const MIN_DETECTION_RATIO_FOR_AI_FINDINGS = 0.55;
const MIN_KEYPOINTS_FOR_AI_FINDINGS = 12;
const MIN_FRAMES_FOR_AI_FINDINGS = 8;
const MIN_CONFIDENCE_FOR_AI_FINDING = 0.55;
const MAX_AI_FINDINGS_PER_REPORT = 5;
const FINDING_RELIABILITY_VALUES = ['reliable'];
const PROGRESS_STATUSES = [
  'accepted',
  'downloading_video',
  'extracting_frames',
  'running_pose_detection',
  'analysing_stroke',
  'generating_outputs',
  'callback_sending',
  ...METADATA_PROGRESS_STATUSES,
  ...POSE_2D_PROGRESS_STATUSES,
  ...POSE_3D_PROGRESS_STATUSES,
  'running',
  'queued',
];

function normaliseConfidence(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return numeric > 1 ? numeric / 100 : numeric;
}

function hasSubstantiveText(value, minLength = 16) {
  if (!value) return false;
  const text = String(value).trim();
  if (text.length < minLength) return false;
  return !/\b(placeholder|demo|test finding|unknown|n\/a)\b/i.test(text);
}

function findingObservation(finding) {
  return finding.finding_description
    || finding.coach_sees
    || finding.finding_title
    || finding.finding_name
    || finding.observation
    || '';
}

function findingCue(finding) {
  return finding.recommended_correction
    || finding.cue
    || finding.correction_cue
    || finding.next_focus
    || '';
}

function isActionableFinding(finding) {
  const observation = findingObservation(finding);
  const cue = findingCue(finding);
  const confidence = normaliseConfidence(finding.confidence_score ?? finding.ai_confidence);

  return (
    hasSubstantiveText(observation, 18)
    && hasSubstantiveText(cue, 8)
    && (confidence == null || confidence >= MIN_CONFIDENCE_FOR_AI_FINDING)
  );
}

function actionableFindings(payload) {
  const findings = Array.isArray(payload.findings) ? payload.findings : [];
  return findings.filter(isActionableFinding).slice(0, MAX_AI_FINDINGS_PER_REPORT);
}

function assessCallbackQuality(payload) {
  const findings = Array.isArray(payload.findings) ? payload.findings : [];
  const acceptedFindings = actionableFindings(payload);
  const detectionRatio = Number(payload.detection_ratio);
  const detectedKeypoints = Number(payload.detected_keypoints_count);
  const framesProcessed = Number(payload.frame_count_processed);
  const poseReliability = String(payload.pose_reliability || '').toLowerCase();

  const passed = (
    payload.analysis_mode === 'real_pose' &&
    payload.real_pose_detected === true &&
    FINDING_RELIABILITY_VALUES.includes(poseReliability) &&
    Number.isFinite(detectionRatio) &&
    detectionRatio >= MIN_DETECTION_RATIO_FOR_AI_FINDINGS &&
    (!Number.isFinite(detectedKeypoints) || detectedKeypoints >= MIN_KEYPOINTS_FOR_AI_FINDINGS) &&
    (!Number.isFinite(framesProcessed) || framesProcessed >= MIN_FRAMES_FOR_AI_FINDINGS) &&
    acceptedFindings.length > 0
  );

  return {
    passed,
    acceptedFindings,
    rejectedFindingCount: Math.max(0, findings.length - acceptedFindings.length),
    detectionRatio,
    detectedKeypoints,
    framesProcessed,
    poseReliability,
  };
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

function appendStageHistory(existing, entry) {
  const history = normaliseArray(existing);
  return [...history, entry].slice(-50);
}

function callbackStageEntry(payload, status, extra = {}) {
  return {
    stage: payload.stage || status,
    status,
    progress_percent: payload.progress_percent ?? null,
    at: new Date().toISOString(),
    ...extra,
  };
}

function buildQualityFlags(payload, callbackError, quality) {
  const flags = new Set(normaliseArray(payload.quality_flags));
  const findings = Array.isArray(payload.findings) ? payload.findings : [];
  const detectionRatio = quality.detectionRatio;
  const detectedKeypoints = quality.detectedKeypoints;
  const framesProcessed = quality.framesProcessed;

  if (callbackError) flags.add('processing_error');
  if (payload.analysis_mode !== 'real_pose' || payload.real_pose_detected !== true) flags.add('not_real_pose');
  if (!FINDING_RELIABILITY_VALUES.includes(quality.poseReliability)) flags.add('pose_reliability_not_coach_grade');
  if (Number.isFinite(detectionRatio) && detectionRatio < MIN_DETECTION_RATIO_FOR_AI_FINDINGS) flags.add('low_visibility');
  if (Number.isFinite(detectedKeypoints) && detectedKeypoints < 8) flags.add('low_keypoint_count');
  if (Number.isFinite(detectedKeypoints) && detectedKeypoints < MIN_KEYPOINTS_FOR_AI_FINDINGS) flags.add('insufficient_keypoint_coverage');
  if (Number.isFinite(framesProcessed) && framesProcessed < MIN_FRAMES_FOR_AI_FINDINGS) flags.add('too_few_frames_processed');
  if (!findings.length && !callbackError) flags.add('no_ai_findings_returned');
  if (findings.length && !quality.acceptedFindings.length) flags.add('no_actionable_findings');
  if (quality.rejectedFindingCount > 0) flags.add('findings_filtered_by_quality_gate');

  return Array.from(flags);
}

function safeCallbackSummary(payload, quality) {
  const videoProbeSummary = buildSafeVideoProbeCallbackSummary(payload);
  const pose2DSummary = buildSafePose2DCallbackSummary(payload);
  const pose2DArtifact = buildSafePose2DArtifactSummary(payload);
  const pose3DSummary = buildSafePose3DCallbackSummary(payload);
  const pose3DArtifact = buildSafePose3DArtifactSummary(payload);
  return {
    status: payload.status || null,
    analysis_mode: payload.analysis_mode || null,
    real_pose_detected: payload.real_pose_detected === true,
    quality_gate_passed: quality.passed,
    findings_count: Array.isArray(payload.findings) ? payload.findings.length : 0,
    actionable_findings_count: quality.acceptedFindings.length,
    filtered_findings_count: quality.rejectedFindingCount,
    key_frames_count: Array.isArray(payload.key_frames)
      ? payload.key_frames.length
      : Array.isArray(payload.key_moments)
      ? payload.key_moments.length
      : 0,
    detection_ratio: payload.detection_ratio ?? null,
    pose_reliability: payload.pose_reliability || null,
    recommended_next_action: payload.recommended_next_action || null,
    processing_tier: payload.processing_tier || null,
    source_width: payload.source_width ?? null,
    source_height: payload.source_height ?? null,
    processed_width: payload.processed_width ?? null,
    processed_height: payload.processed_height ?? null,
    processing_window_seconds: payload.processing_window_seconds ?? null,
    error_message: payload.error_message || null,
    requested_outputs: normaliseArray(payload.requested_outputs),
    completed_outputs: normaliseArray(payload.completed_outputs),
    skipped_outputs: Array.isArray(payload.skipped_outputs)
      ? payload.skipped_outputs.slice(0, 50).map((item) => ({ id: item?.id || null, reason: item?.reason || null }))
      : [],
    estimate_only_outputs: normaliseArray(payload.estimate_only_outputs),
    video_probe_summary: videoProbeSummary,
    pose_2d_summary: pose2DSummary,
    pose_artifact: pose2DArtifact,
    pose_3d_summary: pose3DSummary,
    pose_3d_artifact: pose3DArtifact,
  };
}

function mergeCallbackSummary(existingSummary, nextSummary) {
  const existing = existingSummary && typeof existingSummary === 'object' ? existingSummary : {};
  const next = nextSummary && typeof nextSummary === 'object' ? nextSummary : {};
  return {
    ...existing,
    ...next,
    video_probe_summary: next.video_probe_summary ?? existing.video_probe_summary ?? null,
    pose_2d_summary: next.pose_2d_summary ?? existing.pose_2d_summary ?? null,
    pose_artifact: next.pose_artifact ?? existing.pose_artifact ?? null,
    pose_3d_summary: next.pose_3d_summary ?? existing.pose_3d_summary ?? null,
    pose_3d_artifact: next.pose_3d_artifact ?? existing.pose_3d_artifact ?? null,
  };
}

function reportSafeReviewContext(value = {}) {
  const {
    athlete_profile_inputs: _athleteProfileInputs,
    athlete_profile_readiness: _athleteProfileReadiness,
    ...safeContext
  } = value || {};
  return safeContext;
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

  if (payload.server_job_id) {
    const { data, error } = await service
      .from('ai_processing_jobs')
      .select('*')
      .eq('server_job_id', payload.server_job_id)
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

    if (!job) {
      console.warn('AI callback received without matching job', {
        video_upload_id: videoUploadId,
        has_job_id: Boolean(payload.job_id || payload.app_job_id || payload.server_job_id),
        status: payload.status || null,
      });
    }

    const { data: upload, error: uploadError } = await service
      .from('video_uploads')
      .select('*')
      .eq('id', videoUploadId)
      .maybeSingle();

    if (uploadError) throw uploadError;
    if (!upload) return sendJson(res, 404, { error: 'VideoUpload not found' });

    const now = new Date().toISOString();
    const callbackStatus = String(payload.status || 'completed').toLowerCase();
    const protectedStatus = job?.queue_status || job?.status;
    const callbackIsCancellation = callbackStatus === 'cancelled';

    if (job && ['cancelled', 'timed_out'].includes(protectedStatus) && callbackStatus !== protectedStatus) {
      return sendJson(res, 200, {
        success: true,
        ignored: true,
        reason: `late_callback_after_${protectedStatus}`,
        job_id: job.id,
      });
    }

    if (job?.queue_status === 'cancel_requested' && !callbackIsCancellation) {
      return sendJson(res, 200, {
        success: true,
        ignored: true,
        reason: 'late_callback_after_cancel_requested',
        job_id: job.id,
      });
    }

    if (job && callbackIsCancellation) {
      await service.from('ai_processing_jobs').update({
        status: 'cancelled',
        queue_status: 'cancelled',
        stage: 'cancelled',
        progress_percent: 100,
        callback_received: true,
        callback_received_at: now,
        callback_status: 'cancelled',
        completed_at: now,
        retryable: false,
        error_code: 'cancelled_by_user',
        error_message: 'AI processing was cancelled. Continue with manual coach review.',
        recommended_next_action: 'manual_review_recommended',
        active_slot_claimed_at: null,
        lease_owner: null,
        lease_expires_at: null,
        stage_history: appendStageHistory(job.stage_history, callbackStageEntry(payload, 'cancelled')),
      }).eq('id', job.id);
      await service.from('video_uploads').update({
        processing_status: 'manual_review',
        ai_error_message: 'AI processing was cancelled. Continue with manual coach review.',
      }).eq('id', upload.id);
      await markJobQueueComplete(service, job, 'cancelled');
      try {
        await dispatchNextQueuedAIJob({ service, req, dispatcher: `callback-cancel:${job.id}` });
      } catch {
        // The cancellation remains final even if the next queued job waits.
      }
      return sendJson(res, 200, {
        success: true,
        cancelled: true,
        job_id: job.id,
        manual_review_required: true,
      });
    }

    const callbackError = ['error', 'failed', 'timed_out'].includes(callbackStatus);
    const progressOnly = PROGRESS_STATUSES.includes(callbackStatus) && !callbackError;
    const quality = assessCallbackQuality(payload);
    const qualityPass = quality.passed;
    const realPose = qualityPass;
    const qualityFlags = buildQualityFlags(payload, callbackError, quality);
    const jobStatus = callbackStatus === 'timed_out'
      ? 'timed_out'
      : callbackError
      ? 'error'
      : qualityPass
      ? 'completed'
      : 'manual_review_recommended';
    const videoStatus = callbackError ? 'error' : qualityPass ? 'completed' : 'manual_review';
    const reportStatus = callbackError ? 'error' : 'in_review';
    const analysisMode = qualityPass ? 'real_pose' : (payload.analysis_mode || (callbackError ? 'error' : 'manual_review'));
    const fallbackNextAction = qualityPass ? 'real_pose_review_ready' : 'manual_review_recommended';
    const callbackMessage = callbackError
      ? payload.error_message || 'AI processing failed. Manual coach review is required.'
      : payload.error_message || "The video did not pass Swim Sight's coach-grade AI quality gate. Manual coach review is recommended.";
    const unreliableMessage = qualityPass
      ? null
      : callbackMessage;

    if (progressOnly && job) {
      const existingSummary = job.callback_summary && typeof job.callback_summary === 'object'
        ? job.callback_summary
        : {};
      const progressDelta = safeCallbackSummary(payload, quality);
      const progressSummary = mergeCallbackSummary(existingSummary, progressDelta);
      const progressProbe = progressSummary.video_probe_summary;
      const progressMetadata = progressProbe?.videoMetadata || {};
      const metadataProgress = isMetadataProgressStatus(callbackStatus);
      const pose2DProgress = isPose2DProgressStatus(callbackStatus);
      const pose3DProgress = isPose3DProgressStatus(callbackStatus);
      const progressStatus = isMetadataProgressStatus(callbackStatus)
        ? jobStatusForMetadataProgress(callbackStatus)
        : pose2DProgress
        ? jobStatusForPose2DProgress(callbackStatus)
        : pose3DProgress
        ? jobStatusForPose3DProgress(callbackStatus)
        : callbackStatus === 'running'
        ? 'running'
        : callbackStatus;
      const progressQualityFlags = metadataProgress || pose2DProgress || pose3DProgress
        ? Array.from(new Set([...normaliseArray(payload.quality_flags), callbackStatus]))
        : qualityFlags;
      await service.from('ai_processing_jobs').update({
        status: progressStatus,
        queue_status: 'processing',
        stage: payload.stage || callbackStatus,
        progress_percent: payload.progress_percent ?? job.progress_percent ?? 0,
        pose_reliability: payload.pose_reliability || job.pose_reliability || null,
        quality_flags: progressQualityFlags,
        recommended_next_action: payload.recommended_next_action || job.recommended_next_action || null,
        detection_ratio: payload.detection_ratio ?? job.detection_ratio ?? null,
        frame_count_processed: payload.frame_count_processed ?? job.frame_count_processed ?? null,
        detected_keypoints_count: payload.detected_keypoints_count ?? job.detected_keypoints_count ?? null,
        stage_history: appendStageHistory(job.stage_history, callbackStageEntry(payload, callbackStatus)),
        analysis_mode: payload.analysis_mode || job.analysis_mode || null,
        video_duration_seconds: progressMetadata.durationSeconds ?? payload.video_duration_seconds ?? job.video_duration_seconds ?? null,
        video_fps: progressMetadata.fps ?? payload.video_fps ?? job.video_fps ?? null,
        started_at: job.started_at || now,
        callback_status: 'progress',
        callback_summary: progressSummary,
      }).eq('id', job.id);

      await service.from('video_uploads').update({
        processing_status: 'processing_ai',
        ai_error_message: null,
      }).eq('id', upload.id);

      return sendJson(res, 200, {
        success: true,
        progress_only: true,
        job_id: job.id,
        status: callbackStatus,
      });
    }

    await service.from('video_uploads').update({
      processing_status: videoStatus,
      ai_error_message: unreliableMessage,
    }).eq('id', upload.id);

    if (job) {
      const finalCallbackStatus = callbackStatus === 'timed_out'
        ? 'timed_out'
        : callbackError
        ? 'error'
        : qualityPass
        ? 'completed'
        : 'manual_review';
      const attemptCount = Number(job.attempt_count ?? ((job.retry_count || 0) + 1)) || 1;
      const maxAttempts = Number(job.max_attempts || 3) || 3;
      const retryable = !qualityPass && attemptCount < maxAttempts;
      const finalQueueStatus = callbackStatus === 'timed_out'
        ? 'timed_out'
        : callbackError
        ? (retryable ? 'retry_available' : 'failed')
        : qualityPass
        ? 'completed'
        : 'manual_review';
      await service.from('ai_processing_jobs').update({
        status: jobStatus,
        queue_status: finalQueueStatus,
        stage: callbackStatus === 'timed_out'
          ? 'timed_out'
          : callbackError
          ? 'error'
          : qualityPass
          ? 'completed'
          : 'manual_review_recommended',
        progress_percent: 100,
        pose_reliability: payload.pose_reliability || null,
        quality_flags: qualityFlags,
        recommended_next_action: payload.recommended_next_action || fallbackNextAction,
        detection_ratio: payload.detection_ratio ?? null,
        frame_count_processed: payload.frame_count_processed ?? null,
        detected_keypoints_count: payload.detected_keypoints_count ?? null,
        stage_history: appendStageHistory(payload.stage_history || job.stage_history, callbackStageEntry(
          payload,
          callbackError ? 'error' : qualityPass ? 'completed' : 'manual_review_recommended',
          { quality_gate_passed: qualityPass }
        )),
        error_message: unreliableMessage,
        last_error: callbackError ? unreliableMessage : null,
        error_code: callbackError ? (payload.error_code || 'worker_callback_error') : null,
        retryable,
        callback_received: true,
        callback_received_at: now,
        callback_status: finalCallbackStatus,
        completed_at: now,
        failed_at: callbackError ? now : null,
        timed_out_at: callbackStatus === 'timed_out' ? now : null,
        processing_duration_seconds: payload.processing_duration_seconds ?? null,
        analysis_mode: analysisMode,
        video_duration_seconds: payload.video_duration_seconds ?? null,
        video_fps: payload.video_fps ?? null,
        callback_summary: mergeCallbackSummary(job.callback_summary, safeCallbackSummary(payload, quality)),
        active_slot_claimed_at: null,
        lease_owner: null,
        lease_expires_at: null,
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
      real_pose_detected: qualityPass,
      overall_score: qualityPass ? payload.overall_score ?? null : null,
      phase_breakdown: qualityPass && payload.phase_breakdown ? payload.phase_breakdown : {},
      technical_summary: qualityPass ? payload.technical_summary || null : unreliableMessage,
      next_focus: qualityPass ? payload.next_focus || null : payload.recommended_next_action || fallbackNextAction,
      review_context: reportSafeReviewContext(upload.review_context || {}),
      created_by: upload.created_by,
    };

    const { data: existingReports, error: reportLookupError } = await service
      .from('reports')
      .select('*')
      .eq('video_upload_id', upload.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (reportLookupError) throw reportLookupError;

    const existingReport = (existingReports || []).find((report) => job?.id && report.ai_processing_job_id === job.id)
      || (existingReports || []).find((report) => !isCoachLockedReport(report.status))
      || null;
    if (existingReport && isCoachLockedReport(existingReport.status)) {
      let lockedReportNextDispatch = null;
      if (job) {
        try {
          lockedReportNextDispatch = await dispatchNextQueuedAIJob({
            service,
            req,
            dispatcher: `callback:${job.id}`,
          });
        } catch (dispatchError) {
          console.warn('AI callback skipped locked report update, but dispatch-next failed', {
            job_id: job.id,
            message: dispatchError?.message,
          });
        }
      }
      return sendJson(res, 200, {
        success: true,
        report_id: existingReport.id,
        analysis_mode: existingReport.analysis_mode,
        real_pose_detected: existingReport.real_pose_detected,
        findings_created: 0,
        key_frames_created: 0,
        skipped_report_update: true,
        next_dispatch_attempted: Boolean(lockedReportNextDispatch?.dispatched),
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
    if (!qualityPass) {
      const { error: deletePendingAiError } = await service
        .from('findings')
        .delete()
        .eq('report_id', report.id)
        .eq('source', 'ai')
        .eq('approval_status', 'pending');

      if (deletePendingAiError) throw deletePendingAiError;
    }

    if (qualityPass && quality.acceptedFindings.length) {
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

        const rows = quality.acceptedFindings.map((finding) => ({
          club_id: upload.club_id,
          report_id: report.id,
          swimmer_id: upload.swimmer_id,
          video_upload_id: upload.id,
          source: 'ai',
          approval_status: 'pending',
          severity: normaliseSeverity(finding.severity),
          stroke_phase: finding.stroke_phase || finding.phase || null,
          timestamp_seconds: finding.timestamp_seconds ?? finding.timestamp_start ?? null,
          observation: findingObservation(finding),
          why_it_matters: finding.why_it_matters || null,
          correction_cue: findingCue(finding),
          drill: finding.recommended_drill || finding.drill || null,
          next_focus: finding.next_focus || null,
          ai_confidence: normaliseConfidence(finding.confidence_score ?? finding.ai_confidence),
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

    let nextDispatch = null;
    if (job) {
      try {
        const finalAttemptCount = Number(job.attempt_count ?? ((job.retry_count || 0) + 1)) || 1;
        const finalMaxAttempts = Number(job.max_attempts || 3) || 3;
        const queueStatus = callbackStatus === 'timed_out'
          ? 'timed_out'
          : callbackError
          ? (finalAttemptCount < finalMaxAttempts ? 'retry_available' : 'failed')
          : qualityPass
          ? 'completed'
          : 'manual_review';
        await markJobQueueComplete(service, job, queueStatus);
        nextDispatch = await dispatchNextQueuedAIJob({
          service,
          req,
          dispatcher: `callback:${job.id}`,
        });
      } catch (dispatchError) {
        console.warn('AI callback completed, but dispatch-next failed', {
          job_id: job.id,
          message: dispatchError?.message,
        });
      }
    }

    return sendJson(res, 200, {
      success: true,
      report_id: report.id,
      analysis_mode: analysisMode,
      real_pose_detected: qualityPass,
      findings_created: findingsCreated,
      key_frames_created: keyFramesCreated,
      quality_gate_passed: qualityPass,
      quality_flags: qualityFlags,
      manual_review_required: !qualityPass,
      next_dispatch_attempted: Boolean(nextDispatch?.dispatched),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
