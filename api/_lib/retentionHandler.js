import {
  ADMIN_ROLES,
  createServiceClient,
  handleApiError,
  readJsonBody,
  requireClubRole,
  requireUser,
  sendJson,
} from './server.js';
import { deleteRawFootageObject } from './dataDeletion.js';
import {
  COMPLETED_REPORT_STATUSES,
  footageRetentionDays,
  selectUploadsDueForDeletion,
} from './safeguarding.js';

function cronAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  const authorization = req.headers.authorization || req.headers.Authorization || '';
  return Boolean(secret && authorization === `Bearer ${secret}`);
}

export async function handleRetentionCleanup(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const service = createServiceClient();
    let clubId = null;
    let requestedBy = null;
    if (req.method === 'GET') {
      if (!process.env.CRON_SECRET) {
        return sendJson(res, 503, { error: 'Scheduled retention requires CRON_SECRET.' });
      }
      if (!cronAuthorized(req)) return sendJson(res, 401, { error: 'Unauthorized' });
    } else {
      const { user } = await requireUser(req);
      const body = await readJsonBody(req);
      clubId = body.club_id;
      if (!clubId) return sendJson(res, 400, { error: 'club_id is required' });
      await requireClubRole(service, clubId, user.id, ADMIN_ROLES);
      requestedBy = user.id;
    }

    let uploadQuery = service
      .from('video_uploads')
      .select('*')
      .is('raw_footage_deleted_at', null)
      .limit(500);
    if (clubId) uploadQuery = uploadQuery.eq('club_id', clubId);
    const { data: uploads, error: uploadsError } = await uploadQuery;
    if (uploadsError) throw uploadsError;

    const uploadIds = (uploads || []).map((upload) => upload.id);
    let completedVideoIds = new Set();
    if (uploadIds.length) {
      const { data: completedReports, error: reportsError } = await service
        .from('reports')
        .select('video_upload_id')
        .in('video_upload_id', uploadIds)
        .in('status', Array.from(COMPLETED_REPORT_STATUSES))
        .eq('is_deleted', false);
      if (reportsError) throw reportsError;
      completedVideoIds = new Set(
        (completedReports || []).map((report) => report.video_upload_id).filter(Boolean)
      );
    }

    const retentionDays = footageRetentionDays(process.env.FOOTAGE_RETENTION_DAYS);
    const due = selectUploadsDueForDeletion(uploads || [], {
      now: new Date(),
      retentionDays,
      completedVideoIds,
    });
    const deletedAt = new Date().toISOString();
    const results = [];
    for (const { upload, reason } of due) {
      results.push(await deleteRawFootageObject(service, upload, {
        deletedAt,
        reason,
        deletedBy: requestedBy,
      }));
    }

    return sendJson(res, 200, {
      success: results.every((result) => result.success),
      retention_days: retentionDays,
      scanned_count: uploads?.length || 0,
      due_count: due.length,
      deleted_count: results.filter((result) => result.success).length,
      failed_count: results.filter((result) => !result.success).length,
      results,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
