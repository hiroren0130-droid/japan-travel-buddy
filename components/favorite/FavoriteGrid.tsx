"use client";

import type { TravelPlan } from "@/types/travel";
import FavoriteCard from "./FavoriteCard";

export interface FavoriteGridProps {
  favorites: TravelPlan[];
  view?: "grid" | "list";
  onCardClick?: (plan: TravelPlan) => void;
  onRemove?: (plan: TravelPlan) => void;
}

export default function FavoriteGrid({
  favorites,
  view = "grid",
  onCardClick,
  onRemove,
}: FavoriteGridProps) {
  return (
    <div
      className={
        view === "list"
          ? "flex flex-col gap-4"
          : "grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
      }
    >
      {favorites.map((plan) => (
        <FavoriteCard
  key={`${plan.title}-${plan.summary}`}
  plan={plan}
  view={view}
  onClick={() => onCardClick?.(plan)}
  onRemove={() => onRemove?.(plan)}
/>
      ))}
    </div>
  );
}