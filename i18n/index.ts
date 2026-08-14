import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import et from "./et.json";
import fr from "./fr.json";
import ru from "./ru.json";

const LANGUAGE_KEY = "kazione-language";
const SUPPORTED = ["en", "fr", "et", "ru"] as const;
export type AppLanguage = (typeof SUPPORTED)[number];

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  et: { translation: et },
  ru: { translation: ru },
};

let initialized = false;

/** First matching device preferred language, else English — same idea as web `detectLocale`. */
export function detectDeviceLanguage(): AppLanguage {
  try {
    for (const locale of getLocales()) {
      const code = (locale.languageCode ?? locale.languageTag?.slice(0, 2) ?? "")
        .toLowerCase();
      if ((SUPPORTED as readonly string[]).includes(code)) {
        return code as AppLanguage;
      }
    }
  } catch {
    // Expo Go / tests without native module
  }
  return "en";
}

export async function initI18n() {
  if (initialized) return i18n;

  const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
  const lng: AppLanguage =
    stored && (SUPPORTED as readonly string[]).includes(stored)
      ? (stored as AppLanguage)
      : detectDeviceLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

  initialized = true;
  return i18n;
}

export { i18n };
export { useTranslation, Trans } from "react-i18next";
export const t = i18n.t.bind(i18n);

export async function setStoredLanguage(lang: string) {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}
