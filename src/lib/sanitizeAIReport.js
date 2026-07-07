import { drawingToSvg } from './annotationRender.js';

const READY_REPORT_STATUSES = new Set(['coach_approved', 'finalised', 'published', 'shared']);
const SAFE_ANNOTATION_TYPES = new Set(['key_frame', 'coach_draw', 'body_line']);
const SAFE_IMAGE_DATA_URL = /^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/=]+$/i;
const UNSAFE_TEXT_VALUE = /(?:storage\/v1\/object\/sign|[?&]token=|signed[_ -]?url|file:\/\/|\/Users\/|\/home\/|[a-z]:\\\\)/i;
const UNSAFE_SVG = /<(?:script|style|foreignObject|iframe|object|embed|image|a)\b|\bon[a-z]+\s*=|\b(?:href|xlink:href|style)\s*=|javascript:|url\s*\(/i;
const SAFE_SVG_TAGS = new Set(['svg', 'rect', 'g', 'path', 'text', 'ellipse']);

export const UNSAFE_PUBLIC_REPORT_KEYS = new Set([
  'landmarks',
  'raw_landmarks',
  'keypoints',
  'raw_keypoints',
  'pose_results',
  'frames',
  'frame_array',
  'frame_arrays',
  'signed_video_url',
  'signed_read_url',
  'video_url',
  'file_uri',
  'file_bucket',
  'file_path',
  'storage_bucket',
  'storage_path',
  'storage_key',
  'video_storage_key',
  'local_path',
  'callback_url',
  'raw_ai_payload',
  'raw_payload',
  'debug',
  'debug_data',
  'calibration_config',
  'calibration_data',
  'estimated_drag',
  'height_cm',
  'mass_kg',
  'height',
  'mass',
  'guardian_name',
  'guardian_email',
  'guardian',
  'contact_email',
  'contact_phone',
  'coach_notes',
  'private_coach_notes',
  'rejection_reason',
  'rejection_note',
]);

function safeText(value, maxLength = 1200) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text || UNSAFE_TEXT_VALUE.test(text)) return null;
  return text.slice(0, maxLength);
}

function safeNumber(value, { min = -Infinity, max = Infinity } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(max, Math.max(min, number));
}

function safeThumbnail(value) {
  if (typeof value !== 'string' || value.length > 750_000) return null;
  return SAFE_IMAGE_DATA_URL.test(value) ? value : null;
}

function safeRenderedSvg(value) {
  if (typeof value !== 'string' || value.length > 500_000) return null;
  const svg = value.trim();
  if (!svg.startsWith('<svg') || UNSAFE_SVG.test(svg)) return null;
  const tags = Array.from(svg.matchAll(/<\/?([a-z][a-z0-9:-]*)\b/gi), match => match[1].toLowerCase());
  if (!tags.length || tags.some(tag => !SAFE_SVG_TAGS.has(tag))) return null;
  return svg;
}

function observationOnly(value) {
  const text = safeText(value);
  return text ? text.split('\n\nCoach should check: ')[0].trim() : null;
}

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== null && item !== undefined && item !== ''));
}

export function sanitizePublicFinding(finding = {}) {
  const approved = finding.approval_status === 'approved' || finding.coach_approved === true;
  if (!approved || finding.included_in_report === false) return null;

  const observation = observationOnly(finding.observation || finding.coach_sees || finding.finding_name);
  const cue = safeText(finding.correction_cue || finding.cue);

  return compactObject({
    id: safeText(finding.id, 100),
    approval_status: 'approved',
    included_in_report: true,
    finding_name: safeText(finding.finding_name) || observation,
    observation,
    coach_sees: observation,
    severity: safeText(finding.severity, 30),
    phase: safeText(finding.phase || finding.stroke_phase, 80),
    timestamp_seconds: safeNumber(finding.timestamp_seconds ?? finding.timestamp_start, { min: 0 }),
    timestamp_start: safeNumber(finding.timestamp_start ?? finding.timestamp_seconds, { min: 0 }),
    timestamp_end: safeNumber(finding.timestamp_end, { min: 0 }),
    why_it_matters: safeText(finding.why_it_matters),
    correction_cue: cue,
    cue,
    drill: safeText(finding.linked_drill_title || finding.drill),
    linked_drill_title: safeText(finding.linked_drill_title || finding.drill),
    linked_drill_summary: safeText(finding.linked_drill_summary),
    next_focus: safeText(finding.next_focus),
    linked_standard_title: safeText(finding.linked_standard_title),
  });
}

export function sanitizePublicFindings(findings = []) {
  return (Array.isArray(findings) ? findings : []).map(sanitizePublicFinding).filter(Boolean);
}

export function sanitizePublicAnnotation(annotation = {}) {
  if (annotation.include_in_report !== true || annotation.is_public !== true) return null;

  const drawingData = annotation.drawing_data && typeof annotation.drawing_data === 'object'
    ? annotation.drawing_data
    : null;
  const canvasWidth = safeNumber(annotation.canvas_width, { min: 240, max: 4096 });
  const canvasHeight = safeNumber(annotation.canvas_height, { min: 180, max: 4096 });
  const thumbnail = safeThumbnail(annotation.thumbnail_data_url);
  // Coach drawings (coach_draw/body_line) overlay their vector SVG on the captured frame:
  // emit the SVG even when a thumbnail exists, with a transparent background so the frame
  // shows through. Key frames keep their clean captured frame (no overlay). Without a
  // thumbnail, the SVG keeps its own dark backdrop (standalone card). drawingToSvg escapes
  // all coach text and validates colours/points, so the output is safe.
  const isCoachDrawing = annotation.annotation_type === 'coach_draw' || annotation.annotation_type === 'body_line';
  const renderedSvg = safeRenderedSvg(annotation.rendered_svg)
    || (drawingData && (!thumbnail || isCoachDrawing)
      ? drawingToSvg(drawingData, { width: canvasWidth, height: canvasHeight, background: thumbnail ? 'transparent' : undefined })
      : null);
  const annotationType = SAFE_ANNOTATION_TYPES.has(annotation.annotation_type)
    ? annotation.annotation_type
    : 'coach_draw';

  return compactObject({
    id: safeText(annotation.id, 100),
    annotation_type: annotationType,
    timestamp_seconds: safeNumber(annotation.timestamp_seconds, { min: 0 }),
    frame_label: safeText(annotation.frame_label || annotation.video_frame_time_label, 80),
    video_frame_time_label: safeText(annotation.video_frame_time_label || annotation.frame_label, 80),
    phase: safeText(annotation.phase || drawingData?.phase, 80),
    canvas_width: canvasWidth,
    canvas_height: canvasHeight,
    rendered_svg: renderedSvg,
    thumbnail_data_url: thumbnail,
    title: safeText(annotation.title, 180),
    note: safeText(annotation.note || annotation.coach_note),
    finding_id: safeText(annotation.finding_id, 100),
    linked_finding_title: safeText(annotation.linked_finding_title),
    include_in_report: true,
    is_public: true,
  });
}

export function sanitizePublicAnnotations(annotations = []) {
  return (Array.isArray(annotations) ? annotations : []).map(sanitizePublicAnnotation).filter(Boolean);
}

export function sanitizePublicReportPayload(payload = {}) {
  const report = payload.report || {};
  if (!READY_REPORT_STATUSES.has(report.status)) {
    return { report: null, swimmer: null, club: null, video_meta: {}, findings: [], annotations: [], drag_items: [] };
  }

  return {
    report: compactObject({
      title: safeText(report.title),
      status: report.status,
      stroke_type: safeText(report.stroke_type, 80),
      analysis_type: safeText(report.analysis_type, 80),
      overall_score: safeNumber(report.overall_score, { min: 0, max: 100 }),
      technical_summary: safeText(report.technical_summary),
      coach_summary: safeText(report.coach_summary),
      next_focus: safeText(report.next_focus),
      finalised_at: safeText(report.finalised_at, 80),
      created_at: safeText(report.created_at || report.created_date, 80),
      created_date: safeText(report.created_date || report.created_at, 80),
      ai_completed_at: safeText(report.ai_completed_at, 80),
    }),
    video_meta: compactObject({
      stroke_type: safeText(payload.video_meta?.stroke_type, 80),
      analysis_type: safeText(payload.video_meta?.analysis_type, 80),
      camera_angle: safeText(payload.video_meta?.camera_angle, 80),
    }),
    swimmer: payload.swimmer ? compactObject({ name: safeText(payload.swimmer.name, 180) }) : null,
    club: payload.club ? compactObject({
      name: safeText(payload.club.name, 180),
      logo_url: safeText(payload.club.logo_url, 500),
    }) : null,
    findings: sanitizePublicFindings(payload.findings),
    annotations: sanitizePublicAnnotations(payload.annotations),
    drag_items: [],
    disclaimer: 'This report was reviewed and approved by a coach. AI-assisted suggestions may have been edited or rejected before sharing.',
  };
}

export function findUnsafePublicReportPaths(value, path = '$', matches = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => findUnsafePublicReportPaths(item, `${path}[${index}]`, matches));
    return matches;
  }
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string' && UNSAFE_TEXT_VALUE.test(value)) matches.push(path);
    return matches;
  }

  Object.entries(value).forEach(([key, item]) => {
    const childPath = `${path}.${key}`;
    if (UNSAFE_PUBLIC_REPORT_KEYS.has(key.toLowerCase())) matches.push(childPath);
    if (key === 'approval_status' && item !== 'approved') matches.push(childPath);
    findUnsafePublicReportPaths(item, childPath, matches);
  });
  return Array.from(new Set(matches));
}
