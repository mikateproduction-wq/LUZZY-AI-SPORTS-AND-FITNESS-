import { setAudioModeAsync } from 'expo-audio';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, Dimensions } from 'react-native';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';

import { logger } from '@/utils/logger';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const INTRO_VIDEO_SOURCE = {
  uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/sclm6h484eo3ofidt3zbf.mp4',
} as VideoSource;
const DEFAULT_FALLBACK_MS = 25000;
const MIN_FALLBACK_MS = 8000;
const MAX_FALLBACK_MS = 60000;
const FINISH_BUFFER_MS = 1200;

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const entryOpacityAnim = useRef(new Animated.Value(0)).current;
  const entryScaleAnim = useRef(new Animated.Value(1.02)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const glowPulseAnim = useRef(new Animated.Value(0.3)).current;
  const hasNavigatedRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationHandledRef = useRef(false);
  const hasAnimatedEntryRef = useRef(false);

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const animateVideoEntry = useCallback(() => {
    if (hasAnimatedEntryRef.current) {
      return;
    }

    hasAnimatedEntryRef.current = true;
    logger.log('[Splash] starting intro video entry animation');

    Animated.parallel([
      Animated.timing(entryOpacityAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(entryScaleAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      logger.log('[Splash] intro video entry animation finished:', finished);
    });

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulseAnim, {
          toValue: 0.6,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulseAnim, {
          toValue: 0.3,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [entryOpacityAnim, entryScaleAnim, glowPulseAnim]);

  const navigateToLoading = useCallback(() => {
    if (hasNavigatedRef.current) {
      return;
    }

    hasNavigatedRef.current = true;
    clearFallbackTimer();
    logger.log('[Splash] navigating to loading screen');

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(entryScaleAnim, {
        toValue: 0.95,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.replace('/loading' as any);
    });
  }, [clearFallbackTimer, fadeAnim, entryScaleAnim]);

  const scheduleFallback = useCallback(
    (timeoutMs: number) => {
      clearFallbackTimer();
      logger.log('[Splash] scheduling fallback navigation in ms:', timeoutMs);
      fallbackTimerRef.current = setTimeout(() => {
        logger.log('[Splash] fallback timer completed');
        navigateToLoading();
      }, timeoutMs);
    },
    [clearFallbackTimer, navigateToLoading]
  );

  const player = useVideoPlayer(INTRO_VIDEO_SOURCE, (p) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    scheduleFallback(DEFAULT_FALLBACK_MS);

    void (async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true });
        logger.log('[Splash] audio mode configured for intro video');
      } catch (error) {
        logger.log('[Splash] audio mode configuration failed:', error);
      }
    })();

    return () => {
      clearFallbackTimer();
    };
  }, [clearFallbackTimer, fadeAnim, scheduleFallback, shimmerAnim]);

  // expo-video replaces the expo-av callbacks: ready/error via 'statusChange'
  // (duration now in seconds), natural end via 'playToEnd'.
  useEffect(() => {
    const subscriptions = [
      player.addListener('statusChange', ({ status, error }) => {
        if (status === 'error') {
          logger.log('[Splash] playback status error:', error);
          scheduleFallback(2000);
          return;
        }
        if (status !== 'readyToPlay') return;

        logger.log('[Splash] intro video is ready');
        animateVideoEntry();
        player.play();

        if (!durationHandledRef.current && player.duration > 0) {
          durationHandledRef.current = true;
          const durationMs = player.duration * 1000;
          const timeoutMs = Math.min(
            Math.max(durationMs + FINISH_BUFFER_MS, MIN_FALLBACK_MS),
            MAX_FALLBACK_MS
          );
          logger.log('[Splash] intro video duration detected (ms):', durationMs);
          scheduleFallback(timeoutMs);
        }
      }),
      player.addListener('playToEnd', () => {
        logger.log('[Splash] intro video finished naturally');
        navigateToLoading();
      }),
    ];

    return () => {
      subscriptions.forEach((sub) => sub.remove());
    };
  }, [animateVideoEntry, navigateToLoading, player, scheduleFallback]);

  return (
    <View style={styles.container} testID="splash.screen">
      <Animated.View
        style={[
          styles.videoContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.glowTop,
            { opacity: glowPulseAnim },
          ]}
        />
        <Animated.View
          style={[
            styles.glowBottom,
            { opacity: glowPulseAnim },
          ]}
        />

        <Animated.View
          style={[
            styles.videoStage,
            {
              opacity: entryOpacityAnim,
              transform: [{ scale: entryScaleAnim }],
            },
          ]}
        >
          <VideoView
            player={player}
            style={styles.video}
            contentFit="contain"
            nativeControls={false}
            allowsPictureInPicture={false}
            testID="splash.intro-video"
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  glowTop: {
    position: 'absolute',
    top: -60,
    left: -20,
    right: -20,
    height: SCREEN_HEIGHT * 0.35,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderBottomLeftRadius: 300,
    borderBottomRightRadius: 300,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -80,
    left: -30,
    right: -30,
    height: SCREEN_HEIGHT * 0.3,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderTopLeftRadius: 300,
    borderTopRightRadius: 300,
  },
  videoStage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: SCREEN_WIDTH * 0.88,
    height: SCREEN_HEIGHT * 0.88,
    backgroundColor: '#000000',
  },
});
