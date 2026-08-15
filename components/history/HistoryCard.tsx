"use client";

import Link from "next/link";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useLocale } from "@/components/LocaleProvider";

import type { SavedTravelPlan } from "@/types/travel";

type Props = {
  plan: SavedTravelPlan;
  onDelete?: () => void;
};

export default function HistoryCard({
  plan,
  onDelete,
}: Props) {
  const historyCardMessages =
    useLocale().messages.historyCard;

  return (
    <Card>
      <h2 className="text-xl font-bold">
        {plan.title}
      </h2>

      <p className="mt-3 text-gray-600">
  {plan.summary || historyCardMessages.summaryFallback}
</p>

      <div className="mt-6 flex gap-3">
        <Link href={`/history/${plan.id}`}>
          <Button type="button">
  {historyCardMessages.openLabel}
</Button>
        </Link>

        <Button
  type="button"
  variant="danger"
  onClick={onDelete}
>
          {historyCardMessages.deleteLabel}
        </Button>
      </div>
    </Card>
  );
}
