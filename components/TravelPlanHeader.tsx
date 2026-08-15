"use client";

import Image from "next/image";

import FavoriteButton from "./FavoriteButton";
import CopyButton from "./CopyButton";
import PdfButton from "./PdfButton";
import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

import {
  CalendarDays,
  MapPin,
  Sparkles,
  Footprints,
} from "lucide-react";

const defaultMessages = getMessages(DEFAULT_LOCALE);

type Props = {
  title: string;
  text: string;
};

export default function TravelPlanHeader({
  title,
  text,
}: Props) {
  return (
    <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Hero */}
      <div className="relative min-h-[420px] w-full overflow-hidden sm:min-h-[460px] lg:min-h-[500px]">
        <Image
          src="/images/kyoto-header.jpg"
          alt={defaultMessages.travelPlanHeader.imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-slate-900/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/10" />

        {/* 背景装飾 */}
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl"
        />

        {/* Content */}
        <div className="relative flex min-h-[420px] flex-col justify-end px-6 py-7 sm:min-h-[460px] sm:px-9 sm:py-9 lg:min-h-[500px] lg:px-12 lg:py-11">
          <div className="max-w-4xl">
            {/* ブランド */}
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <Sparkles size={17} aria-hidden="true" />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-100 sm:text-sm">
                {defaultMessages.appName}
              </p>
            </div>

            {/* タイトル */}
            <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {title}
            </h1>

            {/* 説明 */}
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base sm:leading-8">
              {defaultMessages.travelPlanHeader.description}
            </p>

            {/* Travel Info */}
            <div className="mt-6 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                <div className="flex items-center gap-2 text-blue-100">
                  <CalendarDays size={16} aria-hidden="true" />

                  <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                    {defaultMessages.travelPlanHeader.info.durationLabel}
                  </span>
                </div>

                <p className="mt-1 text-sm font-bold text-white sm:text-base">
                  {defaultMessages.travelPlanHeader.info.durationValue}
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                <div className="flex items-center gap-2 text-blue-100">
                  <MapPin size={16} aria-hidden="true" />

                  <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                    {defaultMessages.travelPlanHeader.info.spotsLabel}
                  </span>
                </div>

                <p className="mt-1 text-sm font-bold text-white sm:text-base">
                  {defaultMessages.travelPlanHeader.info.spotsValue}
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                <div className="flex items-center gap-2 text-blue-100">
                  <Footprints size={16} aria-hidden="true" />

                  <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                    {defaultMessages.travelPlanHeader.info.areaLabel}
                  </span>
                </div>

                <p className="mt-1 text-sm font-bold text-white sm:text-base">
                  {defaultMessages.travelPlanHeader.info.areaValue}
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                <div className="flex items-center gap-2 text-blue-100">
                  <Sparkles size={16} aria-hidden="true" />

                  <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                    {defaultMessages.travelPlanHeader.info.planLabel}
                  </span>
                </div>

                <p className="mt-1 text-sm font-bold text-white sm:text-base">
                  {defaultMessages.travelPlanHeader.info.planValue}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <FavoriteButton text={text} />
              <CopyButton text={text} />
              <PdfButton text={text} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
