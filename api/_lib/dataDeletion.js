import { privateVideoStorageReference } from './safeguarding.js';

export async function deleteRawFootageObject(
  service,
  upload,
  { deletedAt = new Date().toISOString(), reason, deletedBy = null } = {}
) {
  const reference = privateVideoStorageReference(upload);
  if (!reference) {
    return { success: false, upload_id: upload?.id || null, error_code: 'private_video_not_found' };
  }

  const { error: storageError } = await service.storage
    .from(reference.bucket)
    .remove([reference.path]);
  if (storageError) {
    return { success: false, upload_id: upload.id, error_code: 'private_video_delete_failed' };
  }

  const { error: updateError } = await service
    .from('video_uploads')
    .update({
      file_path: null,
      storage_path: null,
      storage_bucket: null,
      original_filename: '[deleted]',
      file_size_bytes: null,
      file_size_mb: null,
      upload_status: 'deleted',
      raw_footage_deleted_at: deletedAt,
      raw_footage_deletion_reason: reason || 'retention_period_elapsed',
      raw_footage_deleted_by: deletedBy,
    })
    .eq('id', upload.id);
  if (updateError) {
    return { success: false, upload_id: upload.id, error_code: 'deletion_marker_update_failed' };
  }

  return { success: true, upload_id: upload.id, reason };
}

export async function deleteArtifactPreviews(service, thumbnailPaths) {
  const paths = Array.from(new Set(
    (thumbnailPaths || [])
      .filter((path) => typeof path === 'string' && path.trim())
      .map((path) => path.replace(/^ai-artifacts\//, ''))
  ));
  if (!paths.length) return { success: true, deleted_count: 0 };
  const { error } = await service.storage.from('ai-artifacts').remove(paths);
  return error
    ? { success: false, deleted_count: 0, error_code: 'artifact_preview_delete_failed' }
    : { success: true, deleted_count: paths.length };
}

export async function deleteRowsByIds(service, table, column, ids) {
  if (!ids?.length) return 0;
  const { data, error } = await service
    .from(table)
    .delete()
    .in(column, ids)
    .select('id');
  if (error) throw error;
  return data?.length || 0;
}
