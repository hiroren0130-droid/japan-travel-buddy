import Image from "next/image";
import Link from "next/link";

import { Spot } from "@/data/spots";

type Props = {
  spot: Spot;
};

export default function SpotCard({ spot }: Props) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="relative h-52 w-full">
        <Image
          src={spot.image}
          alt={spot.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-5">
        <h3 className="text-xl font-bold">
          📍 {spot.name}
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          {spot.area} ・ {spot.category}
        </p>

        <p className="mt-4 text-gray-700">
          {spot.description}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              spot.name
            )}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          >
            🗺 Google Maps
          </a>

          <Link
            href={`/spots/${spot.id}`}
            className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-100"
          >
            詳細を見る
          </Link>
        </div>
      </div>
    </div>
  );
}