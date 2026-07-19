import { TravelPlan } from "@/types/travel";

const STORAGE_KEY = "favorite-travel-plans";

export function getFavorites(): TravelPlan[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);

    return data ? (JSON.parse(data) as TravelPlan[]) : [];
  } catch {
    return [];
  }
}

export function isFavorite(title: string): boolean {
  return getFavorites().some((plan) => plan.title === title);
}

export function saveFavorite(plan: TravelPlan) {
  const favorites = getFavorites();

  if (!favorites.some((p) => p.title === plan.title)) {
    favorites.push(plan);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }
}

export function removeFavorite(title: string) {
  const favorites = getFavorites().filter(
    (plan) => plan.title !== title
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}