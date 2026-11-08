import { setAudioModeAsync } from 'expo-audio';
import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';

const INTRO_VIDEO_SOURCE = require('../assets/videos/intro.mp4') as VideoSource;
const INITIAL_FALLBACK_MS = 25000;
const FINISH_BUFFER_MS = 1500;
const MIN_FALLBACK_MS = 8000;
const MAX_FALLBACK_MS = 60000;

interface Props {
  onFinished: () => void;
}

export default function IntroVideoOverlay({ onFinished }: Props) {
  const { width, height } = useWindowDimensions();
  const opacity = useRef<Animated.Value>(new Animated.Value(1)).current;
  const videoOpacity = useRef<Animated.Value>(new Animated.Value(0)).current;
  const hasFinishedRef = useRef<boolean>(false);
  const durationHandledRef = useRef<boolean>(false);
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFallback = useCallback((): void => {
    if (fallbackRef.current) {
      clearTimeout(fallbackRef.current);
      fallbackRef.current = null;
    }
  }, []);

  const finish = useCallback((): void => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    clearFallback();

    Animated.timing(opacity, {
      toValue: 0,
      duration: 420,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onFinished());
  }, [clearFallback, onFinished, opacity]);

  const scheduleFallback = useCallback(
    (timeoutMs: number): void => {
      clearFallback();
      fallbackRef.current = setTimeout(finish, timeoutMs);
    },
    [clearFallback, finish]
  );

  const player = useVideoPlayer(INTRO_VIDEO_SOURCE, (p) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });

  useEffect(() => {
    scheduleFallback(INITIAL_FALLBACK_MS);

    // expo-audio equivalent of the old expo-av audio mode — video still plays
    // if the device declines a non-essential audio mode update.
    void setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);

    const subscriptions = [
      player.addListener('statusChange', ({ status }) => {
        if (status === 'readyToPlay') {
          Animated.timing(videoOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();

          if (!durationHandledRef.current && player.duration > 0) {
            durationHandledRef.current = true;
            const durationMs = player.duration * 1000;
            scheduleFallback(
              Math.min(Math.max(durationMs + FINISH_BUFFER_MS, MIN_FALLBACK_MS), MAX_FALLBACK_MS)
            );
          }
        } else if (status === 'error') {
          scheduleFallback(1200);
        }
      }),
      player.addListener('playToEnd', () => finish()),
    ];

    return () => {
      clearFallback();
      subscriptions.forEach((sub) => sub.remove());
    };
  }, [clearFallback, finish, player, scheduleFallback, videoOpacity]);

  return (
    <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="auto">
      <View style={styles.background}>
        <Animated.View
          style={[
            styles.videoWrap,
            { width, height, opacity: videoOpacity },
          ]}
        >
          <VideoView
            player={player}
            style={{ width, height }}
            contentFit="contain"
            nativeControls={false}
            allowsPictureInPicture={false}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  background: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
});
