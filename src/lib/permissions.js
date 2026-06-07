/**
 * Swim Sight 3D — ClubMember permission helpers
 *
 * These helpers encode the role hierarchy used by ClubMember records.
 * Roles (from club_members): owner | admin | coach | assistant_coach | swimmer | parent
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

// Owners and admins manage club settings, branding, squads
export function canManageClub(role) {
  return [ROLES.OWNER, ROLES.ADMIN].includes(role);
}

// Owners and admins create or revoke invite codes
export function canCreateInvites(role) {
  return [ROLES.OWNER, ROLES.ADMIN].includes(role);
}

// Only owners can issue admin-level invites
export function canCreateAdminInvites(role) {
  return role === ROLES.OWNER;
}

// Coaches (and above) can upload videos for analysis
export function canUploadVideos(role) {
  return [ROLES.OWNER, ROLES.ADMIN, ROLES.COACH, ROLES.ASSISTANT_COACH].includes(role);
}

// Coaches (and above) can send a video to AI analysis
export function canTriggerAI(role) {
  return [ROLES.OWNER, ROLES.ADMIN, ROLES.COACH, ROLES.ASSISTANT_COACH].includes(role);
}

// Coaches (and above) can approve or reject AI-suggested findings
export function canApproveFindings(role) {
  return [ROLES.OWNER, ROLES.ADMIN, ROLES.COACH, ROLES.ASSISTANT_COACH].includes(role);
}

// All authenticated club members can view reports
export function canViewReports(role) {
  return [ROLES.OWNER, ROLES.ADMIN, ROLES.COACH, ROLES.ASSISTANT_COACH, ROLES.SWIMMER, ROLES.PARENT].includes(role);
}

// All authenticated club members can view a swimmer's profile page
export function canViewSwimmerProfile(role) {
  return [ROLES.OWNER, ROLES.ADMIN, ROLES.COACH, ROLES.ASSISTANT_COACH, ROLES.SWIMMER, ROLES.PARENT].includes(role);
}

// Coaches (and above) can upload reference assets for their club
export function canUploadClubReferenceAsset(role) {
  return [ROLES.OWNER, ROLES.ADMIN, ROLES.COACH, ROLES.ASSISTANT_COACH].includes(role);
}

// Only owners can upload official/global model assets
export function canUploadOfficialModelAsset(role) {
  return role === ROLES.OWNER;
}

// Human-readable label for display
export function getRoleLabel(role) {
  const labels = {
    owner:   'Owner',
    admin:   'Admin',
    coach:   'Coach',
    assistant_coach: 'Assistant Coach',
    swimmer: 'Swimmer',
    parent:  'Parent',
  };
  return labels[role] || role;
}
