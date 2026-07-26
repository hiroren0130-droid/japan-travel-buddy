"use client";

import { useMemo, useState } from "react";

import FavoriteHeader from "@/components/favorite/FavoriteHeader";
import FavoriteGrid from "@/components/favorite/FavoriteGrid";
import FavoriteEmpty from "@/components/favorite/FavoriteEmpty";
import FavoriteSearch from "@/components/favorite/FavoriteSearch";
import FavoriteSort, {
  FavoriteSortType,
} from "@/components/favorite/FavoriteSort";

import {
  getFavoriteItems,
  removeFavorite,
} from "@/lib/favorites";

import type { TravelPlan } from "@/types/travel";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState(getFavoriteItems());
  const [search, setSearch] = useState("");
  const [sort, setSort] =
    useState<FavoriteSortType>("newest");

  

  function handleRemove(plan: TravelPlan) {
    removeFavorite(plan.title);
    setFavorites(getFavoriteItems());
  }

  function handleCardClick(plan: TravelPlan) {
    console.log(plan.title);

    // router.push(...)
  }

  const filteredFavorites = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const list = favorites.filter((item) => {
      if (!keyword) return true;

      return (
        item.plan.title.toLowerCase().includes(keyword) ||
        item.plan.summary.toLowerCase().includes(keyword)
      );
    });

    switch (sort) {
      case "oldest":
        list.sort((a, b) => a.savedAt - b.savedAt);
        break;

      case "title":
        list.sort((a, b) =>
          a.plan.title.localeCompare(b.plan.title, "ja")
        );
        break;

      default:
        list.sort((a, b) => b.savedAt - a.savedAt);
    }

    return list.map((item) => item.plan);
  }, [favorites, search, sort]);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <FavoriteHeader count={favorites.length} />

      {favorites.length > 0 && (
        <>
          <FavoriteSearch
            value={search}
            onChange={setSearch}
          />

          <FavoriteSort
            value={sort}
            onChange={setSort}
          />
        </>
      )}

      {filteredFavorites.length === 0 ? (
        <FavoriteEmpty />
      ) : (
        <FavoriteGrid
          favorites={filteredFavorites}
          onCardClick={handleCardClick}
          onRemove={handleRemove}
        />
      )}
    </main>
  );
}