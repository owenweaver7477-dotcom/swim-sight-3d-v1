import {
  ADMIN_ROLES,
  createServiceClient,
  handleApiError,
  requireClubRole,
  requireUser,
  sendJson,
} from '../../../_lib/server.js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { user } = await requireUser(req);
    const inviteId = req.query?.id;
    if (!inviteId) return sendJson(res, 400, { error: 'Invite id is required.' });

    const service = createServiceClient();
    const { data: invite, error: fetchError } = await service
      .from('club_invites')
      .select('*')
      .eq('id', inviteId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!invite) return sendJson(res, 404, { error: 'Invite not found.' });

    await requireClubRole(service, invite.club_id, user.id, ADMIN_ROLES);

    const { data: updatedInvite, error: updateError } = await service
      .from('club_invites')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
      })
      .eq('id', invite.id)
      .select('*')
      .single();

    if (updateError) throw updateError;
    return sendJson(res, 200, { invite: updatedInvite });
  } catch (error) {
    return handleApiError(res, error);
  }
}
