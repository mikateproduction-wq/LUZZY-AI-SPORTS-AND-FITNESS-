import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { UN_COUNTRIES, CONTINENT_LABELS_FR, getCountry, type Country } from '@/data/countries';
import { createProfile, checkPseudoAvailable } from '@/lib/supabase';
import { validatePseudo, normalizePseudo, PSEUDO_MIN, PSEUDO_MAX } from '@/utils/pseudo';
import { sanitizeName } from '@/utils/validation';
import { logger } from '@/utils/logger';

type PseudoState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error';

const PSEUDO_DEBOUNCE_MS = 400;
const NAME_MAX = 60;

/** Textes de l'onboarding. Le français et l'anglais sont fournis ; les autres langues suivent l'anglais. */
const STRINGS = {
  fr: {
    title: 'Votre profil',
    subtitle: 'Ces informations apparaissent dans les classements. Votre pseudo est public, vos nom et prénom ne le sont pas.',
    firstName: 'Prénom',
    lastName: 'Nom',
    pseudo: 'Pseudo public',
    pseudoHint: `${PSEUDO_MIN} à ${PSEUDO_MAX} caractères : lettres, chiffres, point, tiret ou underscore.`,
    pseudoChecking: 'Vérification…',
    pseudoAvailable: 'Pseudo disponible',
    pseudoTaken: 'Ce pseudo est déjà pris',
    pseudoInvalid: 'Pseudo invalide',
    pseudoError: 'Vérification impossible, réessayez',
    country: 'Pays',
    countryPlaceholder: 'Choisir votre pays',
    countrySearch: 'Rechercher un pays',
    submit: 'Continuer',
    submitting: 'Enregistrement…',
    requiredNames: 'Prénom et nom sont obligatoires.',
    requiredCountry: 'Choisissez votre pays.',
    saveError: "Impossible d'enregistrer le profil. Réessayez.",
    close: 'Fermer',
  },
  en: {
    title: 'Your profile',
    subtitle: 'This information appears in leaderboards. Your pseudo is public; your first and last name are not.',
    firstName: 'First name',
    lastName: 'Last name',
    pseudo: 'Public pseudo',
    pseudoHint: `${PSEUDO_MIN} to ${PSEUDO_MAX} characters: letters, digits, dot, dash or underscore.`,
    pseudoChecking: 'Checking…',
    pseudoAvailable: 'Pseudo available',
    pseudoTaken: 'This pseudo is already taken',
    pseudoInvalid: 'Invalid pseudo',
    pseudoError: 'Check failed, please retry',
    country: 'Country',
    countryPlaceholder: 'Choose your country',
    countrySearch: 'Search a country',
    submit: 'Continue',
    submitting: 'Saving…',
    requiredNames: 'First and last name are required.',
    requiredCountry: 'Choose your country.',
    saveError: 'Could not save your profile. Please retry.',
    close: 'Close',
  },
} as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const s = language === 'fr' ? STRINGS.fr : STRINGS.en;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [pseudoState, setPseudoState] = useState<PseudoState>('idle');
  const [country, setCountry] = useState<Country | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Vérification du pseudo : validation locale d'abord, puis disponibilité en base après une pause.
  useEffect(() => {
    const value = normalizePseudo(pseudo);
    if (value.length === 0) {
      setPseudoState('idle');
      return;
    }
    if (validatePseudo(value) !== null) {
      setPseudoState('invalid');
      return;
    }
    setPseudoState('checking');
    let cancelled = false;
    const timer = setTimeout(async () => {
      const { available, error } = await checkPseudoAvailable(value);
      if (cancelled) return;
      if (error || available === null) {
        logger.error('[Onboarding] pseudo check failed', { status: error?.status });
        setPseudoState('error');
        return;
      }
      setPseudoState(available ? 'available' : 'taken');
    }, PSEUDO_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pseudo]);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return UN_COUNTRIES;
    return UN_COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q);
  }, [countryQuery]);

  const pseudoMessage: Record<PseudoState, string> = {
    idle: `${PSEUDO_MIN}–${PSEUDO_MAX}`,
    checking: s.pseudoChecking,
    available: s.pseudoAvailable,
    taken: s.pseudoTaken,
    invalid: s.pseudoInvalid,
    error: s.pseudoError,
  };
  const pseudoColor =
    pseudoState === 'available' ? theme.colors.success : pseudoState === 'idle' || pseudoState === 'checking'
      ? theme.colors.textSecondary
      : theme.colors.error ?? '#E5484D';

  const canSubmit =
    !submitting &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    pseudoState === 'available' &&
    country !== null;

  const handleSubmit = async () => {
    if (!user || !canSubmit || !country) return;
    setFormError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setFormError(s.requiredNames);
      return;
    }
    if (!country) {
      setFormError(s.requiredCountry);
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await createProfile(user.id, {
        firstName: sanitizeName(firstName, NAME_MAX),
        lastName: sanitizeName(lastName, NAME_MAX),
        pseudo: normalizePseudo(pseudo),
        countryCode: country.code,
      });
      if (error) {
        logger.error('[Onboarding] createProfile failed', { status: error.status, code: error.code });
        // 23505 : violation d'unicité, le pseudo vient d'être pris par un autre joueur.
        setPseudoState(error.code === '23505' ? 'taken' : 'error');
        setFormError(error.code === '23505' ? s.pseudoTaken : s.saveError);
        return;
      }
      await refreshProfile();
      router.replace('/(tabs)');
    } catch (err) {
      logger.error('[Onboarding] unexpected failure', err);
      setFormError(s.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: theme.colors.text }]}>{s.title}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{s.subtitle}</Text>

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{s.firstName}</Text>
          <TextInput
            value={firstName}
            onChangeText={(v) => setFirstName(v.slice(0, NAME_MAX))}
            autoCapitalize="words"
            autoComplete="given-name"
            maxLength={NAME_MAX}
            style={inputStyle}
            placeholderTextColor={theme.colors.textSecondary}
          />

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{s.lastName}</Text>
          <TextInput
            value={lastName}
            onChangeText={(v) => setLastName(v.slice(0, NAME_MAX))}
            autoCapitalize="words"
            autoComplete="family-name"
            maxLength={NAME_MAX}
            style={inputStyle}
            placeholderTextColor={theme.colors.textSecondary}
          />

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{s.pseudo}</Text>
          <TextInput
            value={pseudo}
            onChangeText={(v) => setPseudo(v.slice(0, PSEUDO_MAX))}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={PSEUDO_MAX}
            style={inputStyle}
            placeholderTextColor={theme.colors.textSecondary}
          />
          <Text style={[styles.hint, { color: pseudoColor }]} accessibilityLiveRegion="polite">
            {pseudoState === 'idle' ? s.pseudoHint : pseudoMessage[pseudoState]}
          </Text>

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{s.country}</Text>
          <Pressable
            onPress={() => setPickerOpen(true)}
            accessibilityRole="button"
            style={[...inputStyle, styles.countryButton]}
          >
            <Text style={{ color: country ? theme.colors.text : theme.colors.textSecondary }}>
              {country ? country.name : s.countryPlaceholder}
            </Text>
          </Pressable>

          {formError ? <Text style={[styles.error, { color: '#E5484D' }]}>{formError}</Text> : null}

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            accessibilityRole="button"
            style={[
              styles.submit,
              { backgroundColor: theme.colors.primary, opacity: canSubmit ? 1 : 0.5 },
            ]}
          >
            <Text style={styles.submitText}>{submitting ? s.submitting : s.submit}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
          <View style={styles.pickerHeader}>
            <TextInput
              value={countryQuery}
              onChangeText={setCountryQuery}
              placeholder={s.countrySearch}
              placeholderTextColor={theme.colors.textSecondary}
              autoCorrect={false}
              style={[...inputStyle, styles.flex]}
            />
            <Pressable onPress={() => setPickerOpen(false)} accessibilityRole="button" style={styles.closeButton}>
              <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>{s.close}</Text>
            </Pressable>
          </View>
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            initialNumToRender={30}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setCountry(getCountry(item.code));
                  setPickerOpen(false);
                  setCountryQuery('');
                }}
                accessibilityRole="button"
                style={[styles.countryRow, { borderBottomColor: theme.colors.border }]}
              >
                <Text style={{ color: theme.colors.text, flex: 1 }}>{item.name}</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                  {CONTINENT_LABELS_FR[item.continent]}
                </Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  label: { fontSize: 13, marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  countryButton: { justifyContent: 'center' },
  hint: { fontSize: 12, marginTop: 6, minHeight: 16 },
  error: { fontSize: 14, marginTop: 16 },
  submit: { marginTop: 28, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  closeButton: { paddingHorizontal: 8, paddingVertical: 8 },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
