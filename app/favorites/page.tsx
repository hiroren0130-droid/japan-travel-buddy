"use client";

import { useEffect, useState } from "react";

import TravelPlanCard from "@/components/TravelPlanCard";
import EmptyState from "@/components/ui/EmptyState";

import { getFavorites } from "@/lib/favorites";
import type { TravelPlan } from "@/types/travel";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<TravelPlan[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-bold">
        ❤️ お気に入り
      </h1>

      {favorites.length === 0 ? (
        <EmptyState
          icon="❤️"
          title="お気に入りはまだありません"
          description="旅行プランを保存するとここに表示されます。"
        />
      ) : (
        <div className="space-y-6">
          {favorites.map((plan) => (
            <TravelPlanCard
              key={plan.title}
              plan={plan}
            />
          ))}
        </div>
      )}
    </main>
  );
}