"use client";

import { useState } from "react";

import {
  CalendarDays,
  Copy,
  FileText,
  Heart,
  Map,
  MapPin,
  NotebookText,
  Save,
  Share2,
  Sparkles,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

import InteractiveTravelMap from "./InteractiveTravelMap";
import SpotImage from "./SpotImage";
import TravelTimeline from "./TravelTimeline";

import { auth } from "@/lib/firebase";
import {
  isFavorite,
  removeFavorite,
  saveFavorite,
} from "@/lib/favorites";
import { saveTravelPlan } from "@/lib/firestore";
import { createGoogleMapsRoute } from "@/lib/googleMaps";
import { downloadTravelPlanPdf } from "@/lib/pdf";
import { getSpotById } from "@/lib/spotService";

import type { TravelPlan } from "@/types/travel";

type Props = {
  plan: TravelPlan;
};

export default function TravelPlanCard({
  plan,
}: Props) {
  const [favorite, setFavorite] = useState(() =>
    isFavorite(plan.title)
  );

  function handleFavorite() {
    if (favorite) {
      removeFavorite(plan.title);
      setFavorite(false);
      return;
    }

    saveFavorite(plan);
    setFavorite(true);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(plan, null, 2)
      );

      alert("旅行プランをコピーしました。");
    } catch (error) {
      console.error(
        "旅行プランのコピーに失敗しました。",
        error
      );

      alert("コピーに失敗しました。");
    }
  }

  function handlePdf() {
    downloadTravelPlanPdf(plan);
  }

  async function handleSave() {
    const user = auth.currentUser;

    if (!user) {
      alert("ログインしてください。");
      return;
    }

    try {
      await saveTravelPlan(user.uid, plan);
      alert("旅行プランを保存しました。");
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("保存に失敗しました。");
      }

      console.error(error);
    }
  }

  async function handleShare() {
    const shareText = `${plan.title}

${plan.summary}

Japan Travel Buddyで作成した旅行プラン`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: plan.title,
          text: shareText,
        });
      } catch {
        // 共有画面を閉じた場合は何もしない
      }

      return;
    }

    try {
      await navigator.clipboard.writeText(shareText);
      alert("共有用の旅行プランをコピーしました。");
    } catch (error) {
      console.error(
        "共有用テキストのコピーに失敗しました。",
        error
      );

      alert("共有に失敗しました。");
    }
  }

  function handleRoute() {
    const spotNames = plan.days
      .flatMap((day) => day.items)
      .map((item) => getSpotById(item.spotId))
      .filter(
        (
          spot
        ): spot is NonNullable<typeof spot> =>
          spot != null
      )
      .map((spot) => spot.name);

    if (spotNames.length === 0) {
      alert(
        "ルートを作成できるスポットがありません。"
      );
      return;
    }

    const url = createGoogleMapsRoute(spotNames);

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  const allSpots = plan.days
    .flatMap((day) => day.items)
    .map((item) => getSpotById(item.spotId))
    .filter(
      (
        spot
      ): spot is NonNullable<typeof spot> =>
        spot != null
    );

  const routeSpots = allSpots
    .filter(
      (spot) =>
        spot.latitude != null &&
        spot.longitude != null
    )
    .map((spot) => ({
      name: spot.name,
      latitude: spot.latitude,
      longitude: spot.longitude,
    }));

  const firstSpot = allSpots[0];

  console.log(firstSpot);

  const totalDays = plan.days.length;

  const totalSpots = plan.days.reduce(
    (sum, day) => sum + day.items.length,
    0
  );

  const heroSummary =
    plan.summary.length > 85
      ? `${plan.summary.slice(0, 85)}...`
      : plan.summary;

  const actionButtonClass =
    "h-11 w-11 rounded-xl border border-white/80 bg-white text-slate-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 hover:text-blue-700";

  return (
    <Card className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-0 shadow-xl">
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#17376f] via-[#124ca8] to-[#08a4dc]">
        {/* Background decoration */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />

          <div className="absolute -bottom-40 right-0 h-80 w-80 rounded-full bg-cyan-300/30 blur-3xl" />

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/10 via-transparent to-transparent" />
        </div>

        <div className="relative grid gap-5 p-4 sm:p-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-7">
          {/* Representative image */}
          <div className="relative min-h-[210px] overflow-hidden rounded-[20px] border border-white/20 bg-white/10 shadow-xl sm:min-h-[230px] lg:min-h-[235px]">
            {firstSpot ? (
  <SpotImage
  src={firstSpot.image}
  alt={firstSpot.name}
/>
) : (
  <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-cyan-100 to-indigo-200" />
)}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />

            {firstSpot && (
              <div className="absolute bottom-3 left-3 right-3">
                <div className="rounded-xl border border-white/30 bg-slate-950/40 px-3 py-2 text-white backdrop-blur-md">
                  <p className="truncate text-sm font-bold">
                    {firstSpot.name}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-white/75">
                    {firstSpot.area}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Hero content */}
          <div className="min-w-0 text-white">
            {/* Top row */}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
              {/* Title area */}
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-200 sm:text-sm">
                  Japan Travel Buddy
                </p>

                <h1 className="mt-2 text-3xl font-black leading-[1.16] tracking-tight sm:text-4xl lg:text-[40px]">
                  {plan.title}
                </h1>

                {heroSummary && (
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-50/90 sm:text-base sm:leading-7">
                    {heroSummary}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2.5 lg:grid lg:grid-cols-4 lg:justify-self-end">
                <Button
                  size="icon"
                  onClick={handleFavorite}
                  variant="secondary"
                  aria-label={
                    favorite
                      ? "お気に入りから削除"
                      : "お気に入りに追加"
                  }
                  title={
                    favorite
                      ? "お気に入りから削除"
                      : "お気に入り"
                  }
                  className={actionButtonClass}
                >
                  <Heart
                    size={20}
                    className={
                      favorite
                        ? "fill-rose-500 text-rose-500"
                        : ""
                    }
                    aria-hidden="true"
                  />
                </Button>

                <Button
                  size="icon"
                  onClick={handleCopy}
                  variant="secondary"
                  aria-label="旅行プランをコピー"
                  title="コピー"
                  className={actionButtonClass}
                >
                  <Copy
                    size={20}
                    aria-hidden="true"
                  />
                </Button>

                <Button
                  size="icon"
                  onClick={handlePdf}
                  variant="secondary"
                  aria-label="旅行プランをPDFで保存"
                  title="PDF保存"
                  className={actionButtonClass}
                >
                  <FileText
                    size={20}
                    aria-hidden="true"
                  />
                </Button>

                <Button
                  size="icon"
                  onClick={handleSave}
                  variant="secondary"
                  aria-label="旅行プランを保存"
                  title="保存"
                  className={actionButtonClass}
                >
                  <Save
                    size={20}
                    aria-hidden="true"
                  />
                </Button>

                <Button
                  size="icon"
                  onClick={handleRoute}
                  variant="secondary"
                  aria-label="Google Mapsでルートを開く"
                  title="Google Maps"
                  className="h-11 w-11 rounded-xl border border-white/80 bg-white text-slate-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 hover:text-blue-700 lg:col-start-3"
                >
                  <Map
                    size={20}
                    aria-hidden="true"
                  />
                </Button>

                <Button
                  size="icon"
                  onClick={handleShare}
                  variant="secondary"
                  aria-label="旅行プランを共有"
                  title="共有"
                  className={actionButtonClass}
                >
                  <Share2
                    size={20}
                    aria-hidden="true"
                  />
                </Button>
              </div>
            </div>

            {/* Plan information */}
            <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/15 bg-white/15 px-4 py-3 backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100">
                  Duration
                </p>

                <div className="mt-1.5 flex items-center gap-2">
                  <CalendarDays
                    size={18}
                    className="shrink-0 text-cyan-200"
                    aria-hidden="true"
                  />

                  <p className="text-base font-bold text-white">
                    {totalDays}日間
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/15 px-4 py-3 backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100">
                  Spots
                </p>

                <div className="mt-1.5 flex items-center gap-2">
                  <MapPin
                    size={18}
                    className="shrink-0 text-cyan-200"
                    aria-hidden="true"
                  />

                  <p className="whitespace-nowrap text-base font-bold text-white">
                    {totalSpots}スポット
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/15 px-4 py-3 backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100">
                  Area
                </p>

                <div className="mt-1.5 flex min-w-0 items-center gap-2">
                  <Map
                    size={18}
                    className="shrink-0 text-cyan-200"
                    aria-hidden="true"
                  />

                  <p className="truncate text-base font-bold text-white">
                    {firstSpot?.area ?? "日本"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/15 px-4 py-3 backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100">
                  AI
                </p>

                <div className="mt-1.5 flex min-w-0 items-center gap-2">
                  <Sparkles
                    size={18}
                    className="shrink-0 text-yellow-200"
                    aria-hidden="true"
                  />

                  <p className="truncate text-base font-bold text-white">
                    Concierge
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="space-y-6 p-4 sm:p-5 lg:p-6">
        {/* Summary */}
        {plan.summary && (
          <section className="rounded-[24px] border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <NotebookText
                  size={23}
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                  Travel Summary
                </p>

                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  プラン概要
                </h2>

                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                  {plan.summary}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Timeline */}
        <TravelTimeline plan={plan} />

        {/* Map */}
        {routeSpots.length > 0 && (
          <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-7">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Map
                  size={20}
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                  Travel Map
                </p>

                <h2 className="text-lg font-bold text-slate-900">
                  旅行ルート
                </h2>
              </div>
            </div>

            <InteractiveTravelMap
              spots={routeSpots}
            />
          </section>
        )}
      </div>
    </Card>
  );
}