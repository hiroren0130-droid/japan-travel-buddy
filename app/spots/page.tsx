import Image from "next/image";
import { notFound } from "next/navigation";

import { getSpotById } from "@/lib/spotService";

type Props = {
  params: {
    id: string;
  };
};

export default function SpotPage({ params }: Props) {
  const spot = getSpotById(params.id);

  if (!spot) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="overflow-hidden rounded-2xl border bg-white shadow">
        <div className="relative h-80 w-full">
          <Image
            src={spot.image}
            alt={spot.name}
            fill
            className="object-cover"
          />
        </div>

        <div className="p-8">
          <h1 className="text-3xl font-bold">
            📍 {spot.name}
          </h1>

          <p className="mt-2 text-gray-500">
            {spot.area} ・ {spot.category}
          </p>

          <p className="mt-6 leading-8">
            {spot.description}
          </p>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              spot.name
            )}`}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-block rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            🗺 Google Mapsで開く
          </a>
        </div>
      </div>
    </main>
  );
}