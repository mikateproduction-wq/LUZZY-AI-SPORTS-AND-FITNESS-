import { describe, expect, test } from 'bun:test';

import {
  getBreakpoint,
  getGridItemWidth,
  getPhoneClass,
  getResponsiveLayout,
  scaleFont,
} from '@/lib/responsive';

describe('breakpoints', () => {
  test('téléphones et tablettes aux seuils iOS et Android', () => {
    expect(getBreakpoint(320)).toBe('compact');
    expect(getBreakpoint(430)).toBe('compact');
    expect(getBreakpoint(599)).toBe('compact');
    expect(getBreakpoint(600)).toBe('medium');
    expect(getBreakpoint(834)).toBe('medium');
    expect(getBreakpoint(839)).toBe('medium');
    expect(getBreakpoint(840)).toBe('expanded');
    expect(getBreakpoint(1024)).toBe('expanded');
  });

  test('sous-classes téléphone', () => {
    expect(getPhoneClass(320)).toBe('xs');
    expect(getPhoneClass(360)).toBe('sm');
    expect(getPhoneClass(375)).toBe('sm');
    expect(getPhoneClass(390)).toBe('md');
    expect(getPhoneClass(393)).toBe('md');
    expect(getPhoneClass(430)).toBe('lg');
    expect(getPhoneClass(440)).toBe('lg');
  });
});

describe('getResponsiveLayout', () => {
  test('iPhone SE 1re génération (320 x 568) : petit écran, marge réduite, police réduite', () => {
    const layout = getResponsiveLayout(320, 568);
    expect(layout.breakpoint).toBe('compact');
    expect(layout.phoneClass).toBe('xs');
    expect(layout.horizontalPadding).toBe(12);
    expect(layout.contentMaxWidth).toBeNull();
    expect(layout.fontScale).toBe(0.9);
    expect(layout.isTablet).toBe(false);
    expect(layout.columns).toBe(2);
  });

  test('iPhone 15 (393 x 852) : mobile standard, pas de limite de largeur', () => {
    const layout = getResponsiveLayout(393, 852);
    expect(layout.phoneClass).toBe('md');
    expect(layout.horizontalPadding).toBe(16);
    expect(layout.contentMaxWidth).toBeNull();
    expect(layout.isLandscape).toBe(false);
  });

  test('iPad Air portrait (820 x 1180) : tablette medium, contenu limité', () => {
    const layout = getResponsiveLayout(820, 1180);
    expect(layout.breakpoint).toBe('medium');
    expect(layout.isTablet).toBe(true);
    expect(layout.columns).toBe(3);
    expect(layout.contentMaxWidth).toBe(720);
    expect(layout.horizontalPadding).toBe(24);
  });

  test('iPad Pro 12,9 paysage (1366 x 1024) : expanded, 4 colonnes, police plafonnée', () => {
    const layout = getResponsiveLayout(1366, 1024);
    expect(layout.breakpoint).toBe('expanded');
    expect(layout.isLandscape).toBe(true);
    expect(layout.columns).toBe(4);
    expect(layout.contentMaxWidth).toBe(960);
    expect(layout.fontScale).toBe(1.15);
  });

  test('téléphone paysage : détecté comme paysage', () => {
    const layout = getResponsiveLayout(844, 390);
    expect(layout.isLandscape).toBe(true);
  });

  test('dimensions négatives ou nulles ramenées à zéro sans erreur', () => {
    const layout = getResponsiveLayout(-10, 0);
    expect(layout.width).toBe(0);
    expect(layout.breakpoint).toBe('compact');
  });
});

describe('scaleFont', () => {
  test('la police suit la largeur et reste bornée', () => {
    expect(scaleFont(16, getResponsiveLayout(375, 812))).toBe(16);
    expect(scaleFont(16, getResponsiveLayout(320, 568))).toBe(14.5);
    expect(scaleFont(16, getResponsiveLayout(1366, 1024))).toBe(18.5);
  });
});

describe('getGridItemWidth', () => {
  test('deux colonnes sur 375 pt avec marge et espace', () => {
    // 375 - 16 * 2 marges = 343 ; espace 12 ; (343 - 12) / 2 = 165.5 -> 165
    expect(getGridItemWidth(343, 2, 12)).toBe(165);
  });

  test('une colonne ne subit aucun espace', () => {
    expect(getGridItemWidth(300, 1, 12)).toBe(300);
  });

  test('colonnes invalides ramenées à une', () => {
    expect(getGridItemWidth(300, 0, 12)).toBe(300);
  });
});
