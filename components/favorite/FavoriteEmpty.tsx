"use client";

import { Heart } from "lucide-react";

export default function FavoriteEmpty() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
      <Heart className="mb-4 h-16 w-16 fill-gray-300 text-gray-300" />

      <h2 className="text-2xl font-semibold text-gray-700">
        お気に入りはまだありません
      </h2>

      <p className="mt-3 max-w-md text-gray-500">
        気に入った旅行プランを保存すると、
        ここからいつでも見返すことができます。
      </p>
    </div>
  );
}