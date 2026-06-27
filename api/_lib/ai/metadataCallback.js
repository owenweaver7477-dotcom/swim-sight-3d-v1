import { buildVideoProbeSummary } from '../../../src/lib/biomechanics/videoProbe.js';

export const METADATA_PROGRESS_STATUSES = Object.freeze(['metadata_ready', 'frames_sampled']);

export const WORKER_METADATA_CALLBACK_CONTRACT = Object.freeze({
  job_id: 'string',
  status: 'metadata_ready|frames_sampled',
  video_metadata: Object.freeze({
    duration_seconds: 'number',
    fps: 'number|null',
    frame_count: 'number|null',
    width: 'number',
    height: 'number',
    codec: 'string|null',
    container: 'string|null',
    file_size_mb: 'number|null',
    orientation: 'landscape|portrait|square|unknown',
  }),
  frame_sampling: Object.freeze({
    sampling_rate_fps: 'number',
    max_sampled_frames: 'number',
  }),
  warnings: 'string[]',
});

function normaliseArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return value != null && value !== '';
}

export function isMetadataProgressStatus(status) {
  return METADATA_PROGRESS_STATUSES.includes(String(status || '').toLowerCase());
}

export function jobStatusForMetadataProgress(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'metadata_ready' || normalized === 'frames_sampled') return 'extracting_frames';
  return normalized || 'running';
}

export function buildSafeVideoProbeCallbackSummary(payload = {}, options = {}) {
  const nestedMetadata = payload.video_metadata && typeof payload.video_metadata === 'object'
    ? payload.video_metadata
    : {};
  const metadataInput = {
    ...nestedMetadata,
    durationSeconds: payload.video_duration_seconds ?? payload.duration_seconds ?? payload.duration ?? nestedMetadata.durationSeconds,
    fps: payload.video_fps ?? payload.fps ?? payload.source_fps ?? nestedMetadata.fps,
    frameCount: payload.source_frame_count ?? payload.frame_count ?? nestedMetadata.frameCount,
    width: payload.source_width ?? payload.video_width ?? nestedMetadata.width,
    height: payload.source_height ?? payload.video_height ?? nestedMetadata.height,
    codec: payload.codec ?? payload.video_codec ?? nestedMetadata.codec,
    containerType: payload.container_type ?? payload.container ?? payload.file_type ?? nestedMetadata.containerType,
    fileSizeMb: payload.file_size_mb ?? nestedMetadata.fileSizeMb,
    orientation: payload.orientation ?? nestedMetadata.orientation,
    warnings: [
      ...normaliseArray(payload.video_metadata_warnings),
      ...normaliseArray(payload.warnings),
    ],
    errors: [
      ...normaliseArray(payload.video_metadata_errors),
      ...normaliseArray(payload.errors),
    ],
  };

  if (!Object.values(metadataInput).some(hasValue)) return null;

  const requestedSampling = payload.frame_sampling && typeof payload.frame_sampling === 'object'
    ? payload.frame_sampling
    : payload.frame_sampling_summary && typeof payload.frame_sampling_summary === 'object'
    ? payload.frame_sampling_summary
    : {};
  const summary = buildVideoProbeSummary(metadataInput, {
    samplingRateFps: requestedSampling.samplingRateFps ?? requestedSampling.sampling_rate_fps ?? payload.sampling_rate_fps,
    maxSampledFrames: requestedSampling.maxSampledFrames
      ?? requestedSampling.max_sampled_frames
      ?? payload.max_sampled_frames
      ?? options.defaultMaxSampledFrames
      ?? 100,
  });

  return {
    ok: summary.ok,
    availabilityState: summary.availabilityState,
    videoMetadata: summary.videoMetadata,
    frameSampling: {
      samplingRateFps: summary.frameSampling.samplingRateFps,
      sourceFps: summary.frameSampling.sourceFps,
      totalSampledFrames: summary.frameSampling.totalSampledFrames,
      maxSampledFrames: summary.frameSampling.maxSampledFrames,
      capped: summary.frameSampling.capped,
      samples: summary.frameSampling.samples.slice(0, 200),
      warnings: summary.frameSampling.warnings,
      errors: summary.frameSampling.errors,
    },
    warnings: summary.warnings,
    errors: summary.errors,
  };
}
