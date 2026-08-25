"use client";

import { useRef, useState } from "react";

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
import { useLocale } from "@/components/LocaleProvider";

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
import {
  getLocalizedSpotArea,
  getLocalizedSpotName,
} from "@/lib/localizedSpot";
import { downloadTravelPlanPdf } from "@/lib/pdf";
import { getSpotById } from "@/lib/spotService";
import { createTravelPlanShareText } from "@/lib/travelPlanExport";

import type { TravelPlan } from "@/types/travel";

type Props = {
  plan: TravelPlan;
};

function isValidTravelPlan(value: unknown): value is TravelPlan {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.title !== "string" ||
    typeof candidate.summary !== "string" ||
    !candidate.title.trim() ||
    !candidate.summary.trim() ||
    Array.from(candidate.title.trim()).length > 120 ||
    Array.from(candidate.summary.trim()).length > 2000 ||
    !Array.isArray(candidate.days) ||
    candidate.days.length < 1 ||
    candidate.days.length > 14
  ) {
    return false;
  }

  return candidate.days.every((day) => {
    if (typeof day !== "object" || day === null) {
      return false;
    }

    return Array.isArray(
      (day as Record<string, unknown>).items
    );
  });
}

function createCopyablePlan(plan: TravelPlan) {
  return {
    title: plan.title,
    summary: plan.summary,
    days: plan.days,
    ...(plan.startLocation
      ? { startLocation: plan.startLocation }
      : {}),
    ...(plan.startTime
      ? { startTime: plan.startTime }
      : {}),
    ...(plan.endLocation
      ? { endLocation: plan.endLocation }
      : {}),
    ...(plan.endTime
      ? { endTime: plan.endTime }
      : {}),
  };
}

function logClientError(
  message: string,
  error: unknown
) {
  if (process.env.NODE_ENV === "development") {
    console.error(message, error);
  } else {
    console.error(message);
  }
}

function isAbortError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

export default function TravelPlanCard({
  plan,
}: Props) {
  const { locale, messages: defaultMessages } = useLocale();
  const [favorite, setFavorite] = useState(() =>
    isFavorite(plan.title)
  );
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

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
        JSON.stringify(
          createCopyablePlan(plan),
          null,
          2
        )
      );

      alert(defaultMessages.travelPlanCard.alerts.copySuccess);
    } catch (error) {
      logClientError(
        "旅行プランのコピーに失敗しました。",
        error
      );

      alert(defaultMessages.travelPlanCard.alerts.copyFailed);
    }
  }

  async function handlePdf() {
    try {
      await downloadTravelPlanPdf(plan, locale);
    } catch (error) {
      logClientError(
        "旅行プランPDFの作成に失敗しました。",
        error
      );

      alert(defaultMessages.travelPlanCard.alerts.pdfFailed);
    }
  }

  async function handleSave() {
    if (savingRef.current) return;

    const user = auth.currentUser;

    if (!user) {
      alert(defaultMessages.travelPlanCard.alerts.loginRequired);
      return;
    }

    if (!isValidTravelPlan(plan)) {
      alert(defaultMessages.travelPlanCard.alerts.invalidPlan);
      return;
    }

    const uid = user.uid;
    const normalizedPlan: TravelPlan = {
      title: plan.title.trim(),
      summary: plan.summary.trim(),
      days: plan.days,
      favorite: plan.favorite,
      startLocation:
        plan.startLocation?.trim() ||
        undefined,
      startTime: plan.startTime,
      endLocation:
        plan.endLocation?.trim() ||
        undefined,
      endTime: plan.endTime,
    };

    savingRef.current = true;
    setSaving(true);

    try {
      await saveTravelPlan(uid, normalizedPlan);

      if (auth.currentUser?.uid !== uid) {
        alert(defaultMessages.travelPlanCard.alerts.authChanged);
        return;
      }

      alert(defaultMessages.travelPlanCard.alerts.saveSuccess);
    } catch (error) {
      logClientError(
        "旅行プランの保存に失敗しました。",
        error
      );

      alert(defaultMessages.travelPlanCard.alerts.saveFailed);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function handleShare() {
    const shareText = createTravelPlanShareText(plan, locale);

    if (navigator.share) {
      try {
        await navigator.share({
          title: plan.title,
          text: shareText,
        });
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }

        logClientError(
          "旅行プランの共有に失敗しました。",
          error
        );

        alert(defaultMessages.travelPlanCard.alerts.shareUnavailable);
      }

      return;
    }

    try {
      await navigator.clipboard.writeText(shareText);
      alert(defaultMessages.travelPlanCard.alerts.shareCopySuccess);
    } catch (error) {
      logClientError(
        "共有用テキストのコピーに失敗しました。",
        error
      );

      alert(defaultMessages.travelPlanCard.alerts.shareFailed);
    }
  }

  function handleRoute() {
    try {
      const routePoints = plan.days
        .flatMap((day) => day.items)
        .map((item) => getSpotById(item.spotId))
        .filter(
          (
            spot
          ): spot is NonNullable<typeof spot> =>
            spot != null
        )
        .map((spot) => ({
          name: spot.name,
          address: spot.address,
          latitude: spot.latitude,
          longitude: spot.longitude,
        }));

      if (routePoints.length === 0) {
        alert(
          defaultMessages.travelPlanCard.alerts.noRouteSpots
        );
        return;
      }

      const url = createGoogleMapsRoute(
        routePoints,
        {
          startLocation:
            plan.startLocation,
          endLocation:
            plan.endLocation,
        }
      );

      const openedWindow = window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );

      if (openedWindow === null) {
        throw new Error("Google Maps window was blocked.");
      }
    } catch (error) {
      logClientError(
        "Google Mapsを開けませんでした。",
        error
      );

      alert(defaultMessages.travelPlanCard.alerts.mapsFailed);
    }
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
  const firstSpotName = firstSpot
    ? getLocalizedSpotName(firstSpot, locale)
    : undefined;
  const firstSpotArea = firstSpot
    ? getLocalizedSpotArea(firstSpot, locale)
    : undefined;

  const totalDays = plan.days.length;

  const totalSpots = plan.days.reduce(
    (sum, day) => sum + day.items.length,
    0
  );

  const travelConditions = [
    {
      label:
        defaultMessages.travelForm.startLocation.label,
      value: plan.startLocation,
    },
    {
      label:
        defaultMessages.travelForm.startTime.label,
      value: plan.startTime,
    },
    {
      label:
        defaultMessages.travelForm.endLocation.label,
      value: plan.endLocation,
    },
    {
      label:
        defaultMessages.travelForm.endTime.label,
      value: plan.endTime,
    },
  ].filter(
    (condition): condition is {
      label: string;
      value: string;
    } => Boolean(condition.value)
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
  alt={firstSpotName ?? firstSpot.name}
  spotName={firstSpot.name}
  spotId={firstSpot.id}
  latitude={firstSpot.latitude}
  longitude={firstSpot.longitude}
/>
) : (
  <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-cyan-100 to-indigo-200" />
)}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />

            {firstSpot && (
              <div className="absolute bottom-3 left-3 right-3">
                <div className="rounded-xl border border-white/30 bg-slate-950/40 px-3 py-2 text-white backdrop-blur-md">
                  <p className="truncate text-sm font-bold">
                    {firstSpotName}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-white/75">
                    {firstSpotArea}
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
                  {defaultMessages.appName}
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
                      ? defaultMessages.travelPlanCard.actions.removeFavorite
                      : defaultMessages.travelPlanCard.actions.addFavorite
                  }
                  title={
                    favorite
                      ? defaultMessages.travelPlanCard.actions.removeFavorite
                      : defaultMessages.travelPlanCard.actions.favoriteTitle
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
                  aria-label={defaultMessages.travelPlanCard.actions.copy}
                  title={defaultMessages.travelPlanCard.actions.copyTitle}
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
                  aria-label={defaultMessages.travelPlanCard.actions.savePdf}
                  title={defaultMessages.travelPlanCard.actions.savePdfTitle}
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
                  disabled={saving}
                  variant="secondary"
                  aria-label={
                    saving
                      ? defaultMessages.travelPlanCard.actions.saving
                      : defaultMessages.travelPlanCard.actions.save
                  }
                  title={
                    saving
                      ? defaultMessages.travelPlanCard.actions.saving
                      : defaultMessages.travelPlanCard.actions.saveTitle
                  }
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
                  aria-label={defaultMessages.travelPlanCard.actions.openRoute}
                  title={defaultMessages.travelPlanCard.actions.mapsTitle}
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
                  aria-label={defaultMessages.travelPlanCard.actions.share}
                  title={defaultMessages.travelPlanCard.actions.shareTitle}
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
                  {defaultMessages.travelPlanCard.info.durationLabel}
                </p>

                <div className="mt-1.5 flex items-center gap-2">
                  <CalendarDays
                    size={18}
                    className="shrink-0 text-cyan-200"
                    aria-hidden="true"
                  />

                  <p className="text-base font-bold text-white">
                    {totalDays}
                    {defaultMessages.travelPlanCard.info.daySuffix}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/15 px-4 py-3 backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100">
                  {defaultMessages.travelPlanCard.info.spotsLabel}
                </p>

                <div className="mt-1.5 flex items-center gap-2">
                  <MapPin
                    size={18}
                    className="shrink-0 text-cyan-200"
                    aria-hidden="true"
                  />

                  <p className="whitespace-nowrap text-base font-bold text-white">
                    {totalSpots}
                    {defaultMessages.travelPlanCard.info.spotSuffix}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/15 px-4 py-3 backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100">
                  {defaultMessages.travelPlanCard.info.areaLabel}
                </p>

                <div className="mt-1.5 flex min-w-0 items-center gap-2">
                  <Map
                    size={18}
                    className="shrink-0 text-cyan-200"
                    aria-hidden="true"
                  />

                  <p className="truncate text-base font-bold text-white">
                    {firstSpotArea ?? defaultMessages.travelPlanCard.info.defaultArea}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/15 px-4 py-3 backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100">
                  {defaultMessages.travelPlanCard.info.aiLabel}
                </p>

                <div className="mt-1.5 flex min-w-0 items-center gap-2">
                  <Sparkles
                    size={18}
                    className="shrink-0 text-yellow-200"
                    aria-hidden="true"
                  />

                  <p className="truncate text-base font-bold text-white">
                    {defaultMessages.travelPlanCard.info.aiValue}
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
                  {defaultMessages.travelPlanCard.summaryEyebrow}
                </p>

                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  {defaultMessages.travelPlanCard.summaryTitle}
                </h2>

                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                  {plan.summary}
                </p>
              </div>
            </div>
          </section>
        )}

        {travelConditions.length > 0 && (
          <section className="rounded-[24px] border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-7">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {travelConditions.map(
                (condition) => (
                  <div
                    key={condition.label}
                    className="rounded-2xl bg-slate-50 px-4 py-3"
                  >
                    <p className="text-xs font-bold text-slate-500">
                      {condition.label}
                    </p>

                    <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                      {condition.value}
                    </p>
                  </div>
                )
              )}
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
                  {defaultMessages.travelPlanCard.mapEyebrow}
                </p>

                <h2 className="text-lg font-bold text-slate-900">
                  {defaultMessages.travelPlanCard.mapTitle}
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
