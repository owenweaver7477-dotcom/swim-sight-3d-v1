export const ANALYSIS_JOB_STATUSES = [
  'created',
  'pending',
  'queued',
  'processing',
  'completed',
  'failed',
  'cancelled',
];

const ACTIVE_STATUSES = new Set([
  'accepted',
  'running',
  'downloading_video',
  'extracting_frames',
  'running_pose_detection',
  'analysing_stroke',
  'generating_outputs',
  'callback_sending',
]);

const FAILED_STATUSES = new Set([
  'error',
  'failed',
  'retry_available',
  'timed_out',
  'unreliable_pose',
  'manual_review',
  'manual_review_recommended',
]);

const SAFE_ERROR_BY_CODE = {
  callback_timeout: 'AI-assisted analysis took too long. Manual coach review is still available.',
  cancelled_by_user: 'AI cancellation was requested. Continue with manual coach review.',
  missing_private_storage: 'This video is missing its private upload file. Re-upload the clip or continue manual review.',
  render_acceptance_failed: 'AI worker is temporarily unavailable. You can still complete a manual coach review.',
  render_rejected: 'AI-assisted analysis could not start. Manual coach review is still available.',
  signed_url_failed: 'The private video link could not be prepared for AI processing. Continue manual review or retry later.',
  trigger_failed: 'AI-assisted analysis could not start. Manual coach review is still available.',
  worker_acceptance_delayed: 'AI worker acceptance is delayed. Manual coach review is available while the job waits.',
  video_decode_failed: 'The video could not be processed. Please check the clip quality or continue with manual review.',
  video_download_failed: 'The video could not be loaded by the AI worker. Continue with manual coach review or retry later.',
};

const DEFAULT_FAILED_USER_MESSAGE = 'AI-assisted analysis could not complete. Manual coach review is still available.';

export function normaliseAnalysisJobStatus(job = {}) {
  const queueStatus = job.queue_status || null;
  const status = job.status || null;

  if (queueStatus === 'cancel_requested') return 'processing';
  if (queueStatus === 'cancelled' || status === 'cancelled') return 'cancelled';
  if (status === 'completed') return 'completed';
  if (queueStatus === 'queued' || status === 'queued') return 'queued';
  if (queueStatus === 'dispatching' || queueStatus === 'dispatched' || queueStatus === 'processing') return 'processing';
  if (ACTIVE_STATUSES.has(status)) return 'processing';
  if (FAILED_STATUSES.has(queueStatus) || FAILED_STATUSES.has(status)) return 'failed';
  if (status === 'created') return 'created';
  return 'pending';
}

export function safeUserErrorForJob(job = {}) {
  const state = normaliseAnalysisJobStatus(job);
  if (!['failed', 'cancelled'].includes(state)) return null;
  if (job.error_code && SAFE_ERROR_BY_CODE[job.error_code]) return SAFE_ERROR_BY_CODE[job.error_code];
  if (state === 'cancelled') return SAFE_ERROR_BY_CODE.cancelled_by_user;
  return DEFAULT_FAILED_USER_MESSAGE;
}

export function safeAnalysisOutput(callbackSummary) {
  if (!callbackSummary || typeof callbackSummary !== 'object') return null;
  return {
    status: callbackSummary.status || null,
    quality_gate_passed: callbackSummary.quality_gate_passed === true,
    findings_count: callbackSummary.findings_count ?? null,
    actionable_findings_count: callbackSummary.actionable_findings_count ?? null,
    filtered_findings_count: callbackSummary.filtered_findings_count ?? null,
    requested_outputs: Array.isArray(callbackSummary.requested_outputs) ? callbackSummary.requested_outputs : [],
    completed_outputs: Array.isArray(callbackSummary.completed_outputs) ? callbackSummary.completed_outputs : [],
    skipped_outputs: Array.isArray(callbackSummary.skipped_outputs) ? callbackSummary.skipped_outputs : [],
    video_probe_summary: callbackSummary.video_probe_summary || null,
    pose_2d_summary: callbackSummary.pose_2d_summary || null,
    pose_3d_summary: callbackSummary.pose_3d_summary || null,
  };
}

export function safeAnalysisJobForClient(job = {}) {
  const analysisJobStatus = normaliseAnalysisJobStatus(job);
  const userError = safeUserErrorForJob(job);
  return {
    id: job.id || null,
    job_id: job.id || null,
    video_upload_id: job.video_upload_id || null,
    swimmer_id: job.swimmer_id || null,
    club_id: job.club_id || null,
    coach_id: job.coach_id || job.created_by || null,
    requested_by_user_id: job.requested_by_user_id || job.created_by || null,
    status: job.status || null,
    analysis_job_status: analysisJobStatus,
    queue_status: job.queue_status || null,
    queue_position: job.queue_position ?? null,
    stage: job.stage || null,
    progress_label: job.progress_label || job.stage || null,
    progress_percent: job.progress_percent ?? 0,
    attempt_count: job.attempt_count ?? null,
    retry_count: job.retry_count ?? 0,
    max_attempts: job.max_attempts ?? null,
    retryable: job.retryable !== false,
    requested_outputs: Array.isArray(job.requested_outputs) ? job.requested_outputs : [],
    analysis_options: job.analysis_options || null,
    worker_provider: job.worker_provider || 'render',
    result_report_id: job.result_report_id || job.report_id || null,
    report_id: job.report_id || null,
    server_job_id: job.server_job_id || null,
    user_error: userError,
    user_error_message: userError,
    developer_error_present: Boolean(job.last_error || job.dispatch_error),
    analysis_output: safeAnalysisOutput(job.callback_summary),
    created_at: job.created_at || job.created_date || null,
    updated_at: job.updated_at || job.updated_date || null,
    queued_at: job.queued_at || null,
    started_at: job.started_at || job.accepted_at || null,
    completed_at: job.completed_at || null,
    failed_at: job.failed_at || job.timed_out_at || null,
  };
}

export function safeAnalysisJobResponse(job, extra = {}) {
  const safeJob = safeAnalysisJobForClient(job);
  return {
    job_id: safeJob.id,
    status: safeJob.analysis_job_status,
    job: safeJob,
    user_error: safeJob.user_error,
    user_error_message: safeJob.user_error_message,
    manual_review_available: true,
    ...extra,
  };
}
