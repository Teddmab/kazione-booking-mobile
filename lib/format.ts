const LOCALE_MAP: Record<string, string> = {
  en: "en-GB",
  fr: "fr-FR",
  et: "et-EE",
  ru: "ru-RU",
};

export function localeForLanguage(lang: string): string {
  const code = lang.split("-")[0];
  return LOCALE_MAP[code] ?? "en-GB";
}

export function formatCurrency(
  amount: number,
  currency = "EUR",
  language = "en",
): string {
  return new Intl.NumberFormat(localeForLanguage(language), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTime(iso: string, language = "en"): string {
  return new Date(iso).toLocaleTimeString(localeForLanguage(language), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string, language = "en"): string {
  return new Date(iso).toLocaleDateString(localeForLanguage(language), {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatDateLong(d: Date, language = "en"): string {
  return d.toLocaleDateString(localeForLanguage(language), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function clientDisplayName(
  first: string,
  last: string,
): string {
  return [first, last].filter(Boolean).join(" ").trim() || "—";
}
