"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { Timestamp } from "firebase/firestore";

import { auth } from "@/lib/firebase";
import {
  getTravelPlans,
  deleteTravelPlan,
} from "@/lib/firestore";

import { SavedTravelPlan } from "@/types/travel";

type SavedPlan = SavedTravelPlan & {
  createdAt?: Timestamp;
};

export default function MyPage() {
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setPlans([]);
        setLoading(false);
        return;
      }

      try {
        const result = await getTravelPlans(user.uid);
        setPlans(result as SavedPlan[]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function handleDelete(id: string) {
    const ok = confirm("この旅行プランを削除しますか？");

    if (!ok) return;

    try {
      await deleteTravelPlan(id);

      setPlans((prev) => prev.filter((plan) => plan.id !== id));

      alert("削除しました。");
    } catch (error) {
      console.error(error);
      alert("削除に失敗しました。");
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <p>読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-bold">
  📁 マイ旅行プラン
</h1>

<p className="mb-8 mt-2 text-gray-500">
  保存件数：{plans.length}件
</p>

      {plans.length === 0 ? (
        <p>保存された旅行プランはありません。</p>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <h2 className="text-xl font-bold">
                {plan.title}
              </h2>

              {plan.summary && (
                <p className="mt-2 text-gray-600">
                  {plan.summary}
                </p>
              )}

              {plan.createdAt && (
                <p className="mt-3 text-sm text-gray-500">
                  作成日：
                  {plan.createdAt.toDate().toLocaleDateString("ja-JP")}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/mypage/${plan.id}`}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                >
                  詳細を見る
                </Link>

                <button
                  onClick={() => handleDelete(plan.id)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
                >
                  削除
                </button>

                <Link
                  href="/"
                  className="rounded-lg border px-4 py-2 transition hover:bg-gray-100"
                >
                  ホームへ戻る
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}