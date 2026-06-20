export const CONSENT_REQUIRED_CODE = 'minor_guardian_consent_required';
export const DEFAULT_FOOTAGE_RETENTION_DAYS = 30;
export const COMPLETED_REPORT_STATUSES = new Set([
  'coach_approved',
  'finalised',
  'published',
  'shared',
]);

export function envFlagEnabled(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

export function consentGate(consentRecord, { required = false } = {}) {
  if (!required) return { allowed: true, reason: 'gate_disabled' };
  if (consentRecord?.is_minor !== true) return { allowed: true, reason: 'not_marked_minor' };
  if (consentRecord?.consent_status === 'granted') {
    return { allowed: true, reason: 'guardian_consent_granted' };
  }
  return {
    allowed: false,
    reason: CONSENT_REQUIRED_CODE,
    message: (
      'Guardian consent is required before this minor swimmer can be sent for AI Review. '
      + "Open the swimmer's consent step, record granted consent, then try again."
    ),
    next_action: 'record_guardian_consent',
  };
}

export function footageRetentionDays(value) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_FOOTAGE_RETENTION_DAYS;
}

export function privateVideoStorageReference(upload) {
  const bucket = upload?.file_bucket || upload?.storage_bucket;
  const path = upload?.file_path || upload?.storage_path;
  if (bucket !== 'private-videos' || !path) return null;
  return { bucket, path };
}

export function selectUploadsDueForDeletion(
  uploads,
  { now = new Date(), retentionDays = DEFAULT_FOOTAGE_RETENTION_DAYS, completedVideoIds = new Set() } = {}
) {
  const nowDate = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(nowDate.getTime())) throw new TypeError('now must be a valid date');
  const cutoff = new Date(nowDate.getTime() - footageRetentionDays(retentionDays) * 86400000);

  return (uploads || []).flatMap((upload) => {
    if (!upload?.id || upload.raw_footage_deleted_at || !privateVideoStorageReference(upload)) return [];
    const uploadedAt = new Date(upload.upload_completed_at || upload.created_at || 0);
    const retentionElapsed = !Number.isNaN(uploadedAt.getTime()) && uploadedAt <= cutoff;
    const workflowComplete = completedVideoIds.has(upload.id);
    if (!workflowComplete && !retentionElapsed) return [];
    return [{
      upload,
      reason: workflowComplete ? 'coach_review_complete' : 'retention_period_elapsed',
    }];
  });
}
