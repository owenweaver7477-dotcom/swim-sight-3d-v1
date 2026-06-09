import {
  COACH_ROLES,
  createServiceClient,
  handleApiError,
  readJsonBody,
  requireClubRole,
  requireUser,
  sendJson,
} from '../../_lib/server.js';

const RECIPIENT_TYPES = ['swimmer', 'parent', 'coach', 'other'];
const DELIVERY_METHODS = ['manual_copy', 'email'];
const STATUSES = ['prepared', 'copied', 'sent', 'failed', 'skipped'];

function normalizeChoice(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { user } = await requireUser(req);
    const service = createServiceClient();
    const reportId = req.query.id;
    const body = await readJsonBody(req);

    const { data: report, error: reportError } = await service
      .from('reports')
      .select('id,club_id,swimmer_id,status,is_deleted')
      .eq('id', reportId)
      .eq('is_deleted', false)
      .maybeSingle();

    if (reportError) throw reportError;
    if (!report) return sendJson(res, 404, { error: 'Report not found' });

    await requireClubRole(service, report.club_id, user.id, COACH_ROLES);

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
    const status = normalizeChoice(body.status, STATUSES, deliveryMethod === 'email' ? 'skipped' : 'prepared');

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
  } catch (error) {
    return handleApiError(res, error);
  }
}
