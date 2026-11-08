import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { DEFAULT_LANGUAGE, LanguageCode, LANGUAGES, t } from '@/constants/i18n';
import { logger } from '@/utils/logger';

const LANGUAGE_STORAGE_KEY = '@fitness_language';

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [language, setLanguage] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    void loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved && LANGUAGES.some((l) => l.code === saved)) {
        setLanguage(saved as LanguageCode);
      }
    } catch (error) {
      logger.error('[Language] loading error', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = useCallback(async (code: LanguageCode) => {
    try {
      setLanguage(code);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      logger.log('[Language] changed', code);
    } catch (error) {
      logger.error('[Language] saving error', error);
    }
  }, []);

  const languageLabel = useMemo(() => {
    return LANGUAGES.find((l) => l.code === language)?.label ?? language;
  }, [language]);

  const translate = useCallback(
    (key: Parameters<typeof t>[0], vars?: Parameters<typeof t>[2]) => {
      return t(key, language, vars);
    },
    [language]
  );

  return {
    language,
    languageLabel,
    changeLanguage,
    isLoading,
    availableLanguages: LANGUAGES,
    t: translate,
  };
});
