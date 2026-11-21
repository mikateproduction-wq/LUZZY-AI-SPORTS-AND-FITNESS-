import { Footprints } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTodaySteps } from '@/hooks/useTodaySteps';
import { DAILY_STEP_GOAL } from '@/lib/stepTally';

const STEP_COLOR = '#4ECDC4';

/** Pas du jour et progression vers l'objectif, affichés sur l'accueil. */
export function StepsCard() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { steps, status } = useTodaySteps();

  const progress = Math.min(steps / DAILY_STEP_GOAL, 1);
  const goalReached = progress >= 1;

  const renderBody = () => {
    if (Platform.OS === 'web') {
      return (
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          {t('home.pedometerWeb')}
        </Text>
      );
    }
    if (status === 'idle' || status === 'loading') {
      return <ActivityIndicator size="small" color={theme.colors.primary} />;
    }
    if (status === 'unavailable' || status === 'denied') {
      return (
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          {t('home.pedometerUnavailable')}
        </Text>
      );
    }
    return (
      <>
        <View style={styles.valueRow}>
          <Text style={[styles.value, { color: theme.colors.text }]}>{steps.toLocaleString()}</Text>
          <Text style={[styles.unit, { color: theme.colors.textSecondary }]}>
            {t('activity.steps').toLowerCase()}
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: theme.colors.border }]}>
          <View
            style={[
              styles.fill,
              {
                width: `${Math.round(progress * 100)}%`,
                backgroundColor: goalReached ? theme.colors.success : STEP_COLOR,
              },
            ]}
          />
        </View>
        <Text style={[styles.goal, { color: theme.colors.textSecondary }]}>
          {t('home.dailyGoal', { goal: DAILY_STEP_GOAL.toLocaleString() })}
        </Text>
      </>
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]} accessibilityRole="summary">
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: STEP_COLOR + '20' }]}>
          <Footprints color={STEP_COLOR} size={20} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>{t('home.pedometer')}</Text>
      </View>
      {renderBody()}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
  },
  unit: {
    fontSize: 14,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  goal: {
    fontSize: 12,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
});
