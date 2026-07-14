/**
 * useClubContext — Supabase-backed club workspace hook.
 * Loads the user's club memberships, keeps an active club in localStorage,
 * and exposes the legacy club/switchClub shape used by existing pages.
 */
import { useState, useEffect, useCallback } from 'react';
import { getActiveClub, setActiveClub, setActiveRole, signOut as clearSwimState } from '@/lib/swimState';
import { useAuth } from '@/lib/AuthContext';
import { supabase, hasSupabaseBrowserEnv } from '@/lib/supabaseClient';
import { normalizeRole } from '@/lib/permissions';

const DEFAULT_PRIMARY_COLOR = '#0077B6';
const DEFAULT_ACCENT_COLOR = '#00A6C8';

let _globalClub = null;
let _globalClubs = [];
let _globalCurrentMember = null;
let _initialized = false;
let _initializedUserId = null;
let _listeners = [];

function deriveInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts.map(part => part[0]).join('').toUpperCase().slice(0, 3);
}

export function normaliseClub(club, membership) {
  if (!club) return null;
  const rawRole = membership?.role || club._rawMemberRole || club._memberRole || null;
  const role = normalizeRole(rawRole);
  return {
    ...club,
    initials: club.initials || deriveInitials(club.name),
    primary_color: club.primary_color || DEFAULT_PRIMARY_COLOR,
    accent_color: club.accent_color || DEFAULT_ACCENT_COLOR,
    _memberRole: role,
    _rawMemberRole: rawRole,
    _membershipId: membership?.id || club._membershipId,
    _member: membership || club._member || null,
    // The swimmer this member is linked to (for swimmer/parent portal scoping).
    linked_swimmer_id: membership?.linked_swimmer_id ?? club.linked_swimmer_id ?? club._member?.linked_swimmer_id ?? null,
  };
}

function selectStoredClub(userClubs) {
  const saved = getActiveClub();
  if (saved?.id) {
    const existing = userClubs.find(club => club.id === saved.id);
    if (existing) return existing;
  }
  return userClubs[0] || null;
}

function notifyListeners() {
  _listeners.forEach(fn => fn({
    club: _globalClub,
    clubs: _globalClubs,
    currentMember: _globalCurrentMember,
  }));
}

function setGlobalSelection(nextClub, nextClubs = _globalClubs) {
  _globalClub = nextClub || null;
  _globalClubs = nextClubs || [];
  _globalCurrentMember = nextClub?._member || null;

  if (_globalClub) {
    setActiveClub(_globalClub);
    setActiveRole(_globalClub._memberRole || null);
  } else {
    clearSwimState();
  }

  notifyListeners();
  window.dispatchEvent(new Event('swimStateChanged'));
}

export async function loadUserClubs(userId) {
  if (!userId || !hasSupabaseBrowserEnv()) return [];

  const { data, error } = await supabase
    .from('club_members')
    .select(`
      id,
      club_id,
      user_id,
      role,
      linked_swimmer_id,
      created_at,
      updated_at,
      clubs (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || [])
    .filter(row => row.clubs)
    .map(row => normaliseClub(row.clubs, {
      id: row.id,
      club_id: row.club_id,
      user_id: row.user_id,
      role: row.role,
      linked_swimmer_id: row.linked_swimmer_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
}

export function useClubContext() {
  const { user, isAuthenticated, authChecked } = useAuth();
  const [club, setClub] = useState(_globalClub || getActiveClub());
  const [clubs, setClubs] = useState(_globalClubs);
  const [currentMember, setCurrentMember] = useState(_globalCurrentMember);
  const [loading, setLoading] = useState(!_initialized);

  const applyState = useCallback(({ club: nextClub, clubs: nextClubs, currentMember: nextMember }) => {
    setClub(nextClub || null);
    setClubs(nextClubs || []);
    setCurrentMember(nextMember || null);
    setLoading(false);
  }, []);

  const refreshClubs = useCallback(async () => {
    if (!user?.id || !isAuthenticated) {
      setGlobalSelection(null, []);
      return [];
    }

    const userClubs = await loadUserClubs(user.id);
    const selected = selectStoredClub(userClubs);
    setGlobalSelection(selected, userClubs);
    return userClubs;
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    const listener = applyState;
    _listeners.push(listener);

    if (!authChecked) {
      setLoading(true);
      return () => {
        _listeners = _listeners.filter(fn => fn !== listener);
      };
    }

    if (!isAuthenticated || !user?.id) {
      _globalClub = null;
      _globalClubs = [];
      _globalCurrentMember = null;
      _initialized = false;
      _initializedUserId = null;
      clearSwimState();
      applyState({ club: null, clubs: [], currentMember: null });
      notifyListeners();
    } else if (!_initialized || _initializedUserId !== user.id) {
      _initialized = true;
      _initializedUserId = user.id;
      setLoading(true);
      refreshClubs().catch(() => {
        setLoading(false);
      });
    } else {
      applyState({
        club: _globalClub,
        clubs: _globalClubs,
        currentMember: _globalCurrentMember,
      });
    }

    return () => {
      _listeners = _listeners.filter(fn => fn !== listener);
    };
  }, [applyState, authChecked, isAuthenticated, refreshClubs, user?.id]);

  useEffect(() => {
    const onChanged = () => {
      const current = getActiveClub();
      setClub(current);
      setCurrentMember(current?._member || null);
    };
    window.addEventListener('swimStateChanged', onChanged);
    return () => window.removeEventListener('swimStateChanged', onChanged);
  }, []);

  const switchClub = useCallback((newClub) => {
    const selected = normaliseClub(newClub);
    const updatedClubs = selected
      ? _globalClubs.map(existing => existing.id === selected.id ? selected : existing)
      : _globalClubs;
    setGlobalSelection(selected, updatedClubs);
  }, []);

  const setActiveClubSelection = useCallback((newClub) => {
    switchClub(newClub);
  }, [switchClub]);

  const memberRole = club?._memberRole || currentMember?.role || null;

  return {
    club,
    currentClub: club,
    clubs,
    activeClubId: club?.id || null,
    currentMember,
    memberRole,
    loading,
    switchClub,
    setActiveClub: setActiveClubSelection,
    refreshClubs,
  };
}

export function resetClubContext() {
  _globalClub = null;
  _globalClubs = [];
  _globalCurrentMember = null;
  _initialized = false;
  _initializedUserId = null;
  _listeners = [];
}
