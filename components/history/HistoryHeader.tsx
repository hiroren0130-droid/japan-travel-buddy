"use client";

import { BookOpen } from "lucide-react";

type Props = {
  count: number;
};

export default function HistoryHeader({ count }: Props) {
  return (
    <div className="mb-8">
      <h1 className="flex items-center gap-2 text-3xl font-bold">
        <BookOpen className="h-8 w-8 text-blue-600" />
        保存した旅行プラン
      </h1>

      <p className="mt-2 text-gray-500">
  {count === 0
    ? "保存した旅行プランはありません"
    : `保存件数：${count}件`}
</p>
    </div>
  );
}