"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { auth } from "@/lib/firebase";
import {
  deleteTravelPlan,
  getTravelPlans,
} from "@/lib/firestore";
import { SavedTravelPlan } from "@/types/travel";

export default function HistoryPage() {
  const [plans, setPlans] = useState<SavedTravelPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlans() {
      const user = auth.currentUser;

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const result = await getTravelPlans(user.uid);
        setPlans(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadPlans();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("この旅行プランを削除しますか？")) {
      return;
    }

    try {
      await deleteTravelPlan(id);

      setPlans((prev) => prev.filter((plan) => plan.id !== id));
    } catch (error) {
      console.error(error);
      alert("削除に失敗しました。");
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <p>読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-8 text-3xl font-bold">
        📚 保存した旅行プラン
      </h1>
      <p className="mt-2 text-gray-500">
  保存件数：{plans.length}件
</p>
      {plans.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center">
          <p className="text-gray-500">
            保存された旅行プランはありません。
          </p>

          <Link
            href="/chat"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            AIで旅行プランを作成する
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold">
                {plan.title}
              </h2>

              <p className="mt-3 text-gray-600">
                {plan.summary}
              </p>

              <div className="mt-6 flex gap-3">
  <Link
    href={`/history/${plan.id}`}
    className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
  >
    開く
  </Link>

  <button
    onClick={() => handleDelete(plan.id)}
    className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
  >
    削除
  </button>
</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}