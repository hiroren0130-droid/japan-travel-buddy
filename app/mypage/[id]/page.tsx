"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import TravelPlanCard from "@/components/TravelPlanCard";
import type { TravelPlan } from "@/types/travel";
import { getTravelPlan } from "@/lib/firestore";

type Props = {
  params: {
    id: string;
  };
};

export default function TravelPlanDetailPage({ params }: Props) {
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlan() {
      try {
        const data = await getTravelPlan(params.id);
        setPlan(data);
      } catch (error) {
        console.error("旅行プラン取得エラー:", error);
        setPlan(null);
      } finally {
        setLoading(false);
      }
    }

    loadPlan();
  }, [params.id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <p className="text-center text-gray-500">
          読み込み中...
        </p>
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="mx-auto max-w-3xl p-6 text-center">
        <h1 className="mb-4 text-3xl font-bold">
          プランが見つかりません
        </h1>

        <p className="mb-8 text-gray-600">
          この旅行プランは削除されたか、
          存在しない可能性があります。
        </p>

        <Link
          href="/mypage"
          className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          マイページへ戻る
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <Link
          href="/mypage"
          className="text-blue-600 hover:underline"
        >
          ← マイページへ戻る
        </Link>
      </div>

      <TravelPlanCard plan={plan} />
    </main>
  );
}