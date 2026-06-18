import { supabase } from '@/lib/supabaseClient';

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof body === 'object' ? body.error || body.message : body;
    const error = new Error(message || `Request failed with status ${response.status}`);
    if (body && typeof body === 'object') Object.assign(error, body);
    throw error;
  }

  return { data: body };
}

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function postJson(url, payload) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(payload || {}),
  });
  return parseResponse(response);
}

async function getJson(url) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(url, {
    headers: authHeaders,
  });
  return parseResponse(response);
}

async function patchJson(url, payload) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(payload || {}),
  });
  return parseResponse(response);
}

export const functions = {
  createClubWorkspace(payload) {
    return postJson('/api/clubs/create', payload);
  },

  joinClubWithInviteCode(payload) {
    return postJson('/api/clubs/join-invite', payload);
  },

  createClubInvite(payload) {
    return postJson('/api/clubs/invites/create', payload);
  },

  revokeClubInvite(inviteId) {
    return patchJson(`/api/clubs/invites/${inviteId}/revoke`, {});
  },

  triggerPoseAnalysis(videoUploadIdOrPayload) {
    const payload = typeof videoUploadIdOrPayload === 'string'
      ? { video_upload_id: videoUploadIdOrPayload }
      : videoUploadIdOrPayload;
    return postJson('/api/ai/trigger', payload);
  },

  getSignedVideoUrl(videoUploadId) {
    return postJson(`/api/video-uploads/${videoUploadId}/signed-url`, {});
  },

  createSharedReportLink(reportId) {
    return postJson(`/api/reports/${reportId}/share-link`, {});
  },

  logReportDelivery(reportId, payload) {
    return postJson(`/api/reports/${reportId}`, { action: 'log_delivery', ...payload });
  },

  async disableSharedReportLink(linkId) {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`/api/shared-report-links/${linkId}/disable`, {
      method: 'PATCH',
      headers: authHeaders,
    });
    return parseResponse(response);
  },

  async deleteAIReport(reportId) {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`/api/reports/${reportId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    return parseResponse(response);
  },

  resetTimedOutAIJobs(payload) {
    return postJson('/api/admin/ai-jobs/reset-timed-out', payload);
  },

  getAIQueueStatus(clubId) {
    return getJson(`/api/admin/ai-jobs/reset-timed-out?action=queue-status&club_id=${encodeURIComponent(clubId)}`);
  },

  dispatchNextAIJob(payload) {
    return postJson('/api/admin/ai-jobs/reset-timed-out', { ...payload, action: 'dispatch_next' });
  },

  async getSharedReport(token) {
    const response = await fetch(`/api/shared-reports/${encodeURIComponent(token)}`);
    return parseResponse(response);
  },
};

export default functions;
