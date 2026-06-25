/**
 * Swim Sight 3D — ClubMember permission helpers
 *
 * These helpers encode the role hierarchy used by ClubMember records.
 * Roles (from club_members): owner | admin | coach | assistant_coach | swimmer | parent
 * Some pilot/imported workspaces may use display-style aliases such as
 * head_coach or club_admin. Normalise those before checking permissions.
 *
 * Usage:
 *   import { canManageClub } from '@/lib/permissions';
 *   const canEdit = canManageClub(club?._memberRole);
 *
 * NOTE: This file is not currently wired into pages — inline role checks
 * (e.g. ['owner','admin'].includes(memberRole)) are used throughout the app.
 * Use these helpers for any new role-gated logic going forward.
 */

export const ROLES = {
  OWNER:   'owner',
  ADMIN:   'admin',
  COACH:   'coach',
  ASSISTANT_COACH: 'assistant_coach',
  SWIMMER: 'swimmer',
  PARENT:  'parent',
};

export const ROLE_ALIASES = {
  administrator: ROLES.ADMIN,
  club_admin: ROLES.ADMIN,
  clubadmin: ROLES.ADMIN,
  head_coach: ROLES.COACH,
  headcoach: ROLES.COACH,
  assistant: ROLES.ASSISTANT_COACH,
  assistantcoach: ROLES.ASSISTANT_COACH,
  assistant_coach: ROLES.ASSISTANT_COACH,
  athlete: ROLES.SWIMMER,
};

export const ADMIN_ACCESS_ROLES = [ROLES.OWNER, ROLES.ADMIN];
export const COACH_ACCESS_ROLES = [ROLES.OWNER, ROLES.ADMIN, ROLES.COACH, ROLES.ASSISTANT_COACH];
export const PILOT_ACCESS_ROLES = [ROLES.OWNER, ROLES.ADMIN, ROLES.COACH];

export function normalizeRole(role) {
  const key = String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  return ROLE_ALIASES[key] || key;
}

export function isAdminRole(role) {
  return ADMIN_ACCESS_ROLES.includes(normalizeRole(role));
}

export function isCoachAppRole(role) {
  return COACH_ACCESS_ROLES.includes(normalizeRole(role));
}

export function isPilotRole(role) {
  return PILOT_ACCESS_ROLES.includes(normalizeRole(role));
}

// Owners and admins manage club settings, branding, squads
export function canManageClub(role) {
  return isAdminRole(role);
}

// Owners and admins create or revoke invite codes
export function canCreateInvites(role) {
  return isAdminRole(role);
}

// Only owners can issue admin-level invites
export function canCreateAdminInvites(role) {
  return normalizeRole(role) === ROLES.OWNER;
}

// Coaches (and above) can upload videos for analysis
export function canUploadVideos(role) {
  return isCoachAppRole(role);
}

// Coaches (and above) can send a video to AI analysis
export function canTriggerAI(role) {
  return isCoachAppRole(role);
}

// Coaches (and above) can approve or reject AI-suggested findings
export function canApproveFindings(role) {
  return isCoachAppRole(role);
}

// All authenticated club members can view reports
export function canViewReports(role) {
  return [ROLES.OWNER, ROLES.ADMIN, ROLES.COACH, ROLES.ASSISTANT_COACH, ROLES.SWIMMER, ROLES.PARENT].includes(normalizeRole(role));
}

// All authenticated club members can view a swimmer's profile page
export function canViewSwimmerProfile(role) {
  return [ROLES.OWNER, ROLES.ADMIN, ROLES.COACH, ROLES.ASSISTANT_COACH, ROLES.SWIMMER, ROLES.PARENT].includes(normalizeRole(role));
}

// Coaches (and above) can upload reference assets for their club
export function canUploadClubReferenceAsset(role) {
  return isCoachAppRole(role);
}

// Only owners can upload official/global model assets
export function canUploadOfficialModelAsset(role) {
  return normalizeRole(role) === ROLES.OWNER;
}

// Human-readable label for display
export function getRoleLabel(role) {
  const labels = {
    owner:   'Owner',
    admin:   'Admin',
    club_admin: 'Club Admin',
    head_coach: 'Head Coach',
    coach:   'Coach',
    assistant_coach: 'Assistant Coach',
    swimmer: 'Swimmer',
    parent:  'Parent',
  };
  const key = String(role || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  return labels[key] || labels[normalizeRole(role)] || role;
}
