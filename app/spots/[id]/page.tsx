import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { spots } from "@/data/spots";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SpotDetailPage({ params }: Props) {
  const { id } = await params;

  const spot = spots.find((s) => s.id === id);

  if (!spot) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Link
        href="/spots"
        className="mb-6 inline-block text-blue-600 hover:underline"
      >
        ← スポット一覧へ戻る
      </Link>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-lg">
        <div className="relative h-80 w-full">
          <Image
            src={spot.image}
            alt={spot.name}
            fill
            className="object-cover"
          />
        </div>

        <div className="p-8">
          <h1 className="text-4xl font-bold">📍 {spot.name}</h1>

          <p className="mt-2 text-gray-500">
            {spot.area} ・ {spot.category}
          </p>

          {spot.rating && (
            <p className="mt-4 text-lg">⭐ {spot.rating} / 5</p>
          )}

          <p className="mt-6 leading-8 text-gray-700">
            {spot.description}
          </p>

          <div className="mt-8 grid gap-3 rounded-xl bg-gray-50 p-6">
            {spot.address && (
              <div>📍 <strong>住所：</strong>{spot.address}</div>
            )}

            {spot.hours && (
              <div>🕒 <strong>営業時間：</strong>{spot.hours}</div>
            )}

            {spot.price && (
              <div>💴 <strong>入場料：</strong>{spot.price}</div>
            )}
          </div>

          <div className="mt-8 flex gap-4">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                spot.name
              )}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-blue-600 px-5 py-3 text-white"
            >
              🗺 Google Maps
            </a>

            {spot.website && (
              <a
                href={spot.website}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border px-5 py-3"
              >
                🌐 公式サイト
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}