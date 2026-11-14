import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  deleteAccount,
  matchesExpected,
  type AccountDeletionFailure,
} from '@/lib/accountDeletion';
import { clearSession } from '@/lib/authSession';
import { logger } from '@/utils/logger';

/** Textes de la suppression de compte. Français et anglais ; les autres langues suivent l'anglais. */
const STRINGS = {
  fr: {
    title: 'Supprimer mon compte',
    warning:
      'Cette action est définitive et irréversible. Elle efface votre profil, votre pseudo (qui redevient disponible), votre XP et l\'historique lié à votre compte. Certaines données peuvent être conservées temporairement lorsque la loi l\'exige.',
    intro: 'Pour confirmer, retapez exactement votre prénom, votre nom et l\'adresse email de votre compte.',
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'Adresse email du compte',
    emailUnavailable:
      'Impossible de vérifier votre adresse email sur cet appareil. Reconnectez-vous puis réessayez.',
    cancel: 'Annuler',
    confirm: 'Supprimer définitivement',
    submitting: 'Suppression…',
    errNetwork: 'Connexion impossible. Vérifiez votre réseau puis réessayez.',
    errMismatch: 'Les informations saisies ne correspondent pas à votre compte. Vérifiez-les et réessayez.',
    errUnauthorized: 'Votre session a expiré. Reconnectez-vous puis réessayez.',
    errServer: 'La suppression a échoué côté serveur. Réessayez plus tard.',
    successTitle: 'Compte supprimé',
    successBody: 'Votre compte et les données associées ont été supprimés. Vous êtes déconnecté.',
    close: 'Fermer',
  },
  en: {
    title: 'Delete my account',
    warning:
      'This action is permanent and cannot be undone. It erases your profile, your pseudo (which becomes available again), your XP and the history linked to your account. Some data may be kept temporarily where the law requires it.',
    intro: 'To confirm, type exactly your first name, last name and the email address of your account.',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Account email address',
    emailUnavailable:
      'Your email address cannot be verified on this device. Sign in again and retry.',
    cancel: 'Cancel',
    confirm: 'Delete permanently',
    submitting: 'Deleting…',
    errNetwork: 'Connection failed. Check your network and retry.',
    errMismatch: 'The details entered do not match your account. Check them and retry.',
    errUnauthorized: 'Your session has expired. Sign in again and retry.',
    errServer: 'Deletion failed on the server. Please retry later.',
    successTitle: 'Account deleted',
    successBody: 'Your account and related data have been deleted. You are signed out.',
    close: 'Close',
  },
} as const;

type Strings = (typeof STRINGS)['fr'] | (typeof STRINGS)['en'];

export interface DeleteAccountExpected {
  firstName: string;
  lastName: string;
  /** Null si l'email n'est pas lisible sur l'appareil : la suppression reste bloquée côté interface. */
  email: string | null;
}

interface DeleteAccountModalProps {
  visible: boolean;
  expected: DeleteAccountExpected;
  onClose: () => void;
  /** Appelé quand l'utilisateur ferme le message de succès. La déconnexion complète se fait ici. */
  onFinished: () => void;
}

type Phase = 'form' | 'submitting' | 'success';

function failureMessage(s: Strings, reason: AccountDeletionFailure): string {
  switch (reason) {
    case 'network':
      return s.errNetwork;
    case 'confirmation_mismatch':
      return s.errMismatch;
    case 'unauthorized':
      return s.errUnauthorized;
    case 'server':
      return s.errServer;
  }
}

export function DeleteAccountModal({ visible, expected, onClose, onFinished }: DeleteAccountModalProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const s: Strings = language === 'fr' ? STRINGS.fr : STRINGS.en;

  const [firstInput, setFirstInput] = useState('');
  const [lastInput, setLastInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Réinitialise le formulaire à chaque ouverture : aucune saisie ne reste en mémoire après fermeture.
  useEffect(() => {
    if (visible) {
      setFirstInput('');
      setLastInput('');
      setEmailInput('');
      setPhase('form');
      setErrorMessage(null);
    }
  }, [visible]);

  const emailKnown = expected.email !== null && expected.email.length > 0;
  const matches =
    emailKnown &&
    matchesExpected(firstInput, expected.firstName) &&
    matchesExpected(lastInput, expected.lastName) &&
    matchesExpected(emailInput, expected.email ?? '');
  const busy = phase === 'submitting';
  const canConfirm = matches && !busy;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setErrorMessage(null);
    setPhase('submitting');
    const result = await deleteAccount({
      firstName: firstInput,
      lastName: lastInput,
      email: emailInput,
    });
    if (!result.ok) {
      setErrorMessage(failureMessage(s, result.reason));
      setPhase('form');
      return;
    }
    // Le serveur a supprimé le compte : le jeton local n'a plus de sens.
    try {
      await clearSession();
    } catch (err) {
      logger.error('[DeleteAccount] local session clear failed', err);
    }
    setPhase('success');
  };

  const handleFinished = () => {
    onFinished();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={busy ? undefined : onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={busy ? undefined : onClose} />
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {phase === 'success' ? (
            <>
              <Text style={[styles.title, { color: theme.colors.text }]}>{s.successTitle}</Text>
              <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{s.successBody}</Text>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleFinished}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmText}>{s.close}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={[styles.title, { color: theme.colors.error }]}>{s.title}</Text>
              <Text style={[styles.body, { color: theme.colors.text }]}>{s.warning}</Text>
              <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{s.intro}</Text>

              <Text style={[styles.label, { color: theme.colors.text }]}>{s.firstName}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                value={firstInput}
                onChangeText={setFirstInput}
                editable={!busy}
                autoCorrect={false}
                autoCapitalize="words"
              />

              <Text style={[styles.label, { color: theme.colors.text }]}>{s.lastName}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                value={lastInput}
                onChangeText={setLastInput}
                editable={!busy}
                autoCorrect={false}
                autoCapitalize="words"
              />

              <Text style={[styles.label, { color: theme.colors.text }]}>{s.email}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                value={emailInput}
                onChangeText={setEmailInput}
                editable={!busy && emailKnown}
                autoCorrect={false}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
              />

              {!emailKnown ? (
                <Text style={[styles.body, { color: theme.colors.error }]}>{s.emailUnavailable}</Text>
              ) : null}

              {errorMessage ? (
                <Text style={[styles.body, { color: theme.colors.error, fontWeight: '600' }]}>{errorMessage}</Text>
              ) : null}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                  onPress={onClose}
                  disabled={busy}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.buttonText, { color: theme.colors.text }]}>{s.cancel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.confirmButton,
                    { backgroundColor: canConfirm ? theme.colors.error : theme.colors.border },
                  ]}
                  onPress={handleConfirm}
                  disabled={!canConfirm}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmText}>{busy ? s.submitting : s.confirm}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    maxHeight: '85%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 6,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  confirmButton: {
    borderColor: 'transparent',
    marginTop: 16,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
