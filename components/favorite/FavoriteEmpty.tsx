"use client";

import { Heart } from "lucide-react";
import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const favoriteEmptyMessages = getMessages(DEFAULT_LOCALE).favoriteEmpty;

export default function FavoriteEmpty() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
      <Heart className="mb-4 h-16 w-16 fill-gray-300 text-gray-300" />

      <h2 className="text-2xl font-semibold text-gray-700">
        {favoriteEmptyMessages.title}
      </h2>

      <p className="mt-3 max-w-md text-gray-500">
        {favoriteEmptyMessages.description}
      </p>
    </div>
  );
}
