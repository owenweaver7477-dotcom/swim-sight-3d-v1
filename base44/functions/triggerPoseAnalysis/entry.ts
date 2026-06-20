import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ALLOWED_ROLES = ['owner', 'admin', 'coach'];

function envFlagEnabled(value: string | undefined | null) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function generateJobId() {
  return 'job_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
}

Deno.serve(async (req) => {
  let video_upload_id = null;
  let jobId = null;
  const base44 = createClientFromRequest(req);

  try {
    console.log('[triggerPoseAnalysis] Function started');

    // 1. Authenticate
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`[triggerPoseAnalysis] Authenticated user: ${user.id}`);

    const body = await req.json();
    video_upload_id = body.video_upload_id;
    console.log(`[triggerPoseAnalysis] Incoming video_upload_id: ${video_upload_id}`);

    if (!video_upload_id) {
      return Response.json({ error: 'video_upload_id is required' }, { status: 400 });
    }

    // 2. Load the VideoUpload record
    const upload = await base44.asServiceRole.entities.VideoUpload.get(video_upload_id);
    if (!upload) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }
    console.log(`[triggerPoseAnalysis] VideoUpload loaded: filename=${upload.original_filename}, stroke=${upload.stroke_type}, status=${upload.processing_status}`);

    if (!upload.file_uri) {
      return Response.json({ error: 'Video has no private file attached' }, { status: 400 });
    }

    // 3. Verify membership + role
    const memberships = await base44.asServiceRole.entities.ClubMember.filter({ user_id: user.id });
    const membership = memberships.find(m => m.club_id === upload.club_id);
    if (!membership) {
      return Response.json({ error: 'Forbidden: not a member of this club' }, { status: 403 });
    }
    if (!ALLOWED_ROLES.includes(membership.role)) {
      return Response.json({ error: 'Forbidden: insufficient role to trigger AI analysis' }, { status: 403 });
    }

    // This remains off unless production explicitly enables the safeguarding
    // gate after the consent process and records are ready.
    if (envFlagEnabled(Deno.env.get('REQUIRE_CONSENT')) && upload.swimmer_id) {
      const consentRecords = await base44.asServiceRole.entities.ConsentRecord.filter({
        swimmer_id: upload.swimmer_id,
      });
      const consent = consentRecords?.[0] || null;
      if (consent?.is_minor === true && consent.consent_status !== 'granted') {
        return Response.json({
          error: 'Guardian consent is required before this minor swimmer can be sent for AI Review. Open the swimmer consent step, record granted consent, then try again.',
          code: 'minor_guardian_consent_required',
          next_action: 'record_guardian_consent',
        }, { status: 409 });
      }
    }

    // 4. Validate stroke_type
    const strokeType = upload.stroke_type;
    if (!strokeType) {
      return Response.json(
        { error: 'stroke_type is missing from this video. Go to Configure Review, select the stroke, and click Start Analysis to save it before triggering AI.' },
        { status: 400 }
      );
    }

    // 5. Check existing in-progress jobs — prevent duplicate submissions
    const existingJobs = await base44.asServiceRole.entities.AIProcessingJob.filter({ video_upload_id });
    const activeJob = existingJobs.find(j => ['queued', 'downloading_video', 'extracting_frames', 'running_pose_detection', 'analysing_stroke', 'generating_outputs', 'callback_sending'].includes(j.status));
    if (activeJob) {
      console.log(`[triggerPoseAnalysis] Active job already exists: ${activeJob.job_id} status=${activeJob.status}`);
      return Response.json({
        success: false,
        error: 'An AI analysis job is already in progress for this video.',
        job_id: activeJob.job_id,
        status: activeJob.status,
      }, { status: 409 });
    }

    // 6. Determine retry count
    const retryCount = existingJobs.length;
    jobId = generateJobId();

    // 7. Create AIProcessingJob immediately (status: queued)
    const job = await base44.asServiceRole.entities.AIProcessingJob.create({
      club_id: upload.club_id,
      swimmer_id: upload.swimmer_id || null,
      video_upload_id: upload.id,
      analysis_session_id: upload.analysis_session_id || null,
      created_by: user.id,
      job_id: jobId,
      status: 'queued',
      stage: 'Queued for pose-assisted review',
      progress_percent: 0,
      message: 'Job accepted by Base44, sending to AI server…',
      primary_camera_angle: upload.camera_angle || null,
      retry_count: retryCount,
      callback_received: false,
    });
    console.log(`[triggerPoseAnalysis] AIProcessingJob created: ${job.id}, job_id=${jobId}`);

    // 8. Update VideoUpload → pending_ai (optimistic — before server call)
    await base44.asServiceRole.entities.VideoUpload.update(video_upload_id, {
      processing_status: 'pending_ai',
      ai_requested_at: new Date().toISOString(),
      ai_error_message: null,
    });

    // 9. Resolve AI_SERVER_URL
    const AI_SERVER_URL_RAW = Deno.env.get('AI_SERVER_URL');
    if (!AI_SERVER_URL_RAW) {
      await base44.asServiceRole.entities.AIProcessingJob.update(job.id, {
        status: 'error',
        error_message: 'AI_SERVER_URL secret is not configured.',
        failed_at: new Date().toISOString(),
      });
      await base44.asServiceRole.entities.VideoUpload.update(video_upload_id, { processing_status: 'error', ai_error_message: 'AI_SERVER_URL secret is not configured.' });
      return Response.json({ error: 'AI_SERVER_URL secret is not configured.' }, { status: 503 });
    }
    const AI_SERVER_BASE = AI_SERVER_URL_RAW.replace(/\/process-video$/, '').replace(/\/$/, '');
    const AI_PROCESS_URL = AI_SERVER_BASE + '/process-video';
    console.log(`[triggerPoseAnalysis] AI server process URL: ${AI_PROCESS_URL}`);

    // 10. Build callback URL
    const APP_ID = Deno.env.get('BASE44_APP_ID');
    const CALLBACK_URL = `https://base44.app/api/apps/${APP_ID}/functions/handlePoseAnalysisCallback`;
    console.log(`[triggerPoseAnalysis] callback_url: ${CALLBACK_URL}`);

    // 11. Generate signed video URL (only when triggering AI)
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri: upload.file_uri,
      expires_in: 3600,
    });
    console.log('[triggerPoseAnalysis] Signed video URL generated');

    // 12. Build payload for Python server
    const frameRate = (typeof upload.frame_rate === 'number' && upload.frame_rate > 0) ? upload.frame_rate : 30;
    const payload = {
      job_id: jobId,
      video_upload_id: upload.id,
      club_id: upload.club_id,
      swimmer_id: upload.swimmer_id || null,
      uploaded_by_user_id: upload.uploaded_by_user_id || null,
      signed_video_url: signed_url,
      stroke_type: strokeType,
      analysis_type: upload.analysis_type || 'Technique Review',
      camera_angle: upload.camera_angle || 'Side',
      frame_rate: frameRate,
      callback_url: CALLBACK_URL,
      // Performance hints
      max_sampled_frames: 100,
      downscale_frames: true,
    };
    console.log(`[triggerPoseAnalysis] POSTing to: ${AI_PROCESS_URL}, job_id=${jobId}`);

    // 13. POST to Python server — expect immediate acceptance response
    let aiResponse;
    let aiData;
    try {
      aiResponse = await fetch(AI_PROCESS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const aiText = await aiResponse.text();
      console.log(`[triggerPoseAnalysis] AI server response: status=${aiResponse.status}, body=${aiText}`);
      try { aiData = JSON.parse(aiText); } catch { aiData = { raw: aiText }; }
    } catch (fetchError) {
      console.error(`[triggerPoseAnalysis] Network error: ${fetchError.message}`);
      const errMsg = `Network error reaching AI server: ${fetchError.message}`;
      await base44.asServiceRole.entities.AIProcessingJob.update(job.id, {
        status: 'error', error_message: errMsg, failed_at: new Date().toISOString(),
      });
      await base44.asServiceRole.entities.VideoUpload.update(video_upload_id, {
        processing_status: 'error', ai_error_message: errMsg,
      });
      return Response.json({ error: errMsg }, { status: 502 });
    }

    // 14. Check server accepted the job
    if (!aiResponse.ok || aiData?.accepted === false) {
      const errMsg = `AI server rejected job (HTTP ${aiResponse.status}): ${aiData?.error || aiData?.detail || 'Unknown error'}`;
      console.error(`[triggerPoseAnalysis] ${errMsg}`);
      await base44.asServiceRole.entities.AIProcessingJob.update(job.id, {
        status: 'error', error_message: errMsg, failed_at: new Date().toISOString(),
      });
      await base44.asServiceRole.entities.VideoUpload.update(video_upload_id, {
        processing_status: 'error', ai_error_message: errMsg,
      });
      return Response.json({ error: errMsg }, { status: 502 });
    }

    // 15. Server accepted — update job with server_job_id and processing status
    const serverJobId = aiData?.job_id || null;
    await base44.asServiceRole.entities.AIProcessingJob.update(job.id, {
      status: 'downloading_video',
      server_job_id: serverJobId,
      stage: 'Downloading video securely',
      progress_percent: 5,
      message: 'Python server accepted job. Video downloading…',
      started_at: new Date().toISOString(),
    });

    await base44.asServiceRole.entities.VideoUpload.update(video_upload_id, {
      processing_status: 'processing',
      ai_started_at: new Date().toISOString(),
    });

    console.log(`[triggerPoseAnalysis] Success — server_job_id=${serverJobId}, status=processing`);

    return Response.json({
      success: true,
      job_id: jobId,
      server_job_id: serverJobId,
      video_upload_id,
      processing_status: 'processing',
      stage: 'downloading_video',
      message: 'AI job accepted. Processing in background.',
    });

  } catch (error) {
    console.error(`[triggerPoseAnalysis] Unhandled error: ${error.message}`);
    if (video_upload_id) {
      try {
        await base44.asServiceRole.entities.VideoUpload.update(video_upload_id, {
          processing_status: 'error',
          ai_error_message: error.message,
        });
      } catch (_) { /* best-effort */ }
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});
