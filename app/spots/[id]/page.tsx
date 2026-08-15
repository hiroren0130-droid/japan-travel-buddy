import { notFound } from "next/navigation";

import SpotDetail from "@/components/SpotDetail";
import { getSpotById } from "@/lib/spotService";

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

  return <SpotDetail spot={spot} />;
}
