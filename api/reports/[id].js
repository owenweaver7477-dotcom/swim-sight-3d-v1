import { COACH_ROLES, createServiceClient, handleApiError, requireClubRole, requireUser, sendJson } from '../_lib/server.js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { user } = await requireUser(req);
    const service = createServiceClient();
    const reportId = req.query.id;

    const { data: report, error: reportError } = await service
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .maybeSingle();

    if (reportError) throw reportError;
    if (!report) return sendJson(res, 404, { error: 'Report not found' });

    await requireClubRole(service, report.club_id, user.id, COACH_ROLES);

    const { error: deleteError } = await service
      .from('reports')
      .update({ is_deleted: true, status: 'draft' })
      .eq('id', report.id);

    if (deleteError) throw deleteError;

    await service
      .from('shared_report_links')
      .update({
        status: 'disabled',
        disabled_at: new Date().toISOString(),
        disabled_by: user.id,
      })
      .eq('report_id', report.id)
      .eq('status', 'active');

    if (report.video_upload_id) {
      await service
        .from('video_uploads')
        .update({
          processing_status: 'uploaded',
          ai_report_id: null,
          ai_error_message: 'AI report was deleted by coach. You can run AI analysis again.',
        })
        .eq('id', report.video_upload_id);
    }

    return sendJson(res, 200, { success: true, report_id: report.id });
  } catch (error) {
    return handleApiError(res, error);
  }
}
