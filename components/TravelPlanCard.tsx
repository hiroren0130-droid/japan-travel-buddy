"use client";

import { useEffect, useState } from "react";

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

  return (
    <Card className="overflow-hidden p-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-sky-500 p-6 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">{plan.title}</h2>

            <p className="mt-2 text-sm text-blue-100">
              AIがあなたの条件に合わせて作成した旅行プランです。
            </p>
          </div>

          <div className="flex gap-2">
            <Button
  onClick={handleFavorite}
  variant="secondary"
  className="bg-white/20 hover:bg-white/30"
>
  {favorite ? "❤️" : "🤍"}
</Button>

<Button
  onClick={handleCopy}
  variant="secondary"
  className="bg-white/20 hover:bg-white/30"
>
  📋
</Button>

<Button
  onClick={handlePdf}
  variant="secondary"
  className="bg-white/20 hover:bg-white/30"
>
  📄
</Button>

<Button
  onClick={handleSave}
  variant="secondary"
  className="bg-white/20 hover:bg-white/30"
>
  💾
</Button>

<Button
  onClick={handleShare}
  variant="secondary"
  className="bg-white/20 hover:bg-white/30"
>
  📤
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
      <div className="p-6">
        <TravelTimeline plan={plan} />
      </div>
    </Card>
  );
}