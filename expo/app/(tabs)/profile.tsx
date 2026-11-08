import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Animated,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { User as UserIcon, Save, Edit, Camera, Trophy, Shield, Star, Diamond } from 'lucide-react-native';

import { useProfile } from '@/contexts/ProfileContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Gender, FitnessLevel, FitnessGoal, ActivityLevel, Rank } from '@/types/fitness';
import { logger } from '@/utils/logger';
import { clampInt, sanitizeName, sanitizeText } from '@/utils/validation';

const MAX_PHOTO_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const RANK_COLORS: Record<Rank, { bg: string; accent: string; glow: string }> = {
  bronze: { bg: '#CD7F32', accent: '#8B5A2B', glow: '#CD7F3240' },
  silver: { bg: '#C0C0C0', accent: '#808080', glow: '#C0C0C040' },
  gold: { bg: '#FFD700', accent: '#DAA520', glow: '#FFD70040' },
  diamond: { bg: '#B9F2FF', accent: '#00CED1', glow: '#B9F2FF40' },
};

const RANK_ICONS: Record<Rank, React.ComponentType<{ color: string; size: number }>> = {
  bronze: Shield,
  silver: Star,
  gold: Trophy,
  diamond: Diamond,
};

export default function ProfileScreen() {
  const { theme, themeOpacity } = useTheme();
  const { profile, updateProfile, xp, rankInfo } = useProfile();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(!profile);
  const [name, setName] = useState(profile?.name || '');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [height, setHeight] = useState(profile?.height?.toString() || '');
  const [weight, setWeight] = useState(profile?.weight?.toString() || '');
  const [gender, setGender] = useState<Gender>(profile?.gender || 'male');
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>(
    profile?.fitnessLevel || 'beginner'
  );
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>(
    profile?.fitnessGoal || 'general_health'
  );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    profile?.activityLevel || 'sedentary'
  );
  const [medicalRestrictions, setMedicalRestrictions] = useState(
    profile?.medicalRestrictions || ''
  );

  const rankProgressAnim = useRef(new Animated.Value(0)).current;
  const rankGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rankProgressAnim, {
      toValue: rankInfo.progress,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [rankInfo.progress, rankProgressAnim]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rankGlowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(rankGlowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [rankGlowAnim]);

  const rankColors = RANK_COLORS[rankInfo.rank];
  const RankIcon = RANK_ICONS[rankInfo.rank];

  const rankLabel = useMemo(() => {
    const labels: Record<Rank, string> = {
      bronze: t('profile.rankBronze'),
      silver: t('profile.rankSilver'),
      gold: t('profile.rankGold'),
      diamond: t('profile.rankDiamond'),
    };
    return labels[rankInfo.rank];
  }, [rankInfo.rank, t]);

  const progressBarWidth = rankProgressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const glowOpacity = rankGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  const applyPickedPhoto = useCallback(
    async (asset: ImagePicker.ImagePickerAsset) => {
      try {
        if (asset.mimeType && !ALLOWED_MIME_TYPES.includes(asset.mimeType.toLowerCase())) {
          Alert.alert(t('profile.permissionTitle'), 'Format non supporté. Utilisez JPG, PNG ou WEBP.');
          return;
        }
        if (typeof asset.fileSize === 'number' && asset.fileSize > MAX_PHOTO_SIZE_BYTES) {
          Alert.alert(t('profile.permissionTitle'), 'Image trop volumineuse (max 8 Mo).');
          return;
        }

        setIsSavingPhoto(true);
        if (profile) {
          await updateProfile({ ...profile, photoUri: asset.uri });
        }
      } catch (e) {
        logger.error('[Profile] photo save error', e);
        Alert.alert(t('profile.permissionTitle'), "Impossible d'enregistrer la photo. Réessayez.");
      } finally {
        setIsSavingPhoto(false);
      }
    },
    [profile, t, updateProfile]
  );

  const pickImage = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(t('profile.permissionTitle'), t('profile.permissionMessage'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });

      if (!result.canceled && result.assets[0]) {
        await applyPickedPhoto(result.assets[0]);
      }
    } catch (e) {
      logger.error('[Profile] pickImage error', e);
      Alert.alert(t('profile.permissionTitle'), "Sélection de l'image impossible. Réessayez.");
    }
  }, [applyPickedPhoto, t]);

  const takePhoto = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert(t('profile.permissionTitle'), t('profile.permissionMessage'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });

      if (!result.canceled && result.assets[0]) {
        await applyPickedPhoto(result.assets[0]);
      }
    } catch (e) {
      logger.error('[Profile] takePhoto error', e);
      Alert.alert(t('profile.permissionTitle'), 'Prise de photo impossible. Réessayez.');
    }
  }, [applyPickedPhoto, t]);

  const handleAvatarPress = useCallback(() => {
    Alert.alert(
      t('profile.title'),
      undefined,
      [
        { text: 'Prendre une photo', onPress: () => void takePhoto() },
        { text: 'Choisir depuis la galerie', onPress: () => void pickImage() },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  }, [pickImage, t, takePhoto]);

  const handleSave = () => {
    // Server-mirrored validation: bounds enforced again before persisting
    // (CWE-20) — the UI is never trusted as the only guard.
    const safeName = sanitizeName(name);
    const safeRestrictions = sanitizeText(medicalRestrictions);
    if (!safeName) {
      Alert.alert('Error', t('profile.errorName'));
      return;
    }
    const safeAge = clampInt(age, 10, 100, NaN as unknown as number);
    if (Number.isNaN(safeAge)) {
      Alert.alert('Error', t('profile.errorAge'));
      return;
    }
    const safeHeight = clampInt(height, 80, 250, NaN as unknown as number);
    if (Number.isNaN(safeHeight)) {
      Alert.alert('Error', t('profile.errorHeight'));
      return;
    }
    const safeWeight = clampInt(weight, 25, 400, NaN as unknown as number);
    if (Number.isNaN(safeWeight)) {
      Alert.alert('Error', t('profile.errorWeight'));
      return;
    }

    void updateProfile({
      name: safeName,
      age: safeAge,
      height: safeHeight,
      weight: safeWeight,
      gender,
      fitnessLevel,
      photoUri: profile?.photoUri,
      fitnessGoal,
      activityLevel,
      medicalRestrictions: safeRestrictions || undefined,
    });

    setIsEditing(false);
    Alert.alert(t('profile.successTitle'), t('profile.successMessage'));
  };

  const SelectOption = ({
    label,
    isSelected,
    onPress,
  }: {
    label: string;
    value: string;
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.optionButton,
        {
          backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
        },
      ]}
      onPress={onPress}
      disabled={!isEditing}
    >
      <Text
        style={[
          styles.optionText,
          {
            color: isSelected ? '#FFFFFF' : theme.colors.text,
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
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('profile.title')}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {t('profile.subtitle')}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Edit color={theme.colors.primary} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={handleAvatarPress}
          activeOpacity={0.8}
          disabled={isSavingPhoto}
        >
          <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primary }]}>
            {isSavingPhoto ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : profile?.photoUri ? (
              <Image source={{ uri: profile.photoUri }} style={styles.avatarImage} />
            ) : (
              <UserIcon color="#FFFFFF" size={48} />
            )}
          </View>
          <View style={[styles.cameraIconContainer, { backgroundColor: theme.colors.primary }]}>
            <Camera color="#FFFFFF" size={18} />
          </View>
        </TouchableOpacity>

        <View style={[styles.rankCard, { backgroundColor: theme.colors.surface }]}>
          <Animated.View
            style={[
              styles.rankGlow,
              {
                backgroundColor: rankColors.glow,
                opacity: glowOpacity,
              },
            ]}
          />
          <View style={styles.rankHeader}>
            <View style={[styles.rankBadge, { backgroundColor: rankColors.bg + '25' }]}>
              <RankIcon color={rankColors.bg} size={28} />
            </View>
            <View style={styles.rankHeaderText}>
              <Text style={[styles.rankLabel, { color: theme.colors.textSecondary }]}>
                {t('profile.rank')}
              </Text>
              <Text style={[styles.rankName, { color: rankColors.bg }]}>
                {rankLabel}
              </Text>
            </View>
            <View style={[styles.xpBadge, { backgroundColor: theme.colors.primary + '15' }]}>
              <Text style={[styles.xpBadgeText, { color: theme.colors.primary }]}>
                {xp} XP
              </Text>
            </View>
          </View>

          <View style={styles.rankProgressSection}>
            <View style={[styles.rankProgressBg, { backgroundColor: theme.colors.border }]}>
              <Animated.View
                style={[
                  styles.rankProgressFill,
                  {
                    backgroundColor: rankColors.bg,
                    width: progressBarWidth,
                  },
                ]}
              />
            </View>
            <Text style={[styles.rankProgressText, { color: theme.colors.textSecondary }]}>
              {rankInfo.xpToNext > 0
                ? t('profile.xpToNext', { xp: String(rankInfo.xpToNext) })
                : t('profile.maxRank')}
            </Text>
          </View>

          <View style={styles.rankTiers}>
            {(['bronze', 'silver', 'gold', 'diamond'] as Rank[]).map((r) => {
              const isActive = r === rankInfo.rank;
              const isPast = RANK_COLORS[r] && getRankOrder(r) < getRankOrder(rankInfo.rank);
              const tierColor = RANK_COLORS[r];
              return (
                <View
                  key={r}
                  style={[
                    styles.rankTierItem,
                    {
                      backgroundColor: isActive
                        ? tierColor.bg + '20'
                        : isPast
                        ? tierColor.bg + '10'
                        : theme.colors.background,
                      borderColor: isActive ? tierColor.bg : 'transparent',
                      borderWidth: isActive ? 1.5 : 0,
                    },
                  ]}
                >
                  <View style={[styles.rankTierDot, { backgroundColor: isPast || isActive ? tierColor.bg : theme.colors.border }]} />
                  <Text
                    style={[
                      styles.rankTierText,
                      {
                        color: isActive ? tierColor.bg : isPast ? theme.colors.text : theme.colors.textSecondary,
                        fontWeight: isActive ? '700' as const : '500' as const,
                      },
                    ]}
                  >
                    {t(`profile.rank${r.charAt(0).toUpperCase() + r.slice(1)}` as any)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text }]}>{t('profile.name')}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder={t('profile.namePlaceholder')}
              placeholderTextColor={theme.colors.textSecondary}
              editable={isEditing}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.halfField]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>{t('profile.age')}</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                value={age}
                onChangeText={setAge}
                placeholder={t('profile.agePlaceholder')}
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                editable={isEditing}
              />
            </View>

            <View style={[styles.field, styles.halfField]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>{t('profile.height')}</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                value={height}
                onChangeText={setHeight}
                placeholder={t('profile.heightPlaceholder')}
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                editable={isEditing}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text }]}>{t('profile.weight')}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              value={weight}
              onChangeText={setWeight}
              placeholder={t('profile.weightPlaceholder')}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              editable={isEditing}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text }]}>{t('profile.gender')}</Text>
            <View style={styles.optionsRow}>
              <SelectOption
                label={t('profile.gender.male')}
                value="male"
                isSelected={gender === 'male'}
                onPress={() => setGender('male')}
              />
              <SelectOption
                label={t('profile.gender.female')}
                value="female"
                isSelected={gender === 'female'}
                onPress={() => setGender('female')}
              />
              <SelectOption
                label={t('profile.gender.other')}
                value="other"
                isSelected={gender === 'other'}
                onPress={() => setGender('other')}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text }]}>{t('profile.fitnessLevel')}</Text>
            <View style={styles.optionsColumn}>
              <SelectOption
                label={t('profile.fitnessLevel.beginner')}
                value="beginner"
                isSelected={fitnessLevel === 'beginner'}
                onPress={() => setFitnessLevel('beginner')}
              />
              <SelectOption
                label={t('profile.fitnessLevel.intermediate')}
                value="intermediate"
                isSelected={fitnessLevel === 'intermediate'}
                onPress={() => setFitnessLevel('intermediate')}
              />
              <SelectOption
                label={t('profile.fitnessLevel.expert')}
                value="expert"
                isSelected={fitnessLevel === 'expert'}
                onPress={() => setFitnessLevel('expert')}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text }]}>{t('profile.fitnessGoal')}</Text>
            <View style={styles.optionsColumn}>
              <SelectOption
                label={t('profile.fitnessGoal.weightLoss')}
                value="weight_loss"
                isSelected={fitnessGoal === 'weight_loss'}
                onPress={() => setFitnessGoal('weight_loss')}
              />
              <SelectOption
                label={t('profile.fitnessGoal.muscleGain')}
                value="muscle_gain"
                isSelected={fitnessGoal === 'muscle_gain'}
                onPress={() => setFitnessGoal('muscle_gain')}
              />
              <SelectOption
                label={t('profile.fitnessGoal.endurance')}
                value="endurance"
                isSelected={fitnessGoal === 'endurance'}
                onPress={() => setFitnessGoal('endurance')}
              />
              <SelectOption
                label={t('profile.fitnessGoal.flexibility')}
                value="flexibility"
                isSelected={fitnessGoal === 'flexibility'}
                onPress={() => setFitnessGoal('flexibility')}
              />
              <SelectOption
                label={t('profile.fitnessGoal.generalHealth')}
                value="general_health"
                isSelected={fitnessGoal === 'general_health'}
                onPress={() => setFitnessGoal('general_health')}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text }]}>{t('profile.activityLevel')}</Text>
            <View style={styles.optionsColumn}>
              <SelectOption
                label={t('profile.activityLevel.sedentary')}
                value="sedentary"
                isSelected={activityLevel === 'sedentary'}
                onPress={() => setActivityLevel('sedentary')}
              />
              <SelectOption
                label={t('profile.activityLevel.lightlyActive')}
                value="lightly_active"
                isSelected={activityLevel === 'lightly_active'}
                onPress={() => setActivityLevel('lightly_active')}
              />
              <SelectOption
                label={t('profile.activityLevel.moderatelyActive')}
                value="moderately_active"
                isSelected={activityLevel === 'moderately_active'}
                onPress={() => setActivityLevel('moderately_active')}
              />
              <SelectOption
                label={t('profile.activityLevel.veryActive')}
                value="very_active"
                isSelected={activityLevel === 'very_active'}
                onPress={() => setActivityLevel('very_active')}
              />
              <SelectOption
                label={t('profile.activityLevel.extremelyActive')}
                value="extremely_active"
                isSelected={activityLevel === 'extremely_active'}
                onPress={() => setActivityLevel('extremely_active')}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text }]}>{t('profile.medicalRestrictions')}</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              value={medicalRestrictions}
              onChangeText={setMedicalRestrictions}
              placeholder={t('profile.medicalRestrictionsPlaceholder')}
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={4}
              editable={isEditing}
            />
          </View>

          {isEditing && (
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSave}
            >
              <Save color="#FFFFFF" size={20} />
              <Text style={styles.saveButtonText}>{t('profile.saveProfile')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.socialCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.socialTitle, { color: theme.colors.textSecondary }]}>{t('social.followUs')}</Text>
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={[styles.socialButton, styles.socialX]}
              onPress={() => Linking.openURL('https://x.com/mikatproduction')}
              activeOpacity={0.8}
            >
              <Text style={styles.socialXIcon}>𝕏</Text>
              <Text style={styles.socialButtonText}>@mikatproduction</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, styles.socialFacebook]}
              onPress={() => Linking.openURL('https://web.facebook.com/profile.php?id=61588056604314')}
              activeOpacity={0.8}
            >
              <Text style={styles.socialFbIcon}>f</Text>
              <Text style={styles.socialButtonText}>{t('social.facebook')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, styles.socialInstagram]}
              onPress={() => Linking.openURL('https://www.instagram.com/mikateproduction01/')}
              activeOpacity={0.8}
            >
              <Text style={styles.socialIgIcon}>◎</Text>
              <Text style={styles.socialButtonText}>@mikateproduction01</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

function getRankOrder(rank: Rank): number {
  const order: Record<Rank, number> = { bronze: 0, silver: 1, gold: 2, diamond: 3 };
  return order[rank];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  avatarWrapper: {
    alignSelf: 'center' as const,
    marginBottom: 24,
    position: 'relative' as const,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden' as const,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraIconContainer: {
    position: 'absolute' as const,
    bottom: 32,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  rankCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden' as const,
  },
  rankGlow: {
    position: 'absolute' as const,
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  rankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankHeaderText: {
    flex: 1,
    marginLeft: 14,
  },
  rankLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 2,
  },
  rankName: {
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },
  xpBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  xpBadgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  rankProgressSection: {
    marginBottom: 16,
  },
  rankProgressBg: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden' as const,
    marginBottom: 8,
  },
  rankProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  rankProgressText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  rankTiers: {
    flexDirection: 'row',
    gap: 8,
  },
  rankTierItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    gap: 4,
  },
  rankTierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rankTierText: {
    fontSize: 10,
  },
  form: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  halfField: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionsColumn: {
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  textArea: {
    minHeight: 90,
    paddingTop: 14,
    textAlignVertical: 'top' as const,
  },
  socialCard: {
    borderRadius: 20,
    padding: 20,
    marginTop: 24,
    gap: 14,
  },
  socialTitle: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
  },
  socialRow: {
    flexDirection: 'column' as const,
    gap: 10,
  },
  socialButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 14,
    gap: 12,
  },
  socialX: {
    backgroundColor: '#000000',
  },
  socialFacebook: {
    backgroundColor: '#1877F2',
  },
  socialInstagram: {
    backgroundColor: '#E1306C',
  },
  socialXIcon: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    width: 24,
    textAlign: 'center' as const,
  },
  socialFbIcon: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    width: 24,
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
  },
  socialIgIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    width: 24,
    textAlign: 'center' as const,
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
    flex: 1,
  },
});
