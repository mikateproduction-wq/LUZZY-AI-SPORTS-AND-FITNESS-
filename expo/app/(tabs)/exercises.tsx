import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  Modal,
  FlatList,
  type GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Heart, Zap, Target, Wind, Trophy, Flame, Clock, Medal, X, Dumbbell, ChevronRight } from 'lucide-react-native';

import { EXERCISES } from '@/data/exercises';
import { useQuery } from '@tanstack/react-query';
import { fetchExerciseCatalog } from '@/lib/catalog';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getExerciseTranslation } from '@/data/exerciseTranslations';
import { Exercise, ExerciseCategory, FitnessLevel } from '@/types/fitness';
import { SPORTS, SPORT_NAMES } from '@/constants/sports';

function getDailyChallenges(catalog: Exercise[]) {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const seed = dayOfYear * 137 + now.getFullYear() * 31;
  const shuffled = [...catalog].sort((a, b) => {
    const ha = ((seed ^ a.id.charCodeAt(0) * 17) % 100);
    const hb = ((seed ^ b.id.charCodeAt(0) * 17) % 100);
    return ha - hb;
  });
  return shuffled.slice(0, 3);
}

const LEVELS: { id: FitnessLevel | 'all'; name: string }[] = [
  { id: 'all', name: 'Tous niveaux' },
  { id: 'beginner', name: 'Débutant' },
  { id: 'intermediate', name: 'Intermédiaire' },
  { id: 'expert', name: 'Expert' },
];

const CATEGORIES: { id: ExerciseCategory | 'all'; name: string; icon: typeof Target }[] = [
  { id: 'all', name: 'Tous', icon: Target },
  { id: 'cardio', name: 'Cardio', icon: Zap },
  { id: 'strength', name: 'Force', icon: Target },
  { id: 'yoga', name: 'Yoga', icon: Heart },
  { id: 'stretching', name: 'Mobilité', icon: Wind },
];

export default function ExercisesScreen() {
  const { theme, themeOpacity } = useTheme();
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<FitnessLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [showSportPicker, setShowSportPicker] = useState<boolean>(false);

  // Read-only catalog from Supabase merged over the local bundle
  // (local data is used immediately and serves as the offline fallback).
  const catalogQuery = useQuery({
    queryKey: ['exercises', 'catalog'],
    queryFn: fetchExerciseCatalog,
    staleTime: 10 * 60 * 1000,
  });
  const catalog = catalogQuery.data?.exercises ?? EXERCISES;
  const dailyChallenges = useMemo(() => getDailyChallenges(catalog), [catalog]);

  const sportExerciseIds = useMemo<Set<string> | null>(() => {
    if (!selectedSport) return null;
    const sport = SPORTS.find(s => s.id === selectedSport);
    return sport ? new Set(sport.exerciseIds) : null;
  }, [selectedSport]);

  const getSportName = useCallback((sportId: string): string => {
    const names = SPORT_NAMES[sportId];
    return names?.[language] ?? names?.en ?? sportId;
  }, [language]);

  const filteredExercises = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return catalog.filter((exercise) => {
      const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory;
      const matchesLevel = selectedLevel === 'all' || exercise.difficulty === selectedLevel;
      const translation = getExerciseTranslation(exercise.id, language);
      const displayName = translation?.name ?? exercise.name;
      const matchesSearch = !normalizedSearch || displayName.toLowerCase().includes(normalizedSearch);
      const matchesSport = !sportExerciseIds || sportExerciseIds.has(exercise.id);
      return matchesCategory && matchesLevel && matchesSearch && matchesSport;
    });
  }, [language, searchQuery, selectedCategory, selectedLevel, sportExerciseIds, catalog]);

  const listFade = useRef(new Animated.Value(0)).current;
  const listSlide = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    listFade.setValue(0);
    listSlide.setValue(12);
    Animated.parallel([
      Animated.timing(listFade, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(listSlide, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [selectedCategory, selectedLevel, selectedSport, searchQuery, listFade, listSlide]);

  return (
    <Animated.View style={{ flex: 1, opacity: themeOpacity }}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>EXERCICES À LA MAISON</Text>
          <View style={styles.headerBadges}>
            <View style={styles.flameBadge}>
              <Flame size={16} color="#FF4D4D" fill="#FF4D4D" />
            </View>
            <View style={[styles.countPill, { backgroundColor: theme.colors.primary + '14', borderColor: theme.colors.primary + '35' }]}>
              <Text style={[styles.countValue, { color: theme.colors.primary }]}>{filteredExercises.length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={[styles.searchBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Search color={theme.colors.textSecondary} size={19} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Rechercher dans les entraînements..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>
        </View>

        <View style={styles.sportSection}>
          <TouchableOpacity
            style={[
              styles.sportPickerBtn,
              {
                backgroundColor: selectedSport ? theme.colors.primary + '15' : theme.colors.surface,
                borderColor: selectedSport ? theme.colors.primary : theme.colors.border,
              },
            ]}
            onPress={() => setShowSportPicker(true)}
            activeOpacity={0.82}
          >
            <View style={[styles.sportIconBubble, { backgroundColor: selectedSport ? theme.colors.primary + '18' : theme.colors.background }]}> 
              <Medal size={15} color={selectedSport ? theme.colors.primary : theme.colors.textSecondary} />
            </View>
            <Text style={[styles.sportPickerText, { color: selectedSport ? theme.colors.primary : theme.colors.text }]}>
              {selectedSport ? getSportName(selectedSport) : 'Exercices par sport'}
            </Text>
            {selectedSport ? (
              <TouchableOpacity
                onPress={(e: GestureResponderEvent) => { e.stopPropagation(); setSelectedSport(null); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={14} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            ) : (
              <ChevronRight size={16} color={theme.colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        <Modal visible={showSportPicker} animationType="slide" transparent onRequestClose={() => setShowSportPicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}> 
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Choisis ton sport</Text>
                  <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>Filtre les exercices selon ta discipline.</Text>
                </View>
                <TouchableOpacity onPress={() => setShowSportPicker(false)} style={[styles.modalClose, { backgroundColor: theme.colors.surface }]}>
                  <X size={20} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={SPORTS}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.sportGrid}
                columnWrapperStyle={styles.sportGridRow}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: sport }) => {
                  const isActive = selectedSport === sport.id;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.sportCard,
                        {
                          backgroundColor: isActive ? theme.colors.primary + '15' : theme.colors.surface,
                          borderColor: isActive ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                      onPress={() => {
                        setSelectedSport(sport.id);
                        setShowSportPicker(false);
                      }}
                      activeOpacity={0.82}
                    >
                      <Text style={styles.sportEmoji}>{sport.emoji}</Text>
                      <Text style={[styles.sportName, { color: isActive ? theme.colors.primary : theme.colors.text }]} numberOfLines={2}>
                        {getSportName(sport.id)}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </Modal>

        <View style={styles.challengesSection}>
          <View style={styles.challengesHeader}>
            <View style={styles.challengesTitleRow}>
              <Trophy color="#F59E0B" size={15} />
              <Text style={[styles.challengesTitle, { color: theme.colors.text }]}>Défis rapides du jour</Text>
            </View>
            <View style={styles.challengesBadge}>
              <Text style={styles.challengesBadgeText}>3</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.challengesScroll}>
            {dailyChallenges.map((ch) => {
              const tr = getExerciseTranslation(ch.id, language);
              const name = tr?.name ?? ch.name;
              return (
                <TouchableOpacity
                  key={ch.id}
                  style={[styles.challengeCard, { backgroundColor: theme.colors.surface, borderColor: '#F59E0B30' }]}
                  onPress={() => router.push(`/exercise/${ch.id}` as any)}
                  activeOpacity={0.86}
                  testID={`challenge.${ch.id}`}
                >
                  <View style={styles.challengeImageWrap}>
                    <Image source={{ uri: ch.imageUrl }} style={styles.challengeImg} />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.48)']} style={styles.challengeGradient} />
                  </View>
                  <View style={styles.challengeCardBody}>
                    <Text style={[styles.challengeName, { color: theme.colors.text }]} numberOfLines={1}>{name}</Text>
                    <View style={styles.challengeStats}>
                      <View style={styles.challengeStat}>
                        <Clock size={10} color={theme.colors.textSecondary} />
                        <Text style={[styles.challengeStatText, { color: theme.colors.textSecondary }]}>{ch.duration}m</Text>
                      </View>
                      <View style={styles.challengeStat}>
                        <Flame size={10} color={theme.colors.textSecondary} />
                        <Text style={[styles.challengeStatText, { color: theme.colors.textSecondary }]}>{ch.caloriesBurn} cal</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.levelsScroll}
          contentContainerStyle={styles.categoriesContent}
          testID="exercises.levels"
        >
          {LEVELS.map((level) => {
            const isSelected = selectedLevel === level.id;
            return (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.levelChip,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedLevel(level.id)}
                testID={`exercises.level.${level.id}`}
                activeOpacity={0.84}
              >
                <Text style={[styles.categoryText, { color: isSelected ? '#FFFFFF' : theme.colors.text }]}>{level.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
          testID="exercises.categories"
        >
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(category.id)}
                testID={`exercises.category.${category.id}`}
                activeOpacity={0.84}
              >
                <Icon color={isSelected ? '#FFFFFF' : theme.colors.text} size={17} />
                <Text style={[styles.categoryText, { color: isSelected ? '#FFFFFF' : theme.colors.text }]}>{category.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Animated.ScrollView
          style={styles.exercisesList}
          contentContainerStyle={styles.exercisesContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: listFade, transform: [{ translateY: listSlide }] }}>
            {filteredExercises.map((exercise) => {
              const translation = getExerciseTranslation(exercise.id, language);
              const displayName = translation?.name ?? exercise.name;
              const displayMuscles = translation?.targetMuscles ?? exercise.targetMuscles;
              const difficultyColor =
                exercise.difficulty === 'beginner'
                  ? theme.colors.success
                  : exercise.difficulty === 'intermediate'
                  ? theme.colors.warning
                  : theme.colors.error;

              const levelDots = exercise.difficulty === 'beginner' ? 1 : exercise.difficulty === 'intermediate' ? 2 : 3;

              return (
                <TouchableOpacity
                  key={exercise.id}
                  style={[styles.exerciseCard, { borderBottomColor: theme.colors.border }]}
                  onPress={() => router.push(`/exercise/${exercise.id}` as any)}
                  activeOpacity={0.7}
                  testID={`exercise.card.${exercise.id}`}
                >
                  <Image source={{ uri: exercise.imageUrl }} style={styles.exerciseThumb} resizeMode="cover" />
                  <View style={styles.exerciseContent}>
                    <Text style={[styles.exerciseName, { color: theme.colors.text }]} numberOfLines={1}>{displayName}</Text>
                    <Text style={[styles.exerciseMeta, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                      {exercise.duration} min · {displayMuscles.length} muscles ciblés
                    </Text>
                    <View style={styles.boltsRow}>
                      {[1, 2, 3].map((i) => (
                        <Zap
                          key={i}
                          size={13}
                          color={i <= levelDots ? theme.colors.primary : theme.colors.border}
                          fill={i <= levelDots ? theme.colors.primary : 'transparent'}
                        />
                      ))}
                    </View>
                  </View>
                  <ChevronRight size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        </Animated.ScrollView>
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
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 19,
    fontWeight: '900' as const,
    letterSpacing: -0.3,
    textTransform: 'uppercase' as const,
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flameBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPill: {
    minWidth: 34,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: 'center',
  },
  countValue: {
    fontSize: 13,
    fontWeight: '900' as const,
  },
  sportSection: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sportPickerBtn: {
    minHeight: 46,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  sportIconBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportPickerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '78%' as const,
    paddingBottom: 30,
  },
  modalHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(150,150,150,0.35)',
    alignSelf: 'center',
    marginTop: 10,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportGrid: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sportGridRow: {
    justifyContent: 'space-between' as const,
    marginBottom: 10,
  },
  sportCard: {
    width: '48%' as const,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center' as const,
    gap: 8,
  },
  sportEmoji: {
    fontSize: 32,
  },
  sportName: {
    fontSize: 13,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  challengesSection: {
    marginBottom: 11,
  },
  challengesHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  challengesTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 7,
  },
  challengesTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
  },
  challengesBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#F59E0B20',
  },
  challengesBadgeText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#F59E0B',
  },
  challengesScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  challengeCard: {
    width: 138,
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
  },
  challengeImageWrap: {
    height: 72,
  },
  challengeImg: {
    width: '100%',
    height: '100%',
  },
  challengeGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  challengeCardBody: {
    padding: 9,
    gap: 5,
  },
  challengeName: {
    fontSize: 12,
    fontWeight: '800' as const,
    lineHeight: 15,
  },
  challengeStats: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  challengeStat: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 2,
  },
  challengeStatText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 9,
  },
  searchBox: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  levelsScroll: {
    maxHeight: 38,
    marginBottom: 7,
  },
  categoriesScroll: {
    maxHeight: 42,
    marginBottom: 10,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 7,
  },
  levelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '800' as const,
  },
  exercisesList: {
    flex: 1,
  },
  exercisesContent: {
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  exerciseThumb: {
    width: 68,
    height: 68,
    borderRadius: 16,
  },
  exerciseContent: {
    flex: 1,
    gap: 4,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '800' as const,
    letterSpacing: -0.2,
  },
  exerciseMeta: {
    fontSize: 12.5,
    fontWeight: '500' as const,
  },
  boltsRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
  },
});
