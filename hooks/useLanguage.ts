import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

import { setStoredLanguage } from '@/i18n';

const LANGUAGE_KEY = 'kazione-language';

export function useLanguage() {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState(i18n.language || 'en');

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY).then((stored) => {
      if (stored) setLanguageState(stored);
    });
  }, []);

  const setLanguage = useCallback(async (lang: string) => {
    await setStoredLanguage(lang);
    setLanguageState(lang);
  }, []);

  return { language, setLanguage };
}
