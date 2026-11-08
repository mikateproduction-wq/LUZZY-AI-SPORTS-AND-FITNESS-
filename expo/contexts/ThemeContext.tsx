import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';

import { DEFAULT_THEME, THEMES } from '@/constants/themes';
import { Theme } from '@/types/fitness';
import { logger } from '@/utils/logger';

const THEME_STORAGE_KEY = '@fitness_theme';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(true);
  const themeOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    void loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedThemeId = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedThemeId && THEMES[savedThemeId]) {
        setTheme(THEMES[savedThemeId]);
      }
    } catch (error) {
      logger.error('[Theme] loading error', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeTheme = useCallback(async (themeId: string) => {
    try {
      if (THEMES[themeId]) {
        Animated.sequence([
          Animated.timing(themeOpacity, {
            toValue: 0.55,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.timing(themeOpacity, {
            toValue: 1,
            duration: 260,
            useNativeDriver: true,
          }),
        ]).start();

        setTimeout(() => {
          setTheme(THEMES[themeId]);
        }, 90);

        await AsyncStorage.setItem(THEME_STORAGE_KEY, themeId);
      }
    } catch (error) {
      logger.error('[Theme] saving error', error);
    }
  }, [themeOpacity]);

  return useMemo(() => ({
    theme,
    changeTheme,
    isLoading,
    availableThemes: Object.values(THEMES),
    themeOpacity,
  }), [changeTheme, isLoading, theme, themeOpacity]);
});
