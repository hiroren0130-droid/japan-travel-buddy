"use client";

import type { SavedTravelPlan } from "@/types/travel";
import HistoryCard from "./HistoryCard";

type Props = {
  plans: SavedTravelPlan[];
  view: "grid" | "list";
  onDelete?: (id: string) => void;
};

export default function HistoryGrid({
  plans,
  view,
  onDelete,
}: Props) {
  return (
    <div
      className={
        view === "grid"
          ? "grid gap-5 md:grid-cols-2"
          : "space-y-5"
      }
    >
      {plans.map((plan) => (
        <HistoryCard
          key={plan.id}
          plan={plan}
          onDelete={() => onDelete?.(plan.id)}
        />
      ))}
    </div>
  );
}