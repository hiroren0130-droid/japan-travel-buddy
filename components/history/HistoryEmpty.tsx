"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function HistoryEmpty() {
  return (
    <div className="rounded-xl border bg-white p-8 text-center">
      <BookOpen className="mx-auto h-14 w-14 fill-gray-300 text-gray-300" />

      <p className="mt-4 text-gray-500">
        保存された旅行プランはありません。
      </p>

      <Link
        href="/chat"
        className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        AIで旅行プランを作成する
      </Link>
    </div>
  );
}