import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Dumbbell, Timer, User, Flame, Clock, Trophy, ChevronRight } from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useActivity } from '@/contexts/ActivityContext';
import { EXERCISES } from '@/data/exercises';
import WeatherCard from '@/components/WeatherCard';


export default function HomeScreen() {
  const { theme, themeOpacity } = useTheme();
  const { t } = useLanguage();
  const { profile, rankInfo } = useProfile();
  const { today } = useActivity();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const displayName = profile?.name || t('home.defaultUser');
  const greeting = `${t('home.greeting')} ${displayName}`;

  return (
    <Animated.View style={{ flex: 1, opacity: themeOpacity }}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={[styles.greeting, { color: theme.colors.text }]}>{greeting}</Text>
                <Text style={[styles.appName, { color: theme.colors.textSecondary }]}>LUZZY AI : SPORT & FITNESS</Text>
              </View>
              <TouchableOpacity
                style={[styles.rankBadge, { backgroundColor: theme.colors.surface }]}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <Trophy size={16} color={rankInfo.rank === 'diamond' ? '#00CED1' : rankInfo.rank === 'gold' ? '#FFD700' : rankInfo.rank === 'silver' ? '#C0C0C0' : '#CD7F32'} />
                <Text style={[styles.rankText, { color: theme.colors.text }]}>
                  {rankInfo.rank.toUpperCase()}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.statsRow, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.statBlock}>
                <View style={[styles.statIconWrap, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Flame size={16} color={theme.colors.primary} />
                </View>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>{today.totalCalories}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{t('home.activityLabel')}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.statBlock}>
                <View style={[styles.statIconWrap, { backgroundColor: '#10B98115' }]}>
                  <Dumbbell size={16} color="#10B981" />
                </View>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>{today.exercisesCompleted}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{t('home.workoutsLabel')}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.statBlock}>
                <View style={[styles.statIconWrap, { backgroundColor: '#3B82F615' }]}>
                  <Clock size={16} color="#3B82F6" />
                </View>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>{today.exerciseMinutes}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{t('home.minutesLabel')}</Text>
              </View>
            </View>

            <WeatherCard />

            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('home.quickActions')}</Text>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => router.push('/(tabs)/exercises')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                <Dumbbell size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: theme.colors.text }]}>{t('home.browseExercises')}</Text>
                <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary }]}>
                  {t('home.workoutSubtitle', { count: String(EXERCISES.length) })}
                </Text>
              </View>
              <ChevronRight size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => router.push('/(tabs)/timer')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#3B82F615' }]}>
                <Timer size={22} color="#3B82F6" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: theme.colors.text }]}>{t('home.startTimer')}</Text>
                <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary }]}>
                  Chronomètre & minuteur
                </Text>
              </View>
              <ChevronRight size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F59E0B15' }]}>
                <User size={22} color="#F59E0B" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: theme.colors.text }]}>{t('home.myProfile')}</Text>
                <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary }]}>
                  XP, rang & informations
                </Text>
              </View>
              <ChevronRight size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.bottomSpacer} />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  appName: {
    fontSize: 26,
    fontWeight: '900' as const,
    letterSpacing: 1,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    alignItems: 'center',
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800' as const,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  statDivider: {
    width: 1,
    height: 44,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
    marginTop: 8,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    gap: 14,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  actionSubtitle: {
    fontSize: 12,
  },
  introSection: {
    marginTop: 16,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  introLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  introTextWrap: {
    flex: 1,
    gap: 2,
  },
  introTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  introSubtitle: {
    fontSize: 12,
  },
  bottomSpacer: {
    height: 20,
  },
});
