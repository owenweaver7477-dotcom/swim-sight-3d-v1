import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { token } = await req.json();
    if (!token) {
      return Response.json({ error: 'Invalid link' }, { status: 400 });
    }

    // Find the shared link by token (client-side filtering since token is unique)
    const allLinks = await base44.asServiceRole.entities.SharedReportLink.list('created_date', 100);
    const shareLink = allLinks.find(link => link.token === token);

    if (!shareLink) {
      return Response.json({ error: 'Report not found or link expired' }, { status: 404 });
    }

    if (!shareLink.is_active) {
      return Response.json({ error: 'This share link has been disabled' }, { status: 403 });
    }

    // Check expiry
    if (shareLink.expires_at) {
      const expiry = new Date(shareLink.expires_at);
      if (expiry < new Date()) {
        return Response.json({ error: 'This share link has expired' }, { status: 403 });
      }
    }

    // Update last viewed
    await base44.asServiceRole.entities.SharedReportLink.update(shareLink.id, {
      last_viewed_at: new Date().toISOString()
    });

    // Load linked report
    const reports = await base44.asServiceRole.entities.Report.filter({ id: shareLink.report_id });
    const report = reports[0];
    if (!report || report.is_deleted) {
      return Response.json({ error: 'Report not found or link expired' }, { status: 404 });
    }

    // Load swimmer — prefer shareLink.swimmer_id, fall back to report.swimmer_id
    let swimmer = null;
    const swimmerId = shareLink.swimmer_id || report.swimmer_id;
    if (swimmerId) {
      const swimmers = await base44.asServiceRole.entities.Swimmer.filter({ id: swimmerId });
      swimmer = swimmers[0] || null;
    }

    // Load club
    let club = null;
    if (shareLink.club_id) {
      const clubs = await base44.asServiceRole.entities.Club.filter({ id: shareLink.club_id });
      club = clubs[0];
    }

    // Load video metadata (optional)
    let video_meta = null;
    if (report.video_upload_id) {
      const videos = await base44.asServiceRole.entities.VideoUpload.filter({ id: report.video_upload_id });
      const video = videos[0];
      if (video) {
        video_meta = {
          stroke_type: video.stroke_type,
          analysis_type: video.analysis_type,
          camera_angle: video.camera_angle,
        };
      }
    }

    // Load approved findings ONLY (public page should only see approved)
    const allFindings = await base44.asServiceRole.entities.Finding.filter({ report_id: shareLink.report_id });
    const findings = allFindings
      .filter(f => f.approval_status === 'approved' && f.included_in_report !== false)
      .map(f => ({
        id: f.id,
        finding_name: f.finding_name,
        severity: f.severity,
        phase: f.phase,
        coach_sees: f.coach_sees,
        why_it_matters: f.why_it_matters,
        cue: f.cue,
        drill: f.drill,
        next_focus: f.next_focus,
      }));

    // Load approved drag items included in report — public-safe fields only
    let dragItems = [];
    if (report.video_upload_id) {
      const allDrag = await base44.asServiceRole.entities.DragAnalysis.filter({ video_upload_id: report.video_upload_id });
      dragItems = allDrag
        .filter(d => d.approval_status === 'approved' && d.included_in_report)
        .map(d => ({
          // Public-safe display fields only.
          // Intentionally excluded: id, approval_status, included_in_report,
          // coordinates_json, analysis_mode, evidence_type, risk_score,
          // source, created_by, report_id, video_upload_id, swimmer_id, club_id,
          // analysis_session_id, finding_id, timestamp_end, pose data, file URIs.
          overlay_type: d.overlay_type,
          drag_risk_level: d.drag_risk_level,
          drag_zone: d.drag_zone,
          stroke_phase: d.stroke_phase,
          timestamp_start: typeof d.timestamp_start === 'number' ? d.timestamp_start : undefined,
          measurement_summary: d.measurement_summary || undefined,
          coach_notes: d.coach_notes || undefined,
        }));
    }

    // Strip report to only public-safe fields — no internal IDs, file URIs, pose data, or signed URLs
    const publicReport = {
      id: report.id,
      title: report.title,
      status: report.status,
      source: report.source,
      overall_score: report.overall_score,
      technical_summary: report.technical_summary,
      ai_completed_at: report.ai_completed_at,
      created_date: report.created_date,
    };

    // Strip club to only display fields
    const publicClub = club ? {
      name: club.name,
      logo_url: club.logo_url,
      primary_color: club.primary_color,
      accent_color: club.accent_color,
    } : null;

    // Strip swimmer to only display fields
    const publicSwimmer = swimmer ? {
      name: swimmer.name,
      main_strokes: swimmer.main_strokes,
    } : null;

    return Response.json({
      report: publicReport,
      swimmer: publicSwimmer,
      club: publicClub,
      video_meta,
      findings,
      drag_items: dragItems,
      share_link: {
        id: shareLink.id,
        created_date: shareLink.created_date,
        expires_at: shareLink.expires_at,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});