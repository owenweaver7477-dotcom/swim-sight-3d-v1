import { createServiceClient, handleApiError, requireClubRole, requireUser, sendJson } from '../../_lib/server.js';
import {
  DEFAULT_SIGNED_READ_TTL_SECONDS,
  buildSignedReadResponse,
  normaliseVideoStorageRecord,
} from '../../../src/lib/storage/videoStorage.js';

const MEMBER_ROLES = ['owner', 'admin', 'coach', 'assistant_coach', 'swimmer', 'parent'];
const SIGNED_URL_EXPIRES_IN = DEFAULT_SIGNED_READ_TTL_SECONDS;

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
      .select('id,club_id,swimmer_id,file_bucket,storage_bucket,file_path,storage_path,upload_status,processing_status')
      .eq('id', videoUploadId)
      .maybeSingle();

    if (error) throw error;
    if (!upload) return sendJson(res, 404, { error: 'Video not found' });
    const uploadStatus = upload.upload_status || (upload.processing_status === 'uploaded' ? 'uploaded' : null);
    if (['preparing_upload', 'uploading', 'upload_failed'].includes(upload.processing_status) || ['preparing_upload', 'uploading', 'upload_failed'].includes(uploadStatus)) {
      return sendJson(res, 409, { error: 'Video upload is not complete yet' });
    }

    const storage = normaliseVideoStorageRecord(upload);
    const bucket = storage.file_bucket;
    const path = storage.video_storage_key;
    if (!bucket || !path) {
      return sendJson(res, 422, { error: 'Video storage path is missing' });
    }

    const membership = await requireClubRole(service, upload.club_id, user.id, MEMBER_ROLES);
    if (['swimmer', 'parent'].includes(membership.role)
      && (!membership.linked_swimmer_id || membership.linked_swimmer_id !== upload.swimmer_id)) {
      const accessError = new Error('Forbidden');
      accessError.status = 403;
      throw accessError;
    }

    const { data, error: signError } = await service
      .storage
      .from(bucket)
      .createSignedUrl(path, SIGNED_URL_EXPIRES_IN);

    if (signError) throw signError;
    return sendJson(res, 200, buildSignedReadResponse({
      signedUrl: data.signedUrl,
      expiresIn: SIGNED_URL_EXPIRES_IN,
      storageProvider: storage.storage_provider,
    }));
  } catch (error) {
    return handleApiError(res, error);
  }
}
