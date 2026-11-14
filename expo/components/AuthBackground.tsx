import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ImageBackground, StyleSheet, type ImageSourcePropType } from 'react-native';

/**
 * Photo de fond de l'écran de connexion (photo de sport publique).
 *
 * Photo : `expo/assets/auth/sport-background.jpg` (salle de musculation en noir et blanc,
 * fournie par l'utilisateur). Une superposition sombre garantit la lisibilité du texte.
 * Si la valeur est remise à `null`, le fond redevient un dégradé sombre.
 */
export const AUTH_BACKGROUND_IMAGE_SOURCE: ImageSourcePropType | null = require('@/assets/auth/sport-background.jpg');

const GRADIENT_COLORS = ['#0B0F19', '#1B2230', '#0B0F19'] as const;
const OVERLAY_COLORS = ['rgba(11,15,25,0.45)', 'rgba(11,15,25,0.92)'] as const;

type AuthBackgroundProps = {
  children: React.ReactNode;
};

export function AuthBackground({ children }: AuthBackgroundProps) {
  if (AUTH_BACKGROUND_IMAGE_SOURCE) {
    return (
      <ImageBackground
        source={AUTH_BACKGROUND_IMAGE_SOURCE}
        style={styles.fill}
        resizeMode="cover"
      >
        <LinearGradient colors={OVERLAY_COLORS} style={styles.fill}>
          {children}
        </LinearGradient>
      </ImageBackground>
    );
  }

  return (
    <LinearGradient
      colors={GRADIENT_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.fill}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
