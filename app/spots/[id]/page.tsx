import Link from "next/link";
import { notFound } from "next/navigation";

import SpotImage from "@/components/SpotImage";
import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";
import { getSpotById } from "@/lib/spotService";

const spotDetailMessages = getMessages(DEFAULT_LOCALE).spotDetail;

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SpotDetailPage({
  params,
}: Props) {
  const { id } = await params;

  const spot = getSpotById(id);

  if (!spot) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8">
      <Link
        href="/spots"
        className="mb-6 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
      >
        {spotDetailMessages.backToSpots}
      </Link>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-lg">
        <div className="relative h-80 w-full">
          <SpotImage
            src={spot.image}
            alt={spot.name}
          />
        </div>

        <div className="p-8">
          <h1 className="text-4xl font-bold">
            {spotDetailMessages.namePrefix}{spot.name}
          </h1>

          <p className="mt-2 text-gray-500">
            {spot.area}{spotDetailMessages.metadataSeparator}{spot.category}
          </p>

          {spot.rating != null && (
            <p className="mt-4 text-lg">
              {spotDetailMessages.ratingPrefix}{spot.rating}{spotDetailMessages.ratingSuffix}
            </p>
          )}

          <p className="mt-6 leading-8 text-gray-700">
            {spot.description}
          </p>

          <div className="mt-8 grid gap-3 rounded-xl bg-gray-50 p-6">
            {spot.address && (
              <div>
                {spotDetailMessages.addressPrefix}<strong>{spotDetailMessages.addressLabel}</strong>
                {spot.address}
              </div>
            )}

            {spot.hours && (
              <div>
                {spotDetailMessages.hoursPrefix}<strong>{spotDetailMessages.hoursLabel}</strong>
                {spot.hours}
              </div>
            )}

            {spot.price && (
              <div>
                {spotDetailMessages.pricePrefix}<strong>{spotDetailMessages.priceLabel}</strong>
                {spot.price}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                spot.name
              )}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-blue-600 px-5 py-3 text-white"
            >
              {spotDetailMessages.googleMapsLabel}
            </a>

            {spot.website && (
              <a
                href={spot.website}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border px-5 py-3"
              >
                {spotDetailMessages.officialWebsiteLabel}
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
