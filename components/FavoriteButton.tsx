"use client";

import { useState } from "react";
import { Heart, Check } from "lucide-react";

import { useLocale } from "@/components/LocaleProvider";

type Props = {
  text: string;
};

type Favorite = {
  id: number;
  text: string;
  createdAt: string;
};

export default function FavoriteButton({
  text,
}: Props) {
  const { messages: defaultMessages } = useLocale();
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

    window.setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  return (
    <button
      type="button"
      onClick={saveFavorite}
      aria-label={
        saved
          ? defaultMessages.favoriteButton.savedAriaLabel
          : defaultMessages.favoriteButton.saveAriaLabel
      }
      title={
        saved
          ? defaultMessages.favoriteButton.savedLabel
          : defaultMessages.favoriteButton.favoriteLabel
      }
      className="
        group
        relative
        flex
        h-12
        w-12
        shrink-0
        items-center
        justify-center
        rounded-full
        border
        border-white/25
        bg-white/15
        text-white
        shadow-sm
        backdrop-blur-md
        transition-all
        duration-300
        hover:-translate-y-0.5
        hover:border-white/40
        hover:bg-white/25
        hover:shadow-lg
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-white/70
        active:translate-y-0
      "
    >
      {saved ? (
        <Check
          size={20}
          strokeWidth={2.4}
          aria-hidden="true"
        />
      ) : (
        <Heart
          size={20}
          strokeWidth={2.2}
          aria-hidden="true"
          className="transition-transform duration-300 group-hover:scale-110"
        />
      )}

      <span className="sr-only">
        {saved
          ? defaultMessages.favoriteButton.savedLabel
          : defaultMessages.favoriteButton.favoriteLabel}
      </span>
    </button>
  );
}
