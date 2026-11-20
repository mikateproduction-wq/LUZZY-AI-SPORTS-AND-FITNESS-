/**
 * Système responsive unique de l'application.
 *
 * Toutes les largeurs sont en points logiques (pt iOS, dp Android), c'est-à-dire
 * l'unité que React Native fournit. Une seule fonction pure décide de la classe
 * d'écran, pour que tous les écrans appliquent les mêmes règles.
 *
 * Classes de taille (largeur de la fenêtre) :
 *   - compact  : < 600 pt   téléphones (portrait, et paysage des petits modèles)
 *   - medium   : 600 à 839  tablettes 7-11 pouces, pliables dépliés, iPad mini / Air / Pro 11
 *   - expanded : >= 840     grandes tablettes (iPad Pro 12,9, Android 12 pouces et plus)
 *
 * Sous-classe téléphone (pour adapter les très petits et grands modèles) :
 *   - xs : < 360 pt   (iPhone SE 1re génération, 320 pt)
 *   - sm : 360 à 389  (iPhone SE 2/3, 375 pt ; Android 360 pt)
 *   - md : 390 à 429  (iPhone 12 à 16, 390 à 402 pt ; Pixel 393 pt)
 *   - lg : >= 430     (iPhone Plus / Pro Max, 414 à 440 pt ; Android 412 pt et plus)
 */

export type Breakpoint = 'compact' | 'medium' | 'expanded';
export type PhoneClass = 'xs' | 'sm' | 'md' | 'lg';

export interface ResponsiveLayout {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  phoneClass: PhoneClass;
  isLandscape: boolean;
  isTablet: boolean;
  /** Nombre de colonnes conseillé pour les grilles de cartes. */
  columns: number;
  /** Marge horizontale de contenu. */
  horizontalPadding: number;
  /** Largeur maximale du contenu (null = pleine largeur). */
  contentMaxWidth: number | null;
  /** Facteur appliqué aux tailles de texte, borné pour rester lisible. */
  fontScale: number;
}

export const MEDIUM_MIN_WIDTH = 600;
export const EXPANDED_MIN_WIDTH = 840;
export const REFERENCE_WIDTH = 375;
export const FONT_SCALE_MIN = 0.9;
export const FONT_SCALE_MAX = 1.15;

export function getBreakpoint(width: number): Breakpoint {
  if (width >= EXPANDED_MIN_WIDTH) return 'expanded';
  if (width >= MEDIUM_MIN_WIDTH) return 'medium';
  return 'compact';
}

export function getPhoneClass(width: number): PhoneClass {
  if (width < 360) return 'xs';
  if (width < 390) return 'sm';
  if (width < 430) return 'md';
  return 'lg';
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getResponsiveLayout(width: number, height: number): ResponsiveLayout {
  const safeWidth = Math.max(0, width);
  const safeHeight = Math.max(0, height);
  const breakpoint = getBreakpoint(safeWidth);
  const phoneClass = getPhoneClass(safeWidth);

  const columns = breakpoint === 'expanded' ? 4 : breakpoint === 'medium' ? 3 : 2;

  let horizontalPadding: number;
  if (breakpoint === 'compact') {
    horizontalPadding = phoneClass === 'xs' ? 12 : phoneClass === 'lg' ? 20 : 16;
  } else {
    horizontalPadding = breakpoint === 'medium' ? 24 : 32;
  }

  const contentMaxWidth = breakpoint === 'expanded' ? 960 : breakpoint === 'medium' ? 720 : null;

  return {
    width: safeWidth,
    height: safeHeight,
    breakpoint,
    phoneClass,
    isLandscape: safeWidth > safeHeight,
    isTablet: safeWidth >= MEDIUM_MIN_WIDTH,
    columns,
    horizontalPadding,
    contentMaxWidth,
    fontScale: clamp(safeWidth / REFERENCE_WIDTH, FONT_SCALE_MIN, FONT_SCALE_MAX),
  };
}

/** Taille de police adaptée à la largeur de l'écran, arrondie au demi-point. */
export function scaleFont(size: number, layout: Pick<ResponsiveLayout, 'fontScale'>): number {
  return Math.round(size * layout.fontScale * 2) / 2;
}

/**
 * Largeur d'une carte dans une grille à `columns` colonnes, espaces inclus.
 * Retourne une largeur exacte pour éviter les débordements sur petits écrans.
 */
export function getGridItemWidth(
  containerWidth: number,
  columns: number,
  gap: number,
): number {
  const cols = Math.max(1, Math.floor(columns));
  const available = containerWidth - gap * (cols - 1);
  return Math.floor(available / cols);
}
