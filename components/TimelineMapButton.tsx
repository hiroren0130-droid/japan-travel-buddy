"use client";

import { MapPinned } from "lucide-react";

type Props = {
  spot: string;
};

function getGoogleMapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query
  )}`;
}

export default function TimelineMapButton({ spot }: Props) {
  return (
    <a
      href={getGoogleMapsUrl(spot)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-95"
    >
      <MapPinned size={18} />
      <span>Google Mapsで開く</span>
    </a>
  );
}