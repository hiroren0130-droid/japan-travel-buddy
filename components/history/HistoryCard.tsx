"use client";

import Link from "next/link";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

import type { SavedTravelPlan } from "@/types/travel";

type Props = {
  plan: SavedTravelPlan;
  onDelete?: () => void;
};

export default function HistoryCard({
  plan,
  onDelete,
}: Props) {
  return (
    <Card>
      <h2 className="text-xl font-bold">
        {plan.title}
      </h2>

      <p className="mt-3 text-gray-600">
  {plan.summary || "旅行プランの概要はありません。"}
</p>

      <div className="mt-6 flex gap-3">
        <Link href={`/history/${plan.id}`}>
          <Button type="button">
  開く
</Button>
        </Link>

        <Button
  type="button"
  variant="danger"
  onClick={onDelete}
>
          削除
        </Button>
      </div>
    </Card>
  );
}