"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

import FavoriteHeader from "@/components/favorite/FavoriteHeader";
import FavoriteGrid from "@/components/favorite/FavoriteGrid";
import FavoriteEmpty from "@/components/favorite/FavoriteEmpty";
import FavoriteSearch from "@/components/favorite/FavoriteSearch";
import FavoriteSort, {
  FavoriteSortType,
} from "@/components/favorite/FavoriteSort";
import { useLocale } from "@/components/LocaleProvider";
import TravelPlanCard from "@/components/TravelPlanCard";

import { getTravelPlans, updateTravelPlan } from "@/lib/firestore";
import { getIntlLocale } from "@/lib/locale";

import type { SavedTravelPlan, TravelPlan } from "@/types/travel";

export default function FavoritesPage() {
  const { locale, messages } = useLocale();
  const intlLocale = getIntlLocale(locale);
  const router = useRouter();
  const [favorites, setFavorites] = useState<
    Array<{ plan: SavedTravelPlan; savedAt: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const requestGeneration = useRef(0);
  const removing = useRef(new Set<string>());
  const [selectedPlanId, setSelectedPlanId] =
    useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] =
    useState<FavoriteSortType>("newest");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const generation = ++requestGeneration.current;
      setFavorites([]);
      setLoading(true);
      setLoadFailed(false);
      removing.current.clear();
      if (!user) {
        router.replace("/login");
        return;
      }
      try {
        const plans = await getTravelPlans(user.uid);
        if (generation !== requestGeneration.current || auth.currentUser?.uid !== user.uid) return;
        setFavorites(plans.filter((plan) => plan.favorite === true).map((plan) => ({
          plan,
          savedAt: plan.createdAt?.toMillis() ?? 0,
        })));
      } catch {
        if (generation !== requestGeneration.current || auth.currentUser?.uid !== user.uid) return;
        setLoadFailed(true);
      } finally {
        if (generation === requestGeneration.current && auth.currentUser?.uid === user.uid) setLoading(false);
      }
    }, () => {
      requestGeneration.current += 1;
      setFavorites([]);
      setLoadFailed(true);
      setLoading(false);
    });
    return () => {
      requestGeneration.current += 1;
      unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    function syncSelectedPlanFromUrl() {
      const planId = new URLSearchParams(
        window.location.search
      ).get("plan");

      setSelectedPlanId(planId || null);
    }

    const timeoutId = window.setTimeout(() => {
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

  function handleFavoriteChange(id: string, favorite: boolean) {
    if (!favorite) setFavorites((current) => current.filter((item) => item.plan.id !== id));
  }

  async function handleRemove(plan: TravelPlan) {
    const savedPlan = favorites.find((item) => item.plan === plan)?.plan;
    const user = auth.currentUser;
    if (!savedPlan || !user || removing.current.has(savedPlan.id)) return;
    const generation = requestGeneration.current;
    removing.current.add(savedPlan.id);
    try {
      await updateTravelPlan(savedPlan.id, { favorite: false });
      if (generation !== requestGeneration.current || auth.currentUser?.uid !== user.uid) return;
      handleFavoriteChange(savedPlan.id, false);
    } catch {
      if (generation === requestGeneration.current && auth.currentUser?.uid === user.uid) {
        alert(messages.dashboard.alerts.favoriteFailed);
      }
    } finally {
      if (generation === requestGeneration.current) removing.current.delete(savedPlan.id);
    }
  }

  function handleCardClick(plan: TravelPlan) {
    const savedPlan = favorites.find((item) => item.plan === plan)?.plan;
    if (!savedPlan) return;
    const searchParams = new URLSearchParams();
    searchParams.set("plan", savedPlan.id);

    setSelectedPlanId(savedPlan.id);
    router.push(`/favorites?${searchParams.toString()}`);
  }

  function handleBackToFavorites() {
    window.history.pushState(null, "", "/favorites");
    setSelectedPlanId(null);
  }

  const selectedPlan = selectedPlanId
    ? favorites.find(
        (favorite) =>
          favorite.plan.id === selectedPlanId
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

  if (loading || loadFailed) {
    return <main className="mx-auto max-w-6xl p-6"><p role="status">{loading
      ? messages.myPageDetail.loading
      : messages.dashboard.alerts.loadFailed}</p></main>;
  }

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

        <TravelPlanCard key={selectedPlan.id} plan={selectedPlan} savedPlanId={selectedPlan.id} onFavoriteChange={handleFavoriteChange} />
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
