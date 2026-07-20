"use client";
import {
  Heart,
  Copy,
  FileText,
  Save,
  Route,
  Share2,
} from "lucide-react";
import InteractiveTravelMap from "./InteractiveTravelMap";
import { getSpotById } from "@/lib/spotService";
import { useEffect, useState } from "react";
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
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    setFavorite(isFavorite(plan.title));
  }, [plan.title]);

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
  const shareUrl = window.location.href;

  if (navigator.share) {
    try {
      await navigator.share({
        title: plan.title,
        text: plan.summary,
        url: shareUrl,
      });
    } catch {
      // キャンセルされた場合は何もしない
    }
  } else {
    await navigator.clipboard.writeText(shareUrl);
    alert("URLをコピーしました。");
  }
}
function handleRoute() {
  const spots = plan.days
  .flatMap((day) => day.items)
  .map((item) => getSpotById(item.spotId))
  .filter((spot): spot is NonNullable<typeof spot> => !!spot)
  .map((spot) => spot.name);

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

return (
  <Card className="overflow-hidden p-0">
    {/* Header */}
    <div className="bg-gradient-to-r from-blue-600 to-sky-500 p-6 text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div>
  <div className="flex items-center gap-2">
    <span className="text-3xl">🧳</span>

    <div>
      <h2 className="text-2xl font-bold tracking-tight">
        {plan.title}
      </h2>

      <p className="text-sm text-blue-100">
        AIがあなた専用に作成した旅行プラン
      </p>
    </div>
  </div>
</div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button
  size="icon"
  onClick={handleFavorite}
            variant="secondary"
            className="h-11 w-11 rounded-xl bg-white/20 hover:bg-white/30 hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm"
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
            className="h-11 w-11 rounded-xl bg-white/20 hover:bg-white/30 hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm"
            title="コピー"
          >
            <Copy size={20} />
          </Button>

          <Button
  size="icon"
  onClick={handlePdf}
            variant="secondary"
            className="h-11 w-11 rounded-xl bg-white/20 hover:bg-white/30 hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm"
            title="PDFとして保存"
          >
            <FileText size={20} />
          </Button>

          <Button
  size="icon"
  onClick={handleSave}
            variant="secondary"
            className="h-11 w-11 rounded-xl bg-white/20 hover:bg-white/30 hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm"
            title="保存"
          >
            <Save size={20} />
          </Button>

          <Button
  size="icon"
  onClick={handleRoute}
            variant="secondary"
            className="h-11 w-11 rounded-xl bg-white/20 hover:bg-white/30 hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm"
            title="Google Mapsでルートを開く"
          >
            <Route size={20} />
          </Button>

          <Button
  size="icon"
  onClick={handleShare}
            variant="secondary"
            className="h-11 w-11 rounded-xl bg-white/20 hover:bg-white/30 hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm"
            title="共有"
          >
            <Share2 size={20} />
          </Button>
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