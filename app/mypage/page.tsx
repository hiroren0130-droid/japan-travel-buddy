"use client";

import { useEffect, useState } from "react";
import MyPageHeader from "@/components/mypage/MyPageHeader";
import MyPageEmpty from "@/components/mypage/MyPageEmpty";
import MyPageGrid from "@/components/mypage/MyPageGrid";
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
    <MyPageHeader count={plans.length} />

    {plans.length === 0 ? (
      <MyPageEmpty />
    ) : (
      <MyPageGrid
        plans={plans}
        onDelete={handleDelete}
      />
    )}
  </main>
);
}