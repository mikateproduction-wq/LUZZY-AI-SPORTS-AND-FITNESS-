import React from 'react';
import Svg, { Path } from 'react-native-svg';

import {
  GOOGLE_ICON,
  MONO_BRAND_ICONS,
  type MonoBrandName,
} from '@/constants/brandIcons';

export type BrandName = MonoBrandName | 'google';

type BrandIconProps = {
  name: BrandName;
  size?: number;
  /** Couleur des logos monochromes (ignorée pour le G Google, multicolore). */
  color?: string;
};

/**
 * Logo officiel d'une marque. Le G Google est rendu en quatre couleurs
 * (charte Google) ; les autres logos sont monochromes et prennent `color`.
 */
export function BrandIcon({ name, size = 24, color = '#FFFFFF' }: BrandIconProps) {
  if (name === 'google') {
    const [, , vbWidth, vbHeight] = GOOGLE_ICON.viewBox.split(' ').map(Number);
    const height = (size * vbHeight) / vbWidth;
    return (
      <Svg width={size} height={height} viewBox={GOOGLE_ICON.viewBox}>
        {GOOGLE_ICON.paths.map((p) => (
          <Path key={p.fill} fill={p.fill} d={p.d} />
        ))}
      </Svg>
    );
  }

  const icon = MONO_BRAND_ICONS[name];
  return (
    <Svg width={size} height={size} viewBox={icon.viewBox}>
      <Path fill={color} d={icon.d} />
    </Svg>
  );
}
