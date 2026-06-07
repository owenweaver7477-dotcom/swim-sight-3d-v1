import { createServiceClient, handleApiError, requireClubRole, requireUser, sendJson } from '../../_lib/server.js';

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

    await requireClubRole(service, upload.club_id, user.id, ['owner', 'admin', 'coach', 'assistant_coach']);

    const { data, error: signError } = await service
      .storage
      .from(upload.file_bucket)
      .createSignedUrl(upload.file_path, 60 * 60);

    if (signError) throw signError;
    return sendJson(res, 200, { signed_url: data.signedUrl });
  } catch (error) {
    return handleApiError(res, error);
  }
}
