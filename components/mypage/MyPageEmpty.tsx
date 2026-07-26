"use client";

import Link from "next/link";

export default function MyPageEmpty() {
  return (
    <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
      <p className="mb-6 text-gray-600">
        保存された旅行プランはありません。
      </p>

      <Link
        href="/"
        className="inline-flex rounded-lg bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        AIで旅行プランを作成する
      </Link>
    </div>
  );
}