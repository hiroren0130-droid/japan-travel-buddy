"use client";

import { FolderOpen } from "lucide-react";

type Props = {
  count: number;
};

export default function MyPageHeader({
  count,
}: Props) {
  return (
    <>
      <h1 className="flex items-center gap-2 text-3xl font-bold">
        <FolderOpen className="h-8 w-8 text-blue-600" />
        マイ旅行プラン
      </h1>

      <p className="mb-8 mt-2 text-gray-500">
        {count === 0
          ? "保存した旅行プランはありません"
          : `保存件数：${count}件`}
      </p>
    </>
  );
}