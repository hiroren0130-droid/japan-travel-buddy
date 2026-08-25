"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Header from "@/components/Header";
import { useLocale } from "@/components/LocaleProvider";
import SpotSummaryCard from "@/components/SpotSummaryCard";
import { allSpots } from "@/data";
import {
  getPrefectureDisplayName,
  type PrefectureId,
} from "@/data/regions";
import type { Spot } from "@/data/types";

const SPOT_SELECTION_STORAGE_KEY =
  "japan-travel-buddy:selected-spot-ids";
const availableSpotIds = new Set(
  allSpots.map((spot) => spot.id)
);

type Props = {
  prefectureId: PrefectureId;
  spots: Spot[];
};

export default function DiscoverSpots({
  prefectureId,
  spots,
}: Props) {
  const router = useRouter();
  const { locale, messages } = useLocale();
  const spotsPageMessages = messages.spotsPage;
  const regionName =
    getPrefectureDisplayName(
      prefectureId,
      locale
    );
  const regionNameEn =
    getPrefectureDisplayName(
      prefectureId,
      "en"
    );
  const [selectedSpotIds, setSelectedSpotIds] =
    useState<Set<string>>(
      () => new Set()
    );
  const selectedCount = selectedSpotIds.size;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const storedValue =
          window.localStorage.getItem(
            SPOT_SELECTION_STORAGE_KEY
          );

        if (!storedValue) {
          return;
        }

        const parsedValue: unknown =
          JSON.parse(storedValue);

        if (!Array.isArray(parsedValue)) {
          return;
        }

        const restoredSpotIds =
          parsedValue.filter(
            (spotId): spotId is string =>
              typeof spotId === "string" &&
              availableSpotIds.has(spotId)
          );

        setSelectedSpotIds(
          new Set(restoredSpotIds)
        );
      } catch {
        setSelectedSpotIds(new Set());
      }
    }, 0);

    return () =>
      window.clearTimeout(timeoutId);
  }, []);

  function toggleSpotSelection(
    spotId: string
  ) {
    const nextIds =
      new Set(selectedSpotIds);

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

    const searchParams =
      new URLSearchParams();

    selectedSpotIds.forEach((spotId) => {
      searchParams.append(
        "spotId",
        spotId
      );
    });

    try {
      window.localStorage.removeItem(
        SPOT_SELECTION_STORAGE_KEY
      );
    } catch {
      // Navigation can continue when storage is unavailable.
    }

    router.push(
      `/chat?${searchParams.toString()}`
    );
  }

  return (
    <>
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-bold tracking-widest text-blue-600">
            {regionNameEn.toUpperCase()} SPOT DATABASE
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {locale === "en"
              ? `${regionName} Spots`
              : `${regionName}スポット一覧`}
          </h1>

          <p className="mt-3 text-slate-600">
            {locale === "en"
              ? `Browse sightseeing spots in ${regionName}.`
              : `${regionName}の観光スポットを一覧から探せます。`}
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            {spotsPageMessages.countPrefix}
            {spots.length}
            {spotsPageMessages.countSuffix}
          </p>

          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p
              className="font-bold text-blue-700"
              aria-live="polite"
            >
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
          {spots.map((spot) => {
            const isSelected =
              selectedSpotIds.has(
                spot.id
              );

            return (
              <SpotSummaryCard
                key={spot.id}
                spot={spot}
                selectable
                selected={isSelected}
                onSelectionChange={() =>
                  toggleSpotSelection(spot.id)
                }
              />
            );
          })}
        </div>
      </main>
    </>
  );
}
