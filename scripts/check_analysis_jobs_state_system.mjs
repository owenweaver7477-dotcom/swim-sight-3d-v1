import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  findUnsafePublicReportPaths,
  sanitizePublicReportPayload,
} from '../src/lib/sanitizeAIReport.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');

const aiRoute = read('api/ai/[action].js');
const jobResponse = read('api/_lib/ai/jobResponse.js');
const statusHandler = read('api/_lib/ai/statusHandler.js');
const triggerHandler = read('api/_lib/ai/triggerHandler.js');
const callbackHandler = read('api/_lib/ai/callbackHandler.js');
const queueHelper = read('api/_lib/aiQueue.js');
const videoLibrary = read('src/components/analysis/VideoLibrary.jsx');
const analysePage = read('src/pages/Analyse.jsx');
const functionsClient = read('src/lib/data/functions.js');
const outputSelection = read('src/components/analysis/AIReportOutputSelector.jsx');

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

for (const status of ['created', 'pending', 'queued', 'processing', 'completed', 'failed']) {
  assert.match(jobResponse, new RegExp(`['"\`]${status}['"\`]`), `missing analysis job status: ${status}`);
}

assert.match(aiRoute, /status:\s*statusHandler/, 'consolidated /api/ai/status action must be registered');
assert.match(statusHandler, /requireClubRole/, 'status action must enforce club role access');
assert.match(statusHandler, /safeAnalysisJobResponse/, 'status action must return safe job shape');

assert.match(triggerHandler, /sendJson\(res,\s*202/, 'trigger should return a non-blocking accepted response');
assert.match(triggerHandler, /safeAnalysisJobResponse/, 'trigger should return safe job response');
assert.match(triggerHandler, /Manual coach review is still available|Manual coach review remains available/i, 'trigger must include manual fallback wording');
assert.match(queueHelper, /DEFAULT_AI_SERVER_ACCEPTANCE_TIMEOUT_MS\s*=\s*8\s*\*\s*1000/, 'worker acceptance wait should be short by default');

assert.match(functionsClient, /getAIJobStatus/, 'client helper must expose safe job status lookup');
assert.match(functionsClient, /\/api\/ai\/status\?job_id=/, 'client status helper must use consolidated ai status route');

assert.match(videoLibrary, /AI_POLL_FAST_MS\s*=\s*5\s*\*\s*1000/, 'polling must start at 5 seconds');
assert.match(videoLibrary, /AI_POLL_MEDIUM_AFTER_MS\s*=\s*2\s*\*\s*60\s*\*\s*1000/, 'polling must back off after 2 minutes');
assert.match(videoLibrary, /AI_POLL_MEDIUM_MS\s*=\s*15\s*\*\s*1000/, 'medium polling must be 15 seconds');
assert.match(videoLibrary, /AI_POLL_SLOW_MS\s*=\s*30\s*\*\s*1000/, 'slow polling must be 30 seconds');
assert.match(videoLibrary, /getAIJobPollingInterval/, 'video library must use central polling interval helper');
assert.match(videoLibrary, /Stop waiting and open Coach Studio/, 'active AI state must expose manual review fallback');
assert.match(videoLibrary, /Cancel AI review/, 'active AI state must expose cancellation');

assert.match(analysePage, /Open Coach Studio/, 'Analyse page must keep manual review path visible');
assert.match(analysePage, /Manual coach review is still available|manual coach review/i, 'Analyse page must show manual fallback text');
assert.match(analysePage, /user_error_message|user_error/, 'Analyse page must prefer safe user error fields');

assert.match(jobResponse, /user_error_message/, 'safe job response must include user-facing error field');
assert.match(jobResponse, /developer_error_present/, 'safe job response must separate developer error presence');
assert.doesNotMatch(jobResponse, /dev_error:\s*job\.(last_error|dispatch_error)/, 'safe job response must not expose developer error text');

assert.match(callbackHandler, /payload\.app_job_id/, 'callback must resolve app job id');
assert.match(callbackHandler, /payload\.job_id/, 'callback must resolve job id');

assert.ok(existsSync(path.join(root, 'api/video-uploads/[id]/signed-url.js')), 'signed URL route must still exist');
assert.ok(existsSync(path.join(root, 'scripts/check_analyse_route_runtime_safety.mjs')), 'Analyse runtime safety script must still exist');

const analyseRouteSources = [
  analysePage,
  ...readdirSync(path.join(root, 'src/components/analysis'))
    .filter((file) => /\.(jsx|js|tsx|ts)$/.test(file))
    .map((file) => read(`src/components/analysis/${file}`)),
].join('\n');
assert.doesNotMatch(analyseRouteSources, /<Activity\b/, 'Analyse route subtree must not render an undefined Activity icon');

assert.match(analysePage, /VITE_ENABLE_ADVANCED_AI_METRICS\s*===\s*'true'/, 'advanced AI metrics must remain feature-gated');
assert.match(analysePage, /VITE_ENABLE_ESTIMATED_DRAG\s*===\s*'true'/, 'estimated drag must remain feature-gated');
assert.match(outputSelection, /coach approval|coach review|required/i, 'AI output selection must retain coach-review wording');

const publicPayload = sanitizePublicReportPayload({
  report: {
    status: 'finalised',
    callback_summary: {
      user_error_message: 'AI worker unavailable',
      developer_error_log: 'Traceback should not appear',
      signed_video_url: 'https://example.supabase.co/storage/v1/object/sign/private.mp4?token=secret',
      raw_landmarks: [{ x: 1 }],
      file_path: '/Users/private/video.mp4',
    },
  },
  findings: [{
    approval_status: 'rejected',
    observation: 'Rejected finding should not appear',
    raw_ai_payload: { debug: true },
  }],
  annotations: [],
});
assert.deepEqual(findUnsafePublicReportPaths(publicPayload), [], 'public report sanitizer must remove private fields');
assert.equal(JSON.stringify(publicPayload).includes('Traceback'), false, 'public report must not include developer errors');
assert.equal(JSON.stringify(publicPayload).includes('signed_video_url'), false, 'public report must not include signed URL keys');

const apiFunctions = listApiFunctions();
assert.ok(apiFunctions.length <= 12, `Vercel function count must stay at or under 12; found ${apiFunctions.length}`);
assert.ok(apiFunctions.includes('api/ai/[action].js'), 'AI actions must remain consolidated');

console.log(`Analysis jobs state system check passed. Vercel function count: ${apiFunctions.length}.`);
