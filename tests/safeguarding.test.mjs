import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  consentGate,
  envFlagEnabled,
  footageRetentionDays,
  selectUploadsDueForDeletion,
} from '../api/_lib/safeguarding.js';

test('consent gate defaults off', () => {
  assert.equal(envFlagEnabled(undefined), false);
  assert.equal(consentGate({ is_minor: true, consent_status: 'none' }).allowed, true);
});

test('consent gate blocks only minors without granted consent when required', () => {
  assert.equal(consentGate(null, { required: true }).allowed, true);
  assert.equal(consentGate({ is_minor: false, consent_status: 'none' }, { required: true }).allowed, true);
  assert.equal(consentGate({ is_minor: true, consent_status: 'granted' }, { required: true }).allowed, true);

  const missing = consentGate({ is_minor: true, consent_status: 'none' }, { required: true });
  const withdrawn = consentGate({ is_minor: true, consent_status: 'withdrawn' }, { required: true });
  assert.equal(missing.allowed, false);
  assert.equal(withdrawn.allowed, false);
  assert.equal(missing.next_action, 'record_guardian_consent');
});

test('retention defaults to 30 days', () => {
  assert.equal(footageRetentionDays(undefined), 30);
  assert.equal(footageRetentionDays('45'), 45);
  assert.equal(footageRetentionDays('0'), 30);
});

test('retention selector chooses completed workflows or expired footage', () => {
  const base = {
    file_bucket: 'private-videos',
    file_path: 'club/video.mp4',
    raw_footage_deleted_at: null,
  };
  const uploads = [
    { ...base, id: 'completed', created_at: '2026-06-19T00:00:00Z' },
    { ...base, id: 'expired', created_at: '2026-04-01T00:00:00Z' },
    { ...base, id: 'fresh', created_at: '2026-06-19T00:00:00Z' },
    { ...base, id: 'already-deleted', created_at: '2026-04-01T00:00:00Z', raw_footage_deleted_at: '2026-05-01T00:00:00Z' },
    { ...base, id: 'missing-object', created_at: '2026-04-01T00:00:00Z', file_path: null },
  ];
  const selected = selectUploadsDueForDeletion(uploads, {
    now: new Date('2026-06-20T00:00:00Z'),
    retentionDays: 30,
    completedVideoIds: new Set(['completed']),
  });
  assert.deepEqual(
    selected.map(({ upload, reason }) => [upload.id, reason]),
    [
      ['completed', 'coach_review_complete'],
      ['expired', 'retention_period_elapsed'],
    ]
  );
});

test('public report routes whitelist swimmer fields and omit guardian contact', async () => {
  const supabaseRoute = await readFile(new URL('../api/shared-reports/[token].js', import.meta.url), 'utf8');
  const base44Route = await readFile(new URL('../base44/functions/getSharedReport/entry.ts', import.meta.url), 'utf8');
  const forbidden = [
    'is_minor',
    'consent_status',
    'guardian_name',
    'guardian_email',
    'consent_source',
    'consent_granted_at',
    'consent_withdrawn_at',
  ];

  assert.match(supabaseRoute, /select\('first_name,last_name'\)/);
  assert.match(base44Route, /const publicSwimmer = swimmer \? \{/);
  for (const field of forbidden) {
    assert.equal(supabaseRoute.includes(field), false, `${field} leaked into Supabase shared route`);
    assert.equal(base44Route.includes(field), false, `${field} leaked into Base44 shared route`);
  }
});

test('both AI trigger paths apply consent before creating a job', async () => {
  const supabaseTrigger = await readFile(new URL('../api/_lib/ai/triggerHandler.js', import.meta.url), 'utf8');
  const base44Trigger = await readFile(
    new URL('../base44/functions/triggerPoseAnalysis/entry.ts', import.meta.url),
    'utf8'
  );

  assert.ok(supabaseTrigger.indexOf("from('swimmer_consent_records')") >= 0);
  assert.ok(
    supabaseTrigger.indexOf("from('swimmer_consent_records')")
      < supabaseTrigger.indexOf("from('ai_processing_jobs')\n      .insert")
  );
  assert.ok(base44Trigger.indexOf('entities.ConsentRecord.filter') >= 0);
  assert.ok(
    base44Trigger.indexOf('entities.ConsentRecord.filter')
      < base44Trigger.indexOf('entities.AIProcessingJob.create')
  );
  assert.match(supabaseTrigger, /process\.env\.REQUIRE_CONSENT/);
  assert.match(base44Trigger, /Deno\.env\.get\('REQUIRE_CONSENT'\)/);
});

test('private playback restricts swimmer and parent roles to their linked swimmer', async () => {
  const signedUrlRoute = await readFile(
    new URL('../api/video-uploads/[id]/signed-url.js', import.meta.url),
    'utf8'
  );

  assert.match(signedUrlRoute, /\['swimmer', 'parent'\]\.includes\(membership\.role\)/);
  assert.match(signedUrlRoute, /membership\.linked_swimmer_id !== upload\.swimmer_id/);
  assert.doesNotMatch(signedUrlRoute, /\.select\('\*'\)/);
});

test('share links require every finding to have a final coach decision', async () => {
  const shareLinkRoute = await readFile(
    new URL('../api/reports/[id]/share-link.js', import.meta.url),
    'utf8'
  );

  assert.match(shareLinkRoute, /\['approved', 'rejected'\]\.includes\(finding\.approval_status\)/);
  assert.match(shareLinkRoute, /finding.*still pending review/);
});
