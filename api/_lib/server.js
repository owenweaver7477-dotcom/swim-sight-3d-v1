import { createServerSupabaseClient, createServiceRoleSupabaseClient } from './supabaseServer.js';

export const COACH_ROLES = ['owner', 'admin', 'coach', 'assistant_coach'];
export const ADMIN_ROLES = ['owner', 'admin'];

export function createServiceClient() {
  return createServiceRoleSupabaseClient();
}

export function createUserClient(accessToken) {
  return createServerSupabaseClient({ accessToken });
}

export function sendJson(res, status, payload) {
  return res.status(status).json(payload);
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length);
}

export async function requireUser(req) {
  const token = getBearerToken(req);
  if (!token) {
    const error = new Error('Unauthorized');
    error.status = 401;
    throw error;
  }

  const userClient = createUserClient(token);
  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user) {
    const authError = new Error('Unauthorized');
    authError.status = 401;
    throw authError;
  }

  return { user: data.user, token };
}

export async function getProfile(service, userId) {
  const { data, error } = await service
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getClubMembership(service, clubId, userId) {
  const { data, error } = await service
    .from('club_members')
    .select('*')
    .eq('club_id', clubId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function requireClubRole(service, clubId, userId, roles) {
  const profile = await getProfile(service, userId);
  if (profile?.app_role === 'admin') return { role: 'app_admin', profile };

  const membership = await getClubMembership(service, clubId, userId);
  if (!membership || !roles.includes(membership.role)) {
    const error = new Error('Forbidden');
    error.status = 403;
    throw error;
  }

  return membership;
}

export function normaliseAiServerUrl() {
  const raw = (process.env.AI_SERVER_URL || '').replace(/\/$/, '');
  if (!raw) throw new Error('Missing required environment variable: AI_SERVER_URL');
  return raw.endsWith('/process-video') ? raw : `${raw}/process-video`;
}

export function getPublicAppUrl(req) {
  if (process.env.PUBLIC_APP_URL) return process.env.PUBLIC_APP_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '');
}

export function handleApiError(res, error) {
  const status = error.status || 500;
  return sendJson(res, status, { error: error.message || 'Unexpected server error' });
}
