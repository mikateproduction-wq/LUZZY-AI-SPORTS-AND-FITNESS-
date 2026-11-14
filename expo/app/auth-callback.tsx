import React, { useEffect } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { storeSessionFromUrl } from '@/lib/authSession';
import { logger } from '@/utils/logger';

/**
 * Retour de la connexion Google.
 * - Web : Supabase renvoie les jetons dans le fragment de l'URL courante ; on les enregistre ici.
 * - Natif : la session est déjà enregistrée par la connexion ; cette route redirige seulement.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hash) {
          const result = await storeSessionFromUrl(window.location.href);
          if (!result.ok) {
            logger.error('[Auth] web callback rejected', { reason: result.reason });
          }
          // Nettoie les jetons de l'historique du navigateur.
          window.history.replaceState(null, '', window.location.pathname);
        }
        await refreshProfile();
      } catch (err) {
        logger.error('[Auth] callback failed', err);
      } finally {
        if (!cancelled) router.replace('/');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshProfile, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}
