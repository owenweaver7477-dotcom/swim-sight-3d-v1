const PENDING_INVITE_CODE_KEY = 'swim_sight_pending_invite_code';

export function normaliseInviteCode(code = '') {
  return String(code).trim().toUpperCase();
}

export function getInviteCodeFromSearch(search = '') {
  const params = new URLSearchParams(search);
  return normaliseInviteCode(params.get('code') || params.get('invite') || '');
}

export function rememberPendingInviteCode(code) {
  const normalised = normaliseInviteCode(code);
  if (!normalised || typeof window === 'undefined') return '';
  window.localStorage.setItem(PENDING_INVITE_CODE_KEY, normalised);
  return normalised;
}

export function rememberInviteCodeFromSearch(search = '') {
  return rememberPendingInviteCode(getInviteCodeFromSearch(search));
}

export function peekPendingInviteCode() {
  if (typeof window === 'undefined') return '';
  return normaliseInviteCode(window.localStorage.getItem(PENDING_INVITE_CODE_KEY) || '');
}

export function clearPendingInviteCode() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PENDING_INVITE_CODE_KEY);
}

export function getInviteJoinPath(code) {
  const normalised = normaliseInviteCode(code);
  return normalised ? `/join?code=${encodeURIComponent(normalised)}` : '/club-onboarding';
}

export function appendInviteParam(path, code) {
  const normalised = normaliseInviteCode(code);
  if (!normalised) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}invite=${encodeURIComponent(normalised)}`;
}
