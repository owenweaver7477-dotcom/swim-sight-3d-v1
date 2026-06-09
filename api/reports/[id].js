import {
  COACH_ROLES,
  createServiceClient,
  handleApiError,
  readJsonBody,
  requireClubRole,
  requireUser,
  sendJson,
} from '../_lib/server.js';

const RECIPIENT_TYPES = ['swimmer', 'parent', 'coach', 'other'];
const DELIVERY_METHODS = ['manual_copy', 'email'];
const DELIVERY_STATUSES = ['prepared', 'copied', 'sent', 'failed', 'skipped'];

function normalizeChoice(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

async function handleDeliveryLog(req, res, service, user, report) {
  const body = await readJsonBody(req);
  if (body.action && body.action !== 'log_delivery') {
    return sendJson(res, 400, { error: 'Unsupported report action.' });
  }

  const shareLinkId = body.shared_report_link_id || null;
  if (shareLinkId) {
    const { data: link, error: linkError } = await service
      .from('shared_report_links')
      .select('id,club_id,report_id,status')
      .eq('id', shareLinkId)
      .maybeSingle();

    if (linkError) throw linkError;
    if (!link || link.club_id !== report.club_id || link.report_id !== report.id || link.status !== 'active') {
      return sendJson(res, 400, { error: 'Active shared report link is required for delivery logging.' });
    }
  }

  const deliveryMethod = normalizeChoice(body.delivery_method, DELIVERY_METHODS, 'manual_copy');
  const status = normalizeChoice(body.status, DELIVERY_STATUSES, deliveryMethod === 'email' ? 'skipped' : 'prepared');

  if (deliveryMethod === 'email' && status === 'sent') {
    return sendJson(res, 400, {
      error: 'Email delivery is not configured. Use manual copy delivery for now.',
    });
  }

  const { data: log, error: insertError } = await service
    .from('notification_logs')
    .insert({
      club_id: report.club_id,
      report_id: report.id,
      swimmer_id: body.swimmer_id || report.swimmer_id || null,
      shared_report_link_id: shareLinkId,
      recipient_email: body.recipient_email ? String(body.recipient_email).trim().toLowerCase() : null,
      recipient_type: normalizeChoice(body.recipient_type, RECIPIENT_TYPES, 'other'),
      delivery_method: deliveryMethod,
      status,
      error_message: body.error_message || null,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
      created_by: user.id,
    })
    .select('*')
    .single();

  if (insertError) throw insertError;

  return sendJson(res, 200, {
    success: true,
    notification_log: log,
    email_configured: false,
    message: 'Manual delivery action logged. No email was sent.',
  });
}

export default async function handler(req, res) {
  if (!['DELETE', 'POST'].includes(req.method)) {
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

    if (req.method === 'POST') {
      return handleDeliveryLog(req, res, service, user, report);
    }

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
