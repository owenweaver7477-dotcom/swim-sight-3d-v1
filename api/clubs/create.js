import {
  createServiceClient,
  handleApiError,
  readJsonBody,
  requireUser,
  sendJson,
} from '../_lib/server.js';
import { createAvailableSlug } from '../_lib/clubsUtils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  let createdClubId = null;

  try {
    const { user } = await requireUser(req);
    const body = await readJsonBody(req);
    const name = String(body.name || '').trim();

    if (!name) {
      return sendJson(res, 400, { error: 'Club name is required.' });
    }

    const service = createServiceClient();
    const slug = await createAvailableSlug(service, name);

    const { data: club, error: clubError } = await service
      .from('clubs')
      .insert({
        name,
        slug,
        created_by: user.id,
      })
      .select('*')
      .single();

    if (clubError) throw clubError;
    createdClubId = club.id;

    const { data: membership, error: membershipError } = await service
      .from('club_members')
      .insert({
        club_id: club.id,
        user_id: user.id,
        role: 'owner',
      })
      .select('*')
      .single();

    if (membershipError) throw membershipError;

    return sendJson(res, 200, {
      club: { ...club, _memberRole: membership.role, _membershipId: membership.id, _member: membership },
      membership,
    });
  } catch (error) {
    if (createdClubId) {
      try {
        await createServiceClient().from('clubs').delete().eq('id', createdClubId);
      } catch {
        // Best-effort cleanup only.
      }
    }
    return handleApiError(res, error);
  }
}
