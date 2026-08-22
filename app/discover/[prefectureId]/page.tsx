import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DiscoverSpots from "@/components/DiscoverSpots";
import {
  getPrefectureDisplayName,
  isPrefectureId,
} from "@/data/regions";
import { getSpotsByPrefectureId } from "@/lib/spotService";

type Props = {
  params: Promise<{
    prefectureId: string;
  }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { prefectureId } = await params;

  if (!isPrefectureId(prefectureId)) {
    return {
      title: "Discover",
    };
  }

  const regionName =
    getPrefectureDisplayName(
      prefectureId,
      "en"
    );

  return {
    title: `Discover ${regionName}`,
    description: `Browse sightseeing spots in ${regionName}.`,
  };
}

export default async function DiscoverPage({
  params,
}: Props) {
  const { prefectureId } = await params;

  if (!isPrefectureId(prefectureId)) {
    notFound();
  }

  const spots =
    getSpotsByPrefectureId(
      prefectureId
    );

  if (spots.length === 0) {
    notFound();
  }

  return (
    <DiscoverSpots
      prefectureId={prefectureId}
      spots={spots}
    />
  );
}
