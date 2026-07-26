"use client";

import Link from "next/link";
import { getSpotByName } from "@/lib/spotService";

type Props = {
  name: string;
};

export default function PlaceLink({ name }: Props) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return (
      <span className="text-gray-500">
        不明なスポット
      </span>
    );
  }

  const spot = getSpotByName(trimmedName);

  if (!spot) {
    return (
      <span className="break-words text-gray-700">
        {trimmedName}
      </span>
    );
  }

  return (
    <Link
      href={`/spots/${spot.id}`}
      className="break-words font-semibold text-blue-600 transition-colors hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-300"
      aria-label={`${trimmedName}の詳細ページを見る`}
    >
      {trimmedName}
    </Link>
  );
}