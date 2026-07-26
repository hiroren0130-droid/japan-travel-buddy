"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import TravelPlanCard from "@/components/TravelPlanCard";
import { getTravelPlan } from "@/lib/firestore";
import { TravelPlan } from "@/types/travel";

export default function HistoryDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlan() {
      try {
        const result = await getTravelPlan(id);
        setPlan(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadPlan();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl p-8">
        <p>読み込み中...</p>
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="mx-auto max-w-6xl p-8">
        <h1 className="text-2xl font-bold">旅行プランが見つかりません</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-6xl p-4">
  <Link
    href="/dashboard"
    className="mb-4 inline-block rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
  >
    ← Dashboardへ戻る
  </Link>

  <TravelPlanCard plan={plan} />
</div>
    </main>
  );
}