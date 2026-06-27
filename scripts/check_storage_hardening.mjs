import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  findUnsafePublicReportPaths,
  sanitizePublicReportPayload,
} from '../src/lib/sanitizeAIReport.js';
import {
  buildSignedReadResponse,
  isUnsafePublicVideoReference,
  normaliseVideoStorageRecord,
  publicVideoStorageMetadata,
} from '../src/lib/storage/videoStorage.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');

function listApiFunctions(dir = path.join(root, 'api')) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const rel = path.relative(root, full);
    if (rel.includes(`${path.sep}_lib${path.sep}`)) continue;
    const stats = statSync(full);
    if (stats.isDirectory()) files.push(...listApiFunctions(full));
    else if (/\.(js|ts)$/.test(entry)) files.push(rel);
  }
  return files.sort();
}

const storageHelper = read('src/lib/storage/videoStorage.js');
const videoUploads = read('src/lib/data/videoUploads.js');
const entities = read('src/lib/data/entities.js');
const signedRoute = read('api/video-uploads/[id]/signed-url.js');
const aiQueue = read('api/_lib/aiQueue.js');
const triggerHandler = read('api/_lib/ai/triggerHandler.js');
const sharedReportRoute = read('api/shared-reports/[token].js');
const sanitize = read('src/lib/sanitizeAIReport.js');
const videoLibrary = read('src/components/analysis/VideoLibrary.jsx');
const aiReportPage = read('src/pages/AIReportPage.jsx');
const analysePage = read('src/pages/Analyse.jsx');

assert.ok(existsSync(path.join(root, 'docs/STORAGE_HARDENING.md')), 'storage hardening docs must exist');
assert.match(storageHelper, /VIDEO_STORAGE_PROVIDERS/, 'storage helper must define provider labels');
assert.match(storageHelper, /signed_read_url/, 'storage helper must use neutral signed read URL naming');
assert.match(storageHelper, /video_storage_key/, 'storage helper must expose private object key as an internal field');

const normalised = normaliseVideoStorageRecord({
  file_bucket: 'private-videos',
  file_path: 'club/swimmer/video.mp4',
  mime_type: 'video/mp4',
  file_size_bytes: 1234,
});
assert.equal(normalised.storage_provider, 'supabase_private');
assert.equal(normalised.video_storage_key, 'club/swimmer/video.mp4');
assert.equal(normalised.content_type, 'video/mp4');
assert.equal(publicVideoStorageMetadata(normalised).private_storage_ready, true);
assert.equal(JSON.stringify(publicVideoStorageMetadata(normalised)).includes('club/swimmer/video.mp4'), false, 'public storage metadata must not include private keys');

const signedResponse = buildSignedReadResponse({ signedUrl: 'https://example.test/storage/v1/object/sign/private.mp4?token=secret' });
assert.equal(signedResponse.signed_read_url, signedResponse.signed_url, 'signed read response keeps legacy compatibility');
assert.equal(JSON.stringify(signedResponse).includes('video_storage_key'), false, 'signed read response must not expose storage keys');
assert.equal(isUnsafePublicVideoReference(signedResponse.signed_read_url), true, 'signed URLs are unsafe for public payloads');

assert.match(videoUploads, /video_storage:\s*buildVideoStorageReviewContext/, 'uploads should record storage readiness in review context');
assert.match(entities, /video_storage_key:\s*storage\.video_storage_key/, 'VideoUpload mapper should derive video_storage_key for app use');
assert.match(entities, /buildPrivateVideoUri/, 'VideoUpload mapper should keep legacy private URI compatibility');

assert.match(signedRoute, /requireClubRole/, 'signed playback route must enforce club role access');
assert.match(signedRoute, /\['swimmer', 'parent'\]\.includes\(membership\.role\)/, 'signed playback route must restrict swimmer/parent linked access');
assert.match(signedRoute, /membership\.linked_swimmer_id !== upload\.swimmer_id/, 'signed playback route must compare linked swimmer ids');
assert.match(signedRoute, /createSignedUrl/, 'signed playback route must create short-lived signed URLs');
assert.match(signedRoute, /buildSignedReadResponse/, 'signed playback route must use storage response helper');
assert.doesNotMatch(signedRoute, /video_storage_key\s*:/, 'signed playback response must not return private storage keys');
assert.doesNotMatch(signedRoute, /file_path\s*:\s*path|storage_path\s*:\s*path/, 'signed playback response must not return storage paths');

assert.match(aiQueue, /storage_provider:\s*storage\.storage_provider/, 'AI worker payload must include storage provider');
assert.match(aiQueue, /video_key:\s*storage\.video_storage_key/, 'AI worker payload must include private video key for future workers');
assert.match(aiQueue, /signed_video_url_expires_in_seconds/, 'AI worker payload must document signed URL expiry');
assert.match(aiQueue, /signed_video_url:\s*signed\.signedUrl/, 'Render-compatible worker payload may still use a short-lived signed URL');
assert.match(triggerHandler, /normaliseVideoStorageRecord/, 'AI trigger should use the storage helper for readiness checks');

for (const unsafeKey of ['signed_video_url', 'video_url', 'file_uri', 'file_path', 'storage_path']) {
  assert.match(sanitize, new RegExp(`['"\`]${unsafeKey}['"\`]`), `public report sanitizer must block ${unsafeKey}`);
}
assert.doesNotMatch(sharedReportRoute, /signed_video_url\s*:/, 'shared report route must not return signed video URLs');
assert.doesNotMatch(sharedReportRoute, /file_path\s*:/, 'shared report route must not return raw file paths');
assert.doesNotMatch(sharedReportRoute, /storage_path\s*:/, 'shared report route must not return raw storage paths');

for (const source of [videoLibrary, aiReportPage, analysePage]) {
  assert.match(source, /signed_read_url\s*\|\|\s*res\.data\?\.signed_url/, 'playback callers must accept neutral signed_read_url with legacy fallback');
}

const publicPayload = sanitizePublicReportPayload({
  report: {
    status: 'finalised',
    video_url: 'https://example.test/permanent-public-video.mp4',
    file_uri: 'private://private-videos/club/swimmer/video.mp4',
    callback_summary: {
      signed_video_url: 'https://example.test/storage/v1/object/sign/private.mp4?token=secret',
      storage_path: 'club/swimmer/video.mp4',
      video_storage_key: 'club/swimmer/video.mp4',
    },
  },
  findings: [],
  annotations: [],
});
assert.deepEqual(findUnsafePublicReportPaths(publicPayload), [], 'sanitized public payload must not contain unsafe video references');
assert.equal(JSON.stringify(publicPayload).includes('club/swimmer/video.mp4'), false, 'public payload must strip private storage keys');
assert.equal(JSON.stringify(publicPayload).includes('token=secret'), false, 'public payload must strip signed URLs');

const apiFunctions = listApiFunctions();
assert.ok(apiFunctions.length <= 12, `Vercel function count must stay at or under 12; found ${apiFunctions.length}`);

console.log(`Storage hardening check passed. Vercel function count: ${apiFunctions.length}.`);
