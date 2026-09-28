import { notFound } from "next/navigation";
import type { Metadata } from "next";

import SpotDetail from "@/components/SpotDetail";
import { getSpotById } from "@/lib/spotService";
import { getPageUrlMetadata } from "@/lib/seoMetadata";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const spot = getSpotById(id);
  if (!spot) {
    return { robots: { index: false, follow: false } };
  }
  return getPageUrlMetadata(`/spots/${encodeURIComponent(spot.id)}`);
}

export default async function SpotDetailPage({
  params,
}: Props) {
  const { id } = await params;

  const spot = getSpotById(id);

  if (!spot) {
    notFound();
  }

  return <SpotDetail spot={spot} />;
}
