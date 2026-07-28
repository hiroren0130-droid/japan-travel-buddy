"use client";

import { SavedTravelPlan } from "@/types/travel";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getTravelPlans,
  deleteTravelPlan,
  updateTravelPlan,
} from "@/lib/firestore";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();

  const [plans, setPlans] = useState<SavedTravelPlan[]>([]);

  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      router.replace("/login");
      return;
    }

    try {
      const savedPlans = await getTravelPlans(user.uid);
      setPlans(savedPlans);
    } catch (error) {
      console.error("旅行プラン取得エラー:", error);
    }
  });

  return () => unsubscribe();
}, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  };

  const handleDelete = async (id: string) => {
  if (!confirm("この旅行プランを削除しますか？")) {
    return;
  }

  try {
    await deleteTravelPlan(id);

    setPlans((prev) =>
      prev.filter((plan) => plan.id !== id)
    );
  } catch (error) {
    console.error("削除エラー:", error);
  }
};

const handleFavorite = async (
  id: string,
  favorite: boolean
) => {
  try {
    await updateTravelPlan(id, {
      favorite: !favorite,
    });

    setPlans((prev) =>
      prev.map((plan) =>
        plan.id === id
          ? {
              ...plan,
              favorite: !favorite,
            }
          : plan
      )
    );
  } catch (error) {
    console.error("お気に入り更新エラー:", error);
  }
};

async function handleShare(plan: SavedTravelPlan) {
  const shareText = `${plan.title}

${plan.summary}

Japan Travel Buddyで作成した旅行プラン`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: plan.title,
        text: shareText,
      });
    } else {
      await navigator.clipboard.writeText(shareText);
      alert("旅行プランをコピーしました。");
    }
  } catch (error) {
    console.error("共有エラー:", error);
  }
}

  return (
  <main className="min-h-screen bg-gray-100">
    <div className="mx-auto max-w-6xl p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold sm:text-4xl">
          マイページ
        </h1>

        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
        >
          ログアウト
        </button>
      </div>

      <p className="mt-4 text-gray-600">
        Japan Travel Buddy へようこそ！
      </p>

      <div className="mt-8 rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-2xl font-semibold">
          📚 保存済み旅行プラン
        </h2>

        <button
  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
  className="mb-4 rounded-lg bg-gray-700 px-4 py-2 text-white hover:bg-gray-800"
>
  {showFavoritesOnly
    ? "📚 すべて表示"
    : "⭐ お気に入りのみ"}
</button>

<input
  type="text"
  placeholder="旅行プランを検索..."
  value={searchText}
  onChange={(e) => setSearchText(e.target.value)}
  className="mb-4 w-full rounded-lg border p-3"
/>

        {plans.length === 0 ? (
          <p className="text-gray-500">
            保存された旅行プランはありません。
          </p>
        ) : (
          <div className="space-y-4">
            {plans
  .filter(
    (plan) =>
      !showFavoritesOnly || plan.favorite
  )
  .filter((plan) =>
    plan.title
      .toLowerCase()
      .includes(searchText.toLowerCase())
  )
  .map((plan) => (
              <div
  key={plan.id}
  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
>
  <Link
    href={`/history/${plan.id}`}
    className="block"
  >
    <h3 className="text-xl font-bold text-gray-800">
      {plan.title}
    </h3>

    <p className="mt-2 leading-relaxed text-gray-600">
      {plan.summary}
    </p>

    {plan.createdAt && (
  <p className="mt-3 text-sm text-gray-400">
    作成日：
    {plan.createdAt.toDate().toLocaleDateString("ja-JP")}
  </p>
)}
  </Link>
  <div className="mt-4 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
  <button
  onClick={() =>
    handleFavorite(
      plan.id,
      plan.favorite ?? false
    )
  }
  className="w-full sm:min-w-[130px] sm:w-auto rounded-lg bg-yellow-500 px-4 py-2 text-white transition hover:bg-yellow-600"
>
  {plan.favorite ? "⭐" : "☆"}
</button>

  <button
    onClick={() => handleDelete(plan.id)}
    className="w-full sm:min-w-[130px] sm:w-auto rounded-lg bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
  >
    🗑 削除
  </button>

  <button
  onClick={() => router.push(`/history/${plan.id}/edit`)}
  className="w-full sm:min-w-[130px] sm:w-auto rounded-lg bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
>
  ✏️ 編集
</button>

<button
  onClick={() => handleShare(plan)}
  className="w-full sm:min-w-[130px] sm:w-auto rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
>
  📤 共有
</button>

</div>

</div>

))}
          </div>
        )}
            </div>
    </div>
  </main>
);
}