import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Admin-only utility to reset VideoUpload records stuck in pending_ai
 * with no linked non-deleted Report. Resets them back to 'uploaded'
 * so the coach can retry AI analysis.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    console.log(`[resetStuckVideos] Called by admin user: ${user.id}`);

    // Find all videos stuck in pending_ai
    const stuckUploads = await base44.asServiceRole.entities.VideoUpload.filter({
      processing_status: 'pending_ai',
    });
    console.log(`[resetStuckVideos] Found ${stuckUploads.length} videos in pending_ai`);

    if (stuckUploads.length === 0) {
      return Response.json({ reset_count: 0, message: 'No stuck videos found.' });
    }

    // Find all non-deleted reports to check which uploads have one
    const allReports = await base44.asServiceRole.entities.Report.filter({ is_deleted: false });
    const reportedUploadIds = new Set(allReports.map(r => r.video_upload_id).filter(Boolean));

    const toReset = stuckUploads.filter(u => !reportedUploadIds.has(u.id));
    console.log(`[resetStuckVideos] ${toReset.length} stuck uploads have no linked report — will reset`);

    let resetCount = 0;
    for (const upload of toReset) {
      await base44.asServiceRole.entities.VideoUpload.update(upload.id, {
        processing_status: 'uploaded',
        ai_error_message: 'Reset from stuck AI processing state',
      });
      resetCount++;
      console.log(`[resetStuckVideos] Reset upload ${upload.id} (${upload.original_filename})`);
    }

    return Response.json({
      reset_count: resetCount,
      skipped_count: stuckUploads.length - resetCount,
      message: `Reset ${resetCount} stuck video(s) back to 'uploaded'.`,
    });

  } catch (error) {
    console.error(`[resetStuckVideos] Error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});