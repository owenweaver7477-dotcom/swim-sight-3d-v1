/**
 * useClubContext — Global club workspace hook.
 * Loads the user's club memberships on mount, auto-selects if single club,
 * persists selection to localStorage, and exposes a switcher.
 */
import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { getActiveClub, setActiveClub, setActiveRole } from '@/lib/swimState';

let _globalClub = null;
let _globalSetClub = null;
let _globalClubs = [];
let _globalSetClubs = null;
let _initialized = false;
let _listeners = [];

function notifyListeners() {
  _listeners.forEach(fn => fn(_globalClub, _globalClubs));
}

export async function loadUserClubs(userId) {
  if (!userId) return [];
  const memberships = await base44.entities.ClubMember.filter({ user_id: userId });
  if (!memberships.length) return [];
  const clubIds = memberships.map(m => m.club_id);
  // Fetch all clubs the user belongs to
  const allClubs = await base44.entities.Club.list('-created_date', 50);
  const userClubs = allClubs.filter(c => clubIds.includes(c.id));
  // Attach role info
  return userClubs.map(club => {
    const membership = memberships.find(m => m.club_id === club.id);
    return { ...club, _memberRole: membership?.role || 'coach' };
  });
}

export function useClubContext() {
  const [club, setClub] = useState(_globalClub || getActiveClub());
  const [clubs, setClubs] = useState(_globalClubs);
  const [loading, setLoading] = useState(!_initialized);

  useEffect(() => {
    const listener = (newClub, newClubs) => {
      setClub(newClub);
      setClubs(newClubs);
      setLoading(false);
    };
    _listeners.push(listener);

    if (!_initialized) {
      _initialized = true;
      base44.auth.me().then(user => {
        if (!user) { setLoading(false); return; }
        loadUserClubs(user.id).then(userClubs => {
          _globalClubs = userClubs;
          if (_globalSetClubs) _globalSetClubs(userClubs);

          const saved = getActiveClub();
          let selected = null;
          if (saved && userClubs.find(c => c.id === saved.id)) {
            selected = userClubs.find(c => c.id === saved.id);
          } else if (userClubs.length === 1) {
            selected = userClubs[0];
          } else if (userClubs.length > 1) {
            selected = userClubs[0]; // auto-select most recent
          }

          if (selected) {
            _globalClub = selected;
            setActiveClub(selected);
            setActiveRole(selected._memberRole || 'coach');
            if (_globalSetClub) _globalSetClub(selected);
            window.dispatchEvent(new Event('swimStateChanged'));
          }

          notifyListeners();
          setLoading(false);
        }).catch(() => setLoading(false));
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }

    return () => {
      _listeners = _listeners.filter(fn => fn !== listener);
    };
  }, []);

  // Also sync from swimStateChanged events
  useEffect(() => {
    const onChanged = () => {
      const current = getActiveClub();
      setClub(current);
    };
    window.addEventListener('swimStateChanged', onChanged);
    return () => window.removeEventListener('swimStateChanged', onChanged);
  }, []);

  const switchClub = useCallback((newClub) => {
    _globalClub = newClub;
    setActiveClub(newClub);
    setActiveRole(newClub._memberRole || 'coach');
    setClub(newClub);
    notifyListeners();
    window.dispatchEvent(new Event('swimStateChanged'));
  }, []);

  const refreshClubs = useCallback(async () => {
    const user = await base44.auth.me();
    if (!user) return;
    const userClubs = await loadUserClubs(user.id);
    _globalClubs = userClubs;
    setClubs(userClubs);
    notifyListeners();
    return userClubs;
  }, []);

  return { club, clubs, loading, switchClub, refreshClubs };
}

export function resetClubContext() {
  _globalClub = null;
  _globalClubs = [];
  _initialized = false;
  _listeners = [];
}