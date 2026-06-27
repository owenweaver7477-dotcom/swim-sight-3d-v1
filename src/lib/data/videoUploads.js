import { supabase } from '@/lib/supabaseClient';
import entities from '@/lib/data/entities';
import {
  buildPrivateVideoStorageKey,
  buildVideoStorageReviewContext,
  normaliseVideoStorageRecord,
} from '@/lib/storage/videoStorage';

export const PRIVATE_VIDEO_BUCKET = 'private-videos';
const DEFAULT_STORAGE_UPLOAD_TIMEOUT_MS = 12 * 60 * 1000;
const BYTES_PER_MB = 1024 * 1024;

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
  return buildPrivateVideoStorageKey({ clubId, swimmerId, videoUploadId, filename });
}

function createUploadTimeoutError(timeoutMs) {
  return new Error(
    `Video upload did not finish within ${Math.round(timeoutMs / 60000)} minutes. The video row has been kept so you can retry or delete it. For fastest testing, use a 5-15 second side-view MP4 on stable Wi-Fi.`
  );
}

function coachSafeUploadError(error) {
  if (!error) return 'Upload failed before the video reached private storage.';
  if (error.name === 'AbortError') return error.message;
  const message = error.message || String(error);
  if (/network|fetch|timeout|abort/i.test(message)) {
    return 'Upload failed because the network connection dropped or timed out. Keep the tab open and retry on stable Wi-Fi.';
  }
  if (/payload|too large|413|size/i.test(message)) {
    return 'Upload failed because the video was too large for the current upload path. Trim or compress the clip and retry.';
  }
  return message.slice(0, 500);
}

export function fileSizeMb(fileOrBytes = 0) {
  const bytes = typeof fileOrBytes === 'number' ? fileOrBytes : fileOrBytes?.size || 0;
  return Number((bytes / BYTES_PER_MB).toFixed(2));
}

export async function readVideoDuration(file) {
  if (!file || typeof document === 'undefined' || typeof URL === 'undefined') return null;

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    const cleanup = () => URL.revokeObjectURL(url);

    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const seconds = Number.isFinite(video.duration) ? Number(video.duration.toFixed(2)) : null;
      cleanup();
      resolve(seconds);
    };
    video.onerror = () => {
      cleanup();
      resolve(null);
    };
    video.src = url;
  });
}

async function markUploadFailed(videoUploadId, patch) {
  if (!videoUploadId) return null;
  try {
    return await entities.VideoUpload.update(videoUploadId, {
      processing_status: 'upload_failed',
      upload_status: 'upload_failed',
      upload_error: patch.upload_error,
      ai_error_message: patch.upload_error,
      upload_retry_count: patch.upload_retry_count,
      last_upload_attempt_at: patch.last_upload_attempt_at,
    });
  } catch {
    return null;
  }
}

export async function uploadPrivateVideo({
  file,
  clubId,
  swimmer,
  userId,
  metadata = {},
  onStage,
  timeoutMs = DEFAULT_STORAGE_UPLOAD_TIMEOUT_MS,
  existingVideoUploadId = null,
  existingRecord = null,
}) {
  if (!file) throw new Error('No video file selected.');
  if (!clubId) throw new Error('No active club selected.');
  if (!swimmer?.id) throw new Error('Select a swimmer before uploading a video.');

  onStage?.('preparing_upload', { message: 'Creating private video record' });

  const videoUploadId = existingVideoUploadId || existingRecord?.id || crypto.randomUUID();
  let currentExistingRecord = existingRecord;
  if ((existingVideoUploadId || existingRecord?.id) && !currentExistingRecord) {
    try {
      currentExistingRecord = await entities.VideoUpload.get(videoUploadId);
    } catch {
      currentExistingRecord = null;
    }
  }
  const filePath = buildPrivateVideoPath({
    clubId,
    swimmerId: swimmer.id,
    videoUploadId,
    filename: file.name,
  });
  const now = new Date().toISOString();
  const durationSeconds = metadata.duration_seconds ?? await readVideoDuration(file);
  const retryBase = Number(currentExistingRecord?.upload_retry_count || 0);
  const storageRecord = normaliseVideoStorageRecord({
    file_bucket: PRIVATE_VIDEO_BUCKET,
    file_path: filePath,
    original_filename: file.name,
    content_type: file.type || 'video/mp4',
    file_size_bytes: file.size,
    upload_status: 'uploading',
    created_by: userId,
    club_id: clubId,
    swimmer_id: swimmer.id,
  });
  const nextReviewContext = {
    ...(metadata.review_context || {}),
    video_storage: buildVideoStorageReviewContext(storageRecord),
  };
  const baseRecord = {
    id: videoUploadId,
    club_id: clubId,
    swimmer_id: swimmer.id,
    squad_id: swimmer.squad_id || null,
    file_bucket: PRIVATE_VIDEO_BUCKET,
    file_path: filePath,
    storage_bucket: PRIVATE_VIDEO_BUCKET,
    storage_path: filePath,
    original_filename: file.name,
    mime_type: file.type || 'video/mp4',
    file_size_bytes: file.size,
    file_size_mb: fileSizeMb(file),
    duration_seconds: durationSeconds,
    stroke_type: metadata.stroke_type || 'Freestyle',
    camera_angle: metadata.camera_angle || 'Side',
    analysis_type: metadata.analysis_type || 'Technique Review',
    processing_status: 'uploading',
    upload_status: 'uploading',
    upload_started_at: currentExistingRecord?.upload_started_at || now,
    upload_completed_at: null,
    upload_error: null,
    last_upload_attempt_at: now,
    upload_retry_count: retryBase,
    analysis_session_id: metadata.analysis_session_id || null,
    is_primary_angle: metadata.is_primary_angle ?? true,
    sync_offset_seconds: metadata.sync_offset_seconds ?? null,
    capture_device: metadata.capture_device || null,
    capture_source: metadata.capture_source || null,
    video_quality_rating: metadata.video_quality_rating || null,
    review_context: nextReviewContext,
    created_by: userId || null,
  };

  let videoRecord;
  if (existingVideoUploadId || currentExistingRecord?.id) {
    videoRecord = await entities.VideoUpload.update(videoUploadId, baseRecord);
  } else {
    videoRecord = await entities.VideoUpload.create(baseRecord);
  }

  onStage?.('uploading', { videoUploadId, videoRecord });
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(createUploadTimeoutError(timeoutMs)), timeoutMs);

  try {
    const { error: uploadError } = await supabase
      .storage
      .from(PRIVATE_VIDEO_BUCKET)
      .upload(filePath, file, {
        contentType: file.type || 'video/mp4',
        upsert: Boolean(existingVideoUploadId || currentExistingRecord?.id),
        signal: controller.signal,
      })
      .finally(() => globalThis.clearTimeout(timeout));

    if (uploadError) {
      if (uploadError.name === 'AbortError') throw createUploadTimeoutError(timeoutMs);
      throw uploadError;
    }

    onStage?.('finalising_upload', { videoUploadId, videoRecord });
    return await entities.VideoUpload.update(videoUploadId, {
      file_bucket: PRIVATE_VIDEO_BUCKET,
      file_path: filePath,
      storage_bucket: PRIVATE_VIDEO_BUCKET,
      storage_path: filePath,
      processing_status: 'uploaded',
      upload_status: 'uploaded',
      upload_completed_at: new Date().toISOString(),
      upload_error: null,
      ai_error_message: null,
    });
  } catch (error) {
    globalThis.clearTimeout(timeout);
    const safeMessage = coachSafeUploadError(error);
    const failedRecord = await markUploadFailed(videoUploadId, {
      upload_error: safeMessage,
      upload_retry_count: retryBase + 1,
      last_upload_attempt_at: new Date().toISOString(),
    });
    const wrapped = new Error(safeMessage);
    wrapped.videoUploadId = videoUploadId;
    wrapped.videoUpload = failedRecord || videoRecord;
    throw wrapped;
  }
}
