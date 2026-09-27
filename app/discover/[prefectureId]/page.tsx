import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DiscoverSpots from "@/components/DiscoverSpots";
import {
  isPrefectureId,
} from "@/data/regions";
import { getSpotsByPrefectureId } from "@/lib/spotService";
import { DEFAULT_LOCALE } from "@/lib/locale";
import { getLocalizedPageMetadata } from "@/lib/localeMetadata";

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

  const localized = getLocalizedPageMetadata(`/discover/${prefectureId}`, DEFAULT_LOCALE)!;
  return {
    title: { absolute: localized.title },
    description: localized.description,
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
