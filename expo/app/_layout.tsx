import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { ActivityProvider } from "@/contexts/ActivityContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import IntroVideoOverlay from "@/components/IntroVideoOverlay";
import LoadingOverlay from "@/components/LoadingOverlay";
import { logger } from "@/utils/logger";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

type AppPhase = "intro" | "loading" | "routing" | "ready";

interface StartupRouteControllerProps {
  enabled: boolean;
  onReady: () => void;
}

function StartupRouteController({ enabled, onReady }: StartupRouteControllerProps) {
  const { user, isLoading } = useAuth();
  const hasRoutedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled || isLoading || hasRoutedRef.current) return;

    hasRoutedRef.current = true;
    router.replace(user ? "/(tabs)" : "/auth");

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(onReady);
    });

    return () => cancelAnimationFrame(frame);
  }, [enabled, isLoading, onReady, user]);

  return null;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false, presentation: "fullScreenModal" }} />
      <Stack.Screen name="splash" options={{ headerShown: false, presentation: "fullScreenModal" }} />
      <Stack.Screen name="loading" options={{ headerShown: false, presentation: "fullScreenModal" }} />
      <Stack.Screen name="exercise/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [phase, setPhase] = useState<AppPhase>("intro");
  const [showLoading, setShowLoading] = useState(false);
  const [showApp, setShowApp] = useState(false);

  const introOpacity = useRef(new Animated.Value(1)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const appOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const handleIntroFinished = useCallback(() => {
    logger.log("[App] Intro finished — starting cinematic transition");
    setShowLoading(true);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(flashOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(introOpacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(loadingOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      logger.log("[App] Transition complete — showing loading");
      setPhase("loading");
    });
  }, [introOpacity, loadingOpacity, flashOpacity]);

  const handleLoadingFinished = useCallback(() => {
    setShowApp(true);
    setPhase("routing");
  }, []);

  const handleStartupDestinationReady = useCallback(() => {
    Animated.parallel([
      Animated.timing(loadingOpacity, {
        toValue: 0,
        duration: 400,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(appOpacity, {
        toValue: 1,
        duration: 600,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPhase("ready");
    });
  }, [loadingOpacity, appOpacity]);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <ProfileProvider>
                <ActivityProvider>
                  <NotificationProvider>
                  <View style={styles.root}>
                    {(showApp || phase === "ready") && (
                      <Animated.View style={[StyleSheet.absoluteFill, { opacity: phase === "ready" ? 1 : appOpacity }]}>
                        <RootLayoutNav />
                        <StartupRouteController
                          enabled={phase === "routing"}
                          onReady={handleStartupDestinationReady}
                        />
                      </Animated.View>
                    )}

                    {showLoading && phase !== "ready" && (
                      <Animated.View style={[StyleSheet.absoluteFill, { opacity: loadingOpacity }]} pointerEvents={phase === "loading" ? "auto" : "none"}>
                        <LoadingOverlay onFinished={handleLoadingFinished} />
                      </Animated.View>
                    )}

                    {phase === "intro" && (
                      <Animated.View style={[StyleSheet.absoluteFill, { opacity: introOpacity }]}>
                        <IntroVideoOverlay onFinished={handleIntroFinished} />
                      </Animated.View>
                    )}

                    <Animated.View
                      style={[styles.flash, { opacity: flashOpacity }]}
                      pointerEvents="none"
                    />
                  </View>
                </NotificationProvider>
              </ActivityProvider>
            </ProfileProvider>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  flash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 9999,
  },
});
