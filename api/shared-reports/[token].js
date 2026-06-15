import { createServiceClient, handleApiError, sendJson } from '../_lib/server.js';
import { drawingToSvg } from '../../src/lib/annotationRender.js';

function sanitizeFinding(finding) {
  const observation = finding.observation || '';
  const cue = finding.correction_cue || '';
  return {
    severity: finding.severity,
    phase: finding.stroke_phase,
    timestamp_seconds: finding.timestamp_seconds,
    finding_name: observation,
    observation,
    coach_sees: observation,
    why_it_matters: finding.why_it_matters,
    correction_cue: cue,
    cue,
    drill: finding.linked_drill_title || finding.drill,
    linked_drill_title: finding.linked_drill_title || finding.drill || null,
    linked_drill_summary: finding.linked_drill_summary || null,
    next_focus: finding.next_focus,
  };
}

function sanitizeAnnotation(annotation, findingTitlesById) {
  const thumbnail = typeof annotation.thumbnail_data_url === 'string'
    && annotation.thumbnail_data_url.startsWith('data:image/')
    ? annotation.thumbnail_data_url
    : null;
  const renderedSvg = thumbnail
    ? null
    : drawingToSvg(annotation.drawing_data || {}, {
      width: annotation.canvas_width,
      height: annotation.canvas_height,
    });

  return {
    annotation_type: annotation.annotation_type,
    timestamp_seconds: annotation.timestamp_seconds,
    frame_label: annotation.frame_label || annotation.video_frame_time_label,
    video_frame_time_label: annotation.video_frame_time_label || annotation.frame_label,
    canvas_width: annotation.canvas_width,
    canvas_height: annotation.canvas_height,
    rendered_svg: renderedSvg,
    thumbnail_data_url: thumbnail,
    title: annotation.title,
    coach_note: annotation.coach_note,
    linked_finding_title: annotation.finding_id ? findingTitlesById.get(annotation.finding_id) || null : null,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const service = createServiceClient();
    const token = req.query.token;

    const { data: link, error: linkError } = await service
      .from('shared_report_links')
      .select('*')
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
      .select('*')
      .eq('id', link.report_id)
      .eq('is_deleted', false)
      .maybeSingle();

    if (reportError) throw reportError;
    if (!report || !['coach_approved', 'finalised', 'published', 'shared'].includes(report.status)) {
      return sendJson(res, 404, { error: 'Report not found or not ready to share' });
    }

    const [{ data: swimmer }, { data: club }, { data: findings }, { data: keyFrames }, annotations] = await Promise.all([
      service.from('swimmers').select('first_name,last_name').eq('id', report.swimmer_id).maybeSingle(),
      service.from('clubs').select('name').eq('id', report.club_id).maybeSingle(),
      service
        .from('findings')
        .select('id,severity,stroke_phase,timestamp_seconds,observation,why_it_matters,correction_cue,drill,linked_drill_title,linked_drill_summary,next_focus,approval_status')
        .eq('report_id', report.id)
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: true }),
      service
        .from('key_frames')
        .select('timestamp_seconds,label,note')
        .eq('report_id', report.id)
        .order('timestamp_seconds', { ascending: true }),
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

    return sendJson(res, 200, {
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
      findings: (findings || []).map(sanitizeFinding),
      key_frames: (keyFrames || []).map((frame) => ({
        timestamp_seconds: frame.timestamp_seconds,
        label: frame.label,
        note: frame.note,
      })),
      annotations: (annotations || []).map((annotation) => sanitizeAnnotation(annotation, findingTitlesById)),
      drag_items: [],
      disclaimer: 'AI-assisted evidence supports coach review. Final report content is coach-approved.',
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
