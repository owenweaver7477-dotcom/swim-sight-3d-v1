import { supabase } from '@/lib/supabaseClient';
import entities from '@/lib/data/entities';

export const PRIVATE_VIDEO_BUCKET = 'private-videos';
const DEFAULT_STORAGE_UPLOAD_TIMEOUT_MS = 4 * 60 * 1000;

export function safeVideoFilename(filename = 'video') {
  const trimmed = filename.trim();
  const dotIndex = trimmed.lastIndexOf('.');
  const base = dotIndex > 0 ? trimmed.slice(0, dotIndex) : trimmed;
  const ext = dotIndex > 0 ? trimmed.slice(dotIndex).toLowerCase() : '';
  const safeBase = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'video';
  const safeExt = ext.match(/^\.[a-z0-9]{1,8}$/) ? ext : '';
  return `${Date.now()}-${safeBase}${safeExt}`;
}

export function buildPrivateVideoPath({ clubId, swimmerId, videoUploadId, filename }) {
  return `${clubId}/${swimmerId}/${videoUploadId}/${safeVideoFilename(filename)}`;
}

function createUploadTimeoutError(timeoutMs) {
  return new Error(
    `Video upload did not finish within ${Math.round(timeoutMs / 60000)} minutes. Try a shorter 5-10 second MP4 clip under 20 MB for Sunday testing.`
  );
}

export async function uploadPrivateVideo({
  file,
  clubId,
  swimmer,
  userId,
  metadata = {},
  onStage,
  timeoutMs = DEFAULT_STORAGE_UPLOAD_TIMEOUT_MS,
}) {
  if (!file) throw new Error('No video file selected.');
  if (!clubId) throw new Error('No active club selected.');
  if (!swimmer?.id) throw new Error('Select a swimmer before uploading a video.');

  const videoUploadId = crypto.randomUUID();
  const filePath = buildPrivateVideoPath({
    clubId,
    swimmerId: swimmer.id,
    videoUploadId,
    filename: file.name,
  });

  onStage?.('uploading_storage', { videoUploadId, filePath });
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(createUploadTimeoutError(timeoutMs)), timeoutMs);

  const { error: uploadError } = await supabase
    .storage
    .from(PRIVATE_VIDEO_BUCKET)
    .upload(filePath, file, {
      contentType: file.type || 'video/mp4',
      upsert: false,
      signal: controller.signal,
    })
    .finally(() => globalThis.clearTimeout(timeout));

  if (uploadError) {
    if (uploadError.name === 'AbortError') throw createUploadTimeoutError(timeoutMs);
    throw uploadError;
  }

  try {
    onStage?.('saving_video_record', { videoUploadId });
    return await entities.VideoUpload.create({
      id: videoUploadId,
      club_id: clubId,
      swimmer_id: swimmer.id,
      squad_id: swimmer.squad_id || null,
      file_bucket: PRIVATE_VIDEO_BUCKET,
      file_path: filePath,
      original_filename: file.name,
      mime_type: file.type || 'video/mp4',
      file_size_bytes: file.size,
      stroke_type: metadata.stroke_type || 'Freestyle',
      camera_angle: metadata.camera_angle || 'Side',
      analysis_type: metadata.analysis_type || 'Technique Review',
      processing_status: 'uploaded',
      analysis_session_id: metadata.analysis_session_id || null,
      is_primary_angle: metadata.is_primary_angle ?? true,
      sync_offset_seconds: metadata.sync_offset_seconds ?? null,
      capture_device: metadata.capture_device || null,
      capture_source: metadata.capture_source || null,
      video_quality_rating: metadata.video_quality_rating || null,
      review_context: metadata.review_context || {},
      created_by: userId || null,
    });
  } catch (error) {
    await supabase.storage.from(PRIVATE_VIDEO_BUCKET).remove([filePath]);
    throw new Error(
      `Video reached private storage, but the video record could not be saved: ${error.message || 'Unknown database error'}. The storage object was cleaned up; please retry with a shorter clip.`
    );
  }
}
