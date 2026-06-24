export const CLUB_ROLES = ['owner', 'admin', 'coach', 'assistant_coach', 'swimmer', 'parent'];
export const INVITE_MANAGE_ROLES = ['owner', 'admin'];

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function slugifyClubName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function createAvailableSlug(service, name) {
  const baseSlug = slugifyClubName(name) || 'club';

  for (let suffix = 0; suffix < 50; suffix += 1) {
    const slug = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
    const { data, error } = await service
      .from('clubs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return slug;
  }

  throw new Error('Could not create a unique club slug. Please try a more specific club name.');
}

export function generateInviteCode(length = 8) {
  return Array.from({ length }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
}

export async function createAvailableInviteCode(service) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = generateInviteCode();
    const { data, error } = await service
      .from('club_invites')
      .select('id')
      .eq('invite_code', code)
      .maybeSingle();

    if (error) throw error;
    if (!data) return code;
  }

  throw new Error('Could not generate a unique invite code. Please try again.');
}

export function normalizeInviteCode(code) {
  return String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isInviteUsable(invite) {
  if (!invite?.is_active || invite.revoked_at) return false;
  if (invite.expires_at && new Date(invite.expires_at).getTime() <= Date.now()) return false;
  if (invite.max_uses != null && Number(invite.use_count || 0) >= Number(invite.max_uses)) return false;
  return true;
}

export function assertValidInviteRole(role) {
  if (!CLUB_ROLES.includes(role)) {
    const error = new Error('Invalid invite role.');
    error.status = 400;
    throw error;
  }
}
