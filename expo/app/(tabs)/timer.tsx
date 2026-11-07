import React, { useMemo, useState, useEffect, useRef } from 'react';
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
import { useActivity } from '@/contexts/ActivityContext';
import { logger } from '@/utils/logger';

type Mode = 'stopwatch' | 'timer';

export default function TimerScreen() {
  const { theme, themeOpacity } = useTheme();
  const { addExerciseMinutes } = useActivity();
  const [mode, setMode] = useState<Mode>('stopwatch');
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timerDuration, setTimerDuration] = useState(60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const lastLoggedElapsedMsRef = useRef<number>(0);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (mode === 'timer') {
            if (prevTime <= 0) {
              setIsRunning(false);
              return 0;
            }
            return prevTime - 10;
          }
          return prevTime + 10;
        });
      }, 10);

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      pulseAnim.setValue(1);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, mode, pulseAnim]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  const totalPlannedMs = useMemo(() => timerDuration * 1000, [timerDuration]);

  const getElapsedMs = (currentTime: number) => {
    if (mode === 'stopwatch') return currentTime;
    return Math.max(0, totalPlannedMs - currentTime);
  };

  const logElapsedToActivity = (currentTime: number) => {
    const elapsed = getElapsedMs(currentTime);
    const delta = Math.max(0, elapsed - lastLoggedElapsedMsRef.current);
    if (delta < 1000) return;

    lastLoggedElapsedMsRef.current = elapsed;

    const minutes = Math.floor(delta / 60000);
    if (minutes <= 0) return;

    logger.log('[Timer] logging exercise minutes', { minutes, mode });
    addExerciseMinutes(minutes);
  };

  const handleStart = () => {
    if (mode === 'timer' && time === 0) {
      setTime(timerDuration * 1000);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    logElapsedToActivity(time);
    setIsRunning(false);
  };

  const handleReset = () => {
    logElapsedToActivity(time);
    setIsRunning(false);
    lastLoggedElapsedMsRef.current = 0;
    setTime(mode === 'timer' ? timerDuration * 1000 : 0);
  };

  const handleModeChange = (newMode: Mode) => {
    logElapsedToActivity(time);
    setMode(newMode);
    setIsRunning(false);
    lastLoggedElapsedMsRef.current = 0;
    setTime(newMode === 'timer' ? timerDuration * 1000 : 0);
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
        logElapsedToActivity(time);
        lastLoggedElapsedMsRef.current = 0;
        setTimerDuration(seconds);
        if (!isRunning) {
          setTime(seconds * 1000);
        }
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
        <Text style={[styles.title, { color: theme.colors.text }]}>Timer</Text>
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
            Stopwatch
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
            Timer
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'timer' && !isRunning && (
        <View style={styles.presetsContainer}>
          <Text style={[styles.presetsTitle, { color: theme.colors.textSecondary }]}>
            Quick Presets
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
            {formatTime(time)}
          </Text>
          <Text style={[styles.timerLabel, { color: theme.colors.textSecondary }]}>
            {mode === 'stopwatch' ? 'Elapsed Time' : 'Time Remaining'}
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
