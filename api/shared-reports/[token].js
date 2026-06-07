import { createServiceClient, handleApiError, sendJson } from '../_lib/server.js';

function sanitizeFinding(finding) {
  const observation = finding.observation || '';
  const cue = finding.correction_cue || '';
  return {
    severity: finding.severity,
    phase: finding.stroke_phase,
    finding_name: observation,
    observation,
    coach_sees: observation,
    why_it_matters: finding.why_it_matters,
    correction_cue: cue,
    cue,
    drill: finding.drill,
    next_focus: finding.next_focus,
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

    const [{ data: swimmer }, { data: club }, { data: findings }, { data: keyFrames }] = await Promise.all([
      service.from('swimmers').select('first_name,last_name').eq('id', report.swimmer_id).maybeSingle(),
      service.from('clubs').select('name').eq('id', report.club_id).maybeSingle(),
      service
        .from('findings')
        .select('severity,stroke_phase,observation,why_it_matters,correction_cue,drill,next_focus,approval_status')
        .eq('report_id', report.id)
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: true }),
      service
        .from('key_frames')
        .select('timestamp_seconds,label,note')
        .eq('report_id', report.id)
        .order('timestamp_seconds', { ascending: true }),
    ]);

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
      drag_items: [],
      disclaimer: 'AI-assisted evidence supports coach review. Final report content is coach-approved.',
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
