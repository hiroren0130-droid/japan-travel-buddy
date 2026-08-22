"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Header from "@/components/Header";
import { useLocale } from "@/components/LocaleProvider";
import SpotImage from "@/components/SpotImage";
import { allSpots } from "@/data";
import {
  getLocalizedSpotArea,
  getLocalizedSpotCategory,
  getLocalizedSpotDescription,
  getLocalizedSpotName,
} from "@/lib/localizedSpot";

const SPOT_SELECTION_STORAGE_KEY =
  "japan-travel-buddy:selected-spot-ids";
const availableSpotIds = new Set(
  allSpots.map((spot) => spot.id)
);

export default function SpotsPage() {
  const router = useRouter();
  const { locale, messages } = useLocale();
  const spotsPageMessages = messages.spotsPage;
  const [selectedSpotIds, setSelectedSpotIds] = useState<Set<string>>(
    () => new Set()
  );
  const selectedCount = selectedSpotIds.size;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const storedValue = window.localStorage.getItem(
          SPOT_SELECTION_STORAGE_KEY
        );

        if (!storedValue) {
          return;
        }

        const parsedValue: unknown = JSON.parse(storedValue);

        if (!Array.isArray(parsedValue)) {
          return;
        }

        const restoredSpotIds = parsedValue.filter(
          (spotId): spotId is string =>
            typeof spotId === "string" &&
            availableSpotIds.has(spotId)
        );

        setSelectedSpotIds(new Set(restoredSpotIds));
      } catch {
        setSelectedSpotIds(new Set());
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  function toggleSpotSelection(spotId: string) {
    const nextIds = new Set(selectedSpotIds);

    if (nextIds.has(spotId)) {
      nextIds.delete(spotId);
    } else {
      nextIds.add(spotId);
    }

    setSelectedSpotIds(nextIds);

    try {
      window.localStorage.setItem(
        SPOT_SELECTION_STORAGE_KEY,
        JSON.stringify([...nextIds])
      );
    } catch {
      // Selection remains available in memory when storage is unavailable.
    }
  }

  function openChatWithSelectedSpots() {
    if (selectedSpotIds.size === 0) {
      return;
    }

    const searchParams = new URLSearchParams();

    selectedSpotIds.forEach((spotId) => {
      searchParams.append("spotId", spotId);
    });

    router.push(`/chat?${searchParams.toString()}`);
  }

  return (
    <>
      <Header />

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

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-bold text-blue-700" aria-live="polite">
            {locale === "en"
              ? `${selectedCount} spots selected`
              : `${selectedCount}スポット選択中`}
          </p>

          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={openChatWithSelectedSpots}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {locale === "en"
              ? `Create an AI plan with ${selectedCount} selected spots`
              : `選んだ${selectedCount}スポットでAI旅行プランを作る`}
          </button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {allSpots.map((spot) => {
          const localizedName =
            getLocalizedSpotName(spot, locale);
          const isSelected = selectedSpotIds.has(spot.id);

          return (
          <article
            key={spot.id}
            className={`
              group
              overflow-hidden
              rounded-3xl
              border
              bg-white
              shadow-sm
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-xl
              ${isSelected
                ? "border-blue-500 ring-2 ring-blue-200"
                : "border-slate-200"}
            `}
          >
            <Link href={`/spots/${spot.id}`} className="block">
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

              <div className="p-5 pb-3">
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

            <div className="px-5 pb-5">
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleSpotSelection(spot.id)}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  isSelected
                    ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                    : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}
              >
                {isSelected
                  ? locale === "en"
                    ? "♥ Selected"
                    : "♥ 選択中"
                  : locale === "en"
                    ? "♡ Want to go"
                    : "♡ 行きたい"}
              </button>
            </div>
          </article>
          );
        })}
      </div>
      </main>
    </>
  );
}
