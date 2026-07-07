import { createServiceClient, handleApiError, sendJson } from '../_lib/server.js';
import { sanitizePublicReportPayload } from '../../src/lib/sanitizeAIReport.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const service = createServiceClient();
    const token = req.query.token;

    const { data: link, error: linkError } = await service
      .from('shared_report_links')
      .select('id,report_id,status,expires_at')
      .eq('token', token)
      .maybeSingle();

    if (linkError) throw linkError;
    if (!link || link.status !== 'active') {
      return sendJson(res, 404, { error: 'Report not found or link expired' });
    }
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      await service.from('shared_report_links').update({ status: 'expired' }).eq('id', link.id);
      return sendJson(res, 403, { error: 'This share link has expired' });
    }

    const { data: report, error: reportError } = await service
      .from('reports')
      .select('id,club_id,swimmer_id,status,is_deleted,stroke_type,analysis_type,overall_score,technical_summary,coach_summary,next_focus,finalised_at,created_at,updated_at')
      .eq('id', link.report_id)
      .eq('is_deleted', false)
      .maybeSingle();

    if (reportError) throw reportError;
    if (!report || !['coach_approved', 'finalised', 'published', 'shared'].includes(report.status)) {
      return sendJson(res, 404, { error: 'Report not found or not ready to share' });
    }

    const [{ data: swimmer }, { data: club }, { data: findings }, annotations] = await Promise.all([
      service.from('swimmers').select('first_name,last_name').eq('id', report.swimmer_id).maybeSingle(),
      service.from('clubs').select('name').eq('id', report.club_id).maybeSingle(),
      service
        .from('findings')
        // raw_ai_payload is fetched ONLY so the sanitizer can extract the coach's
        // additional-drill titles/summaries from raw_ai_payload.extra_drills. The
        // sanitizer never emits raw_ai_payload itself (it is an UNSAFE_PUBLIC_REPORT_KEY).
        .select('id,severity,stroke_phase,timestamp_seconds,observation,why_it_matters,correction_cue,drill,linked_drill_title,linked_drill_summary,raw_ai_payload,next_focus,approval_status')
        .eq('report_id', report.id)
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: true }),
      service
        .from('video_annotations')
        .select('annotation_type,timestamp_seconds,frame_label,video_frame_time_label,canvas_width,canvas_height,drawing_data,thumbnail_data_url,title,coach_note,finding_id,include_in_report,is_public')
        .eq('report_id', report.id)
        .eq('include_in_report', true)
        .eq('is_public', true)
        .order('timestamp_seconds', { ascending: true })
        .then(({ data, error }) => {
          if (error) return [];
          return data || [];
        }),
    ]);
    const findingTitlesById = new Map((findings || []).map((finding) => [
      finding.id,
      finding.observation || finding.stroke_phase || 'Technical finding',
    ]));

    const publicPayload = sanitizePublicReportPayload({
      report: {
        title: `${report.stroke_type || 'Technique'} Review`,
        status: report.status,
        stroke_type: report.stroke_type,
        analysis_type: report.analysis_type,
        overall_score: report.overall_score,
        technical_summary: report.technical_summary,
        coach_summary: report.coach_summary,
        next_focus: report.next_focus,
        finalised_at: report.finalised_at,
        created_at: report.created_at,
        ai_completed_at: report.finalised_at || report.updated_at || report.created_at,
      },
      video_meta: {
        stroke_type: report.stroke_type,
        analysis_type: report.analysis_type,
      },
      swimmer: swimmer
        ? { name: [swimmer.first_name, swimmer.last_name].filter(Boolean).join(' ') }
        : null,
      club: club ? { name: club.name } : null,
      findings: (findings || []).map((finding) => ({
        ...finding,
        phase: finding.stroke_phase,
        finding_name: finding.observation,
        coach_sees: finding.observation,
        cue: finding.correction_cue,
        included_in_report: true,
      })),
      annotations: (annotations || []).map((annotation) => ({
        ...annotation,
        linked_finding_title: annotation.finding_id ? findingTitlesById.get(annotation.finding_id) || null : null,
      })),
      drag_items: [],
    });

    return sendJson(res, 200, publicPayload);
  } catch (error) {
    return handleApiError(res, error);
  }
}
