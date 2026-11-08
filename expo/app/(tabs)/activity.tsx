import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { LineChart, BarChart, PieChart as RNPieChart } from 'react-native-chart-kit';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, Platform, TextInput, ActivityIndicator, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, Flame, BarChart3, TrendingUp, PieChart, Footprints, ArrowRightLeft, Share2 } from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActivity } from '@/contexts/ActivityContext';
import { ActivityDayStats } from '@/types/fitness';
import { logger } from '@/utils/logger';

type Range = 'today' | 'week' | 'month';

const STEP_LENGTH_M = 0.762;

function stepsToMeters(steps: number): number {
  return Math.round(steps * STEP_LENGTH_M);
}

function stepsToKm(steps: number): number {
  return parseFloat((steps * STEP_LENGTH_M / 1000).toFixed(2));
}

function sumStats(items: ActivityDayStats[]) {
  return items.reduce(
    (acc, d) => {
      acc.exerciseMinutes += d.exerciseMinutes;
      acc.exercisesCompleted += d.exercisesCompleted;
      acc.totalCalories += d.totalCalories;
      return acc;
    },
    { exerciseMinutes: 0, exercisesCompleted: 0, totalCalories: 0 }
  );
}

export default function ActivityScreen() {
  const { theme, themeOpacity } = useTheme();
  const { t } = useLanguage();
  const { today, week, month, isLoading, resetToday } = useActivity();

  const [range, setRange] = useState<Range>('today');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

  const [pedometerAvailable, setPedometerAvailable] = useState<boolean | null>(null);
  const [pastStepCount, setPastStepCount] = useState<number>(0);
  const [liveStepCount, setLiveStepCount] = useState<number>(0);
  const pedometerSubRef = useRef<{ remove: () => void } | null>(null);

  const [converterInput, setConverterInput] = useState<string>('');
  const [convertedKm, setConvertedKm] = useState<number | null>(null);
  const [convertedMeters, setConvertedMeters] = useState<number | null>(null);

  const stepProgressAnim = useRef(new Animated.Value(0)).current;

  const screenWidth = Dimensions.get('window').width;

  const totalSteps = pastStepCount + liveStepCount;
  const DAILY_STEP_GOAL = 10000;
  const stepProgress = Math.min(totalSteps / DAILY_STEP_GOAL, 1);

  useEffect(() => {
    Animated.timing(stepProgressAnim, {
      toValue: stepProgress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [stepProgress, stepProgressAnim]);

  const stopPedometer = useCallback(() => {
    if (pedometerSubRef.current) {
      pedometerSubRef.current.remove();
      pedometerSubRef.current = null;
      logger.log('[Activity Pedometer] Subscription removed');
    }
  }, []);

  const initPedometer = useCallback(async () => {
    stopPedometer();

    if (Platform.OS === 'web') {
      setPedometerAvailable(false);
      return;
    }

    try {
      const { Pedometer } = await import('expo-sensors');
      const isAvailable = await Pedometer.isAvailableAsync();
      setPedometerAvailable(isAvailable);
      logger.log('[Activity Pedometer] Available:', isAvailable);

      if (!isAvailable) {
        return;
      }

      const permission = await Pedometer.requestPermissionsAsync();
      if (!permission.granted) {
        setPedometerAvailable(false);
        return;
      }

      if (Platform.OS === 'ios') {
        const end = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        try {
          const result = await Pedometer.getStepCountAsync(start, end);
          if (result) {
            setPastStepCount(result.steps);
          }
        } catch (err) {
          logger.warn('[Activity Pedometer] getStepCountAsync error:', err);
        }
      }

      const subscription = Pedometer.watchStepCount((result) => {
        setLiveStepCount(result.steps);
      });

      pedometerSubRef.current = subscription;
      logger.log('[Activity Pedometer] Live subscription started');
    } catch (error) {
      logger.warn('[Activity Pedometer] Init error:', error);
      setPedometerAvailable(false);
    }
  }, [stopPedometer]);

  useFocusEffect(
    useCallback(() => {
      void initPedometer();

      return () => {
        stopPedometer();
      };
    }, [initPedometer, stopPedometer])
  );

  useEffect(() => {
    return () => {
      stopPedometer();
    };
  }, [stopPedometer]);

  const handleConvert = () => {
    const steps = parseInt(converterInput, 10);
    if (!isNaN(steps) && steps >= 0) {
      setConvertedKm(stepsToKm(steps));
      setConvertedMeters(stepsToMeters(steps));
    } else {
      setConvertedKm(null);
      setConvertedMeters(null);
    }
  };

  const rangeItems = useMemo(() => {
    if (range === 'week') return week;
    if (range === 'month') return month;
    return [today];
  }, [month, range, today, week]);

  const summary = useMemo(() => sumStats(rangeItems), [rangeItems]);

  const chartData = useMemo(() => {
    if (range === 'today') {
      const stepsScaled = Math.round(totalSteps / 100);
      return {
        labels: ['Min', 'Exo', 'Cal/10', 'Pas/100'],
        datasets: [{
          data: [
            summary.exerciseMinutes,
            summary.exercisesCompleted,
            Math.round(summary.totalCalories / 10),
            stepsScaled,
          ],
        }],
      };
    }

    const items = range === 'week' ? week.slice(-7) : month.slice(-7);
    return {
      labels: items.map((d, i) => {
        if (range === 'week') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] || `D${i + 1}`;
        const date = new Date(d.dateKey);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }),
      datasets: [{
        data: items.map(d => d.exerciseMinutes || 0),
      }],
    };
  }, [month, range, summary, week, totalSteps]);

  const pieData = useMemo(() => [
    {
      name: 'Minutes',
      value: summary.exerciseMinutes || 1,
      color: theme.colors.success,
      legendFontColor: theme.colors.text,
    },
    {
      name: 'Exercises',
      value: (summary.exercisesCompleted * 10) || 1,
      color: theme.colors.primary,
      legendFontColor: theme.colors.text,
    },
    {
      name: 'Calories',
      value: Math.round(summary.totalCalories / 10) || 1,
      color: theme.colors.error,
      legendFontColor: theme.colors.text,
    },
    {
      name: t('activity.steps'),
      value: Math.round(totalSteps / 100) || 1,
      color: '#4ECDC4',
      legendFontColor: theme.colors.text,
    },
  ], [summary, theme.colors, totalSteps, t]);

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${theme.colors.primary === '#FF6B35' ? '255, 107, 53' : theme.colors.primary === '#4ECDC4' ? '78, 205, 196' : '99, 102, 241'}, ${opacity})`,
    labelColor: () => theme.colors.textSecondary,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 11,
    },
  };

  const progressBarWidth = stepProgressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const SegButton = ({ id, label }: { id: Range; label: string }) => {
    const selected = range === id;
    return (
      <TouchableOpacity
        style={[
          styles.segButton,
          {
            backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
          },
        ]}
        onPress={() => setRange(id)}
        testID={`activity.range.${id}`}
        accessibilityRole="button"
      >
        <Text style={[styles.segText, { color: selected ? '#FFFFFF' : theme.colors.text }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    accent,
    testID,
  }: {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ComponentType<{ color: string; size: number }>;
    accent: string;
    testID: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]} testID={testID}>
      <View style={styles.statTop}>
        <View style={[styles.statIconWrap, { backgroundColor: accent + '20' }]}>
          <Icon color={accent} size={20} />
        </View>
        <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
    </View>
  );

  const renderPedometerCard = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={[styles.pedometerCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.pedometerHeader}>
            <View style={[styles.pedometerIconWrap, { backgroundColor: '#4ECDC420' }]}>
              <Footprints color="#4ECDC4" size={22} />
            </View>
            <Text style={[styles.pedometerTitle, { color: theme.colors.text }]}>
              {t('activity.stepsToday')}
            </Text>
          </View>
          <Text style={[styles.pedometerUnavailableText, { color: theme.colors.textSecondary }]}>
            {t('activity.pedometerWeb')}
          </Text>
        </View>
      );
    }

    if (pedometerAvailable === null) {
      return (
        <View style={[styles.pedometerCard, { backgroundColor: theme.colors.surface }]}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      );
    }

    if (pedometerAvailable === false) {
      return (
        <View style={[styles.pedometerCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.pedometerHeader}>
            <View style={[styles.pedometerIconWrap, { backgroundColor: theme.colors.warning + '20' }]}>
              <Footprints color={theme.colors.warning} size={22} />
            </View>
            <Text style={[styles.pedometerTitle, { color: theme.colors.text }]}>
              {t('activity.stepsToday')}
            </Text>
          </View>
          <Text style={[styles.pedometerUnavailableText, { color: theme.colors.textSecondary }]}>
            {t('activity.pedometerUnavailable')}
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.pedometerCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.pedometerHeader}>
          <View style={[styles.pedometerIconWrap, { backgroundColor: '#4ECDC420' }]}>
            <Footprints color="#4ECDC4" size={22} />
          </View>
          <Text style={[styles.pedometerTitle, { color: theme.colors.text }]}>
            {t('activity.stepsToday')}
          </Text>
        </View>

        <View style={styles.pedometerStepsRow}>
          <Text style={[styles.pedometerStepsValue, { color: theme.colors.text }]}>
            {totalSteps.toLocaleString()}
          </Text>
          <Text style={[styles.pedometerStepsUnit, { color: theme.colors.textSecondary }]}>
            {t('activity.steps').toLowerCase()}
          </Text>
        </View>

        <View style={styles.pedometerDistanceRow}>
          <View style={[styles.distanceBadge, { backgroundColor: theme.colors.primary + '15' }]}>
            <Text style={[styles.distanceBadgeText, { color: theme.colors.primary }]}>
              {stepsToKm(totalSteps)} km
            </Text>
          </View>
          <View style={[styles.distanceBadge, { backgroundColor: theme.colors.success + '15' }]}>
            <Text style={[styles.distanceBadgeText, { color: theme.colors.success }]}>
              {stepsToMeters(totalSteps)} m
            </Text>
          </View>
        </View>

        <View style={[styles.progressBarBg, { backgroundColor: theme.colors.border }]}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: stepProgress >= 1 ? theme.colors.success : '#4ECDC4',
                width: progressBarWidth,
              },
            ]}
          />
        </View>
        <Text style={[styles.pedometerGoalText, { color: theme.colors.textSecondary }]}>
          {Math.round(stepProgress * 100)}% — {DAILY_STEP_GOAL.toLocaleString()} {t('activity.steps').toLowerCase()}
        </Text>

        {liveStepCount > 0 && (
          <View style={styles.pedometerLiveRow}>
            <View style={[styles.liveDot, { backgroundColor: '#4ECDC4' }]} />
            <Text style={[styles.pedometerLiveText, { color: '#4ECDC4' }]}>
              +{liveStepCount} live
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Animated.View style={{ flex: 1, opacity: themeOpacity }}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('activity.title')}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{t('activity.subtitle')}</Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: theme.colors.primary + '15' }]}
            onPress={async () => {
              const statsText = [
                '🏋️ LUZZY AI — My Stats',
                `🔥 ${summary.totalCalories} calories`,
                `⏱ ${summary.exerciseMinutes} min`,
                `💪 ${summary.exercisesCompleted} workouts`,
                `👣 ${totalSteps.toLocaleString()} steps (${stepsToKm(totalSteps)} km)`,
                '',
                '#LuzzyAI #Fitness #Sport',
              ].join('\n');
              try {
                await Share.share({ message: statsText, title: 'LUZZY AI Stats' });
              } catch (e) {
                logger.log('[Share] error', e);
              }
            }}
            testID="activity.share"
          >
            <Share2 size={16} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => resetToday()}
            testID="activity.reset"
            accessibilityRole="button"
          >
            <Text style={[styles.resetText, { color: theme.colors.primary }]}>{t('activity.reset')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.segment, { backgroundColor: theme.colors.surface }]}>
        <SegButton id="today" label={t('activity.today')} />
        <SegButton id="week" label={t('activity.week')} />
        <SegButton id="month" label={t('activity.month')} />
      </View>

      <View style={styles.chartTypeSelector}>
        <TouchableOpacity
          style={[
            styles.chartTypeButton,
            {
              backgroundColor: chartType === 'bar' ? theme.colors.primary : theme.colors.surface,
            },
          ]}
          onPress={() => setChartType('bar')}
        >
          <BarChart3 color={chartType === 'bar' ? '#FFFFFF' : theme.colors.text} size={18} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.chartTypeButton,
            {
              backgroundColor: chartType === 'line' ? theme.colors.primary : theme.colors.surface,
            },
          ]}
          onPress={() => setChartType('line')}
        >
          <TrendingUp color={chartType === 'line' ? '#FFFFFF' : theme.colors.text} size={18} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.chartTypeButton,
            {
              backgroundColor: chartType === 'pie' ? theme.colors.primary : theme.colors.surface,
            },
          ]}
          onPress={() => setChartType('pie')}
        >
          <PieChart color={chartType === 'pie' ? '#FFFFFF' : theme.colors.text} size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
          {Platform.OS !== 'web' ? (
            <>
              {chartType === 'bar' && (
                <BarChart
                  data={chartData}
                  width={screenWidth - 60}
                  height={220}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  yAxisLabel=""
                  yAxisSuffix=""
                  fromZero
                  showBarTops={false}
                />
              )}
              {chartType === 'line' && (
                <LineChart
                  data={chartData}
                  width={screenWidth - 60}
                  height={220}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  bezier
                  yAxisSuffix=""
                  fromZero
                />
              )}
              {chartType === 'pie' && (
                <RNPieChart
                  data={pieData}
                  width={screenWidth - 60}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="value"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  style={styles.chart}
                />
              )}
            </>
          ) : (
            <View style={styles.webChartFallback}>
              <Text style={[styles.webChartText, { color: theme.colors.textSecondary }]}>
                Charts not available on web
              </Text>
              <Text style={[styles.webChartSubtext, { color: theme.colors.textSecondary }]}>
                View statistics below
              </Text>
            </View>
          )}
        </View>

        {renderPedometerCard()}

        <View style={styles.statsGrid}>
          <StatCard
            title={t('activity.calories')}
            value={String(summary.totalCalories)}
            subtitle={range === 'today' ? 'Total' : 'Total'}
            icon={Flame}
            accent={theme.colors.error}
            testID="activity.stat.calories"
          />
          <StatCard
            title={t('activity.exerciseMinutes')}
            value={String(summary.exerciseMinutes)}
            subtitle={'min'}
            icon={Activity}
            accent={theme.colors.success}
            testID="activity.stat.minutes"
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title={t('activity.exercisesCompleted')}
            value={String(summary.exercisesCompleted)}
            subtitle={range === 'today' ? 'Today' : range === 'week' ? '7 days' : '30 days'}
            icon={Activity}
            accent={theme.colors.primary}
            testID="activity.stat.workouts"
          />
          <StatCard
            title={t('activity.steps')}
            value={totalSteps.toLocaleString()}
            subtitle={`${stepsToKm(totalSteps)} km`}
            icon={Footprints}
            accent="#4ECDC4"
            testID="activity.stat.steps"
          />
        </View>

        <View style={[styles.diagramCard, { backgroundColor: theme.colors.surface, marginBottom: 12 }]}>
          <Text style={[styles.diagramTitle, { color: theme.colors.text }]}>{t('activity.diagram.stepGoal')}</Text>
          <View style={styles.stepGoalRow}>
            <View style={styles.stepGoalInfo}>
              <Text style={[styles.stepGoalValue, { color: theme.colors.text }]}>{totalSteps.toLocaleString()}</Text>
              <Text style={[styles.stepGoalTarget, { color: theme.colors.textSecondary }]}>/ {DAILY_STEP_GOAL.toLocaleString()}</Text>
            </View>
            <Text style={[styles.stepGoalPct, { color: stepProgress >= 1 ? theme.colors.success : '#4ECDC4' }]}>{Math.round(stepProgress * 100)}%</Text>
          </View>
          <View style={[styles.segmentTrack, { backgroundColor: theme.colors.border }]}>
            <View style={[styles.segmentZone, { width: '33%', backgroundColor: '#4ECDC420', borderRightWidth: 1, borderRightColor: theme.colors.border }]} />
            <View style={[styles.segmentZone, { width: '33%', backgroundColor: theme.colors.primary + '15', borderRightWidth: 1, borderRightColor: theme.colors.border }]} />
            <View style={[styles.segmentZone, { width: '34%', backgroundColor: theme.colors.success + '10' }]} />
            <Animated.View style={[styles.segmentFill, { width: progressBarWidth, backgroundColor: stepProgress >= 1 ? theme.colors.success : '#4ECDC4' }]} />
          </View>
          <View style={styles.segmentLabels}>
            <Text style={[styles.segmentLabel, { color: theme.colors.textSecondary }]}>3k</Text>
            <Text style={[styles.segmentLabel, { color: theme.colors.textSecondary }]}>6k</Text>
            <Text style={[styles.segmentLabel, { color: theme.colors.textSecondary }]}>10k</Text>
          </View>
          {liveStepCount > 0 && (
            <View style={styles.liveRow}>
              <View style={[styles.livePulseDot, { backgroundColor: '#4ECDC4' }]} />
              <Text style={[styles.liveText, { color: '#4ECDC4' }]}>+{liveStepCount} en direct</Text>
            </View>
          )}
        </View>

        <View style={[styles.diagramGrid2, { marginBottom: 12 }]}>
          <View style={[styles.diagramCardSmall, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.diagramTitleSmall, { color: theme.colors.textSecondary }]}>{t('activity.diagram.distance')}</Text>
            <Text style={[styles.diagramBigValue, { color: theme.colors.text }]}>{stepsToKm(totalSteps)}</Text>
            <Text style={[styles.diagramUnit, { color: theme.colors.primary }]}>km</Text>
            <View style={[styles.miniBarBg, { backgroundColor: theme.colors.border }]}>
              <View style={[styles.miniBarFill, { width: `${Math.min((stepsToKm(totalSteps) / 10) * 100, 100)}%`, backgroundColor: theme.colors.primary }]} />
            </View>
          </View>
          <View style={[styles.diagramCardSmall, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.diagramTitleSmall, { color: theme.colors.textSecondary }]}>{t('activity.diagram.meters')}</Text>
            <Text style={[styles.diagramBigValue, { color: theme.colors.text }]}>{(stepsToMeters(totalSteps) / 1000).toFixed(2)}</Text>
            <Text style={[styles.diagramUnit, { color: theme.colors.success }]}>{t('activity.diagram.goalMultiplier')}</Text>
            <View style={[styles.miniBarBg, { backgroundColor: theme.colors.border }]}>
              <View style={[styles.miniBarFill, { width: `${Math.min((stepsToMeters(totalSteps) / 8000) * 100, 100)}%`, backgroundColor: theme.colors.success }]} />
            </View>
          </View>
          <View style={[styles.diagramCardSmall, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.diagramTitleSmall, { color: theme.colors.textSecondary }]}>{t('activity.diagram.calories')}</Text>
            <Text style={[styles.diagramBigValue, { color: theme.colors.text }]}>{summary.totalCalories}</Text>
            <Text style={[styles.diagramUnit, { color: theme.colors.error }]}>{t('activity.diagram.kcal')}</Text>
            <View style={[styles.miniBarBg, { backgroundColor: theme.colors.border }]}>
              <View style={[styles.miniBarFill, { width: `${Math.min((summary.totalCalories / 500) * 100, 100)}%`, backgroundColor: theme.colors.error }]} />
            </View>
          </View>
        </View>

        <View style={[styles.converterCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.converterHeader}>
            <View style={[styles.converterIconWrap, { backgroundColor: theme.colors.primary + '15' }]}>
              <ArrowRightLeft color={theme.colors.primary} size={20} />
            </View>
            <Text style={[styles.converterTitle, { color: theme.colors.text }]}>
              {t('activity.stepConverter')}
            </Text>
          </View>

          <View style={styles.converterInputRow}>
            <TextInput
              style={[
                styles.converterInput,
                {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              value={converterInput}
              onChangeText={setConverterInput}
              placeholder={t('activity.enterSteps')}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              onSubmitEditing={handleConvert}
            />
            <TouchableOpacity
              style={[styles.converterButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleConvert}
            >
              <Text style={styles.converterButtonText}>{t('activity.convert')}</Text>
            </TouchableOpacity>
          </View>

          {convertedKm !== null && convertedMeters !== null && (
            <View style={styles.converterResults}>
              <View style={[styles.converterResultItem, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.converterResultLabel, { color: theme.colors.textSecondary }]}>
                  {t('activity.kilometers')}
                </Text>
                <Text style={[styles.converterResultValue, { color: theme.colors.primary }]}>
                  {convertedKm} km
                </Text>
              </View>
              <View style={[styles.converterResultItem, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.converterResultLabel, { color: theme.colors.textSecondary }]}>
                  {t('activity.meters')}
                </Text>
                <Text style={[styles.converterResultValue, { color: theme.colors.success }]}>
                  {convertedMeters.toLocaleString()} m
                </Text>
              </View>
            </View>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingRow} testID="activity.loading">
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>{t('activity.loading')}</Text>
          </View>
        ) : null}
      </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  headerButtons: {
    flexDirection: 'row' as const,
    gap: 8,
    alignItems: 'center' as const,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetText: {
    fontSize: 13,
    fontWeight: '800' as const,
  },
  segment: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 6,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  segButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  segText: {
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
  content: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    minHeight: 112,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  statSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  loadingRow: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  chartTypeSelector: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
    justifyContent: 'center',
  },
  chartTypeButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  webChartFallback: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webChartText: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  webChartSubtext: {
    fontSize: 12,
  },
  pedometerCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  pedometerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  pedometerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pedometerTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  pedometerStepsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 10,
  },
  pedometerStepsValue: {
    fontSize: 36,
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
  pedometerStepsUnit: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  pedometerDistanceRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  distanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  distanceBadgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  pedometerGoalText: {
    fontSize: 12,
    marginBottom: 4,
  },
  pedometerLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pedometerLiveText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  pedometerUnavailableText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 8,
  },
  diagramCard: {
    borderRadius: 18,
    padding: 18,
  },
  diagramTitle: {
    fontSize: 15,
    fontWeight: '800' as const,
    marginBottom: 14,
  },
  stepGoalRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  stepGoalInfo: {
    flexDirection: 'row' as const,
    alignItems: 'baseline',
    gap: 4,
  },
  stepGoalValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  stepGoalTarget: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  stepGoalPct: {
    fontSize: 22,
    fontWeight: '800' as const,
  },
  segmentTrack: {
    height: 14,
    borderRadius: 7,
    overflow: 'hidden' as const,
    flexDirection: 'row' as const,
    marginBottom: 6,
    position: 'relative' as const,
  },
  segmentZone: {
    height: '100%',
  },
  segmentFill: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 7,
  },
  segmentLabels: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  segmentLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  liveRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  diagramGrid2: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  diagramCardSmall: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  diagramTitleSmall: {
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  diagramBigValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  diagramUnit: {
    fontSize: 11,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  miniBarBg: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 4,
  },
  converterCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  converterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  converterIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  converterTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  converterInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  converterInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  converterButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  converterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  converterResults: {
    flexDirection: 'row',
    gap: 10,
  },
  converterResultItem: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  converterResultLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  converterResultValue: {
    fontSize: 20,
    fontWeight: '800' as const,
  },

});
