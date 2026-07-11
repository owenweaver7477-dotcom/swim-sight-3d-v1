// Manual-first pilot lock.
//
// For the pilot, Swim Sight 3D runs as a manual coach-review platform and the
// AI review path is locked behind an "In Testing" state for all normal users.
// AI code, database fields, the worker integration, and the callback/queue
// paths are all left intact — this is a reversible UI/config lock, not a
// removal.
//
// Default is LOCKED: with the flag unset, AI review is off. To re-enable AI
// later, set VITE_ENABLE_AI_REVIEW=true on Vercel and redeploy — no code or
// data change required. The server enforces the same flag in
// api/_lib/ai/triggerHandler.js so the app never depends on the Render worker
// while the pilot is locked.
export const AI_REVIEW_ENABLED = import.meta.env.VITE_ENABLE_AI_REVIEW === 'true';
export const AI_PILOT_LOCKED = !AI_REVIEW_ENABLED;
