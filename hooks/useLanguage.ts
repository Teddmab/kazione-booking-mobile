import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { setStoredLanguage } from '@/i18n';

const LANGUAGE_KEY = 'kazione-language';

export function useLanguage() {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState(i18n.language || 'en');

  useEffect(() => {
    setLanguageState(i18n.language || "en");
    const onChange = (lng: string) => setLanguageState(lng);
    i18n.on("languageChanged", onChange);
    return () => {
      i18n.off("languageChanged", onChange);
    };
  }, [i18n]);

  const setLanguage = useCallback(async (lang: string) => {
    await setStoredLanguage(lang);
    setLanguageState(lang);
  }, []);

  return { language, setLanguage };
}
