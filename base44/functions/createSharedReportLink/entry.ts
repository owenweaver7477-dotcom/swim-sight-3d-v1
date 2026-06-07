import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const COACH_ROLES = ['owner', 'admin', 'coach'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report_id } = await req.json();
    if (!report_id) {
      return Response.json({ error: 'report_id is required' }, { status: 400 });
    }

    // Load the report
    let report = null;
    try {
      const reports = await base44.asServiceRole.entities.Report.filter({ id: report_id });
      report = reports[0];
    } catch { /* invalid id format */ }
    if (!report) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    // Verify the user belongs to the report's club with the right role
    const memberships = await base44.asServiceRole.entities.ClubMember.filter({
      club_id: report.club_id,
      user_id: user.id,
    });
    const membership = memberships[0];
    if (!membership || !COACH_ROLES.includes(membership.role)) {
      return Response.json({ error: 'Forbidden: coach role required' }, { status: 403 });
    }

    // Compute share eligibility from findings (same logic as AIReportPage)
    // Coach Approved = at least one approved finding AND zero pending findings
    // Rejected findings are allowed
    const allFindings = await base44.asServiceRole.entities.Finding.filter({ report_id });
    const approvedCount = allFindings.filter(f => f.approval_status === 'approved').length;
    const pendingCount = allFindings.filter(f => f.approval_status === 'pending').length;
    
    if (pendingCount > 0) {
      return Response.json({ error: `Report cannot be shared: ${pendingCount} finding${pendingCount !== 1 ? 's' : ''} still pending review. Please approve or reject all findings.` }, { status: 400 });
    }
    
    if (approvedCount === 0) {
      return Response.json({ error: 'Report cannot be shared: at least one finding must be approved.' }, { status: 400 });
    }

    // Prepare origin for URL construction
    const appId = Deno.env.get('BASE44_APP_ID') || '';
    const origin = req.headers.get('origin') || `https://${appId}.base44.app`;

    // Check for an existing active link BEFORE generating new token
    const existingLinks = await base44.asServiceRole.entities.SharedReportLink.filter({
      report_id,
      is_active: true,
    });
    if (existingLinks.length > 0) {
      const existing = existingLinks[0];
      const publicUrl = `${origin}/shared-report/${existing.token}`;
      return Response.json({
        success: true,
        share_link_id: existing.id,
        token: existing.token,
        public_url: publicUrl
      });
    }

    // Generate a secure random token (32 bytes = 64 hex chars)
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    // Create the SharedReportLink row
    const shareLink = await base44.asServiceRole.entities.SharedReportLink.create({
      club_id: report.club_id,
      report_id,
      swimmer_id: report.swimmer_id || '',
      token,
      created_by_user_id: user.id,
      is_active: true,
    });

    const publicUrl = `${origin}/shared-report/${token}`;

    return Response.json({
      success: true,
      share_link_id: shareLink.id,
      token: token,
      public_url: publicUrl
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});