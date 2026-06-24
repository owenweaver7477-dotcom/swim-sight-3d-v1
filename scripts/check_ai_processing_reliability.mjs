import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

const cancelRoute = await read('api/ai/cancel.js');
const queue = await read('api/_lib/aiQueue.js');
const callbackRoute = await read('api/ai/callback.js');
const videoLibrary = await read('src/components/analysis/VideoLibrary.jsx');
const reportPage = await read('src/pages/AIReportPage.jsx');

assert.match(cancelRoute, /requireClubRole/);
assert.match(cancelRoute, /AI_WEBHOOK_SECRET/);
assert.match(cancelRoute, /cancel_requested/);
assert.doesNotMatch(cancelRoute, /signed_video_url|file_path|storage_path/);
assert.match(queue, /cancelled_during_dispatch/);
assert.match(queue, /\.eq\('queue_status', 'dispatching'\)/);
assert.match(callbackRoute, /late_callback_after_cancel_requested/);
assert.match(callbackRoute, /late_callback_after_/);
assert.match(videoLibrary, /cancelAIReview/);
assert.match(videoLibrary, /continue manual coach review/i);
assert.match(reportPage, /cancelAIReview/);
assert.match(reportPage, /no AI result is published without coach approval/i);

console.log('AI processing reliability check passed.');
