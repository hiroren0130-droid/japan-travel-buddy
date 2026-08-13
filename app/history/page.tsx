"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

import HistoryHeader from "@/components/history/HistoryHeader";
import HistoryEmpty from "@/components/history/HistoryEmpty";
import HistoryGrid from "@/components/history/HistoryGrid";
import HistorySearch from "@/components/history/HistorySearch";
import HistorySort from "@/components/history/HistorySort";
import HistoryViewToggle from "@/components/history/HistoryViewToggle";

import { auth } from "@/lib/firebase";
import {
  deleteTravelPlan,
  getTravelPlans,
} from "@/lib/firestore";
import { SavedTravelPlan } from "@/types/travel";

export default function HistoryPage() {
  const router = useRouter();

  const [plans, setPlans] = useState<SavedTravelPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    let active = true;
    let requestGeneration = 0;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;

      const generation = ++requestGeneration;
      setPlans([]);
      setLoading(true);

      if (!user) {
        setLoading(false);
        router.replace("/login");
        return;
      }

      const uid = user.uid;

      try {
        const result = await getTravelPlans(uid);

        if (
          active &&
          generation === requestGeneration &&
          auth.currentUser?.uid === uid
        ) {
          setPlans(result);
        }
      } catch (error) {
        if (
          !active ||
          generation !== requestGeneration ||
          auth.currentUser?.uid !== uid
        ) {
          return;
        }

        if (process.env.NODE_ENV === "development") {
          console.error("旅行履歴取得エラー:", error);
        } else {
          console.error("Travel history loading failed.");
        }

        alert("旅行履歴を読み込めませんでした。");
      } finally {
        if (
          active &&
          generation === requestGeneration &&
          auth.currentUser?.uid === uid
        ) {
          setLoading(false);
        }
      }
    }, (error) => {
      if (!active) return;

      requestGeneration++;
      setPlans([]);
      setLoading(false);

      if (process.env.NODE_ENV === "development") {
        console.error("認証状態確認エラー:", error);
      } else {
        console.error("Authentication state check failed.");
      }

      alert("認証状態を確認できませんでした。ページを再読み込みしてください。");
    });

    return () => {
      active = false;
      requestGeneration++;
      unsubscribe();
    };
  }, [router]);

  async function handleDelete(id: string) {
    if (!confirm("この旅行プランを削除しますか？")) {
      return;
    }

    try {
      await deleteTravelPlan(id);

      setPlans((prev) => prev.filter((plan) => plan.id !== id));
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("旅行プラン削除エラー:", error);
      } else {
        console.error("Travel plan deletion failed.");
      }

      alert("旅行プランを削除できませんでした。");
    }
  }

  const filteredPlans = [...plans]
    .filter((plan) => {
      const keyword = search.toLowerCase();

      return (
        plan.title.toLowerCase().includes(keyword) ||
        plan.summary.toLowerCase().includes(keyword)
      );
    })
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis() ?? 0;
      const bTime = b.createdAt?.toMillis() ?? 0;

      return sort === "newest"
        ? bTime - aTime
        : aTime - bTime;
    });

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <p>読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <HistoryHeader count={plans.length} />

      <HistorySearch
        value={search}
        onChange={setSearch}
      />

      <HistoryViewToggle
        view={view}
        onChange={setView}
      />

      <HistorySort
        value={sort}
        onChange={setSort}
      />

      {filteredPlans.length === 0 ? (
        <HistoryEmpty />
      ) : (
        <HistoryGrid
  plans={filteredPlans}
  view={view}
  onDelete={handleDelete}
        />
      )}
    </main>
  );
}
