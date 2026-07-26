import type { TravelPlan } from "@/types/travel";

const STORAGE_KEY = "favorite-travel-plans";

export interface FavoriteItem {
  plan: TravelPlan;
  savedAt: number;
}

export function getFavorites(): TravelPlan[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const favorites: FavoriteItem[] = JSON.parse(raw);

    return favorites
      .sort((a, b) => b.savedAt - a.savedAt)
      .map((item) => item.plan);
  } catch {
    return [];
  }
}

export function isFavorite(title: string): boolean {
  return getFavorites().some((plan) => plan.title === title);
}

export function saveFavorite(plan: TravelPlan) {
  const favorites = getFavoriteItems();

  if (favorites.some((item) => item.plan.title === plan.title)) {
    return;
  }

  favorites.unshift({
    plan,
    savedAt: Date.now(),
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

export function removeFavorite(title: string) {
  const favorites = getFavoriteItems().filter(
    (item) => item.plan.title !== title
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

export function getFavoriteItems(): FavoriteItem[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const data = JSON.parse(raw);

    // 新形式
    if (Array.isArray(data) && data[0]?.plan) {
      return data;
    }

    // 旧形式から自動変換
    if (Array.isArray(data)) {
      return data.map((plan: TravelPlan, index: number) => ({
        plan,
        savedAt: Date.now() - index,
      }));
    }

    return [];
  } catch {
    return [];
  }
}