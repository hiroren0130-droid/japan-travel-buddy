export const SUPPORTED_LOCALES = ["ja", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ja";

export type LocaleRecord<T> = Record<Locale, T>;

const LOCALE_LABELS: LocaleRecord<string> = {
  ja: "日本語",
  en: "English",
};

const INTL_LOCALES: LocaleRecord<string> = {
  ja: "ja-JP",
  en: "en-US",
};

export function isSupportedLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    SUPPORTED_LOCALES.some((locale) => locale === value)
  );
}

export function normalizeLocale(
  value: unknown,
  fallback: Locale = DEFAULT_LOCALE,
): Locale {
  return isSupportedLocale(value) ? value : fallback;
}

export function getLocaleLabel(locale: Locale): string {
  return LOCALE_LABELS[locale];
}

export function getIntlLocale(locale: Locale): string {
  return INTL_LOCALES[locale];
}
