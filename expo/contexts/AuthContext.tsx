import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState } from 'react';

import { getAccessToken, getAuthUserId, fetchOwnProfile, type ProfileRow } from '@/lib/supabase';
import { signInWithGoogle, signOutSupabase } from '@/lib/authSession';
import { logger } from '@/utils/logger';

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
};

const SIGN_IN_FAILED_MESSAGE = 'Connexion impossible. Réessayez.';
const PROFILE_LOAD_FAILED_MESSAGE = 'Impossible de charger votre profil. Vérifiez votre connexion.';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  /** Charge l'identité et le profil depuis la session stockée. */
  const restoreSession = useCallback(async () => {
    const token = await getAccessToken();
    const userId = token ? await getAuthUserId() : null;
    if (!userId) {
      setUser(null);
      setProfile(null);
      return;
    }
    setUser({ id: userId, email: null, name: null });
    const { data, error: profileError } = await fetchOwnProfile(userId);
    if (profileError) {
      logger.error('[Auth] profile load failed', { status: profileError.status, code: profileError.code });
      setError(PROFILE_LOAD_FAILED_MESSAGE);
      setProfile(null);
      return;
    }
    setProfile(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await restoreSession();
      } catch (err) {
        logger.error('[Auth] session restore failed', err);
        setUser(null);
        setProfile(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restoreSession]);

  const signIn = useCallback(
    async (_provider: 'google') => {
      setIsSigningIn(true);
      setError(null);
      try {
        const result = await signInWithGoogle();
        if (!result.ok) {
          if (result.reason !== 'cancelled') setError(SIGN_IN_FAILED_MESSAGE);
          return;
        }
        await restoreSession();
      } catch (err) {
        logger.error('[Auth] sign-in failed', err);
        setError(SIGN_IN_FAILED_MESSAGE);
      } finally {
        setIsSigningIn(false);
      }
    },
    [restoreSession]
  );

  const signOut = useCallback(async () => {
    await signOutSupabase();
    setUser(null);
    setProfile(null);
    setError(null);
  }, []);

  /** Rechargé après l'onboarding pour passer dans l'application. */
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const { data, error: profileError } = await fetchOwnProfile(user.id);
    if (profileError) {
      setError(PROFILE_LOAD_FAILED_MESSAGE);
      return;
    }
    setProfile(data);
  }, [user]);

  return {
    user,
    profile,
    /** Connecté mais sans profil : l'onboarding doit être terminé avant l'accès à l'app. */
    needsOnboarding: user !== null && profile === null && !isLoading,
    isLoading,
    isSigningIn,
    error,
    signIn,
    signOut,
    clearError,
    refreshProfile,
  };
});
