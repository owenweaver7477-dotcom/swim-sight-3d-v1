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
const RETRYABLE_JOB_STATUSES = ['error', 'timed_out', 'unreliable_pose', 'manual_review_recommended'];
const RETRYABLE_VIDEO_STATUSES = ['uploaded', 'completed', 'unreliable_pose', 'error', 'manual_review'];
const INCOMPLETE_UPLOAD_STATUSES = ['preparing_upload', 'uploading', 'upload_failed'];
const PYTHON_SIGNED_URL_TTL_SECONDS = 15 * 60;
const AI_SERVER_TRIGGER_TIMEOUT_MS = 20 * 1000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  let job;
  let upload;

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
      });
    }

    const uploadStatus = upload.upload_status || (upload.processing_status === 'uploaded' ? 'uploaded' : null);
    if (INCOMPLETE_UPLOAD_STATUSES.includes(upload.processing_status) || INCOMPLETE_UPLOAD_STATUSES.includes(uploadStatus)) {
      return sendJson(res, 409, {
        error: uploadStatus === 'upload_failed' || upload.processing_status === 'upload_failed'
          ? 'This video upload failed before the private file was ready. Retry or delete the failed upload row before sending for AI Review.'
          : 'This video is still uploading. Wait until the upload is complete before sending it for AI Review.',
        processing_status: upload.processing_status,
        upload_status: upload.upload_status,
      });
    }

    const storageBucket = upload.file_bucket || upload.storage_bucket;
    const storagePath = upload.file_path || upload.storage_path;
    if (!storageBucket || !storagePath) {
      return sendJson(res, 422, {
        error: 'This video is missing its private storage location. Retry the upload before sending it for AI Review.',
      });
    }

    const { data: existingJobs, error: activeError } = await service
      .from('ai_processing_jobs')
      .select('id,status,server_job_id,retry_count,created_at')
      .eq('video_upload_id', upload.id)
      .order('created_at', { ascending: false });

    if (activeError) throw activeError;
    const activeJobs = (existingJobs || []).filter((existingJob) => ACTIVE_JOB_STATUSES.includes(existingJob.status));
    if (activeJobs?.length) {
      return sendJson(res, 409, {
        error: 'An AI analysis job is already in progress for this video.',
        job: activeJobs[0],
      });
    }

    if (!RETRYABLE_VIDEO_STATUSES.includes(upload.processing_status || 'uploaded')) {
      return sendJson(res, 409, {
        error: 'This video is not in a retryable state. Refresh the video library before trying again.',
        processing_status: upload.processing_status,
      });
    }

    const latestJob = existingJobs?.[0] || null;
    if (latestJob && !RETRYABLE_JOB_STATUSES.includes(latestJob.status) && upload.processing_status !== 'uploaded') {
      return sendJson(res, 409, {
        error: 'The latest AI job is not retryable yet. Wait for it to finish or reset timed-out jobs.',
        job: latestJob,
      });
    }

    const retryCount = Math.max(0, ...((existingJobs || []).map((existingJob) => existingJob.retry_count || 0))) + (existingJobs?.length ? 1 : 0);

    const { data: signed, error: signError } = await service
      .storage
      .from(storageBucket)
      .createSignedUrl(storagePath, PYTHON_SIGNED_URL_TTL_SECONDS);

    if (signError) {
      const error = new Error(`Could not create secure video URL for AI processing: ${signError.message}`);
      error.qualityFlags = ['signed_url_expired'];
      throw error;
    }

    const { data: createdJob, error: createJobError } = await service
      .from('ai_processing_jobs')
      .insert({
        club_id: upload.club_id,
        video_upload_id: upload.id,
        status: 'queued',
        stage: 'queued',
        progress_percent: 0,
        stage_history: [{ stage: 'queued', at: new Date().toISOString() }],
        recommended_next_action: null,
        retry_count: retryCount,
        created_by: user.id,
      })
      .select('*')
      .single();

    if (createJobError) throw createJobError;
    job = createdJob;

    await service
      .from('video_uploads')
      .update({ processing_status: 'queued_ai', ai_error_message: null })
      .eq('id', upload.id);

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
        throw new Error('AI server did not accept the job within 20 seconds. The uploaded video is saved; retry AI Review or continue manual review.');
      }
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
      await service.from('ai_processing_jobs').update({
        status: 'error',
        stage: 'AI server rejected job',
        error_message: message,
        completed_at: new Date().toISOString(),
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
        stage_history: [
          ...(Array.isArray(job.stage_history) ? job.stage_history : []),
          { stage: 'accepted', at: new Date().toISOString(), server_job_id: serverJobId },
        ],
        started_at: new Date().toISOString(),
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
    });
  } catch (error) {
    if (job?.id || upload?.id) {
      try {
        const service = createServiceClient();
        if (job?.id) {
          await service.from('ai_processing_jobs').update({
            status: 'error',
            stage: error.qualityFlags?.includes('signed_url_expired') ? 'signed_url_expired' : 'error',
            quality_flags: error.qualityFlags || ['processing_error'],
            recommended_next_action: 'manual_review_recommended',
            error_message: error.message,
            completed_at: new Date().toISOString(),
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
