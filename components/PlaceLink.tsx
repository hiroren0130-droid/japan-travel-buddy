"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { useLocale } from "@/components/LocaleProvider";
import { getLocalizedSpotName } from "@/lib/localizedSpot";
import { getSpotByName } from "@/lib/spotService";

type Props = {
  name: string;
};

export default function PlaceLink({
  name,
}: Props) {
  const { locale, messages } = useLocale();
  const placeLinkMessages = messages.placeLink;
  const trimmedName = name.trim();

  if (!trimmedName) {
    return (
      <span className="text-lg font-semibold text-slate-400">
        {placeLinkMessages.unknownSpot}
      </span>
    );
  }

  const spot = getSpotByName(trimmedName);

  if (!spot) {
    return (
      <span className="break-words text-xl font-bold tracking-tight text-slate-900">
        {trimmedName}
      </span>
    );
  }

  const localizedName =
    getLocalizedSpotName(spot, locale);

  return (
    <Link
      href={`/spots/${spot.id}`}
      aria-label={`${localizedName}${placeLinkMessages.detailAriaLabelSuffix}`}
      className="
        group
        inline-flex
        max-w-full
        items-center
        gap-2
        break-words
        text-xl
        font-bold
        tracking-tight
        text-slate-900
        transition-colors
        duration-300
        hover:text-blue-600
        focus:outline-none
        focus-visible:text-blue-600
        focus-visible:ring-2
        focus-visible:ring-blue-500
        focus-visible:ring-offset-2
        rounded-lg
      "
    >
      <span className="break-words">
        {localizedName}
      </span>

      <ArrowUpRight
        size={18}
        className="
          shrink-0
          text-slate-400
          transition-all
          duration-300
          group-hover:translate-x-0.5
          group-hover:-translate-y-0.5
          group-hover:text-blue-600
        "
        aria-hidden="true"
      />
    </Link>
  );
}
