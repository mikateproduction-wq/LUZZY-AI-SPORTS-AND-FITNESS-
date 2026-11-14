import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

/** Textes de la confirmation de déconnexion. Français et anglais ; les autres langues suivent l'anglais. */
const STRINGS = {
  fr: {
    title: 'Se déconnecter ?',
    message: 'Vous devrez vous reconnecter avec Google pour accéder à votre compte.',
    cancel: 'Annuler',
    confirm: 'Se déconnecter',
    busy: 'Déconnexion…',
  },
  en: {
    title: 'Sign out?',
    message: 'You will need to sign in with Google again to access your account.',
    cancel: 'Cancel',
    confirm: 'Sign out',
    busy: 'Signing out…',
  },
} as const;

interface ConfirmSignOutModalProps {
  visible: boolean;
  busy: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmSignOutModal({
  visible,
  busy,
  errorMessage,
  onCancel,
  onConfirm,
}: ConfirmSignOutModalProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const s = language === 'fr' ? STRINGS.fr : STRINGS.en;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={busy ? undefined : onCancel} />
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{s.title}</Text>
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{s.message}</Text>

          {errorMessage ? (
            <Text style={[styles.error, { color: theme.colors.error }]}>{errorMessage}</Text>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
              onPress={onCancel}
              disabled={busy}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text }]}>{s.cancel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton, { backgroundColor: theme.colors.primary }]}
              onPress={onConfirm}
              disabled={busy}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmText}>{busy ? s.busy : s.confirm}</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
  error: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
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
