"use client";

import { useState } from "react";

type Props = {
  text: string;
};

type Favorite = {
  id: number;
  text: string;
  createdAt: string;
};

export default function FavoriteButton({ text }: Props) {
  const [saved, setSaved] = useState(false);

  const saveFavorite = () => {
    const trimmedText = text.trim();

    if (!trimmedText) return;

    let favorites: Favorite[] = [];

    try {
      favorites = JSON.parse(
        localStorage.getItem("travelFavorites") || "[]"
      );
    } catch {
      favorites = [];
    }

    // 同じ内容は重複保存しない
    const exists = favorites.some(
      (favorite) => favorite.text === trimmedText
    );

    if (!exists) {
      favorites.unshift({
        id: Date.now(),
        text: trimmedText,
        createdAt: new Date().toISOString(),
      });

      localStorage.setItem(
        "travelFavorites",
        JSON.stringify(favorites)
      );
    }

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  return (
    <button
      type="button"
      onClick={saveFavorite}
      aria-label="お気に入りに保存"
      className="rounded-lg bg-yellow-500 px-4 py-2 text-white transition-colors hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-300"
    >
      {saved ? "⭐ 保存しました" : "⭐ お気に入り"}
    </button>
  );
}