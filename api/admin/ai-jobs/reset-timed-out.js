import { ADMIN_ROLES, createServiceClient, handleApiError, readJsonBody, requireClubRole, requireUser, sendJson } from '../../_lib/server.js';

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

function appendStageHistory(existing, entry) {
  return [...asArray(existing), entry].slice(-80);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { user } = await requireUser(req);
    const { club_id, timeout_minutes = 10 } = await readJsonBody(req);
    const service = createServiceClient();

    if (!club_id) {
      return sendJson(res, 400, { error: 'club_id is required for V1 reset tools' });
    }

    await requireClubRole(service, club_id, user.id, ADMIN_ROLES);

    const cutoff = new Date(Date.now() - Number(timeout_minutes) * 60 * 1000).toISOString();
    const { data: jobs, error: jobsError } = await service
      .from('ai_processing_jobs')
      .select('*')
      .eq('club_id', club_id)
      .in('status', ACTIVE_JOB_STATUSES)
      .lt('updated_at', cutoff);

    if (jobsError) throw jobsError;
    if (!jobs?.length) return sendJson(res, 200, { reset_count: 0, details: [] });

    const now = new Date().toISOString();
    const details = [];

    for (const job of jobs) {
      const retryable = Number(job.attempt_count ?? ((job.retry_count || 0) + 1)) < Number(job.max_attempts || 3);
      await service.from('ai_processing_jobs').update({
        status: 'timed_out',
        stage: 'timed_out',
        progress_percent: 100,
        error_message: 'AI server did not return a callback before timeout.',
        last_error: 'AI server did not return a callback before timeout.',
        error_code: 'callback_timeout',
        retryable,
        timed_out_at: now,
        recommended_next_action: 'manual_review_recommended',
        quality_flags: ['callback_timeout'],
        callback_status: 'timed_out',
        completed_at: now,
        stage_history: appendStageHistory(job.stage_history, {
          stage: 'timed_out',
          status: 'timed_out',
          at: now,
          timeout_minutes: Number(timeout_minutes),
          retryable,
        }),
      }).eq('id', job.id);

      await service.from('video_uploads').update({
        processing_status: 'manual_review',
        ai_error_message: 'AI processing timed out. Retry AI Review or continue with manual coach review.',
      }).eq('id', job.video_upload_id);

      details.push({ job_id: job.id, video_upload_id: job.video_upload_id, previous_status: job.status });
    }

    return sendJson(res, 200, { reset_count: details.length, details });
  } catch (error) {
    return handleApiError(res, error);
  }
}
