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

const ACTIVE_JOB_STATUSES = ['queued', 'running'];

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

    const { data: activeJobs, error: activeError } = await service
      .from('ai_processing_jobs')
      .select('id,status,server_job_id')
      .eq('video_upload_id', upload.id)
      .in('status', ACTIVE_JOB_STATUSES);

    if (activeError) throw activeError;
    if (activeJobs?.length) {
      return sendJson(res, 409, {
        error: 'An AI analysis job is already in progress for this video.',
        job: activeJobs[0],
      });
    }

    const { data: signed, error: signError } = await service
      .storage
      .from(upload.file_bucket)
      .createSignedUrl(upload.file_path, 60 * 60);

    if (signError) throw signError;

    const { data: createdJob, error: createJobError } = await service
      .from('ai_processing_jobs')
      .insert({
        club_id: upload.club_id,
        video_upload_id: upload.id,
        status: 'queued',
        stage: 'Queued for pose-assisted review',
        progress_percent: 0,
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

    const aiResponse = await fetch(aiProcessUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
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
        status: 'running',
        server_job_id: serverJobId,
        stage: 'Python server accepted job',
        progress_percent: 5,
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
      video_upload_id: upload.id,
    });
  } catch (error) {
    if (job?.id || upload?.id) {
      try {
        const service = createServiceClient();
        if (job?.id) {
          await service.from('ai_processing_jobs').update({
            status: 'error',
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
