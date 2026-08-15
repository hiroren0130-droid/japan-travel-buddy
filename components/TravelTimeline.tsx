"use client";

import { TravelPlan } from "@/types/travel";
import TimelineItem from "./TimelineItem";

import { CalendarDays, MapPin } from "lucide-react";

import { useLocale } from "@/components/LocaleProvider";
import { getSpotById } from "@/lib/spotService";

type Props = {
  plan: TravelPlan;
};

export default function TravelTimeline({
  plan,
}: Props) {
  const { messages: defaultMessages } = useLocale();

  return (
    <div className="space-y-12">
      {plan.days.map((day) => (
        <section
          key={day.day}
          aria-labelledby={`day-${day.day}`}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          {/* Day Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 px-5 py-5 sm:px-7 sm:py-6">
            {/* 背景装飾 */}
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl"
            />

            <div
              aria-hidden="true"
              className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl"
            />

            <div className="relative flex items-center gap-4">
              {/* カレンダーアイコン */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm sm:h-16 sm:w-16">
                <CalendarDays
                  size={30}
                  strokeWidth={2.2}
                  aria-hidden="true"
                />
              </div>

              {/* Day情報 */}
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-100 sm:text-xs">
                  {defaultMessages.travelTimeline.brandLabel}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h2
                    id={`day-${day.day}`}
                    className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
                  >
                    {defaultMessages.travelTimeline.dayPrefix}
                    {day.day}
                    {defaultMessages.travelTimeline.daySuffix}
                  </h2>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 shadow-sm sm:text-sm">
                    <MapPin
                      size={14}
                      className="text-rose-500"
                      aria-hidden="true"
                    />

                    {day.items.length}
                    {defaultMessages.travelTimeline.spotCountSuffix}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div
            role="list"
            className="relative px-3 py-6 sm:px-6 sm:py-8 lg:px-8"
          >
            {day.items.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 px-5 py-10 text-center">
                <p className="text-sm font-medium text-slate-500">
                  {defaultMessages.travelTimeline.emptyMessage}
                </p>
              </div>
            ) : (
              day.items.map((item) => {
                const spot = getSpotById(item.spotId);

                return (
                  <TimelineItem
                    key={`${day.day}-${item.time}-${item.spotId}`}
                    time={item.time}
                    spot={spot?.name ?? defaultMessages.travelTimeline.unknownSpot}
                    description={item.description}
                    transport={item.transport}
                    duration={item.duration}
                  />
                );
              })
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
