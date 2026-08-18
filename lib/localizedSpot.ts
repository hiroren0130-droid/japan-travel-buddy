import type {
  Spot,
  SpotTranslation,
} from "@/data/types";
import { kyotoSpotTranslationsEn } from "@/data/locales/en/kyoto";
import type { Locale } from "@/lib/locale";

function getSpotTranslation(
  spot: Spot,
  locale: Locale
): SpotTranslation | undefined {
  if (locale !== "en") {
    return undefined;
  }

  return kyotoSpotTranslationsEn[spot.id];
}

function localizedValue(
  translatedValue: string | undefined,
  fallbackValue: string
): string {
  const normalizedTranslation =
    translatedValue?.trim();

  return normalizedTranslation || fallbackValue;
}

export function getLocalizedSpotName(
  spot: Spot,
  locale: Locale
): string {
  return localizedValue(
    getSpotTranslation(spot, locale)?.name,
    spot.name
  );
}

export function getLocalizedSpotDescription(
  spot: Spot,
  locale: Locale
): string {
  return localizedValue(
    getSpotTranslation(spot, locale)?.description,
    spot.description
  );
}

export function getLocalizedSpotArea(
  spot: Spot,
  locale: Locale
): string {
  return localizedValue(
    getSpotTranslation(spot, locale)?.area,
    spot.area
  );
}

export function getLocalizedSpotCategory(
  spot: Spot,
  locale: Locale
): string {
  return localizedValue(
    getSpotTranslation(spot, locale)?.category,
    spot.category
  );
}

export function getLocalizedSpotAddress(
  spot: Spot,
  locale: Locale
): string | undefined {
  if (!spot.address) {
    return undefined;
  }

  return localizedValue(
    getSpotTranslation(spot, locale)?.address,
    spot.address
  );
}

export function getLocalizedSpotHours(
  spot: Spot,
  locale: Locale
): string | undefined {
  if (!spot.hours) {
    return undefined;
  }

  if (locale !== "en") {
    return spot.hours;
  }

  const translatedHours =
    getSpotTranslation(spot, locale)?.hours?.trim();

  if (translatedHours) {
    return translatedHours;
  }

  if (spot.hours.trim() === "24時間") {
    return "Open 24 hours";
  }

  return spot.hours.replaceAll("〜", "–");
}

export function getLocalizedSpotPrice(
  spot: Spot,
  locale: Locale
): string | undefined {
  if (!spot.price) {
    return undefined;
  }

  return localizedValue(
    getSpotTranslation(spot, locale)?.price,
    spot.price
  );
}
