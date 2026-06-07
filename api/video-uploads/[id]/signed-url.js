import { createServiceClient, handleApiError, requireClubRole, requireUser, sendJson } from '../../_lib/server.js';

const MEMBER_ROLES = ['owner', 'admin', 'coach', 'assistant_coach', 'swimmer', 'parent'];
const SIGNED_URL_EXPIRES_IN = 10 * 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { user } = await requireUser(req);
    const service = createServiceClient();
    const videoUploadId = req.query.id;

    const { data: upload, error } = await service
      .from('video_uploads')
      .select('*')
      .eq('id', videoUploadId)
      .maybeSingle();

    if (error) throw error;
    if (!upload) return sendJson(res, 404, { error: 'Video not found' });
    if (!upload.file_bucket || !upload.file_path) {
      return sendJson(res, 422, { error: 'Video storage path is missing' });
    }

    await requireClubRole(service, upload.club_id, user.id, MEMBER_ROLES);

    const { data, error: signError } = await service
      .storage
      .from(upload.file_bucket)
      .createSignedUrl(upload.file_path, SIGNED_URL_EXPIRES_IN);

    if (signError) throw signError;
    return sendJson(res, 200, {
      signed_url: data.signedUrl,
      expires_in: SIGNED_URL_EXPIRES_IN,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
