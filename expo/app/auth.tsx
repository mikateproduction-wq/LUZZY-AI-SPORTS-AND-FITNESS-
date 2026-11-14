import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthBackground } from '@/components/AuthBackground';
import { BrandIcon } from '@/components/BrandIcon';
import { LANGUAGES, t, type Key, type LanguageCode } from '@/constants/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { LANGUAGE_STORAGE_KEY } from '@/contexts/LanguageContext';
import { logger } from '@/utils/logger';

/** Langue de l'écran de connexion tant que l'utilisateur n'a pas choisi de langue. */
const AUTH_FALLBACK_LANGUAGE: LanguageCode = 'en';

const SPINNER_COLOR = '#FFFFFF';
const GOOGLE_SPINNER_COLOR = '#3C4043';

export default function AuthScreen() {
  const { user, profile, isLoading, isSigningIn, error, signIn, clearError } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [chosenLanguage, setChosenLanguage] = useState<LanguageCode | null>(null);
  const [languageReady, setLanguageReady] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (!cancelled && saved && LANGUAGES.some((l) => l.code === saved)) {
          setChosenLanguage(saved as LanguageCode);
        }
      } catch (err) {
        logger.error('[Auth] language read failed', err);
      } finally {
        if (!cancelled) setLanguageReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user) {
      router.replace(profile ? '/(tabs)' : '/onboarding');
    }
  }, [user, profile, router]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const language: LanguageCode = chosenLanguage ?? AUTH_FALLBACK_LANGUAGE;
  const tr = (key: Key) => t(key, language);

  const handleSignIn = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      // haptics not available
    }
    await signIn('google');
  };

  if (isLoading || !languageReady) {
    return (
      <AuthBackground>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={SPINNER_COLOR} />
        </View>
      </AuthBackground>
    );
  }

  return (
    <AuthBackground>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.hero}>
          <Text style={styles.appName} accessibilityRole="header">
            LUZZY AI
          </Text>
          <Text style={styles.appTagline}>{tr('auth.tagline')}</Text>
        </View>

        <View style={styles.signInSection}>
          <Text style={styles.signInTitle} accessibilityRole="header">
            {tr('auth.signInTitle')}
          </Text>
          <Text style={styles.signInSubtitle}>{tr('auth.signInSubtitle')}</Text>

          {error ? (
            <View style={styles.errorContainer} accessibilityRole="alert">
              <Text style={styles.errorText}>{tr('auth.errorGeneric')}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleSignIn}
            disabled={isSigningIn}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={tr('auth.signInGoogle')}
            accessibilityState={{ disabled: isSigningIn, busy: isSigningIn }}
          >
            {isSigningIn ? (
              <ActivityIndicator color={GOOGLE_SPINNER_COLOR} size="small" />
            ) : (
              <BrandIcon name="google" size={22} />
            )}
            <Text style={styles.googleButtonText}>{tr('auth.signInGoogle')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legalText}>{tr('auth.legalNotice')}</Text>
      </ScrollView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 32,
  },
  hero: {
    alignItems: 'center',
    gap: 12,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  signInSection: {
    gap: 12,
  },
  signInTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  signInSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorContainer: {
    backgroundColor: 'rgba(220,53,69,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(220,53,69,0.4)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    color: '#FFE0E0',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    minHeight: 54,
    backgroundColor: '#FFFFFF',
  },
  googleButtonText: {
    color: '#3C4043',
    fontSize: 16,
    fontWeight: '600',
  },
  legalText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
