"use client";

import Link from "next/link";

import { useLocale } from "@/components/LocaleProvider";
import SpotImage from "@/components/SpotImage";
import type { Spot } from "@/data/types";
import {
  getLocalizedSpotArea,
  getLocalizedSpotCategory,
  getLocalizedSpotDescription,
  getLocalizedSpotName,
} from "@/lib/localizedSpot";

type Props = {
  spot: Spot;
  selectable?: boolean;
  selected?: boolean;
  onSelectionChange?: () => void;
};

export default function SpotSummaryCard({
  spot,
  selectable = false,
  selected = false,
  onSelectionChange,
}: Props) {
  const { locale, messages } = useLocale();
  const localizedName = getLocalizedSpotName(
    spot,
    locale
  );

  return (
    <article
      className={`
        group
        min-w-0
        overflow-hidden
        rounded-3xl
        border
        bg-white
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-xl
        ${
          selected
            ? "border-blue-500 ring-2 ring-blue-200"
            : "border-slate-200"
        }
      `}
    >
      <Link
        href={`/spots/${spot.id}`}
        className="block min-w-0"
      >
        <div className="h-56 w-full overflow-hidden">
          <SpotImage
            src={spot.image}
            alt={localizedName}
            spotName={spot.name}
            spotId={spot.id}
            latitude={spot.latitude}
            longitude={spot.longitude}
            className="transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="min-w-0 p-5 pb-3">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <h3 className="min-w-0 break-words text-xl font-extrabold text-slate-950">
              {localizedName}
            </h3>

            <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
              {getLocalizedSpotCategory(spot, locale)}
            </span>
          </div>

          <p className="mt-2 break-words text-sm font-semibold text-slate-500">
            {messages.spotsPage.areaPrefix}
            {getLocalizedSpotArea(spot, locale)}
          </p>

          <p className="mt-4 line-clamp-1 break-words text-sm leading-6 text-slate-600">
            {getLocalizedSpotDescription(spot, locale)}
          </p>

          <div className="mt-5 text-sm font-bold text-blue-600">
            {messages.spotsPage.detailLink}
          </div>
        </div>
      </Link>

      {selectable && (
        <div className="px-5 pb-5">
          <button
            type="button"
            aria-pressed={selected}
            onClick={onSelectionChange}
            className={`w-full rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
              selected
                ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            {selected
              ? locale === "en"
                ? "♥ Selected"
                : "♥ 選択中"
              : locale === "en"
                ? "♡ Want to go"
                : "♡ 行きたい"}
          </button>
        </div>
      )}
    </article>
  );
}
