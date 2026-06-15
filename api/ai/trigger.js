import {
  COACH_ROLES,
  createServiceClient,
  getPublicAppUrl,
  handleApiError,
  normaliseAiServerUrl,
  readJsonBody,
  requireClubRole,
  requireUser,
  sendJson,
} from '../_lib/server.js';

const ACTIVE_JOB_STATUSES = [
  'queued',
  'accepted',
  'running',
  'downloading_video',
  'extracting_frames',
  'running_pose_detection',
  'analysing_stroke',
  'generating_outputs',
  'callback_sending',
];
const RETRYABLE_JOB_STATUSES = ['error', 'timed_out', 'retry_available', 'unreliable_pose', 'manual_review', 'manual_review_recommended'];
const RETRYABLE_VIDEO_STATUSES = ['uploaded', 'completed', 'unreliable_pose', 'error', 'manual_review'];
const INCOMPLETE_UPLOAD_STATUSES = ['preparing_upload', 'uploading', 'upload_failed'];
const PYTHON_SIGNED_URL_TTL_SECONDS = 15 * 60;
const AI_SERVER_TRIGGER_TIMEOUT_MS = 20 * 1000;
const DEFAULT_MAX_ATTEMPTS = 3;

function nowIso() {
  return new Date().toISOString();
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function stageEntry(stage, extra = {}) {
  return { stage, at: nowIso(), ...extra };
}

function appendStageHistory(existing, entry) {
  return [...asArray(existing), entry].slice(-80);
}

function maxExistingAttempt(existingJobs = []) {
  return Math.max(
    0,
    ...existingJobs.map((existingJob) => Number(
      existingJob.attempt_count
      ?? (existingJob.retry_count != null ? existingJob.retry_count + 1 : 0)
    ) || 0)
  );
}

function safeVideoState(upload, storageReady = false) {
  return {
    video_upload_id: upload?.id || null,
    processing_status: upload?.processing_status || null,
    upload_status: upload?.upload_status || null,
    storage_ready: storageReady,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  let job;
  let upload;
  let attemptCount = 0;
  let maxAttempts = DEFAULT_MAX_ATTEMPTS;

  try {
    const { user } = await requireUser(req);
    const { video_upload_id } = await readJsonBody(req);
    if (!video_upload_id) return sendJson(res, 400, { error: 'video_upload_id is required' });

    const service = createServiceClient();
    const { data: uploadRow, error: uploadError } = await service
      .from('video_uploads')
      .select('*')
      .eq('id', video_upload_id)
      .maybeSingle();

    if (uploadError) throw uploadError;
    if (!uploadRow) return sendJson(res, 404, { error: 'Video not found' });
    upload = uploadRow;

    await requireClubRole(service, upload.club_id, user.id, COACH_ROLES);

    if (!upload.stroke_type) {
      return sendJson(res, 400, {
        error: 'stroke_type is missing from this video. Configure the review before sending it for AI analysis.',
        ...safeVideoState(upload, Boolean((upload.file_bucket || upload.storage_bucket) && (upload.file_path || upload.storage_path))),
      });
    }

    const uploadStatus = upload.upload_status || (upload.processing_status === 'uploaded' ? 'uploaded' : null);
    if (INCOMPLETE_UPLOAD_STATUSES.includes(upload.processing_status) || INCOMPLETE_UPLOAD_STATUSES.includes(uploadStatus)) {
      return sendJson(res, 409, {
        error: uploadStatus === 'upload_failed' || upload.processing_status === 'upload_failed'
          ? 'This video upload failed before the private file was ready. Retry or delete the failed upload row before sending for AI Review.'
          : 'This video is still uploading. Wait until the upload is complete before sending it for AI Review.',
        ...safeVideoState(upload, false),
      });
    }

    const storageBucket = upload.file_bucket || upload.storage_bucket;
    const storagePath = upload.file_path || upload.storage_path;
    if (!storageBucket || !storagePath) {
      return sendJson(res, 422, {
        error: 'This video is missing its private storage location. Retry the upload before sending it for AI Review.',
        ...safeVideoState(upload, false),
      });
    }

    const { data: existingJobs, error: activeError } = await service
      .from('ai_processing_jobs')
      .select('*')
      .eq('video_upload_id', upload.id)
      .order('created_at', { ascending: false });

    if (activeError) throw activeError;
    const activeJobs = (existingJobs || []).filter((existingJob) => ACTIVE_JOB_STATUSES.includes(existingJob.status));
    if (activeJobs?.length) {
      const activeJob = activeJobs[0];
      await service
        .from('video_uploads')
        .update({ processing_status: 'pending_ai', ai_error_message: null })
        .eq('id', upload.id);

      return sendJson(res, 200, {
        success: true,
        duplicate_active_job: true,
        message: 'AI Review is already in progress for this video.',
        job: activeJob,
        server_job_id: activeJob.server_job_id || null,
        video_upload_id: upload.id,
        processing_status: 'pending_ai',
        stage: activeJob.stage || activeJob.status,
        retry_count: activeJob.retry_count || 0,
        attempt_count: activeJob.attempt_count ?? ((activeJob.retry_count || 0) + 1),
      });
    }

    if (!RETRYABLE_VIDEO_STATUSES.includes(upload.processing_status || 'uploaded')) {
      return sendJson(res, 409, {
        error: 'This video is not in a retryable state. Refresh the video library before trying again.',
        ...safeVideoState(upload, true),
      });
    }

    const latestJob = existingJobs?.[0] || null;
    const latestAttemptCount = maxExistingAttempt(existingJobs || []);
    maxAttempts = Number(latestJob?.max_attempts || DEFAULT_MAX_ATTEMPTS);

    if (latestJob && !RETRYABLE_JOB_STATUSES.includes(latestJob.status) && upload.processing_status !== 'uploaded') {
      return sendJson(res, 409, {
        error: 'The latest AI job is not retryable yet. Wait for it to finish or reset timed-out jobs.',
        job: latestJob,
        ...safeVideoState(upload, true),
      });
    }

    if (latestJob && RETRYABLE_JOB_STATUSES.includes(latestJob.status) && latestAttemptCount >= maxAttempts) {
      return sendJson(res, 409, {
        error: `AI Review has reached ${maxAttempts} attempts for this video. Continue with manual review, or ask an owner/admin to inspect the job history.`,
        job: latestJob,
        retryable: false,
        ...safeVideoState(upload, true),
      });
    }

    attemptCount = latestAttemptCount + 1;
    const retryCount = Math.max(0, attemptCount - 1);
    const queuedAt = nowIso();

    const { data: createdJob, error: createJobError } = await service
      .from('ai_processing_jobs')
      .insert({
        club_id: upload.club_id,
        video_upload_id: upload.id,
        status: 'queued',
        stage: 'queued',
        progress_percent: 0,
        stage_history: [stageEntry('queued', { attempt_count: attemptCount })],
        recommended_next_action: null,
        retry_count: retryCount,
        attempt_count: attemptCount,
        max_attempts: maxAttempts,
        last_attempt_at: queuedAt,
        retryable: true,
        callback_status: 'waiting',
        render_acceptance_status: 'pending',
        last_error: null,
        error_code: null,
        failed_at: null,
        timed_out_at: null,
        created_by: user.id,
      })
      .select('*')
      .single();

    if (createJobError) throw createJobError;
    job = createdJob;

    await service
      .from('video_uploads')
      .update({ processing_status: 'pending_ai', ai_error_message: null })
      .eq('id', upload.id);

    const { data: signed, error: signError } = await service
      .storage
      .from(storageBucket)
      .createSignedUrl(storagePath, PYTHON_SIGNED_URL_TTL_SECONDS);

    if (signError) {
      const error = new Error(`Could not create secure video URL for AI processing: ${signError.message}`);
      error.qualityFlags = ['signed_url_failed'];
      error.errorCode = 'signed_url_failed';
      throw error;
    }

    const aiProcessUrl = normaliseAiServerUrl();
    const callbackUrl = `${getPublicAppUrl(req)}/api/ai/callback`;
    const payload = {
      job_id: job.id,
      app_job_id: job.id,
      video_upload_id: upload.id,
      club_id: upload.club_id,
      swimmer_id: upload.swimmer_id,
      uploaded_by_user_id: upload.created_by,
      signed_video_url: signed.signedUrl,
      stroke_type: upload.stroke_type,
      analysis_type: upload.analysis_type || 'Technique Review',
      camera_angle: upload.camera_angle || 'Side',
      capture_source: upload.capture_source || null,
      review_context: upload.review_context || {},
      callback_url: callbackUrl,
      max_sampled_frames: 100,
      downscale_frames: true,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_SERVER_TRIGGER_TIMEOUT_MS);
    let aiResponse;
    try {
      aiResponse = await fetch(aiProcessUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (error) {
      if (error?.name === 'AbortError') {
        const timeoutError = new Error('AI server did not accept the job within 20 seconds. The uploaded video is saved; retry AI Review or continue manual review.');
        timeoutError.errorCode = 'render_acceptance_timeout';
        timeoutError.qualityFlags = ['render_acceptance_timeout'];
        throw timeoutError;
      }
      error.errorCode = error.errorCode || 'render_acceptance_failed';
      error.qualityFlags = error.qualityFlags || ['render_acceptance_failed'];
      throw error;
    } finally {
      clearTimeout(timeout);
    }
    const responseText = await aiResponse.text();
    let aiData;
    try {
      aiData = JSON.parse(responseText);
    } catch {
      aiData = { raw: responseText };
    }

    if (!aiResponse.ok || aiData?.accepted === false) {
      const message = `AI server rejected job (HTTP ${aiResponse.status}): ${aiData?.error || aiData?.detail || 'Unknown error'}`;
      const retryable = attemptCount < maxAttempts;
      await service.from('ai_processing_jobs').update({
        status: retryable ? 'retry_available' : 'error',
        stage: 'render_rejected',
        error_message: message,
        last_error: message,
        error_code: 'render_rejected',
        retryable,
        render_acceptance_status: `rejected:${aiResponse.status}`,
        recommended_next_action: retryable ? 'retry_ai_review_or_manual_review' : 'manual_review_recommended',
        quality_flags: ['render_rejected'],
        failed_at: nowIso(),
        completed_at: nowIso(),
        stage_history: appendStageHistory(job.stage_history, stageEntry('render_rejected', { http_status: aiResponse.status })),
      }).eq('id', job.id);
      await service.from('video_uploads').update({
        processing_status: 'error',
        ai_error_message: message,
      }).eq('id', upload.id);
      return sendJson(res, 502, { error: message });
    }

    const serverJobId = aiData?.job_id || aiData?.server_job_id || null;
    const { data: updatedJob, error: updateJobError } = await service
      .from('ai_processing_jobs')
      .update({
        status: 'accepted',
        server_job_id: serverJobId,
        stage: 'accepted',
        progress_percent: 5,
        stage_history: appendStageHistory(job.stage_history, stageEntry('accepted', {
          server_job_id: serverJobId,
          attempt_count: attemptCount,
        })),
        accepted_at: nowIso(),
        started_at: nowIso(),
        render_acceptance_status: 'accepted',
        callback_status: 'waiting',
        retryable: attemptCount < maxAttempts,
      })
      .eq('id', job.id)
      .select('*')
      .single();

    if (updateJobError) throw updateJobError;

    await service
      .from('video_uploads')
      .update({ processing_status: 'processing_ai' })
      .eq('id', upload.id);

    return sendJson(res, 200, {
      success: true,
      job: updatedJob,
      server_job_id: serverJobId,
      video_upload_id: upload.id,
      processing_status: 'processing_ai',
      stage: updatedJob.stage,
      retry_count: updatedJob.retry_count,
      attempt_count: updatedJob.attempt_count,
    });
  } catch (error) {
    if (job?.id || upload?.id) {
      try {
        const service = createServiceClient();
        if (job?.id) {
          const retryable = (job.attempt_count ?? attemptCount) < (job.max_attempts ?? maxAttempts);
          const errorCode = error.errorCode || (error.qualityFlags?.includes('signed_url_failed') ? 'signed_url_failed' : 'trigger_failed');
          await service.from('ai_processing_jobs').update({
            status: retryable ? 'retry_available' : 'error',
            stage: errorCode,
            quality_flags: error.qualityFlags || ['processing_error'],
            recommended_next_action: retryable ? 'retry_ai_review_or_manual_review' : 'manual_review_recommended',
            error_message: error.message,
            last_error: error.message,
            error_code: errorCode,
            retryable,
            render_acceptance_status: errorCode.startsWith('render_') ? 'failed' : job.render_acceptance_status || null,
            failed_at: nowIso(),
            completed_at: nowIso(),
            stage_history: appendStageHistory(job.stage_history, stageEntry(errorCode, {
              error_code: errorCode,
              retryable,
            })),
          }).eq('id', job.id);
        }
        if (upload?.id) {
          await service.from('video_uploads').update({
            processing_status: 'error',
            ai_error_message: error.message,
          }).eq('id', upload.id);
        }
      } catch {
        // Best-effort failure recording only.
      }
    }
    return handleApiError(res, error);
  }
}
