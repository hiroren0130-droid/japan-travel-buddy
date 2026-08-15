"use client";

import { useLocale } from "@/components/LocaleProvider";

export type FavoriteSortType =
  | "newest"
  | "oldest"
  | "title";

export interface FavoriteSortProps {
  value: FavoriteSortType;
  onChange: (value: FavoriteSortType) => void;
}

export default function FavoriteSort({
  value,
  onChange,
}: FavoriteSortProps) {
  const favoriteSortMessages =
    useLocale().messages.favoriteSort;
  return (
    <div className="mb-6 flex justify-end">
      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value as FavoriteSortType)
        }
        className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <option value="newest">{favoriteSortMessages.newest}</option>
        <option value="oldest">{favoriteSortMessages.oldest}</option>
        <option value="title">{favoriteSortMessages.title}</option>
      </select>
    </div>
  );
}
