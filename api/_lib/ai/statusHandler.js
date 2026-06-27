import {
  COACH_ROLES,
  createServiceClient,
  handleApiError,
  readJsonBody,
  requireClubRole,
  requireUser,
  sendJson,
} from '../server.js';
import { safeAnalysisJobResponse } from './jobResponse.js';

async function readJobId(req) {
  if (req.method === 'GET') {
    const queryJobId = Array.isArray(req.query?.job_id) ? req.query.job_id[0] : req.query?.job_id;
    return queryJobId || null;
  }
  const body = await readJsonBody(req);
  return body.job_id || null;
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { user } = await requireUser(req);
    const jobId = await readJobId(req);
    if (!jobId) return sendJson(res, 400, { error: 'job_id is required' });

    const service = createServiceClient();
    const { data: job, error } = await service
      .from('ai_processing_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();
    if (error) throw error;
    if (!job) return sendJson(res, 404, { error: 'AI job not found' });

    await requireClubRole(service, job.club_id, user.id, COACH_ROLES);

    return sendJson(res, 200, safeAnalysisJobResponse(job, {
      success: true,
      message: job.status === 'completed'
        ? 'Draft findings are ready for coach review.'
        : 'AI job status loaded. Manual coach review remains available.',
    }));
  } catch (error) {
    return handleApiError(res, error);
  }
}
