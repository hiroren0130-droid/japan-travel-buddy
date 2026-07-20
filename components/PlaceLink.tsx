"use client";

import Link from "next/link";
import { getSpotByName } from "@/lib/spotService";

type Props = {
  name: string;
};

export default function PlaceLink({ name }: Props) {
  const spot = getSpotByName(name);

  if (!spot) {
    return <span>{name}</span>;
  }

  return (
    <Link
      href={`/spots/${spot.id}`}
      className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
    >
      {name}
    </Link>
  );
}