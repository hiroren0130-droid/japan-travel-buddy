"use client";

import { Heart } from "lucide-react";

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
          お気に入り
        </h1>

        <p className="mt-2 text-gray-500">
  {count === 0
    ? "保存した旅行プランはありません"
    : `保存した旅行プランは ${count} 件あります`}
</p>
      </div>
    </div>
  );
}