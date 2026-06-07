import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Admin-only: Find AIProcessingJob records stuck in queued/running states
 * with no callback received after 10 minutes, and mark them as timed_out errors.
 * Also resets the linked VideoUpload back to 'uploaded' so the coach can retry.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    console.log(`[resetTimedOutAIJobs] Called by admin user: ${user.id}`);

    const RUNNING_STATUSES = [
      'queued',
      'downloading_video',
      'extracting_frames',
      'running_pose_detection',
      'analysing_stroke',
      'generating_outputs',
      'callback_sending',
    ];

    const TIMEOUT_MINUTES = 10;
    const now = new Date();

    // Fetch all non-terminal jobs (no club filter — admin sees all)
    const allJobs = await base44.asServiceRole.entities.AIProcessingJob.list('-created_date', 200);
    console.log(`[resetTimedOutAIJobs] Total jobs fetched: ${allJobs.length}`);

    const timedOut = allJobs.filter(job => {
      if (!RUNNING_STATUSES.includes(job.status)) return false;
      if (job.callback_received) return false;
      const ts = job.updated_date || job.created_date;
      if (!ts) return false;
      const ageMinutes = (now - new Date(ts)) / 60000;
      return ageMinutes >= TIMEOUT_MINUTES;
    });

    console.log(`[resetTimedOutAIJobs] Found ${timedOut.length} timed-out job(s)`);

    if (timedOut.length === 0) {
      return Response.json({ reset_count: 0, message: 'No timed-out jobs found.' });
    }

    let resetCount = 0;
    const resetDetails = [];

    for (const job of timedOut) {
      // 1. Mark job as error / timed_out
      await base44.asServiceRole.entities.AIProcessingJob.update(job.id, {
        status: 'error',
        stage: 'timed_out',
        progress_percent: 100,
        error_message: 'AI server did not return a callback before timeout.',
        recommended_next_action: 'manual_review_recommended',
        failed_at: now.toISOString(),
      });

      // 2. Reset linked VideoUpload back to 'uploaded' so coach can retry
      if (job.video_upload_id) {
        await base44.asServiceRole.entities.VideoUpload.update(job.video_upload_id, {
          processing_status: 'uploaded',
          ai_error_message: 'AI processing timed out. Video has been reset for retry.',
        });
      }

      resetCount++;
      resetDetails.push({
        job_id: job.job_id || job.id,
        video_upload_id: job.video_upload_id,
        previous_status: job.status,
        age_minutes: Math.round((now - new Date(job.updated_date || job.created_date)) / 60000),
      });

      console.log(`[resetTimedOutAIJobs] Reset job ${job.id} (was: ${job.status}, video: ${job.video_upload_id})`);
    }

    return Response.json({
      reset_count: resetCount,
      message: `Reset ${resetCount} timed-out job(s) to error/timed_out.`,
      details: resetDetails,
    });

  } catch (error) {
    console.error(`[resetTimedOutAIJobs] Error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});