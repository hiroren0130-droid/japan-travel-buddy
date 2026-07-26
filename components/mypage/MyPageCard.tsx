"use client";

import Link from "next/link";
import { Timestamp } from "firebase/firestore";

import { SavedTravelPlan } from "@/types/travel";

type SavedPlan = SavedTravelPlan & {
  createdAt?: Timestamp;
};

type Props = {
  plan: SavedPlan;
  onDelete: () => void;
};

export default function MyPageCard({
  plan,
  onDelete,
}: Props) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md">
      <h2 className="text-xl font-bold">
        {plan.title}
      </h2>

      <p className="mt-2 text-gray-600">
  {plan.summary || "旅行プランの概要はありません。"}
</p>

      {plan.createdAt && (
        <p className="mt-3 text-sm text-gray-500">
          作成日：
          {plan.createdAt
            .toDate()
            .toLocaleDateString("ja-JP")}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
  href={`/mypage/${plan.id}`}
  className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
>
  詳細を見る
</Link>

        <button
  type="button"
  onClick={onDelete}
          className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
        >
          削除
        </button>

        <Link
  href="/"
  className="rounded-lg border px-4 py-2 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
>
  ホームへ戻る
</Link>
      </div>
    </div>
  );
}