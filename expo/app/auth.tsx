import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { DEFAULT_THEME } from "@/constants/themes";
import { logger } from "@/utils/logger";

const { width } = Dimensions.get("window");

export default function AuthScreen() {
  const { user, profile, isLoading, isSigningIn, error, signIn, clearError } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const theme = DEFAULT_THEME;

  useEffect(() => {
    if (user) {
      router.replace(profile ? "/(tabs)" : "/onboarding");
    }
  }, [user, profile, router]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleSignIn = async (provider: "google") => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      // haptics not available
    }
    await signIn(provider);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Hero section */}
        <View style={styles.heroSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>💪</Text>
          </View>
          <Text style={styles.appName}>LUZZY AI</Text>
          <Text style={styles.appTagline}>{t("auth.tagline")}</Text>
        </View>

        {/* Sign-in section */}
        <View style={styles.signInSection}>
          <Text style={styles.signInTitle}>{t("auth.signInTitle")}</Text>
          <Text style={styles.signInSubtitle}>{t("auth.signInSubtitle")}</Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Google button */}
          <TouchableOpacity
            style={[styles.oauthButton, styles.googleButton]}
            onPress={() => handleSignIn("google")}
            disabled={isSigningIn}
            activeOpacity={0.85}
          >
            {isSigningIn ? (
              <ActivityIndicator color="#3C4043" size="small" />
            ) : (
              <>
                <GoogleIcon />
                <Text style={styles.googleButtonText}>
                  {t("auth.signInGoogle")}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Skip / Continue as guest */}
          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => router.replace("/(tabs)")}
            activeOpacity={0.7}
          >
            <Text style={styles.guestButtonText}>
              {t("auth.continueAsGuest")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          {t("auth.termsPrefix")}{" "}
          <Text style={styles.footerLink}>{t("auth.terms")}</Text> {"•"}{" "}
          <Text style={styles.footerLink}>{t("auth.privacy")}</Text>
        </Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

/** Inline Google "G" icon (multi-colour SVG via shapes). */
function GoogleIcon() {
  return (
    <View style={styles.iconWrap}>
      <Text style={styles.googleG}>G</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: "center",
    gap: 12,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  logoEmoji: {
    fontSize: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center" as const,
    maxWidth: 260,
    lineHeight: 22,
  },
  signInSection: {
    gap: 12,
  },
  signInTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    textAlign: "center" as const,
    marginBottom: 4,
  },
  signInSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center" as const,
    marginBottom: 8,
  },
  errorContainer: {
    backgroundColor: "rgba(220,53,69,0.15)",
    borderWidth: 1,
    borderColor: "rgba(220,53,69,0.4)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
  },
  errorText: {
    color: "#FFE0E0",
    fontSize: 13,
    textAlign: "center" as const,
    fontWeight: "500" as const,
  },
  oauthButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 12,
    paddingVertical: 16,
    borderRadius: 14,
    minHeight: 54,
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
  },
  googleButtonText: {
    color: "#3C4043",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  iconWrap: {
    width: 24,
    height: 24,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  googleG: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: "#4285F4",
  },
  guestButton: {
    paddingVertical: 14,
    alignItems: "center" as const,
    marginTop: 4,
  },
  guestButtonText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "500" as const,
  },
  footerText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center" as const,
    lineHeight: 18,
  },
  footerLink: {
    fontWeight: "600" as const,
    textDecorationLine: "underline" as const,
  },
});
