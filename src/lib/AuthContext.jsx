import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabaseClient, hasSupabaseBrowserEnv } from '@/lib/supabaseClient';

const AuthContext = createContext();

function getAppOrigin() {
  return import.meta.env.VITE_APP_BASE_URL || window.location.origin;
}

function getFullName(authUser) {
  return (
    authUser?.user_metadata?.full_name ||
    authUser?.user_metadata?.name ||
    authUser?.email?.split('@')[0] ||
    ''
  );
}

function mergeUserProfile(authUser, profile) {
  if (!authUser) return null;

  return {
    id: authUser.id,
    email: authUser.email,
    full_name: profile?.full_name || getFullName(authUser),
    app_role: profile?.app_role || 'user',
    role: profile?.app_role || 'user',
    profile,
    auth_user: authUser,
    created_at: profile?.created_at || authUser.created_at,
    updated_at: profile?.updated_at,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings] = useState({ public_settings: { auth_required: true } });

  const ensureProfile = useCallback(async (authUser) => {
    if (!authUser) return null;

    const supabase = getSupabaseClient();
    const { data: existingProfile, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (selectError) throw selectError;
    if (existingProfile) return existingProfile;

    const fullName = getFullName(authUser);
    const { data: createdProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        email: authUser.email,
        full_name: fullName,
        app_role: 'user',
      })
      .select('*')
      .single();

    if (insertError) throw insertError;
    return createdProfile;
  }, []);

  const applySession = useCallback(async (nextSession) => {
    setSession(nextSession);
    const authUser = nextSession?.user || null;

    if (!authUser) {
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      return null;
    }

    const nextProfile = await ensureProfile(authUser);
    setProfile(nextProfile);
    setUser(mergeUserProfile(authUser, nextProfile));
    setIsAuthenticated(true);
    return nextProfile;
  }, [ensureProfile]);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);

    if (!hasSupabaseBrowserEnv()) {
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      setIsLoadingAuth(false);
      return null;
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      await applySession(data?.session || null);
      setAuthChecked(true);
      return data?.session || null;
    } catch (error) {
      console.error('Supabase auth check failed:', error);
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      setAuthError({
        type: 'auth_error',
        message: error.message || 'Unable to check authentication status',
      });
      setAuthChecked(true);
      return null;
    } finally {
      setIsLoadingAuth(false);
    }
  }, [applySession]);

  const checkAppState = useCallback(async () => {
    setIsLoadingPublicSettings(false);
    return checkUserAuth();
  }, [checkUserAuth]);

  useEffect(() => {
    let mounted = true;
    let subscription;

    async function initialiseAuth() {
      if (!hasSupabaseBrowserEnv()) {
        if (!mounted) return;
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        setAuthChecked(true);
        setIsLoadingAuth(false);
        setIsLoadingPublicSettings(false);
        return;
      }

      const supabase = getSupabaseClient();
      const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (!mounted) return;
        setIsLoadingAuth(true);
        applySession(nextSession)
          .catch((error) => {
            console.error('Supabase auth state update failed:', error);
            setAuthError({
              type: 'auth_error',
              message: error.message || 'Unable to update authentication state',
            });
          })
          .finally(() => {
            if (!mounted) return;
            setAuthChecked(true);
            setIsLoadingAuth(false);
          });
      });

      subscription = data?.subscription;
      await checkAppState();
    }

    initialiseAuth();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [applySession, checkAppState]);

  const login = useCallback(async (email, password) => {
    const supabase = getSupabaseClient();
    setAuthError(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    await applySession(data.session);
    setAuthChecked(true);
    return data;
  }, [applySession]);

  const register = useCallback(async ({ email, password, full_name } = {}) => {
    const supabase = getSupabaseClient();
    setAuthError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: full_name || email?.split('@')[0] || '' },
        emailRedirectTo: `${getAppOrigin()}/club-onboarding`,
      },
    });

    if (error) throw error;
    if (data.session) await applySession(data.session);
    setAuthChecked(true);
    return data;
  }, [applySession]);

  const loginWithGoogle = useCallback(async (redirectTo = '/club-onboarding') => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getAppOrigin()}${redirectTo}`,
      },
    });

    if (error) throw error;
    return data;
  }, []);

  const resetPasswordRequest = useCallback(async (email) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getAppOrigin()}/reset-password`,
    });

    if (error) throw error;
    return data;
  }, []);

  const resetPassword = useCallback(async ({ newPassword }) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) throw error;
    return data;
  }, []);

  const updateProfile = useCallback(async (updates = {}) => {
    if (!session?.user) throw new Error('You must be logged in to update your profile.');

    const supabase = getSupabaseClient();
    const profileUpdates = {
      email: session.user.email,
      full_name: updates.full_name,
    };

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', session.user.id)
      .select('*')
      .single();

    if (error) throw error;

    setProfile(updatedProfile);
    setUser(mergeUserProfile(session.user, updatedProfile));
    return updatedProfile;
  }, [session]);

  const logout = useCallback(async (shouldRedirect = true) => {
    if (hasSupabaseBrowserEnv()) {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    }

    setSession(null);
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    setAuthChecked(true);

    if (shouldRedirect) {
      window.location.assign('/login');
    }
  }, []);

  const navigateToLogin = useCallback(() => {
    window.location.assign('/login');
  }, []);

  const value = useMemo(() => ({
    user,
    profile,
    session,
    loading: isLoadingAuth,
    isAuthenticated,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    appPublicSettings,
    authChecked,
    login,
    register,
    loginWithGoogle,
    resetPasswordRequest,
    resetPassword,
    updateProfile,
    logout,
    navigateToLogin,
    checkUserAuth,
    checkAppState,
  }), [
    user,
    profile,
    session,
    isLoadingAuth,
    isAuthenticated,
    isLoadingPublicSettings,
    authError,
    appPublicSettings,
    authChecked,
    login,
    register,
    loginWithGoogle,
    resetPasswordRequest,
    resetPassword,
    updateProfile,
    logout,
    navigateToLogin,
    checkUserAuth,
    checkAppState,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
