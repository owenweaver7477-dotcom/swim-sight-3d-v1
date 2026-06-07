import {
  ADMIN_ROLES,
  createServiceClient,
  handleApiError,
  readJsonBody,
  requireClubRole,
  requireUser,
  sendJson,
} from '../../_lib/server.js';
import { assertValidInviteRole, createAvailableInviteCode } from '../_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { user } = await requireUser(req);
    const body = await readJsonBody(req);
    const clubId = body.club_id;
    const role = body.role || 'coach';

    if (!clubId) return sendJson(res, 400, { error: 'club_id is required.' });
    assertValidInviteRole(role);

    const service = createServiceClient();
    const membership = await requireClubRole(service, clubId, user.id, ADMIN_ROLES);
    const isAppAdmin = membership?.role === 'app_admin';
    const memberRole = isAppAdmin ? 'owner' : membership.role;

    if (role === 'admin' && memberRole !== 'owner') {
      return sendJson(res, 403, { error: 'Only club owners can create admin invites.' });
    }

    if (role === 'owner') {
      return sendJson(res, 403, { error: 'Owner invites are not supported. Transfer ownership later from member management.' });
    }

    const code = await createAvailableInviteCode(service);
    const maxUses = body.max_uses === '' || body.max_uses == null ? null : Number(body.max_uses);
    if (maxUses != null && (!Number.isInteger(maxUses) || maxUses < 1)) {
      return sendJson(res, 400, { error: 'Max uses must be a positive whole number.' });
    }

    const expiresAt = body.expires_at ? new Date(body.expires_at) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return sendJson(res, 400, { error: 'Expiry date is invalid.' });
    }

    const { data: invite, error } = await service
      .from('club_invites')
      .insert({
        club_id: clubId,
        invite_code: code,
        role,
        email: body.email ? String(body.email).trim().toLowerCase() : null,
        swimmer_id: body.swimmer_id || null,
        max_uses: maxUses,
        expires_at: expiresAt ? expiresAt.toISOString() : null,
        is_active: true,
        use_count: 0,
        created_by: user.id,
      })
      .select('*')
      .single();

    if (error) throw error;
    return sendJson(res, 200, { invite });
  } catch (error) {
    return handleApiError(res, error);
  }
}
