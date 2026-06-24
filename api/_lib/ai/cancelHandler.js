import {
  COACH_ROLES,
  createServiceClient,
  handleApiError,
  normaliseAiServerUrl,
  readJsonBody,
  requireClubRole,
  requireUser,
  sendJson,
} from '../server.js';
import { dispatchNextQueuedAIJob } from '../aiQueue.js';

const FINAL_STATUSES = new Set(['completed', 'error', 'timed_out', 'cancelled', 'manual_review', 'manual_review_recommended']);
const FINAL_QUEUE_STATUSES = new Set(['completed', 'failed', 'timed_out', 'cancelled', 'manual_review']);

function appendStageHistory(existing, entry) {
  const history = Array.isArray(existing) ? existing : [];
  return [...history, entry].slice(-80);
}

function workerCancelUrl(jobId) {
  const processUrl = normaliseAiServerUrl();
  return `${processUrl.replace(/\/process-video$/, '')}/jobs/${encodeURIComponent(jobId)}/cancel`;
}

async function requestWorkerCancellation(job) {
  const secret = process.env.AI_WEBHOOK_SECRET;
  if (!secret) throw new Error('AI cancellation is not configured on the server.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(workerCancelUrl(job.server_job_id || job.id), {
      method: 'POST',
      headers: { 'x-ai-worker-secret': secret },
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.detail || 'The AI worker could not confirm cancellation.');
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

  try {
    const { user } = await requireUser(req);
    const { job_id } = await readJsonBody(req);
    if (!job_id) return sendJson(res, 400, { error: 'job_id is required' });

    const service = createServiceClient();
    const { data: job, error: jobError } = await service
      .from('ai_processing_jobs')
      .select('*')
      .eq('id', job_id)
      .maybeSingle();
    if (jobError) throw jobError;
    if (!job) return sendJson(res, 404, { error: 'AI job not found' });

    await requireClubRole(service, job.club_id, user.id, COACH_ROLES);

    if (FINAL_STATUSES.has(job.status) || FINAL_QUEUE_STATUSES.has(job.queue_status)) {
      return sendJson(res, 200, {
        success: true,
        job_id: job.id,
        status: job.queue_status || job.status,
        message: 'This AI job is already in a final state. Manual coach review remains available.',
      });
    }

    const now = new Date().toISOString();
    const queuedOnly = job.status === 'queued' && job.queue_status === 'queued';
    let workerStatus = queuedOnly ? 'cancelled' : 'cancel_requested';
    let workerWarning = null;

    if (!queuedOnly) {
      try {
        const workerResult = await requestWorkerCancellation(job);
        workerStatus = workerResult.status === 'cancelled' ? 'cancelled' : 'cancel_requested';
      } catch (error) {
        workerWarning = error?.name === 'AbortError'
          ? 'The AI worker did not confirm cancellation in time.'
          : error.message;
      }
    }

    const cancelled = queuedOnly || workerStatus === 'cancelled';
    const update = {
      queue_status: cancelled ? 'cancelled' : 'cancel_requested',
      stage: cancelled ? 'cancelled' : 'cancel_requested',
      progress_percent: cancelled ? 100 : (job.progress_percent || 0),
      recommended_next_action: 'manual_review_recommended',
      retryable: false,
      callback_status: cancelled ? 'cancelled' : 'cancel_requested',
      error_code: 'cancelled_by_user',
      error_message: 'AI cancellation requested. Continue with manual coach review.',
      last_error: workerWarning,
      completed_at: cancelled ? now : job.completed_at,
      active_slot_claimed_at: cancelled ? null : job.active_slot_claimed_at,
      lease_owner: cancelled ? null : job.lease_owner,
      lease_expires_at: cancelled ? null : job.lease_expires_at,
      stage_history: appendStageHistory(job.stage_history, {
        stage: cancelled ? 'cancelled' : 'cancel_requested',
        status: cancelled ? 'cancelled' : 'cancel_requested',
        at: now,
      }),
    };
    if (cancelled) update.status = 'cancelled';

    const { error: updateError } = await service.from('ai_processing_jobs').update(update).eq('id', job.id);
    if (updateError) throw updateError;

    await service.from('video_uploads').update({
      processing_status: 'manual_review',
      ai_error_message: 'AI cancellation requested. Continue with manual coach review.',
    }).eq('id', job.video_upload_id);

    if (cancelled) {
      try {
        await dispatchNextQueuedAIJob({ service, req, dispatcher: `cancel:${job.id}` });
      } catch {
        // Cancellation remains valid even if the next queued dispatch must wait.
      }
    }

    return sendJson(res, 200, {
      success: true,
      job_id: job.id,
      status: cancelled ? 'cancelled' : 'cancel_requested',
      message: workerWarning
        ? 'Manual review is available. The worker did not confirm cancellation, so any late result will be ignored.'
        : 'AI cancellation requested. Continue with manual coach review.',
      worker_confirmation_pending: Boolean(workerWarning),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
