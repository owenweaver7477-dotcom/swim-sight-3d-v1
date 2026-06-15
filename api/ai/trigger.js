import {
  COACH_ROLES,
  createServiceClient,
  handleApiError,
  readJsonBody,
  requireClubRole,
  requireUser,
  sendJson,
} from '../_lib/server.js';
import {
  DUPLICATE_BLOCKING_JOB_STATUSES,
  RETRYABLE_JOB_STATUSES,
  appendStageHistory,
  dispatchNextQueuedAIJob,
  getAIQueueSummary,
  stageEntry,
} from '../_lib/aiQueue.js';

const RETRYABLE_VIDEO_STATUSES = ['uploaded', 'completed', 'unreliable_pose', 'error', 'manual_review'];
const INCOMPLETE_UPLOAD_STATUSES = ['preparing_upload', 'uploading', 'upload_failed'];
const DEFAULT_MAX_ATTEMPTS = 3;

function nowIso() {
  return new Date().toISOString();
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
    const activeJobs = (existingJobs || []).filter((existingJob) => (
      DUPLICATE_BLOCKING_JOB_STATUSES.includes(existingJob.status)
      || ['queued', 'dispatching', 'dispatched', 'processing'].includes(existingJob.queue_status)
    ));
    if (activeJobs?.length) {
      const activeJob = activeJobs[0];
      await service
        .from('video_uploads')
        .update({ processing_status: 'pending_ai', ai_error_message: null })
        .eq('id', upload.id);

      return sendJson(res, 200, {
        success: true,
        queued: activeJob.queue_status === 'queued' || activeJob.status === 'queued',
        dispatched: ['accepted', 'running'].includes(activeJob.status) || ['dispatching', 'dispatched', 'processing'].includes(activeJob.queue_status),
        duplicate_active_job: true,
        message: activeJob.queue_status === 'queued' || activeJob.status === 'queued'
          ? 'This video is already queued for AI Review.'
          : 'AI Review is already in progress for this video.',
        job: activeJob,
        server_job_id: activeJob.server_job_id || null,
        video_upload_id: upload.id,
        processing_status: 'pending_ai',
        stage: activeJob.stage || activeJob.status,
        queue_status: activeJob.queue_status || null,
        queue_position: activeJob.queue_position ?? null,
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
        queue_status: 'queued',
        priority: 5,
        queued_at: queuedAt,
        queued_reason: retryCount > 0 ? 'coach_retry_requested' : 'coach_requested_ai_review',
        concurrency_group: 'default',
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

    const dispatchResult = await dispatchNextQueuedAIJob({
      service,
      req,
      dispatcher: `trigger:${job.id}`,
    });

    const { data: currentJob, error: currentJobError } = await service
      .from('ai_processing_jobs')
      .select('*')
      .eq('id', job.id)
      .single();
    if (currentJobError) throw currentJobError;

    if (dispatchResult.failed && dispatchResult.job?.id === job.id) {
      return sendJson(res, 502, {
        error: dispatchResult.error || 'AI dispatch failed before the worker accepted the job.',
        queued: false,
        dispatched: false,
        job: currentJob,
        video_upload_id: upload.id,
        processing_status: 'error',
        queue_status: currentJob.queue_status || null,
        retryable: currentJob.retryable !== false,
      });
    }

    const queued = currentJob.queue_status === 'queued' || currentJob.status === 'queued';
    const dispatched = dispatchResult.dispatched && dispatchResult.job?.id === job.id;
    const summary = await getAIQueueSummary(service, { clubId: upload.club_id });

    return sendJson(res, 200, {
      success: true,
      queued,
      dispatched,
      message: dispatched
        ? 'AI Review started.'
        : 'Queued for AI Review. Swim Sight 3D will send this video when the AI worker has capacity.',
      job: currentJob,
      server_job_id: currentJob.server_job_id || null,
      video_upload_id: upload.id,
      processing_status: dispatched ? 'processing_ai' : 'pending_ai',
      stage: currentJob.stage,
      queue_status: currentJob.queue_status || null,
      queue_position: currentJob.queue_position ?? null,
      retry_count: currentJob.retry_count,
      attempt_count: currentJob.attempt_count,
      max_active_ai_jobs: summary.max_active_ai_jobs,
      global_active_jobs: summary.global_active_jobs,
      global_queued_jobs: summary.global_queued_jobs,
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
            queue_status: retryable ? 'retry_available' : 'failed',
            stage: errorCode,
            quality_flags: error.qualityFlags || ['processing_error'],
            recommended_next_action: retryable ? 'retry_ai_review_or_manual_review' : 'manual_review_recommended',
            error_message: error.message,
            last_error: error.message,
            error_code: errorCode,
            dispatch_error: error.message,
            retryable,
            render_acceptance_status: errorCode.startsWith('render_') ? 'failed' : job.render_acceptance_status || null,
            failed_at: nowIso(),
            completed_at: nowIso(),
            active_slot_claimed_at: null,
            lease_owner: null,
            lease_expires_at: null,
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
