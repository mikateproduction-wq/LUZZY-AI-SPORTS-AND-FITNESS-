import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Linking,
  Alert,
  Platform,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Palette, Check, Languages, Mail, Bell, Clock, ChevronDown, ChevronUp, LogOut, UserCircle } from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications, NotifFrequency } from '@/contexts/NotificationContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

export default function SettingsScreen() {
  const { theme, changeTheme, availableThemes, themeOpacity } = useTheme();
  const { language, changeLanguage, availableLanguages, t } = useLanguage();
  const { prefs, toggleEnabled, updateFrequency, updateTime, getDefaultFrequency } = useNotifications();
  const { profile, clearAllLocalData } = useProfile();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [notifExpanded, setNotifExpanded] = useState<boolean>(false);

  const handleSignOut = async () => {
    Alert.alert(
      t('auth.accountSection'),
      t('auth.signOut') + '?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: t('auth.signOut'),
          style: 'destructive',
          onPress: () => {
            // Wipe every local trace of the session (MASWE-0024): tokens,
            // profile (health data), XP and any legacy plain-text residue.
            void signOut();
            void clearAllLocalData();
          },
        },
      ]
    );
  };

  const handleSocialPress = async (url: string) => {
    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      logger.error('[Social] open URL error', error);
    }
  };

  const handleEmailPress = async () => {
    const email = 'mikateproduction@gmail.com';
    const subject = t('settings.contactSubject');
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert(
            t('settings.emailErrorTitle'),
            t('settings.emailErrorMessage')
          );
        }
      }
    } catch (error) {
      logger.error('[Email] open email error', error);
      Alert.alert(
        t('settings.emailErrorTitle'),
        Platform.OS === 'web'
          ? 'Sur PC, cette fonction ouvre votre client mail. Sur mobile, elle ouvrira Gmail automatiquement.'
          : t('settings.emailErrorMessage')
      );
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    const result = await toggleEnabled(value);
    if (!result && value) {
      Alert.alert(t('settings.emailErrorTitle'), t('settings.notifPermissionDenied'));
    } else if (result && value) {
      Alert.alert('', t('settings.notifSaved'));
    }
  };

  const handleFrequencyChange = async (freq: NotifFrequency) => {
    await updateFrequency(freq);
    logger.log('[Settings] notification frequency changed', { freq });
  };

  const frequencyOptions: { key: NotifFrequency; label: string }[] = [
    { key: 'daily', label: t('settings.notifFreqDaily') },
    { key: 'every3days', label: t('settings.notifFreqEvery3Days') },
    { key: 'weekly', label: t('settings.notifFreqWeekly') },
  ];

  const defaultFreq = getDefaultFrequency(profile?.fitnessLevel);

  const formatTime = (h: number, m: number) => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <Animated.View style={{ flex: 1, opacity: themeOpacity }}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{t('settings.title')}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {t('settings.subtitle')}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <UserCircle color={theme.colors.text} size={20} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('auth.accountSection')}
            </Text>
          </View>

          {user ? (
            <View style={[styles.notifToggleRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.notifToggleLeft}>
                <View style={[styles.notifStatusDot, { backgroundColor: theme.colors.success }]} />
                <View>
                  <Text style={[styles.notifToggleLabel, { color: theme.colors.text }]}>
                    {user.name || user.email}
                  </Text>
                  {user.email && user.name && (
                    <Text style={[styles.accountEmail, { color: theme.colors.textSecondary }]}>
                      {user.email}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={[styles.signOutBtn, { borderColor: theme.colors.error }]}
                onPress={handleSignOut}
                activeOpacity={0.7}
              >
                <LogOut color={theme.colors.error} size={16} />
                <Text style={[styles.signOutText, { color: theme.colors.error }]}>
                  {t('auth.signOut')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.notifToggleRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.notifToggleLeft}>
                <View style={[styles.notifStatusDot, { backgroundColor: theme.colors.textSecondary }]} />
                <Text style={[styles.notifToggleLabel, { color: theme.colors.text }]}>
                  {t('auth.notSignedIn')}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.signInBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => router.push('/auth')}
                activeOpacity={0.8}
              >
                <Text style={styles.signInBtnText}>{t('auth.signInTitle')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette color={theme.colors.text} size={20} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('settings.colorTheme')}
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            {t('settings.chooseTheme')}
          </Text>

          <View style={styles.themesGrid}>
            {availableThemes.map((availableTheme) => {
              const isSelected = theme.id === availableTheme.id;
              return (
                <TouchableOpacity
                  key={availableTheme.id}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => changeTheme(availableTheme.id)}
                >
                  <View style={styles.themePreview}>
                    <View
                      style={[
                        styles.themeColorBlock,
                        { backgroundColor: availableTheme.colors.primary },
                      ]}
                    />
                    <View
                      style={[
                        styles.themeColorBlock,
                        { backgroundColor: availableTheme.colors.secondary },
                      ]}
                    />
                    <View
                      style={[
                        styles.themeColorBlock,
                        { backgroundColor: availableTheme.colors.background },
                      ]}
                    />
                  </View>
                  <View style={styles.themeInfo}>
                    <Text style={[styles.themeName, { color: theme.colors.text }]}>
                      {availableTheme.name}
                    </Text>
                    {isSelected && (
                      <View style={[styles.checkIcon, { backgroundColor: theme.colors.primary }]}>
                        <Check color="#FFFFFF" size={12} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Languages color={theme.colors.text} size={20} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('settings.language')}
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            {t('settings.chooseLanguage')}
          </Text>

          <View style={styles.themesGrid}>
            {availableLanguages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => changeLanguage(lang.code)}
                  testID={`settings.lang.${lang.code}`}
                >
                  <View style={styles.langBadgeWrap}>
                    <Text style={styles.langFlag}>{lang.flag}</Text>
                  </View>
                  <View style={styles.themeInfo}>
                    <Text style={[styles.themeName, { color: theme.colors.text }]}>
                      {lang.label}
                    </Text>
                    {isSelected && (
                      <View style={[styles.checkIcon, { backgroundColor: theme.colors.primary }]}>
                        <Check color="#FFFFFF" size={12} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setNotifExpanded(!notifExpanded)}
            activeOpacity={0.7}
          >
            <Bell color={theme.colors.text} size={20} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text, flex: 1 }]}>
              {t('settings.notifications')}
            </Text>
            {notifExpanded ? (
              <ChevronUp color={theme.colors.textSecondary} size={20} />
            ) : (
              <ChevronDown color={theme.colors.textSecondary} size={20} />
            )}
          </TouchableOpacity>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            {t('settings.notificationsDesc')}
          </Text>

          <View style={[styles.notifToggleRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.notifToggleLeft}>
              <View style={[styles.notifStatusDot, { backgroundColor: prefs.enabled ? theme.colors.success : theme.colors.error }]} />
              <Text style={[styles.notifToggleLabel, { color: theme.colors.text }]}>
                {prefs.enabled ? t('settings.notifEnabled') : t('settings.notifDisabled')}
              </Text>
            </View>
            <Switch
              value={prefs.enabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
              thumbColor={prefs.enabled ? theme.colors.primary : theme.colors.textSecondary}
            />
          </View>

          {notifExpanded && (
            <View style={styles.notifExpandedContent}>
              <Text style={[styles.notifSubLabel, { color: theme.colors.text }]}>
                {t('settings.notifFrequency')}
              </Text>
              <View style={styles.frequencyGrid}>
                {frequencyOptions.map((opt) => {
                  const isActive = prefs.frequency === opt.key;
                  const isDefault = defaultFreq === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.frequencyChip,
                        {
                          backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
                          borderColor: isActive ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                      onPress={() => handleFrequencyChange(opt.key)}
                    >
                      <Text
                        style={[
                          styles.frequencyChipText,
                          { color: isActive ? '#FFFFFF' : theme.colors.text },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {isDefault && !isActive && (
                        <View style={[styles.defaultBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                          <Text style={[styles.defaultBadgeText, { color: theme.colors.primary }]}>
                            auto
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.notifSubLabel, { color: theme.colors.text, marginTop: 16 }]}>
                {t('settings.notifTimeLabel')}
              </Text>

              {Platform.OS === 'web' ? (
                <View style={[styles.timePickerWeb, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <Clock color={theme.colors.primary} size={18} />
                  <Text style={[styles.timeText, { color: theme.colors.text }]}>
                    {formatTime(prefs.hour, prefs.minute)}
                  </Text>
                  <View style={styles.timeButtons}>
                    {[7, 8, 9, 12, 18, 20].map((h) => (
                      <TouchableOpacity
                        key={h}
                        style={[
                          styles.timePreset,
                          {
                            backgroundColor: prefs.hour === h && prefs.minute === 0 ? theme.colors.primary : theme.colors.background,
                            borderColor: theme.colors.border,
                          },
                        ]}
                        onPress={() => void updateTime(h, 0)}
                      >
                        <Text
                          style={[
                            styles.timePresetText,
                            { color: prefs.hour === h && prefs.minute === 0 ? '#FFFFFF' : theme.colors.text },
                          ]}
                        >
                          {h}:00
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={[styles.timePickerWeb, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <Clock color={theme.colors.primary} size={18} />
                  <Text style={[styles.timeText, { color: theme.colors.text }]}>
                    {formatTime(prefs.hour, prefs.minute)}
                  </Text>
                  <View style={styles.timeButtons}>
                    {[6, 7, 8, 9, 12, 18, 20, 21].map((h) => (
                      <TouchableOpacity
                        key={h}
                        style={[
                          styles.timePreset,
                          {
                            backgroundColor: prefs.hour === h && prefs.minute === 0 ? theme.colors.primary : theme.colors.background,
                            borderColor: theme.colors.border,
                          },
                        ]}
                        onPress={() => void updateTime(h, 0)}
                      >
                        <Text
                          style={[
                            styles.timePresetText,
                            { color: prefs.hour === h && prefs.minute === 0 ? '#FFFFFF' : theme.colors.text },
                          ]}
                        >
                          {h}:00
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.aboutLogoRow}>
            <Image
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/y0ufxbeab3usq9x1qeh9x.png' }}
              style={styles.aboutLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
            {t('settings.aboutTitle')}
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            {t('settings.aboutBody')}
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            {t('settings.version', { version: '1.0.0' })}
          </Text>
          <Text style={[styles.madeBy, { color: theme.colors.textSecondary }]}>
            {t('common.madeBy')}
          </Text>

          <TouchableOpacity
            style={[styles.emailButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleEmailPress}
            activeOpacity={0.8}
          >
            <Mail color="#FFFFFF" size={20} />
            <Text style={styles.emailButtonText}>{t('settings.contactUs')}</Text>
          </TouchableOpacity>

          <View style={styles.socialDivider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>Nous suivre</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: '#000000' }]}
              onPress={() => void handleSocialPress('https://x.com/mikatproduction')}
              activeOpacity={0.8}
            >
              <Text style={styles.socialBtnIcon}>𝕏</Text>
              <Text style={styles.socialBtnText}>@mikatproduction</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: '#1877F2' }]}
              onPress={() => void handleSocialPress('https://web.facebook.com/profile.php?id=61588056604314')}
              activeOpacity={0.8}
            >
              <Text style={styles.socialBtnIcon}>f</Text>
              <Text style={styles.socialBtnText}>Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialBtn, styles.instagramBtn]}
              onPress={() => void handleSocialPress('https://www.instagram.com/mikateproduction01/')}
              activeOpacity={0.8}
            >
              <View style={styles.igIconWrap}>
                <View style={styles.igIconOuter}>
                  <View style={styles.igIconInner} />
                  <View style={styles.igIconDot} />
                </View>
              </View>
              <Text style={styles.socialBtnText}>@mikateproduction01</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  themesGrid: {
    gap: 12,
  },
  langBadgeWrap: {
    minWidth: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 2,
  },
  langFlag: {
    fontSize: 24,
  },
  themeCard: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  themePreview: {
    flexDirection: 'row',
    gap: 4,
  },
  themeColorBlock: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  themeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  notifToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notifStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  notifToggleLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  notifExpandedContent: {
    marginTop: 16,
  },
  notifSubLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 10,
  },
  frequencyGrid: {
    gap: 8,
  },
  frequencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  frequencyChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  timePickerWeb: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  timeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  timePreset: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  timePresetText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  accountEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  signOutBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  signInBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  aboutLogoRow: {
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  aboutLogo: {
    width: 60,
    height: 60,
    borderRadius: 14,
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    gap: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  madeBy: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center' as const,
    fontWeight: '700' as const,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  emailButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  socialDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  socialRow: {
    gap: 10,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  socialBtnIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900' as const,
    width: 24,
    textAlign: 'center' as const,
  },
  socialBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  instagramBtn: {
    backgroundColor: '#E1306C',
  },
  igIconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  igIconOuter: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  igIconInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  igIconDot: {
    position: 'absolute' as const,
    top: 3,
    right: 3,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
  },
});
