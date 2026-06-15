import {
  COACH_ROLES,
  createServiceClient,
  handleApiError,
  readJsonBody,
  requireClubRole,
  requireUser,
  sendJson,
} from '../../_lib/server.js';
import { dispatchNextQueuedAIJob, getAIQueueSummary } from '../../_lib/aiQueue.js';

function sanitizeDispatchForClub(result, clubId) {
  const job = result?.job || null;
  const canShowJob = job && job.club_id === clubId;

  return {
    queued: Boolean(result?.queued),
    dispatched: Boolean(result?.dispatched),
    failed: Boolean(result?.failed),
    reason: result?.reason || null,
    error: canShowJob ? result?.error || null : null,
    job: canShowJob ? job : null,
    job_visible: Boolean(canShowJob),
    summary: result?.summary || null,
  };
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { user } = await requireUser(req);
    const service = createServiceClient();
    const body = req.method === 'POST' ? await readJsonBody(req) : {};
    const clubId = body.club_id || req.query?.club_id;

    if (!clubId) {
      return sendJson(res, 400, { error: 'club_id is required' });
    }

    await requireClubRole(service, clubId, user.id, COACH_ROLES);

    if (req.method === 'GET') {
      const summary = await getAIQueueSummary(service, { clubId });
      return sendJson(res, 200, { success: true, ...summary });
    }

    const dispatchResult = await dispatchNextQueuedAIJob({
      service,
      req,
      dispatcher: `manual:${user.id}`,
    });
    const summary = await getAIQueueSummary(service, { clubId });

    return sendJson(res, 200, {
      success: true,
      ...sanitizeDispatchForClub({ ...dispatchResult, summary }, clubId),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
