import {
  createServiceClient,
  handleApiError,
  readJsonBody,
  requireUser,
  sendJson,
} from '../_lib/server.js';
import { isInviteUsable, normalizeInviteCode } from '../_lib/clubsUtils.js';

const INVALID_INVITE_MESSAGE = 'Invite code not found, expired, or no longer active.';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { user } = await requireUser(req);
    const { invite_code } = await readJsonBody(req);
    const code = normalizeInviteCode(invite_code);

    if (!code) {
      return sendJson(res, 400, { error: 'Please enter an invite code.' });
    }

    const service = createServiceClient();
    const { data: invite, error: inviteError } = await service
      .from('club_invites')
      .select('*')
      .eq('invite_code', code)
      .maybeSingle();

    if (inviteError) throw inviteError;
    if (!invite || !isInviteUsable(invite)) {
      return sendJson(res, 404, { error: INVALID_INVITE_MESSAGE });
    }

    const { data: club, error: clubError } = await service
      .from('clubs')
      .select('*')
      .eq('id', invite.club_id)
      .maybeSingle();

    if (clubError) throw clubError;
    if (!club) return sendJson(res, 404, { error: INVALID_INVITE_MESSAGE });

    const { data: existingMember, error: existingError } = await service
      .from('club_members')
      .select('*')
      .eq('club_id', invite.club_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existingMember) {
      return sendJson(res, 200, {
        already_member: true,
        message: 'You are already a member of this club.',
        club: {
          ...club,
          _memberRole: existingMember.role,
          _membershipId: existingMember.id,
          _member: existingMember,
        },
        membership: existingMember,
      });
    }

    const { data: membership, error: memberError } = await service
      .from('club_members')
      .insert({
        club_id: invite.club_id,
        user_id: user.id,
        role: invite.role,
        linked_swimmer_id: invite.swimmer_id || null,
      })
      .select('*')
      .single();

    if (memberError) throw memberError;

    const { error: updateError } = await service
      .from('club_invites')
      .update({
        use_count: Number(invite.use_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', invite.id);

    if (updateError) throw updateError;

    return sendJson(res, 200, {
      already_member: false,
      club: { ...club, _memberRole: membership.role, _membershipId: membership.id, _member: membership },
      membership,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
