import { randomBytes } from 'node:crypto';
import {
  COACH_ROLES,
  createServiceClient,
  getPublicAppUrl,
  handleApiError,
  requireClubRole,
  requireUser,
  sendJson,
} from '../../_lib/server.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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
      .eq('is_deleted', false)
      .maybeSingle();

    if (reportError) throw reportError;
    if (!report) return sendJson(res, 404, { error: 'Report not found' });

    await requireClubRole(service, report.club_id, user.id, COACH_ROLES);

    const { data: findings, error: findingsError } = await service
      .from('findings')
      .select('id,approval_status')
      .eq('report_id', report.id);

    if (findingsError) throw findingsError;

    const pendingCount = (findings || []).filter((finding) => finding.approval_status === 'pending').length;
    const shareableStatuses = ['coach_approved', 'finalised', 'published', 'shared'];

    if (!shareableStatuses.includes(report.status)) {
      return sendJson(res, 400, {
        error: 'Report must be finalised by a coach before it can be shared.',
      });
    }

    if (pendingCount > 0) {
      return sendJson(res, 400, {
        error: `Report cannot be shared: ${pendingCount} finding${pendingCount === 1 ? '' : 's'} still pending review.`,
      });
    }

    const { data: existing, error: existingError } = await service
      .from('shared_report_links')
      .select('*')
      .eq('report_id', report.id)
      .eq('status', 'active')
      .limit(1);

    if (existingError) throw existingError;
    const activeLink = existing?.[0];
    const origin = getPublicAppUrl(req);

    if (activeLink) {
      return sendJson(res, 200, {
        success: true,
        share_link_id: activeLink.id,
        token: activeLink.token,
        public_url: `${origin}/shared-report/${activeLink.token}`,
      });
    }

    const token = randomBytes(32).toString('hex');
    const { data: link, error: createError } = await service
      .from('shared_report_links')
      .insert({
        club_id: report.club_id,
        report_id: report.id,
        token,
        status: 'active',
        created_by: user.id,
      })
      .select('*')
      .single();

    if (createError) throw createError;

    await service
      .from('reports')
      .update({ status: 'shared' })
      .eq('id', report.id);

    return sendJson(res, 200, {
      success: true,
      share_link_id: link.id,
      token,
      public_url: `${origin}/shared-report/${token}`,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
