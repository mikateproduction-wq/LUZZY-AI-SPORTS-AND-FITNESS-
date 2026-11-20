import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { getResponsiveLayout, type ResponsiveLayout } from '@/lib/responsive';

/**
 * Lit la taille réelle de la fenêtre et renvoie la mise en page correspondante.
 * `useWindowDimensions` se met à jour à la rotation, au multifenêtrage iPad,
 * au pliage/dépliage d'un téléphone pliable et au redimensionnement du navigateur.
 */
export function useResponsive(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();
  return useMemo(() => getResponsiveLayout(width, height), [width, height]);
}
