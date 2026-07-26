"use client";

import { Heart, CalendarDays, MapPinned } from "lucide-react";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

import type { TravelPlan } from "@/types/travel";

type Props = {
  plan: TravelPlan;
  view?: "grid" | "list";
  onClick?: () => void;
  onRemove?: () => void;
};

export default function FavoriteCard({
  plan,
  view = "grid",
  onClick,
  onRemove,
}: Props) {
  const dayCount = plan.days?.length ?? 0;

const spotCount =
  plan.days?.reduce(
    (total, day) => total + day.items.length,
    0
  ) ?? 0;

  return (
    <Card
  onClick={onClick}
  className={`cursor-pointer transition hover:-translate-y-1 hover:shadow-lg ${
    view === "list"
      ? "flex items-center gap-6"
      : ""
  }`}
>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold">
            {plan.title}
          </h2>

          <p className="mt-2 line-clamp-2 text-gray-600">
  {plan.summary || "旅行プランの概要はありません。"}
</p>

          <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <CalendarDays size={16} />
              <span>{dayCount}日間</span>
            </div>

            <div className="flex items-center gap-1">
              <MapPinned size={16} />
              <span>{spotCount}スポット</span>
            </div>
          </div>
        </div>

        <Button
          size="icon"
          variant="secondary"
          title="お気に入り解除"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
        >
          <Heart
            size={20}
            className="fill-red-500 text-red-500"
          />
        </Button>
      </div>
    </Card>
  );
}