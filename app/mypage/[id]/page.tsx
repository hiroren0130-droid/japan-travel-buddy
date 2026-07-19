"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";

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

        if (!data) {
          setPlan(null);
        } else {
          setPlan(data as TravelPlan);
        }
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
        <p className="text-center text-gray-500">読み込み中...</p>
      </main>
    );
  }

  if (!plan) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <TravelPlanCard plan={plan} />
    </main>
  );
}