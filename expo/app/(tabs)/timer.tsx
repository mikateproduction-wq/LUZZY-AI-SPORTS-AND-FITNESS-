import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Pause, RotateCcw, Timer as TimerIcon, Clock } from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActivity } from '@/contexts/ActivityContext';
import { logger } from '@/utils/logger';
import { formatClock, minutesToFlush, remainingMs } from '@/lib/timer';

type Mode = 'stopwatch' | 'timer';

const TICK_MS = 50;

export default function TimerScreen() {
  const { theme, themeOpacity } = useTheme();
  const { t } = useLanguage();
  const { addExerciseMinutes } = useActivity();
  const [mode, setMode] = useState<Mode>('stopwatch');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timerDuration, setTimerDuration] = useState<number>(60);
  const [baseMs, setBaseMs] = useState<number>(0);
  const [now, setNow] = useState<number>(() => Date.now());
  const startedAtRef = useRef<number | null>(null);
  const loggedMsRef = useRef<number>(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const durationMs = useMemo(() => timerDuration * 1000, [timerDuration]);

  const elapsedAt = useCallback(
    (atMs: number): number => {
      if (!isRunning || startedAtRef.current === null) return baseMs;
      return baseMs + (atMs - startedAtRef.current);
    },
    [baseMs, isRunning]
  );

  const liveElapsed = elapsedAt(now);
  const displayMs = mode === 'stopwatch' ? liveElapsed : remainingMs(durationMs, liveElapsed);

  const flushToActivity = useCallback(
    (elapsedMs: number) => {
      const { minutes, nextLoggedMs } = minutesToFlush(loggedMsRef.current, elapsedMs);
      if (minutes <= 0) return;
      loggedMsRef.current = nextLoggedMs;
      logger.log('[Timer] logging exercise minutes', { minutes, mode });
      addExerciseMinutes(minutes);
    },
    [addExerciseMinutes, mode]
  );

  const stopPulse = useCallback(() => {
    pulseLoopRef.current?.stop();
    pulseLoopRef.current = null;
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  const startPulse = useCallback(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulseLoopRef.current = loop;
    loop.start();
  }, [pulseAnim]);

  const pauseAt = useCallback(
    (atMs: number) => {
      const elapsed = elapsedAt(atMs);
      startedAtRef.current = null;
      setBaseMs(elapsed);
      setIsRunning(false);
      stopPulse();
      return elapsed;
    },
    [elapsedAt, stopPulse]
  );

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || mode !== 'timer') return;
    if (liveElapsed < durationMs) return;
    const elapsed = pauseAt(Date.now());
    setBaseMs(durationMs);
    flushToActivity(Math.min(elapsed, durationMs));
  }, [isRunning, mode, liveElapsed, durationMs, pauseAt, flushToActivity]);

  useEffect(() => {
    return () => {
      pulseLoopRef.current?.stop();
    };
  }, []);

  const handleStart = () => {
    if (mode === 'timer' && baseMs >= durationMs) {
      loggedMsRef.current = 0;
      setBaseMs(0);
    }
    const nowMs = Date.now();
    startedAtRef.current = nowMs;
    setNow(nowMs);
    setIsRunning(true);
    startPulse();
  };

  const handlePause = () => {
    const elapsed = pauseAt(Date.now());
    flushToActivity(elapsed);
  };

  const resetTo = (nextMode: Mode) => {
    const elapsed = isRunning ? pauseAt(Date.now()) : baseMs;
    flushToActivity(elapsed);
    startedAtRef.current = null;
    loggedMsRef.current = 0;
    setIsRunning(false);
    stopPulse();
    setBaseMs(0);
    setNow(Date.now());
    setMode(nextMode);
  };

  const handleReset = () => {
    resetTo(mode);
  };

  const handleModeChange = (newMode: Mode) => {
    resetTo(newMode);
  };

  const TimerPreset = ({ seconds, label }: { seconds: number; label: string }) => (
    <TouchableOpacity
      style={[
        styles.presetButton,
        {
          backgroundColor: theme.colors.surface,
          borderColor: timerDuration === seconds ? theme.colors.primary : 'transparent',
          borderWidth: timerDuration === seconds ? 2 : 0,
        },
      ]}
      onPress={() => {
        if (isRunning) return;
        setTimerDuration(seconds);
        setBaseMs(0);
        loggedMsRef.current = 0;
      }}
    >
      <Text
        style={[
          styles.presetLabel,
          {
            color: timerDuration === seconds ? theme.colors.primary : theme.colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Animated.View style={{ flex: 1, opacity: themeOpacity }}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{t('timer.title')}</Text>
      </View>

      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            {
              backgroundColor: mode === 'stopwatch' ? theme.colors.primary : theme.colors.surface,
            },
          ]}
          onPress={() => handleModeChange('stopwatch')}
        >
          <Clock
            color={mode === 'stopwatch' ? '#FFFFFF' : theme.colors.text}
            size={20}
          />
          <Text
            style={[
              styles.modeText,
              {
                color: mode === 'stopwatch' ? '#FFFFFF' : theme.colors.text,
              },
            ]}
          >
            {t('timer.stopwatch')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeButton,
            {
              backgroundColor: mode === 'timer' ? theme.colors.primary : theme.colors.surface,
            },
          ]}
          onPress={() => handleModeChange('timer')}
        >
          <TimerIcon
            color={mode === 'timer' ? '#FFFFFF' : theme.colors.text}
            size={20}
          />
          <Text
            style={[
              styles.modeText,
              {
                color: mode === 'timer' ? '#FFFFFF' : theme.colors.text,
              },
            ]}
          >
            {t('timer.countdown')}
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'timer' && !isRunning && (
        <View style={styles.presetsContainer}>
          <Text style={[styles.presetsTitle, { color: theme.colors.textSecondary }]}>
            {t('timer.presets')}
          </Text>
          <View style={styles.presetsGrid}>
            <TimerPreset seconds={30} label="30s" />
            <TimerPreset seconds={60} label="1m" />
            <TimerPreset seconds={180} label="3m" />
            <TimerPreset seconds={300} label="5m" />
            <TimerPreset seconds={600} label="10m" />
            <TimerPreset seconds={900} label="15m" />
          </View>
        </View>
      )}

      <View style={styles.timerDisplay}>
        <Animated.View
          style={[
            styles.timerCircle,
            {
              backgroundColor: theme.colors.surface,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Text style={[styles.timerText, { color: theme.colors.text }]}>
            {formatClock(displayMs)}
          </Text>
          <Text style={[styles.timerLabel, { color: theme.colors.textSecondary }]}>
            {mode === 'stopwatch' ? t('timer.elapsed') : t('timer.remaining')}
          </Text>
        </Animated.View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
          onPress={handleReset}
        >
          <RotateCcw color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainButton, { backgroundColor: theme.colors.primary }]}
          onPress={isRunning ? handlePause : handleStart}
        >
          {isRunning ? (
            <Pause color="#FFFFFF" size={32} />
          ) : (
            <Play color="#FFFFFF" size={32} />
          )}
        </TouchableOpacity>
      </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  modeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  modeText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  presetsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  presetsTitle: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500' as const,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  timerDisplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  timerCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  timerLabel: {
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 24,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
