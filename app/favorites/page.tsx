"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import FavoriteHeader from "@/components/favorite/FavoriteHeader";
import FavoriteGrid from "@/components/favorite/FavoriteGrid";
import FavoriteEmpty from "@/components/favorite/FavoriteEmpty";
import FavoriteSearch from "@/components/favorite/FavoriteSearch";
import FavoriteSort, {
  FavoriteSortType,
} from "@/components/favorite/FavoriteSort";
import { useLocale } from "@/components/LocaleProvider";
import TravelPlanCard from "@/components/TravelPlanCard";

import {
  getFavoriteItems,
  removeFavorite,
} from "@/lib/favorites";
import { getIntlLocale } from "@/lib/locale";

import type { TravelPlan } from "@/types/travel";

export default function FavoritesPage() {
  const { locale } = useLocale();
  const intlLocale = getIntlLocale(locale);
  const router = useRouter();
  const [favorites, setFavorites] = useState<
    ReturnType<typeof getFavoriteItems>
  >([]);
  const [selectedPlanTitle, setSelectedPlanTitle] =
    useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] =
    useState<FavoriteSortType>("newest");

  useEffect(() => {
    function syncSelectedPlanFromUrl() {
      const planTitle = new URLSearchParams(
        window.location.search
      ).get("plan");

      setSelectedPlanTitle(planTitle || null);
    }

    const timeoutId = window.setTimeout(() => {
      setFavorites(getFavoriteItems());
      syncSelectedPlanFromUrl();
    }, 0);
    window.addEventListener(
      "popstate",
      syncSelectedPlanFromUrl
    );

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(
        "popstate",
        syncSelectedPlanFromUrl
      );
    };
  }, []);

  function handleRemove(plan: TravelPlan) {
    removeFavorite(plan.title);
    setFavorites(getFavoriteItems());
  }

  function handleCardClick(plan: TravelPlan) {
    const searchParams = new URLSearchParams();
    searchParams.set("plan", plan.title);

    setSelectedPlanTitle(plan.title);
    router.push(`/favorites?${searchParams.toString()}`);
  }

  function handleBackToFavorites() {
    window.history.pushState(null, "", "/favorites");
    setSelectedPlanTitle(null);
  }

  const selectedPlan = selectedPlanTitle
    ? favorites.find(
        (favorite) =>
          favorite.plan.title === selectedPlanTitle
      )?.plan
    : undefined;

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
          a.plan.title.localeCompare(b.plan.title, intlLocale)
        );
        break;

      default:
        list.sort((a, b) => b.savedAt - a.savedAt);
    }

    return list.map((item) => item.plan);
  }, [favorites, intlLocale, search, sort]);

  if (selectedPlan) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <button
          type="button"
          onClick={handleBackToFavorites}
          className="mb-6 rounded-lg bg-gray-200 px-4 py-2 font-semibold transition hover:bg-gray-300"
        >
          {locale === "en"
            ? "Back to favorites"
            : "お気に入り一覧に戻る"}
        </button>

        <TravelPlanCard plan={selectedPlan} />
      </main>
    );
  }

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
