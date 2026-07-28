"use client";
import {
  Heart,
  Copy,
  FileText,
  Save,
  Map,
  Share2,
} from "lucide-react";
import InteractiveTravelMap from "./InteractiveTravelMap";
import { getSpotById } from "@/lib/spotService";
import { useState } from "react";
import { createGoogleMapsRoute } from "@/lib/googleMaps";
import { auth } from "@/lib/firebase";
import { saveTravelPlan } from "@/lib/firestore";
import { downloadTravelPlanPdf } from "@/lib/pdf";
import { TravelPlan } from "@/types/travel";
import TravelTimeline from "./TravelTimeline";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  saveFavorite,
  removeFavorite,
  isFavorite,
} from "@/lib/favorites";

type Props = {
  plan: TravelPlan;
};

export default function TravelPlanCard({ plan }: Props) {
  const [favorite, setFavorite] = useState(() =>
  isFavorite(plan.title)
);

  

  function handleFavorite() {
  if (favorite) {
    removeFavorite(plan.title);
    setFavorite(false);
  } else {
    saveFavorite(plan);
    setFavorite(true);
  }
}

  function handleCopy() {
    navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
    alert("旅行プランをコピーしました。");
  }

  function handlePdf() {
  downloadTravelPlanPdf(plan);
}

async function handleSave() {
  const user = auth.currentUser;

  if (!user) {
    alert("ログインしてください。");
    return;
  }

  try {
    await saveTravelPlan(user.uid, plan);
    alert("旅行プランを保存しました。");
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message);
    } else {
      alert("保存に失敗しました。");
    }

    console.error(error);
  }
}

async function handleShare() {
  const shareText = `${plan.title}

${plan.summary}

Japan Travel Buddyで作成した旅行プラン`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: plan.title,
        text: shareText,
      });
    } catch {
      // キャンセル時は何もしない
    }
  } else {
    await navigator.clipboard.writeText(shareText);
    alert("旅行プランをコピーしました。");
  }
}
function handleRoute() {
  const spots = plan.days
    .flatMap((day) => day.items)
    .map((item) => getSpotById(item.spotId))
    .filter((spot): spot is NonNullable<typeof spot> => !!spot)
    .map((spot) => spot.name);

  if (spots.length === 0) {
    alert("ルートを作成できるスポットがありません。");
    return;
  }

  const url = createGoogleMapsRoute(spots);

  window.open(url, "_blank");
}
const routeSpots = plan.days
  .flatMap((day) => day.items)
  .map((item) => getSpotById(item.spotId))
  .filter((spot) => spot && spot.latitude != null)
  .map((spot) => ({
    name: spot!.name,
    latitude: spot!.latitude,
    longitude: spot!.longitude,
  }));

  const firstSpot = plan.days
  .flatMap((day) => day.items)
  .map((item) => getSpotById(item.spotId))
  .find((spot) => spot != null);

const totalDays = plan.days.length;

const totalSpots = plan.days.reduce(
  (sum, day) => sum + day.items.length,
  0
);

return (
  <Card className="overflow-hidden p-0">
    {/* Header */}
    <div className="overflow-hidden">
      {/* Hero画像（今はグレー） */}
      <div className="relative h-[420px] w-full overflow-hidden">
  {firstSpot && (
    <>
      <img
        src={firstSpot.image}
        alt={firstSpot.name}
        className="h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <div className="absolute bottom-0 left-0 w-full p-8 text-white">
        <p className="mb-2 text-sm uppercase tracking-[0.3em] text-white/80">
          Japan Travel Buddy
        </p>

        <h1 className="text-5xl font-bold drop-shadow-lg">
          {plan.title}
        </h1>

        <p className="mt-3 max-w-2xl text-lg text-white/90">
          AIがあなたのためだけにデザインした旅行プラン
        </p>
      </div>
    </>
  )}
</div>

      {/* Header本体 */}
      <div className="bg-gradient-to-br from-sky-600 via-blue-500 to-cyan-400 px-8 py-12 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-start gap-4">
              <div className="flex flex-wrap gap-3">
  <div className="rounded-full bg-white/20 px-4 py-2">
    🗓 {totalDays}日間
  </div>

  <div className="rounded-full bg-white/20 px-4 py-2">
    🚶 {totalSpots}スポット
  </div>

  <div className="rounded-full bg-white/20 px-4 py-2">
    📍 京都
  </div>

  <div className="rounded-full bg-white/20 px-4 py-2">
    ✨ AI Concierge
  </div>
</div>

                <div className="mt-5 flex flex-wrap gap-3 text-sm">
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button
              size="icon"
              onClick={handleFavorite}
              variant="secondary"
              aria-label="お気に入り"
              title="お気に入り"
            >
              <Heart
                size={20}
                className={favorite ? "fill-red-500 text-red-500" : ""}
              />
            </Button>

            <Button
              size="icon"
              onClick={handleCopy}
              variant="secondary"
              aria-label="コピー"
              title="コピー"
            >
              <Copy size={20} />
            </Button>

            <Button
              size="icon"
              onClick={handlePdf}
              variant="secondary"
              aria-label="PDF"
              title="PDF"
            >
              <FileText size={20} />
            </Button>

            <Button
              size="icon"
              onClick={handleSave}
              variant="secondary"
              aria-label="保存"
              title="保存"
            >
              <Save size={20} />
            </Button>

            <Button
              size="icon"
              onClick={handleRoute}
              variant="secondary"
              aria-label="Google Maps"
              title="Google Maps"
            >
              <Map size={20} />
            </Button>

            <Button
              size="icon"
              onClick={handleShare}
              variant="secondary"
              aria-label="共有"
              title="共有"
            >
              <Share2 size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>

    {/* Summary */}
    {plan.summary && (
      <div className="border-b bg-gray-50 p-5">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          📝 プラン概要
        </h3>

        <p className="leading-7 text-gray-700">{plan.summary}</p>
      </div>
    )}

    {/* Timeline */}
    <div className="space-y-8 p-6">
  <TravelTimeline plan={plan} />

  <InteractiveTravelMap spots={routeSpots} />
</div>
  </Card>
);
}