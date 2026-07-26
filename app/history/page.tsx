"use client";

import { useEffect, useState } from "react";

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
  const [plans, setPlans] = useState<SavedTravelPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [view, setView] = useState<"grid" | "list">("grid");

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