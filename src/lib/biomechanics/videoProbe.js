import {
  createAnalysisPayloadSummary,
  createSampledVideoFrame,
  createVideoMetadata,
} from './defaults.js';
import {
  getAnalysisAvailabilityState,
} from './availability.js';
import {
  validateVideoMetadata,
} from './validators.js';

export const DEFAULT_SAMPLING_RATE_FPS = 5;
export const DEFAULT_MAX_SAMPLED_FRAMES = 600;
export const LONG_VIDEO_WARNING_SECONDS = 120;
export const LOW_FPS_WARNING_THRESHOLD = 15;
export const LOW_RESOLUTION_WIDTH = 640;
export const LOW_RESOLUTION_HEIGHT = 360;

const VIDEO_EXTENSION_TYPES = new Map([
  ['mp4', 'mp4'],
  ['mov', 'quicktime'],
  ['m4v', 'mp4'],
  ['webm', 'webm'],
  ['avi', 'avi'],
  ['mkv', 'matroska'],
]);

function numberOrNull(value) {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function positiveNumberOrNull(value) {
  const number = numberOrNull(value);
  return number != null && number > 0 ? number : null;
}

function nonPositiveFieldError(input, keys, errorCode) {
  for (const key of keys) {
    if (input[key] == null || input[key] === '') continue;
    const number = Number(input[key]);
    if (!Number.isFinite(number) || number <= 0) return errorCode;
  }
  return null;
}

function normaliseString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function extensionFromName(name = '') {
  const match = String(name).toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || null;
}

function containerTypeFromInput(input = {}) {
  const explicit = normaliseString(input.containerType || input.container_type || input.container || input.fileType || input.file_type);
  if (explicit) return explicit;
  const mime = normaliseString(input.type || input.mime_type || input.mimeType || input.content_type);
  if (mime?.startsWith('video/')) return mime.replace('video/', '');
  const extension = extensionFromName(input.original_filename || input.file_name || input.name || input.filename);
  return extension ? VIDEO_EXTENSION_TYPES.get(extension) || extension : null;
}

function fileSizeMbFromInput(input = {}) {
  const explicitMb = positiveNumberOrNull(input.fileSizeMb ?? input.file_size_mb);
  if (explicitMb != null) return explicitMb;
  const bytes = positiveNumberOrNull(input.fileSizeBytes ?? input.file_size_bytes ?? input.size);
  return bytes != null ? Number((bytes / (1024 * 1024)).toFixed(2)) : null;
}

function frameCountFromInput(input = {}, durationSeconds, fps) {
  const explicit = positiveNumberOrNull(input.frameCount ?? input.frame_count ?? input.total_frames ?? input.source_frame_count);
  if (explicit != null) return Math.round(explicit);
  if (durationSeconds != null && fps != null) return Math.max(1, Math.round(durationSeconds * fps));
  return null;
}

function warningListForMetadata(metadata) {
  const warnings = new Set(metadata.warnings || []);
  if (!metadata.durationSeconds) warnings.add('duration_unavailable');
  if (!metadata.fps) warnings.add('fps_unavailable');
  if (!metadata.width || !metadata.height) warnings.add('resolution_unavailable');
  if (metadata.fps != null && metadata.fps < LOW_FPS_WARNING_THRESHOLD) warnings.add('low_fps');
  if (metadata.width != null && metadata.height != null && (metadata.width < LOW_RESOLUTION_WIDTH || metadata.height < LOW_RESOLUTION_HEIGHT)) {
    warnings.add('low_resolution');
  }
  if (metadata.durationSeconds != null && metadata.durationSeconds > LONG_VIDEO_WARNING_SECONDS) warnings.add('long_video');
  return Array.from(warnings);
}

function errorListForMetadata(metadata) {
  const errors = new Set(metadata.errors || []);
  if (metadata.durationSeconds != null && metadata.durationSeconds <= 0) errors.add('invalid_duration');
  if (metadata.fps != null && metadata.fps <= 0) errors.add('invalid_fps');
  if (metadata.frameCount != null && metadata.frameCount <= 0) errors.add('invalid_frame_count');
  if (metadata.width != null && metadata.width <= 0) errors.add('invalid_width');
  if (metadata.height != null && metadata.height <= 0) errors.add('invalid_height');
  return Array.from(errors);
}

export function normaliseVideoMetadata(input = {}) {
  const rawErrors = [
    nonPositiveFieldError(input, ['durationSeconds', 'duration_seconds', 'video_duration_seconds', 'duration'], 'invalid_duration'),
    nonPositiveFieldError(input, ['fps', 'video_fps', 'sourceFps', 'source_fps'], 'invalid_fps'),
    nonPositiveFieldError(input, ['frameCount', 'frame_count', 'total_frames', 'source_frame_count'], 'invalid_frame_count'),
    nonPositiveFieldError(input, ['width', 'source_width', 'video_width', 'naturalWidth'], 'invalid_width'),
    nonPositiveFieldError(input, ['height', 'source_height', 'video_height', 'naturalHeight'], 'invalid_height'),
  ].filter(Boolean);
  const durationSeconds = positiveNumberOrNull(
    input.durationSeconds
    ?? input.duration_seconds
    ?? input.video_duration_seconds
    ?? input.duration
  );
  const fps = positiveNumberOrNull(
    input.fps
    ?? input.video_fps
    ?? input.sourceFps
    ?? input.source_fps
  );
  const width = positiveNumberOrNull(
    input.width
    ?? input.source_width
    ?? input.video_width
    ?? input.naturalWidth
  );
  const height = positiveNumberOrNull(
    input.height
    ?? input.source_height
    ?? input.video_height
    ?? input.naturalHeight
  );
  const frameCount = frameCountFromInput(input, durationSeconds, fps);

  const initialMetadata = createVideoMetadata({
    videoId: input.videoId || input.video_id || input.id || null,
    durationSeconds,
    fps,
    frameCount,
    width,
    height,
    codec: normaliseString(input.codec || input.video_codec),
    containerType: containerTypeFromInput(input),
    fileSizeMb: fileSizeMbFromInput(input),
    orientation: normaliseString(input.orientation),
    source: 'video_metadata',
    warnings: Array.isArray(input.warnings) ? input.warnings : [],
    errors: [...(Array.isArray(input.errors) ? input.errors : []), ...rawErrors],
  });

  const errors = errorListForMetadata(initialMetadata);
  const warnings = warningListForMetadata(initialMetadata);
  const metadataComplete = Boolean(
    durationSeconds
    && fps
    && frameCount
    && width
    && height
    && errors.length === 0
  );
  const metadata = createVideoMetadata({
    ...initialMetadata,
    warnings,
    errors,
    metadataComplete,
  });
  const validation = validateVideoMetadata(metadata);

  return {
    ok: validation.ok && errors.length === 0,
    availabilityState: errors.length ? 'failed' : 'metadata_ready',
    metadata,
    warnings,
    errors: [...errors, ...validation.errors],
  };
}

export function buildFrameSamplingPlan(metadataInput = {}, options = {}) {
  const probe = metadataInput.metadataComplete != null
    ? { ok: true, metadata: metadataInput, warnings: metadataInput.warnings || [], errors: metadataInput.errors || [] }
    : normaliseVideoMetadata(metadataInput);
  const metadata = probe.metadata;
  const warnings = new Set(probe.warnings || []);
  const errors = new Set(probe.errors || []);
  const samplingRateFps = positiveNumberOrNull(options.samplingRateFps) || DEFAULT_SAMPLING_RATE_FPS;
  const maxSampledFrames = Math.max(1, Math.floor(positiveNumberOrNull(options.maxSampledFrames) || DEFAULT_MAX_SAMPLED_FRAMES));
  const durationSeconds = positiveNumberOrNull(metadata.durationSeconds);
  const sourceFps = positiveNumberOrNull(metadata.fps);

  if (!durationSeconds) errors.add('duration_required_for_sampling');
  if (!sourceFps) warnings.add('source_fps_unknown');

  if (errors.size) {
    return {
      ok: false,
      availabilityState: 'failed',
      samplingRateFps,
      sourceFps: sourceFps ?? null,
      maxSampledFrames,
      totalSampledFrames: 0,
      capped: false,
      samples: [],
      warnings: Array.from(warnings),
      errors: Array.from(errors),
    };
  }

  const requestedSamples = Math.max(1, Math.ceil(durationSeconds * samplingRateFps));
  const totalSampledFrames = Math.min(requestedSamples, maxSampledFrames);
  const capped = requestedSamples > maxSampledFrames;
  if (capped) warnings.add('sample_count_capped');
  if (durationSeconds < 1) warnings.add('short_video_under_one_second');

  const sampleIntervalMs = 1000 / samplingRateFps;
  const samples = Array.from({ length: totalSampledFrames }, (_, sampleIndex) => {
    const rawTimestampMs = Math.min(durationSeconds * 1000, sampleIndex * sampleIntervalMs);
    const timestampMs = Math.round(rawTimestampMs);
    const sourceFrameIndex = sourceFps
      ? Math.round((timestampMs / 1000) * sourceFps)
      : null;
    return {
      ...createSampledVideoFrame({
        frameIndex: sourceFrameIndex ?? sampleIndex,
        timestampMs,
        imageWidth: metadata.width,
        imageHeight: metadata.height,
      }),
      sampleIndex,
      sourceFrameIndex,
      status: 'scheduled',
    };
  });

  return {
    ok: true,
    availabilityState: 'frames_sampled',
    samplingRateFps,
    sourceFps: sourceFps ?? null,
    maxSampledFrames,
    totalSampledFrames,
    capped,
    samples,
    warnings: Array.from(warnings),
    errors: [],
  };
}

export function buildVideoProbeSummary(input = {}, options = {}) {
  const probe = normaliseVideoMetadata(input);
  const sampling = buildFrameSamplingPlan(probe.metadata, options);
  const availabilityState = sampling.ok ? 'frames_sampled' : probe.availabilityState;
  return {
    ok: probe.ok && sampling.ok,
    availabilityState,
    videoMetadata: probe.metadata,
    frameSampling: {
      samplingRateFps: sampling.samplingRateFps,
      sourceFps: sampling.sourceFps,
      totalSampledFrames: sampling.totalSampledFrames,
      maxSampledFrames: sampling.maxSampledFrames,
      capped: sampling.capped,
      samples: sampling.samples,
      warnings: sampling.warnings,
      errors: sampling.errors,
    },
    warnings: Array.from(new Set([...probe.warnings, ...sampling.warnings])),
    errors: Array.from(new Set([...probe.errors, ...sampling.errors])),
  };
}

export function buildMetadataAnalysisPayloadSummary(input = {}, options = {}) {
  const summary = buildVideoProbeSummary(input, options);
  return createAnalysisPayloadSummary({
    availabilityState: getAnalysisAvailabilityState({
      availabilityState: summary.availabilityState,
      videoMetadata: summary.videoMetadata,
      sampledFrames: summary.frameSampling.samples,
    }),
    videoMetadata: summary.videoMetadata,
    sampledFrames: summary.frameSampling.samples,
    artifacts: [],
  });
}

export async function probeBrowserVideoFile(file) {
  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof URL === 'undefined') {
    return {
      ok: false,
      availabilityState: 'failed',
      metadata: createVideoMetadata({
        source: 'video_metadata',
        errors: ['browser_video_probe_unavailable'],
      }),
      warnings: [],
      errors: ['browser_video_probe_unavailable'],
    };
  }

  return new Promise((resolve) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(objectUrl);
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const result = normaliseVideoMetadata({
        name: file?.name,
        type: file?.type,
        size: file?.size,
        durationSeconds: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
      cleanup();
      resolve(result);
    };
    video.onerror = () => {
      cleanup();
      resolve({
        ok: false,
        availabilityState: 'failed',
        metadata: createVideoMetadata({
          containerType: containerTypeFromInput(file || {}),
          fileSizeMb: fileSizeMbFromInput(file || {}),
          source: 'video_metadata',
          errors: ['unreadable_video_metadata'],
        }),
        warnings: [],
        errors: ['unreadable_video_metadata'],
      });
    };
    video.src = objectUrl;
  });
}
