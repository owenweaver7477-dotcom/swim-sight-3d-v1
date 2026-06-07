import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const COACH_ROLES = ['owner', 'admin', 'coach'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { share_link_id } = await req.json();
    if (!share_link_id) {
      return Response.json({ error: 'share_link_id is required' }, { status: 400 });
    }

    // Load the share link
    let link = null;
    try {
      const links = await base44.asServiceRole.entities.SharedReportLink.filter({ id: share_link_id });
      link = links[0];
    } catch { /* invalid id format */ }
    if (!link) {
      return Response.json({ error: 'Share link not found' }, { status: 404 });
    }

    // Verify user belongs to the same club with coach role
    const memberships = await base44.asServiceRole.entities.ClubMember.filter({
      club_id: link.club_id,
      user_id: user.id,
    });
    const membership = memberships[0];
    if (!membership || !COACH_ROLES.includes(membership.role)) {
      return Response.json({ error: 'Forbidden: coach role required' }, { status: 403 });
    }

    // Disable the link
    await base44.asServiceRole.entities.SharedReportLink.update(share_link_id, { is_active: false });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});