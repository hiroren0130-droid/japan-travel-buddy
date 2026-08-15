"use client";

import Link from "next/link";

import { useLocale } from "@/components/LocaleProvider";
import SpotImage from "@/components/SpotImage";
import { allSpots } from "@/data";
import {
  getLocalizedSpotArea,
  getLocalizedSpotCategory,
  getLocalizedSpotDescription,
  getLocalizedSpotName,
} from "@/lib/localizedSpot";

export default function SpotsPage() {
  const { locale, messages } = useLocale();
  const spotsPageMessages = messages.spotsPage;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="text-sm font-bold tracking-widest text-blue-600">
          {spotsPageMessages.eyebrow}
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          {spotsPageMessages.title}
        </h1>

        <p className="mt-3 text-slate-600">
          {spotsPageMessages.description}
        </p>

        <p className="mt-2 text-sm font-semibold text-slate-500">
          {spotsPageMessages.countPrefix}{allSpots.length}{spotsPageMessages.countSuffix}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {allSpots.map((spot) => {
          const localizedName =
            getLocalizedSpotName(spot, locale);

          return (
          <Link
            key={spot.id}
            href={`/spots/${spot.id}`}
            className="
              group
              overflow-hidden
              rounded-3xl
              border
              border-slate-200
              bg-white
              shadow-sm
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-xl
            "
          >
            <div className="h-56 w-full overflow-hidden">
              <SpotImage
                src={spot.image}
                alt={localizedName}
                spotName={spot.name}
                spotId={spot.id}
                latitude={spot.latitude}
                longitude={spot.longitude}
                className="
                  transition-transform
                  duration-500
                  group-hover:scale-105
                "
              />
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-extrabold text-slate-950">
                  {localizedName}
                </h2>

                <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                  {getLocalizedSpotCategory(spot, locale)}
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                {spotsPageMessages.areaPrefix}{getLocalizedSpotArea(spot, locale)}
              </p>

              <p className="mt-4 line-clamp-1 text-sm leading-6 text-slate-600">
                {getLocalizedSpotDescription(spot, locale)}
              </p>

              <div className="mt-5 text-sm font-bold text-blue-600">
                {spotsPageMessages.detailLink}
              </div>
            </div>
          </Link>
          );
        })}
      </div>
    </main>
  );
}
