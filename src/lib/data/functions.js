import { supabase } from '@/lib/supabaseClient';

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof body === 'object' ? body.error || body.message : body;
    throw new Error(message || `Request failed with status ${response.status}`);
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

  triggerPoseAnalysis(payload) {
    return postJson('/api/ai/trigger', payload);
  },

  getSignedVideoUrl(videoUploadId) {
    return postJson(`/api/video-uploads/${videoUploadId}/signed-url`, {});
  },

  createSharedReportLink(reportId) {
    return postJson(`/api/reports/${reportId}/share-link`, {});
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

  async getSharedReport(token) {
    const response = await fetch(`/api/shared-reports/${encodeURIComponent(token)}`);
    return parseResponse(response);
  },
};

export default functions;
