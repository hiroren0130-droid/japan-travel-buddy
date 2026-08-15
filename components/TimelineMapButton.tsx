"use client";

import { ExternalLink, MapPinned } from "lucide-react";

import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const defaultMessages = getMessages(DEFAULT_LOCALE);

type Props = {
  spot: string;
};

function getGoogleMapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query
  )}`;
}

export default function TimelineMapButton({
  spot,
}: Props) {
  if (!spot.trim()) {
    return null;
  }

  return (
    <a
      href={getGoogleMapsUrl(spot)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${defaultMessages.timelineMapButton.ariaLabelPrefix}${spot}${defaultMessages.timelineMapButton.ariaLabelSuffix}`}
      className="
        group
        inline-flex
        items-center
        gap-2
        rounded-xl
        border
        border-blue-200
        bg-blue-50
        px-4
        py-2
        text-sm
        font-semibold
        text-blue-700
        transition-all
        duration-300
        hover:-translate-y-0.5
        hover:border-blue-300
        hover:bg-blue-600
        hover:text-white
        hover:shadow-md
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-blue-500
        focus-visible:ring-offset-2
      "
    >
      <MapPinned
        size={17}
        className="transition-transform duration-300 group-hover:scale-110"
        aria-hidden="true"
      />

      <span>{defaultMessages.timelineMapButton.label}</span>

      <ExternalLink
        size={14}
        className="opacity-70 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        aria-hidden="true"
      />
    </a>
  );
}
