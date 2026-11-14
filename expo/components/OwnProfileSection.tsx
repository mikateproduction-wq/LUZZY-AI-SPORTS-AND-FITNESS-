import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Edit } from 'lucide-react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { UN_COUNTRIES, CONTINENT_LABELS_FR, getCountry, type Country } from '@/data/countries';
import { checkPseudoAvailable, updateOwnProfile, type ProfilePatch } from '@/lib/supabase';
import { validatePseudo, normalizePseudo, PSEUDO_MIN, PSEUDO_MAX } from '@/utils/pseudo';
import { sanitizeName } from '@/utils/validation';
import { logger } from '@/utils/logger';

const NAME_MAX = 60;

/** Textes de la section profil. Français et anglais ; les autres langues suivent l'anglais. */
const STRINGS = {
  fr: {
    sectionTitle: 'Mon profil',
    firstName: 'Prénom',
    lastName: 'Nom',
    pseudo: 'Pseudo public',
    pseudoHint: `${PSEUDO_MIN} à ${PSEUDO_MAX} caractères : lettres, chiffres, point, tiret ou underscore.`,
    pseudoPrivacy: 'Votre pseudo est public. Votre prénom et votre nom ne le sont pas.',
    country: 'Pays',
    countryPlaceholder: 'Choisir votre pays',
    countrySearch: 'Rechercher un pays',
    edit: 'Modifier mon profil',
    cancel: 'Annuler',
    save: 'Enregistrer',
    saving: 'Enregistrement…',
    close: 'Fermer',
    saved: 'Profil enregistré.',
    requiredNames: 'Prénom et nom sont obligatoires.',
    requiredCountry: 'Choisissez votre pays.',
    pseudoInvalid: 'Pseudo invalide.',
    pseudoTaken: 'Ce pseudo est déjà pris.',
    pseudoCheckFailed: 'Vérification impossible, réessayez.',
    saveError: "Impossible d'enregistrer le profil. Réessayez.",
  },
  en: {
    sectionTitle: 'My profile',
    firstName: 'First name',
    lastName: 'Last name',
    pseudo: 'Public pseudo',
    pseudoHint: `${PSEUDO_MIN} to ${PSEUDO_MAX} characters: letters, digits, dot, dash or underscore.`,
    pseudoPrivacy: 'Your pseudo is public. Your first and last name are not.',
    country: 'Country',
    countryPlaceholder: 'Choose your country',
    countrySearch: 'Search a country',
    edit: 'Edit my profile',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving…',
    close: 'Close',
    saved: 'Profile saved.',
    requiredNames: 'First and last name are required.',
    requiredCountry: 'Choose your country.',
    pseudoInvalid: 'Invalid pseudo.',
    pseudoTaken: 'This pseudo is already taken.',
    pseudoCheckFailed: 'Check failed, please retry.',
    saveError: 'Could not save your profile. Please retry.',
  },
} as const;

export function OwnProfileSection() {
  const { user, profile, refreshProfile } = useAuth();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const s = language === 'fr' ? STRINGS.fr : STRINGS.en;

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [country, setCountry] = useState<Country | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return UN_COUNTRIES;
    return UN_COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q);
  }, [countryQuery]);

  // Le profil est absent : rien n'est affiché (l'onboarding doit d'abord être terminé).
  if (!profile || !user) return null;

  const currentCountry = getCountry(profile.country_code);
  const countryLabel = currentCountry?.name ?? profile.country_code;

  const startEditing = () => {
    setFirstName(profile.first_name);
    setLastName(profile.last_name);
    setPseudo(profile.pseudo);
    setCountry(currentCountry);
    setFormError(null);
    setSuccessMessage(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setFormError(null);
    setPickerOpen(false);
  };

  const handleSave = async () => {
    if (submitting) return;
    setFormError(null);
    setSuccessMessage(null);

    const safeFirst = sanitizeName(firstName, NAME_MAX);
    const safeLast = sanitizeName(lastName, NAME_MAX);
    if (!safeFirst || !safeLast) {
      setFormError(s.requiredNames);
      return;
    }
    if (!country) {
      setFormError(s.requiredCountry);
      return;
    }
    const normalized = normalizePseudo(pseudo);
    if (validatePseudo(normalized) !== null) {
      setFormError(s.pseudoInvalid);
      return;
    }

    const pseudoChanged = normalized !== profile.pseudo;
    const patch: ProfilePatch = {};
    if (safeFirst !== profile.first_name) patch.first_name = safeFirst;
    if (safeLast !== profile.last_name) patch.last_name = safeLast;
    if (country.code !== profile.country_code) patch.country_code = country.code;
    if (pseudoChanged) patch.pseudo = normalized;

    if (Object.keys(patch).length === 0) {
      setEditing(false);
      return;
    }

    setSubmitting(true);
    try {
      if (pseudoChanged) {
        const { available, error: availabilityError } = await checkPseudoAvailable(normalized);
        if (availabilityError || available === null) {
          logger.error('[OwnProfile] pseudo check failed', { status: availabilityError?.status });
          setFormError(s.pseudoCheckFailed);
          return;
        }
        if (!available) {
          setFormError(s.pseudoTaken);
          return;
        }
      }

      const { error } = await updateOwnProfile(user.id, patch);
      if (error) {
        logger.error('[OwnProfile] update failed', { status: error.status, code: error.code });
        // 23505 : violation d'unicité, le pseudo vient d'être pris par un autre joueur.
        setFormError(error.code === '23505' ? s.pseudoTaken : s.saveError);
        return;
      }

      await refreshProfile();
      setEditing(false);
      setSuccessMessage(s.saved);
    } catch (err) {
      logger.error('[OwnProfile] unexpected failure', err);
      setFormError(s.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text },
  ];

  const rows: { label: string; value: string }[] = [
    { label: s.firstName, value: profile.first_name },
    { label: s.lastName, value: profile.last_name },
    { label: s.pseudo, value: `@${profile.pseudo}` },
    { label: s.country, value: countryLabel },
  ];

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{s.sectionTitle}</Text>
        {!editing ? (
          <Pressable onPress={startEditing} accessibilityRole="button" style={styles.editLink}>
            <Edit color={theme.colors.primary} size={16} />
            <Text style={[styles.editLinkText, { color: theme.colors.primary }]}>{s.edit}</Text>
          </Pressable>
        ) : null}
      </View>

      {!editing ? (
        <View style={styles.rows}>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.colors.textSecondary }]}>{row.label}</Text>
              <Text style={[styles.rowValue, { color: theme.colors.text }]}>{row.value}</Text>
            </View>
          ))}
          <Text style={[styles.privacy, { color: theme.colors.textSecondary }]}>{s.pseudoPrivacy}</Text>
          {successMessage ? (
            <Text style={[styles.success, { color: theme.colors.success }]} accessibilityLiveRegion="polite">
              {successMessage}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{s.firstName}</Text>
          <TextInput
            value={firstName}
            onChangeText={(v) => setFirstName(v.slice(0, NAME_MAX))}
            autoCapitalize="words"
            autoComplete="given-name"
            maxLength={NAME_MAX}
            style={inputStyle}
            placeholderTextColor={theme.colors.textSecondary}
            editable={!submitting}
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
            editable={!submitting}
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
            editable={!submitting}
          />
          <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>{s.pseudoHint}</Text>

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{s.country}</Text>
          <Pressable
            onPress={() => setPickerOpen(true)}
            accessibilityRole="button"
            disabled={submitting}
            style={[...inputStyle, styles.countryButton]}
          >
            <Text style={{ color: country ? theme.colors.text : theme.colors.textSecondary }}>
              {country ? country.name : s.countryPlaceholder}
            </Text>
          </Pressable>

          {formError ? (
            <Text style={[styles.error, { color: theme.colors.error }]} accessibilityLiveRegion="polite">
              {formError}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={cancelEditing}
              disabled={submitting}
              accessibilityRole="button"
              style={[styles.button, styles.secondaryButton, { borderColor: theme.colors.border }]}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text }]}>{s.cancel}</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={submitting}
              accessibilityRole="button"
              style={[
                styles.button,
                styles.primaryButton,
                { backgroundColor: theme.colors.primary, opacity: submitting ? 0.6 : 1 },
              ]}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>{submitting ? s.saving : s.save}</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rows: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 14,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  privacy: {
    fontSize: 12,
    marginTop: 4,
  },
  success: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  form: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  countryButton: {
    justifyContent: 'center',
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  error: {
    fontSize: 14,
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  primaryButton: {
    borderColor: 'transparent',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  flex: {
    flex: 1,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  closeButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
