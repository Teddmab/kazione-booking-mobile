export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const LOCALE_MAP: Record<string, string> = {
  en: "en-GB",
  fr: "fr-FR",
  et: "et-EE",
};

export function localeForLanguage(lang: string): string {
  const code = lang.split("-")[0];
  return LOCALE_MAP[code] ?? "en-GB";
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
