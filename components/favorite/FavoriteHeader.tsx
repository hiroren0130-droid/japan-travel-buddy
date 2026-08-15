"use client";

import { Heart } from "lucide-react";
import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const favoriteHeaderMessages = getMessages(DEFAULT_LOCALE).favoriteHeader;

export interface FavoriteHeaderProps {
  count: number;
}

export default function FavoriteHeader({
  count,
}: FavoriteHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Heart className="h-8 w-8 fill-red-500 text-red-500" />
          {favoriteHeaderMessages.title}
        </h1>

        <p className="mt-2 text-gray-500">
  {count === 0
    ? favoriteHeaderMessages.emptyMessage
    : `${favoriteHeaderMessages.countPrefix}${count}${favoriteHeaderMessages.countSuffix}`}
</p>
      </div>
    </div>
  );
}
