import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_ROLES = ['owner', 'admin', 'coach'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report_id, delete_reason } = await req.json();
    if (!report_id) {
      return Response.json({ error: 'report_id is required' }, { status: 400 });
    }

    // Load the report
    const reports = await base44.asServiceRole.entities.Report.filter({ id: report_id });
    const report = reports[0];
    if (!report) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    // Verify membership and role
    const memberships = await base44.asServiceRole.entities.ClubMember.filter({ user_id: user.id });
    const membership = memberships.find(m => m.club_id === report.club_id);
    if (!membership || !ALLOWED_ROLES.includes(membership.role)) {
      return Response.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 });
    }

    // Soft-delete the report
    await base44.asServiceRole.entities.Report.update(report_id, {
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
      delete_reason: delete_reason || null,
    });

    // Deactivate all shared links for this report
    const shareLinks = await base44.asServiceRole.entities.SharedReportLink.filter({ report_id });
    for (const link of shareLinks) {
      if (link.is_active) {
        await base44.asServiceRole.entities.SharedReportLink.update(link.id, { is_active: false });
      }
    }

    // Reset the linked video so coach can re-run AI analysis
    if (report.video_upload_id) {
      await base44.asServiceRole.entities.VideoUpload.update(report.video_upload_id, {
        processing_status: 'uploaded',
        ai_error_message: 'AI report was deleted by coach. You can run AI analysis again.',
      });
    }

    console.log(`[deleteAIReport] Report ${report_id} soft-deleted by user ${user.id}`);

    return Response.json({ success: true, report_id });
  } catch (error) {
    console.error(`[deleteAIReport] Error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});