import { getPublicAppUrl, normaliseAiServerUrl } from './server.js';
import { safeAnalysisJobForClient } from './ai/jobResponse.js';
import {
  DEFAULT_WORKER_SIGNED_READ_TTL_SECONDS,
  normaliseVideoStorageRecord,
} from '../../src/lib/storage/videoStorage.js';

export const RENDER_ACTIVE_JOB_STATUSES = [
  'accepted',
  'running',
  'downloading_video',
  'extracting_frames',
  'running_pose_detection',
  'analysing_stroke',
  'generating_outputs',
  'callback_sending',
];

export const DUPLICATE_BLOCKING_JOB_STATUSES = [
  'queued',
  ...RENDER_ACTIVE_JOB_STATUSES,
];

export const ACTIVE_QUEUE_STATUSES = ['dispatching', 'dispatched', 'processing'];
export const RETRYABLE_JOB_STATUSES = ['error', 'timed_out', 'retry_available', 'unreliable_pose', 'manual_review', 'manual_review_recommended'];

const PYTHON_SIGNED_URL_TTL_SECONDS = DEFAULT_WORKER_SIGNED_READ_TTL_SECONDS;
const DEFAULT_AI_SERVER_ACCEPTANCE_TIMEOUT_MS = 8 * 1000;
const DEFAULT_MAX_ACTIVE_AI_JOBS = 1;

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

export function appendStageHistory(existing, entry) {
  return [...asArray(existing), entry].slice(-80);
}

export function stageEntry(stage, extra = {}) {
  return { stage, at: nowIso(), ...extra };
}

export function getMaxActiveAIJobs() {
  const parsed = Number.parseInt(process.env.MAX_ACTIVE_AI_JOBS || '', 10);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return DEFAULT_MAX_ACTIVE_AI_JOBS;
}

export function getAIServerAcceptanceTimeoutMs() {
  const parsed = Number.parseInt(process.env.AI_SERVER_ACCEPTANCE_TIMEOUT_MS || '', 10);
  if (Number.isFinite(parsed) && parsed >= 2_000 && parsed <= 120_000) return parsed;
  return DEFAULT_AI_SERVER_ACCEPTANCE_TIMEOUT_MS;
}

function publicJob(job) {
  return safeAnalysisJobForClient(job);
}

async function refreshQueuePositions(service) {
  const { error } = await service.rpc('refresh_ai_queue_positions');
  if (error) throw error;
}

async function activeJobIds(service) {
  const ids = new Set();

  const { data: queueActive, error: queueError } = await service
    .from('ai_processing_jobs')
    .select('id')
    .in('queue_status', ACTIVE_QUEUE_STATUSES);
  if (queueError) throw queueError;
  (queueActive || []).forEach((row) => ids.add(row.id));

  const { data: statusActive, error: statusError } = await service
    .from('ai_processing_jobs')
    .select('id')
    .in('status', RENDER_ACTIVE_JOB_STATUSES);
  if (statusError) throw statusError;
  (statusActive || []).forEach((row) => ids.add(row.id));

  return ids;
}

export async function getAIQueueSummary(service, { clubId } = {}) {
  await refreshQueuePositions(service);
  const activeIds = await activeJobIds(service);

  const { count: globalQueuedCount, error: queuedError } = await service
    .from('ai_processing_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('queue_status', 'queued')
    .eq('status', 'queued');
  if (queuedError) throw queuedError;

  let clubQueuedCount = 0;
  let clubActiveCount = 0;
  let nextQueuedJob = null;

  if (clubId) {
    const { count, error } = await service
      .from('ai_processing_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .eq('queue_status', 'queued')
      .eq('status', 'queued');
    if (error) throw error;
    clubQueuedCount = count || 0;

    const clubActiveIds = new Set();
    const { data: clubQueueActive, error: clubQueueActiveError } = await service
      .from('ai_processing_jobs')
      .select('id')
      .eq('club_id', clubId)
      .in('queue_status', ACTIVE_QUEUE_STATUSES);
    if (clubQueueActiveError) throw clubQueueActiveError;
    (clubQueueActive || []).forEach((row) => clubActiveIds.add(row.id));

    const { data: clubStatusActive, error: clubStatusActiveError } = await service
      .from('ai_processing_jobs')
      .select('id')
      .eq('club_id', clubId)
      .in('status', RENDER_ACTIVE_JOB_STATUSES);
    if (clubStatusActiveError) throw clubStatusActiveError;
    (clubStatusActive || []).forEach((row) => clubActiveIds.add(row.id));

    clubActiveCount = clubActiveIds.size;

    const { data: nextJob, error: nextError } = await service
      .from('ai_processing_jobs')
      .select('id, video_upload_id, status, queue_status, queue_position, priority, queued_at, created_at')
      .eq('club_id', clubId)
      .eq('queue_status', 'queued')
      .eq('status', 'queued')
      .order('priority', { ascending: true })
      .order('queued_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (nextError) throw nextError;
    nextQueuedJob = nextJob ? publicJob(nextJob) : null;
  }

  return {
    max_active_ai_jobs: getMaxActiveAIJobs(),
    global_active_jobs: activeIds.size,
    global_queued_jobs: globalQueuedCount || 0,
    club_active_jobs: clubActiveCount,
    club_queued_jobs: clubQueuedCount,
    next_queued_job: nextQueuedJob,
  };
}

async function fetchJobAndUpload(service, jobId) {
  const { data: job, error: jobError } = await service
    .from('ai_processing_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();
  if (jobError) throw jobError;
  if (!job) return { job: null, upload: null };

  const { data: upload, error: uploadError } = await service
    .from('video_uploads')
    .select('*')
    .eq('id', job.video_upload_id)
    .maybeSingle();
  if (uploadError) throw uploadError;
  return { job, upload };
}

function cancellationProtected(job) {
  return ['cancel_requested', 'cancelled'].includes(job?.queue_status)
    || ['cancelled', 'timed_out'].includes(job?.status);
}

async function currentJob(service, jobId) {
  const { data, error } = await service
    .from('ai_processing_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function failDispatch(service, job, upload, error, errorCode = 'dispatch_failed') {
  const latestJob = await currentJob(service, job.id);
  if (cancellationProtected(latestJob)) {
    return {
      dispatched: false,
      failed: false,
      reason: 'cancelled_during_dispatch',
      job: publicJob(latestJob),
    };
  }
  const attemptCount = Number(job.attempt_count ?? ((job.retry_count || 0) + 1)) || 1;
  const maxAttempts = Number(job.max_attempts || 3) || 3;
  const retryable = attemptCount < maxAttempts;
  const message = error?.message || 'AI dispatch failed before the worker accepted the job.';
  const now = nowIso();

  const { data: updatedJob, error: updateError } = await service
    .from('ai_processing_jobs')
    .update({
      status: retryable ? 'retry_available' : 'error',
      queue_status: retryable ? 'retry_available' : 'failed',
      stage: errorCode,
      progress_percent: 100,
      dispatch_error: message,
      error_message: message,
      last_error: message,
      error_code: errorCode,
      retryable,
      render_acceptance_status: 'failed',
      recommended_next_action: retryable ? 'retry_ai_review_or_manual_review' : 'manual_review_recommended',
      quality_flags: [errorCode],
      failed_at: now,
      completed_at: now,
      active_slot_claimed_at: null,
      lease_owner: null,
      lease_expires_at: null,
      stage_history: appendStageHistory(job.stage_history, stageEntry(errorCode, {
        error_code: errorCode,
        retryable,
      })),
    })
    .eq('id', job.id)
    .eq('queue_status', 'dispatching')
    .select('*')
    .maybeSingle();
  if (updateError) throw updateError;
  if (!updatedJob) {
    const current = await currentJob(service, job.id);
    return {
      dispatched: false,
      failed: false,
      reason: cancellationProtected(current) ? 'cancelled_during_dispatch' : 'dispatch_state_changed',
      job: publicJob(current),
    };
  }

  if (upload?.id) {
    await service.from('video_uploads').update({
      processing_status: 'error',
      ai_error_message: message,
    }).eq('id', upload.id);
  }

  await refreshQueuePositions(service);

  return {
    dispatched: false,
    failed: true,
    job: publicJob(updatedJob),
    error: message,
    retryable,
  };
}

async function requeueDelayedAcceptance(service, job, upload) {
  const latestJob = await currentJob(service, job.id);
  if (cancellationProtected(latestJob)) {
    return {
      queued: false,
      dispatched: false,
      failed: false,
      reason: 'cancelled_during_dispatch',
      job: publicJob(latestJob),
    };
  }
  const now = nowIso();
  const message = 'The AI worker did not confirm acceptance yet. The job remains queued; continue manual coach review while it waits.';
  const { data: updatedJob, error: updateError } = await service
    .from('ai_processing_jobs')
    .update({
      status: 'queued',
      queue_status: 'queued',
      stage: 'worker_acceptance_delayed',
      progress_percent: 0,
      dispatch_error: message,
      error_message: null,
      last_error: message,
      error_code: 'worker_acceptance_delayed',
      retryable: true,
      render_acceptance_status: 'delayed',
      recommended_next_action: 'manual_review_available_while_queued',
      quality_flags: ['worker_acceptance_delayed'],
      active_slot_claimed_at: null,
      lease_owner: null,
      lease_expires_at: null,
      stage_history: appendStageHistory(job.stage_history, stageEntry('worker_acceptance_delayed', {
        retryable: true,
      })),
    })
    .eq('id', job.id)
    .eq('queue_status', 'dispatching')
    .select('*')
    .maybeSingle();
  if (updateError) throw updateError;
  if (!updatedJob) {
    const latestJob = await currentJob(service, job.id);
    return {
      dispatched: false,
      failed: false,
      reason: cancellationProtected(latestJob) ? 'cancelled_during_dispatch' : 'dispatch_state_changed',
      job: publicJob(latestJob),
    };
  }
  if (upload?.id) {
    await service.from('video_uploads').update({
      processing_status: 'pending_ai',
      ai_error_message: message,
    }).eq('id', upload.id);
  }
  await refreshQueuePositions(service);
  return {
    queued: true,
    dispatched: false,
    failed: false,
    reason: 'worker_acceptance_delayed',
    job: publicJob(updatedJob),
    retryable: true,
  };
}

async function dispatchClaimedJob({ service, req, job, upload }) {
  if (!job || !upload) {
    return { dispatched: false, failed: true, error: 'Queued AI job is missing its video upload.' };
  }

  const storage = normaliseVideoStorageRecord(upload);
  const storageBucket = storage.file_bucket;
  const storagePath = storage.video_storage_key;
  if (!storageBucket || !storagePath) {
    return failDispatch(
      service,
      job,
      upload,
      new Error('This video is missing its private storage location. Retry the upload before sending it for AI Review.'),
      'missing_private_storage'
    );
  }

  const { data: signed, error: signError } = await service
    .storage
    .from(storageBucket)
    .createSignedUrl(storagePath, PYTHON_SIGNED_URL_TTL_SECONDS);

  if (signError) {
    return failDispatch(
      service,
      job,
      upload,
      new Error(`Could not create secure video URL for AI processing: ${signError.message}`),
      'signed_url_failed'
    );
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
    storage_provider: storage.storage_provider,
    video_key: storage.video_storage_key,
    signed_video_url: signed.signedUrl,
    signed_video_url_expires_in_seconds: PYTHON_SIGNED_URL_TTL_SECONDS,
    stroke_type: upload.stroke_type,
    analysis_type: upload.analysis_type || 'Technique Review',
    camera_angle: upload.camera_angle || 'Side',
    capture_source: upload.capture_source || null,
    original_filename: upload.original_filename || null,
    file_size_bytes: upload.file_size_bytes ?? null,
    file_size_mb: upload.file_size_mb ?? (
      upload.file_size_bytes ? Number((Number(upload.file_size_bytes) / (1024 * 1024)).toFixed(2)) : null
    ),
    duration_seconds: upload.duration_seconds ?? null,
    review_context: upload.review_context || {},
    analysis_mode: upload.review_context?.analysis_mode || 'custom_report',
    selected_report_outputs: upload.review_context?.selected_report_outputs || [],
    athlete_profile_readiness: upload.review_context?.athlete_profile_readiness || {},
    estimate_only_outputs: upload.review_context?.estimate_only_outputs || [],
    estimated_credit_cost: upload.review_context?.estimated_credit_cost ?? null,
    coach_confirmed_draft_ai: upload.review_context?.coach_confirmed_draft_ai === true,
    swimmer_height_cm: upload.review_context?.athlete_profile_inputs?.approximate_height_cm ?? null,
    swimmer_mass_kg: upload.review_context?.athlete_profile_inputs?.body_mass_kg ?? null,
    calibration_available: upload.review_context?.athlete_profile_readiness?.calibration_available === true,
    pool_length_m: upload.review_context?.athlete_profile_inputs?.pool_length_m ?? null,
    callback_url: callbackUrl,
    max_sampled_frames: 100,
    downscale_frames: true,
  };

  await service.from('ai_processing_jobs').update({
    queue_status: 'dispatching',
    dispatch_attempted_at: nowIso(),
    dispatch_error: null,
    stage: 'dispatching',
    stage_history: appendStageHistory(job.stage_history, stageEntry('dispatching')),
  }).eq('id', job.id);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getAIServerAcceptanceTimeoutMs());
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
      return requeueDelayedAcceptance(service, job, upload);
    }
    return failDispatch(service, job, upload, error, 'render_acceptance_failed');
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
    return failDispatch(service, job, upload, new Error(message), 'render_rejected');
  }

  const serverJobId = aiData?.job_id || aiData?.server_job_id || null;
  const now = nowIso();
  const { data: updatedJob, error: updateError } = await service
    .from('ai_processing_jobs')
    .update({
      status: 'accepted',
      queue_status: 'dispatched',
      server_job_id: serverJobId,
      stage: 'accepted',
      progress_percent: 5,
      dispatch_error: null,
      dispatched_at: now,
      accepted_at: now,
      started_at: now,
      render_acceptance_status: 'accepted',
      callback_status: 'waiting',
      retryable: Number(job.attempt_count ?? 1) < Number(job.max_attempts || 3),
      stage_history: appendStageHistory(job.stage_history, stageEntry('accepted', {
        server_job_id: serverJobId,
        attempt_count: job.attempt_count,
      })),
    })
    .eq('id', job.id)
    .eq('queue_status', 'dispatching')
    .select('*')
    .maybeSingle();
  if (updateError) throw updateError;
  if (!updatedJob) {
    const latestJob = await currentJob(service, job.id);
    return {
      dispatched: false,
      failed: false,
      reason: cancellationProtected(latestJob) ? 'cancelled_during_dispatch' : 'dispatch_state_changed',
      job: publicJob(latestJob),
    };
  }

  await service
    .from('video_uploads')
    .update({ processing_status: 'processing_ai', ai_error_message: null })
    .eq('id', upload.id);

  await refreshQueuePositions(service);

  return {
    dispatched: true,
    failed: false,
    job: publicJob(updatedJob),
    server_job_id: serverJobId,
  };
}

export async function dispatchNextQueuedAIJob({ service, req, dispatcher = 'vercel' }) {
  const maxActive = getMaxActiveAIJobs();
  const { data: claimedJobId, error: claimError } = await service.rpc('claim_next_ai_job', {
    p_max_active: maxActive,
    p_dispatcher: dispatcher,
  });

  if (claimError) throw claimError;

  if (!claimedJobId) {
    const summary = await getAIQueueSummary(service);
    return {
      queued: summary.global_queued_jobs > 0,
      dispatched: false,
      failed: false,
      reason: summary.global_active_jobs >= maxActive ? 'capacity_full' : 'no_queued_jobs',
      summary,
    };
  }

  const { job, upload } = await fetchJobAndUpload(service, claimedJobId);
  return dispatchClaimedJob({ service, req, job, upload });
}

export async function markJobQueueComplete(service, job, queueStatus) {
  if (!job?.id) return;
  await service.from('ai_processing_jobs').update({
    queue_status: queueStatus,
    active_slot_claimed_at: null,
    lease_owner: null,
    lease_expires_at: null,
  }).eq('id', job.id);
  await refreshQueuePositions(service);
}
