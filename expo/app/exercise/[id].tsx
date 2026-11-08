import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  Flame,
  Target,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react-native';

import { getExerciseById } from '@/data/exercises';
import { useTheme } from '@/contexts/ThemeContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getExerciseTranslation } from '@/data/exerciseTranslations';
import Exercise3DAnimation from '@/components/Exercise3DAnimation';
import { logger } from '@/utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TimerState = 'idle' | 'running' | 'paused' | 'done';

export default function ExerciseDetailScreen() {
  const { theme, themeOpacity } = useTheme();
  const { addExerciseSession } = useActivity();
  const { addXp } = useProfile();
  const { language, t } = useLanguage();
  const { id } = useLocalSearchParams();
  const exercise = getExerciseById(id as string);
  const [hasStarted, setHasStarted] = useState(false);

  const translation = exercise ? getExerciseTranslation(exercise.id, language) : null;
  const displayName = translation?.name ?? exercise?.name ?? '';
  const displayDescription = translation?.description ?? exercise?.description ?? '';
  const displayInstructions = translation?.instructions ?? exercise?.instructions ?? [];
  const displayMuscles = translation?.targetMuscles ?? exercise?.targetMuscles ?? [];

  const totalSeconds = (exercise?.duration ?? 0) * 60;
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (exercise) setSecondsLeft(exercise.duration * 60);
  }, [exercise]);

  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setTimerState('done');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerState]);

  useEffect(() => {
    if (totalSeconds > 0) {
      const progress = secondsLeft / totalSeconds;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [secondsLeft, totalSeconds, progressAnim]);

  useEffect(() => {
    if (timerState === 'done') { handleComplete(); }
  }, [timerState]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (timerState === 'running') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [timerState, pulseAnim]);

  const handleComplete = () => {
    if (!exercise) return;
    logger.log('[ExerciseDetail] complete');
    addExerciseSession(exercise.duration, exercise.caloriesBurn);
    const xpGained = Math.round(exercise.duration * 0.5 + exercise.caloriesBurn * 0.1);
    addXp(xpGained);
    logger.log('[ExerciseDetail] XP gained', { xpGained });
    setHasStarted(true);
  };

  const startTimer = () => {
    setTimerState('running');
  };

  const pauseTimer = () => {
    setTimerState('paused');
  };

  const resetTimer = () => {
    setTimerState('idle');
    setSecondsLeft(totalSeconds);
    progressAnim.setValue(1);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timerState === 'done') return theme.colors.success;
    const ratio = totalSeconds > 0 ? secondsLeft / totalSeconds : 1;
    if (ratio > 0.5) return theme.colors.primary;
    if (ratio > 0.2) return theme.colors.warning;
    return theme.colors.error;
  };

  if (!exercise) {
    return (
      <Animated.View style={{ flex: 1, opacity: themeOpacity }}>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Exercise not found
          </Text>
        </SafeAreaView>
      </Animated.View>
    );
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={{ flex: 1, opacity: themeOpacity }}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.back()}
          >
            <ArrowLeft color={theme.colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Détails
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: exercise.imageUrl }}
              style={styles.exerciseImage}
              resizeMode="cover"
            />
            <View style={[styles.imageOverlay, { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
              <View style={[styles.durationBadge, { backgroundColor: theme.colors.primary }]}>
                <Clock color="#FFF" size={14} />
                <Text style={styles.durationBadgeText}>{exercise.duration} min</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.titleRow}>
              <Text style={[styles.exerciseName, { color: theme.colors.text }]}>
                {displayName}
              </Text>
              <View
                style={[
                  styles.difficultyBadge,
                  {
                    backgroundColor:
                      exercise.difficulty === 'beginner'
                        ? theme.colors.success + '20'
                        : exercise.difficulty === 'intermediate'
                        ? theme.colors.warning + '20'
                        : theme.colors.error + '20',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    {
                      color:
                        exercise.difficulty === 'beginner'
                          ? theme.colors.success
                          : exercise.difficulty === 'intermediate'
                          ? theme.colors.warning
                          : theme.colors.error,
                    },
                  ]}
                >
                  {exercise.difficulty}
                </Text>
              </View>
            </View>

            <Text style={[styles.categoryText, { color: theme.colors.textSecondary }]}>
              {exercise.category.toUpperCase()}
            </Text>

            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              {displayDescription}
            </Text>

            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
                <Clock color={theme.colors.primary} size={24} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {exercise.duration}m
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Durée
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
                <Flame color={theme.colors.error} size={24} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {exercise.caloriesBurn}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Calories
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
                <Target color={theme.colors.success} size={24} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {displayMuscles.length}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Muscles
                </Text>
              </View>
            </View>

            {/* ── TIMER SECTION ── */}
            <View style={[styles.timerCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.timerLabel, { color: theme.colors.textSecondary }]}>
                Chronomètre d'exercice
              </Text>

              <View style={[styles.progressBarBg, { backgroundColor: theme.colors.border }]}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    { backgroundColor: getTimerColor(), width: progressWidth },
                  ]}
                />
              </View>

              <Animated.Text
                style={[
                  styles.timerDisplay,
                  { color: getTimerColor(), transform: [{ scale: pulseAnim }] },
                ]}
              >
                {timerState === 'done' ? '✓ Terminé !' : formatTime(secondsLeft)}
              </Animated.Text>

              <View style={styles.timerButtons}>
                {timerState === 'idle' || timerState === 'done' ? (
                  <TouchableOpacity
                    style={[styles.timerBtn, { backgroundColor: theme.colors.primary }]}
                    onPress={timerState === 'done' ? resetTimer : startTimer}
                  >
                    {timerState === 'done' ? (
                      <RotateCcw color="#FFF" size={20} />
                    ) : (
                      <Play color="#FFF" size={20} fill="#FFF" />
                    )}
                    <Text style={styles.timerBtnText}>
                      {timerState === 'done' ? 'Recommencer' : 'Démarrer'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.timerBtn, { backgroundColor: theme.colors.warning, flex: 1 }]}
                      onPress={pauseTimer}
                    >
                      <Pause color="#FFF" size={20} fill="#FFF" />
                      <Text style={styles.timerBtnText}>{t('exercise.pause')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.timerBtnSmall, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                      onPress={resetTimer}
                    >
                      <RotateCcw color={theme.colors.text} size={18} />
                    </TouchableOpacity>
                  </>
                )}
                {timerState === 'paused' && (
                  <TouchableOpacity
                    style={[styles.timerBtn, { backgroundColor: theme.colors.primary, flex: 1 }]}
                    onPress={startTimer}
                  >
                    <Play color="#FFF" size={20} fill="#FFF" />
                    <Text style={styles.timerBtnText}>{t('exercise.resume')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={[styles.diagramSection, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Démonstration du mouvement
              </Text>
              <View style={styles.diagramContainer}>
                <Exercise3DAnimation exerciseName={exercise.name} category={exercise.category} />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Muscles ciblés
              </Text>
              <View style={styles.musclesContainer}>
                {displayMuscles.map((muscle, index) => (
                  <View
                    key={index}
                    style={[styles.muscleTag, { backgroundColor: theme.colors.primary + '20' }]}
                  >
                    <Text style={[styles.muscleText, { color: theme.colors.primary }]}>
                      {muscle}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Instructions
              </Text>
              <View style={styles.instructionsContainer}>
                {displayInstructions.map((instruction, index) => (
                  <View key={index} style={styles.instructionItem}>
                    <View
                      style={[
                        styles.instructionNumber,
                        { backgroundColor: theme.colors.primary + '20' },
                      ]}
                    >
                      <Text style={[styles.instructionNumberText, { color: theme.colors.primary }]}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={[styles.instructionText, { color: theme.colors.text }]}>
                      {instruction}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {timerState === 'done' && !hasStarted && (
              <View style={[styles.completedBanner, { backgroundColor: theme.colors.success + '15', borderColor: theme.colors.success }]}>
                <CheckCircle color={theme.colors.success} size={28} />
                <View>
                  <Text style={[styles.completedTitle, { color: theme.colors.success }]}>
                    Exercice terminé !
                  </Text>
                  <Text style={[styles.completedSub, { color: theme.colors.textSecondary }]}>
                    XP et calories enregistrés
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' as const },
  headerSpacer: { width: 40 },
  scrollView: { flex: 1 },
  content: { paddingBottom: 40 },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.65,
    position: 'relative',
  },
  exerciseImage: { width: '100%', height: '100%' },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    padding: 16,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  durationBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' as const },
  infoSection: { paddingHorizontal: 20, paddingTop: 24 },
  titleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 8,
  },
  exerciseName: { fontSize: 26, fontWeight: '800' as const, flex: 1, marginRight: 12 },
  difficultyBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  difficultyText: { fontSize: 12, fontWeight: '700' as const, textTransform: 'capitalize' as const },
  categoryText: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1.2, marginBottom: 12 },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  statsContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, paddingVertical: 16, borderRadius: 20,
    alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 5,
  },
  statValue: { fontSize: 18, fontWeight: '800' as const },
  statLabel: { fontSize: 11 },

  timerCard: {
    borderRadius: 24, padding: 20, marginBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 5,
    gap: 14,
  },
  timerLabel: { fontSize: 13, fontWeight: '600' as const, textAlign: 'center' },
  progressBarBg: {
    height: 6, borderRadius: 3, overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 3 },
  timerDisplay: {
    fontSize: 52, fontWeight: '800' as const, textAlign: 'center', letterSpacing: -1,
  },
  timerButtons: { flexDirection: 'row', gap: 10 },
  timerBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 16,
  },
  timerBtnSmall: {
    width: 50, borderRadius: 16, alignItems: 'center',
    justifyContent: 'center', borderWidth: 1.5,
  },
  timerBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' as const },

  diagramSection: {
    marginBottom: 28, padding: 20, borderRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  diagramContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 19, fontWeight: '700' as const, marginBottom: 14 },
  musclesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  muscleTag: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  muscleText: { fontSize: 13, fontWeight: '600' as const },
  instructionsContainer: { gap: 14 },
  instructionItem: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  instructionNumber: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  instructionNumberText: { fontSize: 13, fontWeight: '700' as const },
  instructionText: { flex: 1, fontSize: 15, lineHeight: 22 },

  completedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 20, borderRadius: 20, borderWidth: 1.5, marginTop: 8, marginBottom: 8,
  },
  completedTitle: { fontSize: 17, fontWeight: '800' as const },
  completedSub: { fontSize: 13, marginTop: 2 },

  errorText: { fontSize: 16, textAlign: 'center' as const, marginTop: 32 },
});
