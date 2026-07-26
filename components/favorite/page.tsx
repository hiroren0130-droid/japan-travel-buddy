"use client";

import { useMemo, useState } from "react";
import FavoriteHeader from "@/components/favorite/FavoriteHeader";
import FavoriteGrid from "@/components/favorite/FavoriteGrid";
import FavoriteEmpty from "@/components/favorite/FavoriteEmpty";
import FavoriteSearch from "@/components/favorite/FavoriteSearch";
import FavoriteViewToggle, {
  FavoriteViewType,
} from "@/components/favorite/FavoriteViewToggle";

import { getFavorites, removeFavorite } from "@/lib/favorites";
import type { TravelPlan } from "@/types/travel";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<TravelPlan[]>(
  () => getFavorites()
);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<FavoriteViewType>("grid");

  
  function handleRemove(plan: TravelPlan) {
    removeFavorite(plan.title);
    setFavorites(getFavorites());
  }

  function handleCardClick() {
  // 今後ここで詳細画面へ遷移
}

  const filteredFavorites = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return favorites;

    return favorites.filter(
  (plan) =>
    plan.title.toLowerCase().includes(keyword) ||
    (plan.summary ?? "").toLowerCase().includes(keyword)
);
  }, [favorites, search]);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <FavoriteHeader count={favorites.length} />

      {favorites.length > 0 && (
  <>
    <FavoriteSearch
      value={search}
      onChange={setSearch}
    />

    <FavoriteViewToggle
      value={view}
      onChange={setView}
    />
  </>
)}

      {filteredFavorites.length === 0 ? (
        <FavoriteEmpty />
      ) : (
        <FavoriteGrid
  favorites={filteredFavorites}
  view={view}
  onCardClick={handleCardClick}
  onRemove={handleRemove}
/>
      )}
    </main>
  );
}