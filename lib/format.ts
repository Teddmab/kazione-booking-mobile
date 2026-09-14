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

/**
 * Appointment timestamps are genuine UTC (S59). Format in the business
 * timezone so staff see salon wall-clock time — same as web `fmtTime(iso, tz)`.
 */
export function formatTime(
  iso: string,
  language = "en",
  timeZone = "Europe/Tallinn",
): string {
  return new Date(iso).toLocaleTimeString(localeForLanguage(language), {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
}

export function formatDate(
  iso: string,
  language = "en",
  timeZone = "Europe/Tallinn",
): string {
  return new Date(iso).toLocaleDateString(localeForLanguage(language), {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone,
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

/** Relative timestamp for notification lists (matches web staff notifs). */
export function formatRelativeTime(iso: string, language = "en"): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  return new Date(iso).toLocaleDateString(localeForLanguage(language), {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
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
