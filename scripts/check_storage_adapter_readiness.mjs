import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  sanitizePublicReportPayload,
  findUnsafePublicReportPaths,
} from '../src/lib/sanitizeAIReport.js';
import {
  DEFAULT_WORKER_SIGNED_READ_TTL_SECONDS,
  isUnsafePublicVideoReference,
  normaliseVideoStorageRecord,
  publicVideoStorageMetadata,
} from '../src/lib/storage/videoStorage.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');

const aiQueue = read('api/_lib/aiQueue.js');
const triggerHandler = read('api/_lib/ai/triggerHandler.js');
const signedUrlRoute = read('api/video-uploads/[id]/signed-url.js');
const sanitizer = read('src/lib/sanitizeAIReport.js');
const storageDocs = read('docs/STORAGE_HARDENING.md');

const syntheticStorage = normaliseVideoStorageRecord({
  storage_provider: 'supabase_private',
  video_storage_key: 'club-a/swimmer-b/video-c/private-video.mp4',
  content_type: 'video/mp4',
  file_size_bytes: 1024,
});

assert.equal(syntheticStorage.storage_provider, 'supabase_private');
assert.equal(syntheticStorage.video_storage_key, 'club-a/swimmer-b/video-c/private-video.mp4');
assert.equal(publicVideoStorageMetadata(syntheticStorage).private_storage_ready, true);
assert.equal(
  JSON.stringify(publicVideoStorageMetadata(syntheticStorage)).includes(syntheticStorage.video_storage_key),
  false,
  'public metadata must not expose private storage keys'
);

assert.match(aiQueue, /PYTHON_SIGNED_URL_TTL_SECONDS\s*=\s*DEFAULT_WORKER_SIGNED_READ_TTL_SECONDS/, 'worker signed URL TTL should use storage helper default');
assert.match(aiQueue, /storage_provider:\s*storage\.storage_provider/, 'worker payload must include storage provider');
assert.match(aiQueue, /video_key:\s*storage\.video_storage_key/, 'worker payload must include private video key');
assert.match(aiQueue, /signed_video_url:\s*signed\.signedUrl/, 'worker payload must include signed URL fallback for current Render worker');
assert.match(aiQueue, /signed_video_url_expires_in_seconds:\s*PYTHON_SIGNED_URL_TTL_SECONDS/, 'worker payload must include signed URL expiry metadata');
assert.match(aiQueue, /missing_private_storage/, 'missing storage must fail safely before worker dispatch');
assert.match(aiQueue, /signed_url_failed/, 'signed URL creation failures must be handled safely');
assert.match(aiQueue, /manual coach review|Manual coach review/i, 'AI dispatch failure path should preserve manual review language');
assert.equal(DEFAULT_WORKER_SIGNED_READ_TTL_SECONDS, 15 * 60, 'worker signed URL TTL should remain short-lived');

assert.match(triggerHandler, /normaliseVideoStorageRecord/, 'AI trigger should normalise storage records before reporting readiness');
assert.match(signedUrlRoute, /requireClubRole/, 'signed playback route must enforce ownership/role checks');
assert.match(signedUrlRoute, /createSignedUrl/, 'signed playback must use short-lived signed URLs');

for (const unsafeKey of [
  'signed_video_url',
  'signed_read_url',
  'video_storage_key',
  'storage_key',
  'storage_path',
  'file_path',
  'file_uri',
]) {
  assert.match(
    sanitizer,
    new RegExp(`['"\`]${unsafeKey}['"\`]`),
    `public report sanitizer must block ${unsafeKey}`
  );
}

const unsafePublicPayload = sanitizePublicReportPayload({
  report: {
    status: 'finalised',
    signed_video_url: 'https://example.supabase.co/storage/v1/object/sign/private-videos/private.mp4?token=secret',
    signed_read_url: 'https://example.supabase.co/storage/v1/object/sign/private-videos/private.mp4?token=secret',
    video_storage_key: 'club-a/swimmer-b/video-c/private-video.mp4',
    storage_path: 'club-a/swimmer-b/video-c/private-video.mp4',
    file_uri: 'private://private-videos/club-a/swimmer-b/video-c/private-video.mp4',
    callback_summary: {
      signed_video_url_expires_in_seconds: 900,
      storage_provider: 'supabase_private',
    },
  },
  findings: [],
  annotations: [],
});

const publicJson = JSON.stringify(unsafePublicPayload);
assert.deepEqual(findUnsafePublicReportPaths(unsafePublicPayload), [], 'sanitized payload must be public-safe');
assert.equal(publicJson.includes('token=secret'), false, 'signed URL tokens must never survive public sanitisation');
assert.equal(publicJson.includes('club-a/swimmer-b/video-c/private-video.mp4'), false, 'private storage keys must never survive public sanitisation');
assert.equal(isUnsafePublicVideoReference('https://example.supabase.co/storage/v1/object/sign/private-videos/private.mp4?token=secret'), true);

assert.match(storageDocs, /SUPABASE_URL/, 'storage docs must list future Supabase direct access env vars');
assert.match(storageDocs, /SUPABASE_SERVICE_ROLE_KEY/, 'storage docs must list service key env var without exposing a value');
assert.match(storageDocs, /SUPABASE_VIDEO_BUCKET/, 'storage docs must document private video bucket env var');
assert.match(storageDocs, /Render worker still receives a short-lived `signed_video_url`/, 'docs must describe current Render compatibility behaviour');
assert.match(storageDocs, /Modal\/RunPod/, 'docs must describe future GPU worker migration path');

console.log('Storage adapter production readiness check passed.');
