import {
  COACH_ROLES,
  createServiceClient,
  handleApiError,
  requireClubRole,
  requireUser,
  sendJson,
} from '../../_lib/server.js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { user } = await requireUser(req);
    const service = createServiceClient();
    const linkId = req.query.id;

    const { data: link, error: linkError } = await service
      .from('shared_report_links')
      .select('*')
      .eq('id', linkId)
      .maybeSingle();

    if (linkError) throw linkError;
    if (!link) return sendJson(res, 404, { error: 'Share link not found' });

    await requireClubRole(service, link.club_id, user.id, COACH_ROLES);

    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await service
      .from('shared_report_links')
      .update({
        status: 'disabled',
        disabled_at: now,
        disabled_by: user.id,
      })
      .eq('id', link.id)
      .select('*')
      .single();

    if (updateError) throw updateError;

    return sendJson(res, 200, {
      success: true,
      share_link_id: updated.id,
      status: updated.status,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
