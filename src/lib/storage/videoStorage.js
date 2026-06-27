export const VIDEO_STORAGE_PROVIDERS = Object.freeze({
  SUPABASE_PRIVATE: 'supabase_private',
  S3_PRIVATE: 's3_private',
  GCS_PRIVATE: 'gcs_private',
});

export const CURRENT_VIDEO_STORAGE_PROVIDER = VIDEO_STORAGE_PROVIDERS.SUPABASE_PRIVATE;
export const PRIVATE_VIDEO_BUCKET = 'private-videos';
export const DEFAULT_SIGNED_READ_TTL_SECONDS = 10 * 60;
export const DEFAULT_WORKER_SIGNED_READ_TTL_SECONDS = 15 * 60;

const PROVIDER_LABELS = new Set(Object.values(VIDEO_STORAGE_PROVIDERS));
const PRIVATE_URI_PREFIX = 'private://';
const SIGNED_URL_PATTERNS = [
  /\/storage\/v1\/object\/sign\//i,
  /[?&](token|signature|x-amz-signature|x-goog-signature)=/i,
  /X-Amz-Signature=/i,
  /X-Goog-Signature=/i,
];

function asCleanString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function safeVideoObjectName(filename = 'video') {
  const raw = asCleanString(filename) || 'video';
  const dotIndex = raw.lastIndexOf('.');
  const base = dotIndex > 0 ? raw.slice(0, dotIndex) : raw;
  const ext = dotIndex > 0 ? raw.slice(dotIndex).toLowerCase() : '';
  const safeBase = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'video';
  const safeExt = ext.match(/^\.[a-z0-9]{1,8}$/) ? ext : '';
  return `${Date.now()}-${safeBase}${safeExt}`;
}

export function buildPrivateVideoStorageKey({ clubId, swimmerId, videoUploadId, filename }) {
  const safeClubId = asCleanString(clubId) || 'unknown-club';
  const safeSwimmerId = asCleanString(swimmerId) || 'unknown-swimmer';
  const safeVideoUploadId = asCleanString(videoUploadId) || 'unknown-video';
  return `${safeClubId}/${safeSwimmerId}/${safeVideoUploadId}/${safeVideoObjectName(filename)}`;
}

function inferProvider(record = {}) {
  const explicit = asCleanString(record.storage_provider || record.storageProvider);
  if (explicit && PROVIDER_LABELS.has(explicit)) return explicit;
  const bucket = asCleanString(record.file_bucket || record.storage_bucket || record.bucket);
  if (bucket === PRIVATE_VIDEO_BUCKET) return CURRENT_VIDEO_STORAGE_PROVIDER;
  return explicit || CURRENT_VIDEO_STORAGE_PROVIDER;
}

export function normaliseVideoStorageRecord(record = {}) {
  const provider = inferProvider(record);
  const bucket = asCleanString(record.file_bucket || record.storage_bucket || record.bucket);
  const key = asCleanString(
    record.video_storage_key
    || record.videoStorageKey
    || record.storage_key
    || record.file_path
    || record.storage_path
    || record.path
  );
  const contentType = asCleanString(record.content_type || record.contentType || record.mime_type || record.mimeType || record.type);
  const sizeBytes = record.file_size_bytes ?? record.fileSizeBytes ?? record.file_size ?? record.size ?? null;

  return {
    storage_provider: provider,
    video_storage_key: key,
    file_bucket: bucket || (provider === CURRENT_VIDEO_STORAGE_PROVIDER ? PRIVATE_VIDEO_BUCKET : null),
    file_path: key,
    storage_bucket: bucket || (provider === CURRENT_VIDEO_STORAGE_PROVIDER ? PRIVATE_VIDEO_BUCKET : null),
    storage_path: key,
    original_filename: asCleanString(record.original_filename || record.originalFilename || record.file_name || record.name),
    content_type: contentType,
    mime_type: contentType,
    file_size_bytes: Number.isFinite(Number(sizeBytes)) ? Number(sizeBytes) : null,
    upload_status: asCleanString(record.upload_status || record.uploadStatus || record.processing_status),
    created_by: asCleanString(record.created_by || record.uploaded_by_user_id || record.user_id),
    club_id: asCleanString(record.club_id || record.clubId),
    swimmer_id: asCleanString(record.swimmer_id || record.swimmerId),
    retention_expires_at: asCleanString(record.retention_expires_at || record.retentionExpiresAt),
    has_private_object: Boolean(key),
  };
}

export function toLegacyVideoStorageFields(record = {}) {
  const storage = normaliseVideoStorageRecord(record);
  return {
    file_bucket: storage.file_bucket,
    file_path: storage.file_path,
    storage_bucket: storage.storage_bucket,
    storage_path: storage.storage_path,
    mime_type: storage.mime_type,
    file_size_bytes: storage.file_size_bytes,
  };
}

export function buildPrivateVideoUri(record = {}) {
  const storage = normaliseVideoStorageRecord(record);
  if (!storage.file_bucket || !storage.video_storage_key) return null;
  return `${PRIVATE_URI_PREFIX}${storage.file_bucket}/${storage.video_storage_key}`;
}

export function buildVideoStorageReviewContext(record = {}) {
  const storage = normaliseVideoStorageRecord(record);
  return {
    storage_provider: storage.storage_provider,
    video_storage_key_present: Boolean(storage.video_storage_key),
    private_storage_ready: Boolean(storage.video_storage_key),
    signed_read_url_ttl_seconds: DEFAULT_SIGNED_READ_TTL_SECONDS,
  };
}

export function publicVideoStorageMetadata(record = {}) {
  const storage = normaliseVideoStorageRecord(record);
  return {
    storage_provider: storage.storage_provider,
    original_filename: storage.original_filename,
    content_type: storage.content_type,
    file_size_bytes: storage.file_size_bytes,
    upload_status: storage.upload_status,
    retention_expires_at: storage.retention_expires_at,
    private_storage_ready: Boolean(storage.video_storage_key),
  };
}

export function buildSignedReadResponse({ signedUrl, expiresIn = DEFAULT_SIGNED_READ_TTL_SECONDS, storageProvider = CURRENT_VIDEO_STORAGE_PROVIDER } = {}) {
  return {
    signed_read_url: signedUrl || null,
    signed_url: signedUrl || null,
    expires_in: expiresIn,
    storage_provider: storageProvider,
  };
}

export function isSignedReadUrl(value) {
  if (typeof value !== 'string') return false;
  return SIGNED_URL_PATTERNS.some((pattern) => pattern.test(value));
}

export function isPrivateStorageReference(value) {
  if (typeof value !== 'string') return false;
  return value.startsWith(PRIVATE_URI_PREFIX) || value.startsWith(`${PRIVATE_VIDEO_BUCKET}/`) || value.includes(`/${PRIVATE_VIDEO_BUCKET}/`);
}

export function isUnsafePublicVideoReference(value) {
  if (typeof value !== 'string') return false;
  return isSignedReadUrl(value) || isPrivateStorageReference(value);
}

export function validateVideoStorageRecord(record = {}) {
  const storage = normaliseVideoStorageRecord(record);
  const errors = [];
  if (!PROVIDER_LABELS.has(storage.storage_provider)) {
    errors.push(`Unsupported storage provider: ${storage.storage_provider || 'missing'}`);
  }
  if (!storage.video_storage_key) errors.push('Missing private video storage key');
  if (storage.file_bucket && storage.file_bucket !== PRIVATE_VIDEO_BUCKET && storage.storage_provider === CURRENT_VIDEO_STORAGE_PROVIDER) {
    errors.push('Supabase private video records must use the private-videos bucket');
  }
  return { ok: errors.length === 0, errors };
}
