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
    <main className="min-h-screen bg-blue-50 bg-gradient-to-br from-slate-50 via-white to-blue-100 px-4 py-8 text-slate-900 [color-scheme:light] sm:px-8">
      <div className="mx-auto max-w-5xl [overflow-wrap:anywhere]">
        <Link
          href={`/discover/${spot.prefectureId}`}
          className="mb-6 inline-block rounded text-sm font-semibold text-blue-700 hover:text-blue-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
        >
          {spotDetailMessages.backToSpots}
        </Link>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-lg shadow-blue-900/5">
          <div className="relative h-80 w-full">
            <SpotImage
              loading="eager"
              src={spot.image}
              alt={localizedName}
              spotName={spot.name}
              spotId={spot.id}
              latitude={spot.latitude}
              longitude={spot.longitude}
            />
          </div>

          {imageCredit && (
            <div className="border-t border-slate-200 bg-slate-50 px-5 py-2 text-right text-xs text-slate-600 sm:px-8">
              <Link
                href={`/image-credits#${spot.id}`}
                className="rounded font-medium hover:text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
              >
                {locale === "en" ? "Photo credit" : "画像クレジット"}
              </Link>
            </div>
          )}

          <div className="p-5 sm:p-8">
            <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">
              {spotDetailMessages.namePrefix}
              {localizedName}
            </h1>

            <p className="mt-2 text-slate-600">
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

            <p className="mt-6 leading-8 text-slate-700">
              {getLocalizedSpotDescription(spot, locale)}
            </p>

            <div className="mt-8 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-6">
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
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
              >
                {spotDetailMessages.googleMapsLabel}
              </a>

              {spot.website && (
                <a
                  href={spot.website}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-blue-200 bg-white px-5 py-3 font-semibold text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
                >
                  {spotDetailMessages.officialWebsiteLabel}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
