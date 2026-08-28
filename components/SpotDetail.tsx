"use client";

import Link from "next/link";

import { useLocale } from "@/components/LocaleProvider";
import SpotImage from "@/components/SpotImage";
import type { Spot } from "@/data/types";
import {
  getLocalizedSpotAddress,
  getLocalizedSpotArea,
  getLocalizedSpotCategory,
  getLocalizedSpotDescription,
  getLocalizedSpotHours,
  getLocalizedSpotName,
  getLocalizedSpotPrice,
} from "@/lib/localizedSpot";
import { getSpotImageCredit } from "@/lib/spotImageCredits";

export default function SpotDetail({
  spot,
}: {
  spot: Spot;
}) {
  const { locale, messages } = useLocale();
  const spotDetailMessages = messages.spotDetail;
  const localizedName =
    getLocalizedSpotName(spot, locale);
  const localizedAddress =
    getLocalizedSpotAddress(spot, locale);
  const localizedHours =
    getLocalizedSpotHours(spot, locale);
  const localizedPrice =
    getLocalizedSpotPrice(spot, locale);
  const imageCredit = getSpotImageCredit(spot.id);

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8">
      <Link
        href={`/discover/${spot.prefectureId}`}
        className="mb-6 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
      >
        {spotDetailMessages.backToSpots}
      </Link>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-lg">
        <div className="relative h-80 w-full">
          <SpotImage
            src={spot.image}
            alt={localizedName}
            spotName={spot.name}
            spotId={spot.id}
            latitude={spot.latitude}
            longitude={spot.longitude}
          />
        </div>

        {imageCredit && (
          <div className="border-t bg-gray-50 px-8 py-2 text-right text-xs text-gray-600">
            <Link
              href={`/image-credits#${spot.id}`}
              className="font-medium hover:text-blue-600 hover:underline"
            >
              {locale === "en" ? "Photo credit" : "画像クレジット"}
            </Link>
          </div>
        )}

        <div className="p-8">
          <h1 className="text-4xl font-bold">
            {spotDetailMessages.namePrefix}
            {localizedName}
          </h1>

          <p className="mt-2 text-gray-500">
            {getLocalizedSpotArea(spot, locale)}
            {spotDetailMessages.metadataSeparator}
            {getLocalizedSpotCategory(spot, locale)}
          </p>

          {spot.rating != null && (
            <p className="mt-4 text-lg">
              {spotDetailMessages.ratingPrefix}
              {spot.rating}
              {spotDetailMessages.ratingSuffix}
            </p>
          )}

          <p className="mt-6 leading-8 text-gray-700">
            {getLocalizedSpotDescription(spot, locale)}
          </p>

          <div className="mt-8 grid gap-3 rounded-xl bg-gray-50 p-6">
            {localizedAddress && (
              <div>
                {spotDetailMessages.addressPrefix}
                <strong>{spotDetailMessages.addressLabel}</strong>
                {localizedAddress}
              </div>
            )}

            {localizedHours && (
              <div>
                {spotDetailMessages.hoursPrefix}
                <strong>{spotDetailMessages.hoursLabel}</strong>
                {localizedHours}
              </div>
            )}

            {localizedPrice && (
              <div>
                {spotDetailMessages.pricePrefix}
                <strong>{spotDetailMessages.priceLabel}</strong>
                {localizedPrice}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                spot.name
              )}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-blue-600 px-5 py-3 text-white"
            >
              {spotDetailMessages.googleMapsLabel}
            </a>

            {spot.website && (
              <a
                href={spot.website}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border px-5 py-3"
              >
                {spotDetailMessages.officialWebsiteLabel}
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
