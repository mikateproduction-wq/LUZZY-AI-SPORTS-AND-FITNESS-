import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';

interface ResponsiveFrameProps {
  children: React.ReactNode;
}

/**
 * Cadre racine : sur téléphone, le contenu occupe toute la largeur.
 * Sur tablette, il est limité à une largeur lisible et centré, pour éviter
 * des lignes de texte et des cartes démesurées sur iPad et grandes tablettes.
 */
export function ResponsiveFrame({ children }: ResponsiveFrameProps) {
  const { contentMaxWidth } = useResponsive();
  const { theme } = useTheme();

  return (
    <View style={[styles.outer, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.inner, contentMaxWidth ? { maxWidth: contentMaxWidth } : null]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
  },
});
