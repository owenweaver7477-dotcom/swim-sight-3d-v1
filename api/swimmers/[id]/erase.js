import {
  createServiceClient,
  handleApiError,
  readJsonBody,
  requireClubRole,
  requireUser,
  sendJson,
} from '../../_lib/server.js';
import {
  deleteArtifactPreviews,
  deleteRawFootageObject,
  deleteRowsByIds,
} from '../../_lib/dataDeletion.js';

const ERASURE_ROLES = ['owner', 'admin', 'coach'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  let deletionEventId = null;
  try {
    const { user } = await requireUser(req);
    const service = createServiceClient();
    const swimmerId = req.query.id;
    const body = await readJsonBody(req);
    if (body.confirm_erasure !== true) {
      return sendJson(res, 400, {
        error: 'Set confirm_erasure to true after confirming this request with the club.',
      });
    }

    const { data: swimmer, error: swimmerError } = await service
      .from('swimmers')
      .select('id,club_id')
      .eq('id', swimmerId)
      .maybeSingle();
    if (swimmerError) throw swimmerError;
    if (!swimmer) return sendJson(res, 404, { error: 'Swimmer not found' });
    await requireClubRole(service, swimmer.club_id, user.id, ERASURE_ROLES);

    const requestedAt = new Date().toISOString();
    const { data: event, error: eventError } = await service
      .from('data_deletion_events')
      .insert({
        club_id: swimmer.club_id,
        swimmer_id: swimmer.id,
        requested_by: user.id,
        request_reason: 'authenticated_erasure_request',
        status: 'requested',
        requested_at: requestedAt,
      })
      .select('id')
      .single();
    if (eventError) throw eventError;
    deletionEventId = event.id;

    await service.from('swimmers').update({
      data_erasure_requested_at: requestedAt,
      data_erasure_requested_by: user.id,
    }).eq('id', swimmer.id);

    const [{ data: uploads, error: uploadsError }, { data: reports, error: reportsError }, { data: annotations, error: annotationsError }] = await Promise.all([
      service.from('video_uploads').select('*').eq('swimmer_id', swimmer.id),
      service.from('reports').select('id,video_upload_id').eq('swimmer_id', swimmer.id),
      service.from('video_annotations').select('id,thumbnail_path').eq('swimmer_id', swimmer.id),
    ]);
    if (uploadsError) throw uploadsError;
    if (reportsError) throw reportsError;
    if (annotationsError) throw annotationsError;

    const uploadIds = (uploads || []).map((upload) => upload.id);
    const reportIds = (reports || []).map((report) => report.id);
    const rawResults = [];
    for (const upload of uploads || []) {
      if (upload.raw_footage_deleted_at) continue;
      rawResults.push(await deleteRawFootageObject(service, upload, {
        deletedAt: requestedAt,
        reason: 'authenticated_erasure_request',
        deletedBy: user.id,
      }));
    }

    const previewResult = await deleteArtifactPreviews(
      service,
      (annotations || []).map((annotation) => annotation.thumbnail_path)
    );

    const deletedCounts = {
      raw_footage: rawResults.filter((result) => result.success).length,
      artifact_previews: previewResult.deleted_count || 0,
      annotations: await deleteRowsByIds(service, 'video_annotations', 'id', (annotations || []).map((row) => row.id)),
      key_frames: await deleteRowsByIds(service, 'key_frames', 'report_id', reportIds),
      calibration_feedback: await deleteRowsByIds(service, 'ai_finding_feedback', 'report_id', reportIds),
      notification_logs: await deleteRowsByIds(service, 'notification_logs', 'report_id', reportIds),
      findings: await deleteRowsByIds(service, 'findings', 'report_id', reportIds),
      ai_jobs: await deleteRowsByIds(service, 'ai_processing_jobs', 'video_upload_id', uploadIds),
      shared_links: await deleteRowsByIds(service, 'shared_report_links', 'report_id', reportIds),
    };

    if (reportIds.length) {
      const { error: reportUpdateError } = await service.from('reports').update({
        status: 'draft',
        analysis_mode: null,
        real_pose_detected: false,
        overall_score: null,
        phase_breakdown: {},
        technical_summary: null,
        coach_summary: null,
        next_focus: null,
        review_context: {},
        is_deleted: true,
        data_erased_at: requestedAt,
      }).in('id', reportIds);
      if (reportUpdateError) throw reportUpdateError;
      deletedCounts.report_markers = reportIds.length;
    }

    if (uploadIds.length) {
      const { error: uploadUpdateError } = await service.from('video_uploads').update({
        ai_report_id: null,
        ai_error_message: null,
      }).in('id', uploadIds);
      if (uploadUpdateError) throw uploadUpdateError;
    }

    const { error: consentUpdateError } = await service.from('swimmer_consent_records').update({
      consent_status: 'withdrawn',
      guardian_name: null,
      guardian_email: null,
      consent_source: null,
      consent_withdrawn_at: requestedAt,
      updated_by: user.id,
    }).eq('swimmer_id', swimmer.id);
    if (consentUpdateError) throw consentUpdateError;

    const { error: swimmerUpdateError } = await service.from('swimmers').update({
      data_erased_at: requestedAt,
      swimmer_email: null,
      parent_email: null,
      notes: null,
    }).eq('id', swimmer.id);
    if (swimmerUpdateError) throw swimmerUpdateError;

    const storageFailures = rawResults.filter((result) => !result.success).length
      + (previewResult.success ? 0 : 1);
    const eventStatus = storageFailures ? 'partial' : 'completed';
    const { error: eventUpdateError } = await service.from('data_deletion_events').update({
      status: eventStatus,
      deleted_counts: deletedCounts,
      error_code: storageFailures ? 'one_or_more_storage_objects_not_deleted' : null,
      completed_at: requestedAt,
    }).eq('id', deletionEventId);
    if (eventUpdateError) throw eventUpdateError;

    return sendJson(res, storageFailures ? 207 : 200, {
      success: storageFailures === 0,
      status: eventStatus,
      deletion_event_id: deletionEventId,
      swimmer_id: swimmer.id,
      deleted_counts: deletedCounts,
      storage_failure_count: storageFailures,
      message: storageFailures
        ? 'Data erasure completed partially. An owner should retry the remaining private storage deletion.'
        : 'Private footage and AI artifacts were deleted. Audit markers were retained.',
    });
  } catch (error) {
    if (deletionEventId) {
      try {
        const service = createServiceClient();
        await service.from('data_deletion_events').update({
          status: 'failed',
          error_code: 'erasure_request_failed',
          completed_at: new Date().toISOString(),
        }).eq('id', deletionEventId);
      } catch {
        // Preserve the original safe API error.
      }
    }
    return handleApiError(res, error);
  }
}
