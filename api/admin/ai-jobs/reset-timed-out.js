import { ADMIN_ROLES, createServiceClient, handleApiError, readJsonBody, requireClubRole, requireUser, sendJson } from '../../_lib/server.js';

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
      .in('status', ['queued', 'running'])
      .lt('updated_at', cutoff);

    if (jobsError) throw jobsError;
    if (!jobs?.length) return sendJson(res, 200, { reset_count: 0, details: [] });

    const now = new Date().toISOString();
    const details = [];

    for (const job of jobs) {
      await service.from('ai_processing_jobs').update({
        status: 'error',
        stage: 'timed_out',
        progress_percent: 100,
        error_message: 'AI server did not return a callback before timeout.',
        recommended_next_action: 'manual_review_recommended',
        completed_at: now,
      }).eq('id', job.id);

      await service.from('video_uploads').update({
        processing_status: 'uploaded',
        ai_error_message: 'AI processing timed out. Video has been reset for retry.',
      }).eq('id', job.video_upload_id);

      details.push({ job_id: job.id, video_upload_id: job.video_upload_id, previous_status: job.status });
    }

    return sendJson(res, 200, { reset_count: details.length, details });
  } catch (error) {
    return handleApiError(res, error);
  }
}
