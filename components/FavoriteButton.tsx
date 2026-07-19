"use client";

import { useState } from "react";

type Props = {
  text: string;
};

export default function FavoriteButton({ text }: Props) {
  const [saved, setSaved] = useState(false);

  const saveFavorite = () => {
    const favorites = JSON.parse(
      localStorage.getItem("travelFavorites") || "[]"
    );

    favorites.unshift({
      id: Date.now(),
      text,
      createdAt: new Date().toISOString(),
    });

    localStorage.setItem(
      "travelFavorites",
      JSON.stringify(favorites)
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  return (
    <button
      onClick={saveFavorite}
      className="rounded-lg bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
    >
      {saved ? "⭐ 保存しました" : "⭐ お気に入り"}
    </button>
  );
}