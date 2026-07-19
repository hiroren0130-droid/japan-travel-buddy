"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/firebase";
import {
  getTravelPlans,
  deleteTravelPlan,
} from "@/lib/firestore";

type SavedPlan = {
  id: string;
  title: string;
  summary?: string;
  createdAt?: {
    seconds: number;
  };
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
      <h1 className="mb-8 text-3xl font-bold">
        📁 マイ旅行プラン
      </h1>

      {plans.length === 0 ? (
        <p>保存された旅行プランはありません。</p>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl border bg-white p-5 shadow-sm"
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
                  {new Date(
                    plan.createdAt.seconds * 1000
                  ).toLocaleDateString("ja-JP")}
                </p>
              )}

              <div className="mt-4 flex gap-3">
                <Link
                  href={`/mypage/${plan.id}`}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  詳細を見る
                </Link>

                <button
                  onClick={() => handleDelete(plan.id)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  削除
                </button>

                <Link
                  href="/"
                  className="rounded-lg border px-4 py-2 hover:bg-gray-100"
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