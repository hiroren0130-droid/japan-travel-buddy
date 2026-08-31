"use client";

import { SavedTravelPlan } from "@/types/travel";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getTravelPlans,
  deleteTravelPlan,
  updateTravelPlan,
} from "@/lib/firestore";
import { useLocale } from "@/components/LocaleProvider";
import { getIntlLocale } from "@/lib/locale";
import { createTravelPlanShareText } from "@/lib/travelPlanExport";
import { clearAdminSession } from "@/lib/auth/client-logout";
import Link from "next/link";

export default function DashboardPage() {
  const { locale, messages } = useLocale();
  const dashboardMessages = messages.dashboard;
  const intlLocale = getIntlLocale(locale);
  const router = useRouter();

  const [plans, setPlans] = useState<SavedTravelPlan[]>([]);

  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const explicitLogoutRef = useRef(false);

  useEffect(() => {
  let active = true;
  let requestGeneration = 0;

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!active) return;

    const generation = ++requestGeneration;
    setPlans([]);

    if (!user) {
      if (explicitLogoutRef.current) {
        return;
      }

      router.replace("/login");
      return;
    }

    const uid = user.uid;

    try {
      const savedPlans = await getTravelPlans(uid);

      if (
        active &&
        generation === requestGeneration &&
        auth.currentUser?.uid === uid
      ) {
        setPlans(savedPlans);
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
        console.error("旅行プラン取得エラー:", error);
      } else {
        console.error("Travel plan loading failed.");
      }

      alert(dashboardMessages.alerts.loadFailed);
    }
  }, (error) => {
    if (!active) return;

    requestGeneration++;
    setPlans([]);

    if (process.env.NODE_ENV === "development") {
      console.error("認証状態確認エラー:", error);
    } else {
      console.error("Authentication state check failed.");
    }

    alert(dashboardMessages.alerts.authFailed);
  });

  return () => {
    active = false;
    requestGeneration++;
    unsubscribe();
  };
}, [
  dashboardMessages.alerts.authFailed,
  dashboardMessages.alerts.loadFailed,
  router,
]);

  const handleLogout = async () => {
    if (loggingOut) return;

    explicitLogoutRef.current = true;
    setLoggingOut(true);

    try {
      const adminSessionCleared = await clearAdminSession();
      await signOut(auth);

      router.replace(
        adminSessionCleared ? "/login" : "/logout-incomplete"
      );
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("ログアウトエラー:", error);
      } else {
        console.error("Logout failed.");
      }

      alert(dashboardMessages.alerts.logoutFailed);
    } finally {
      explicitLogoutRef.current = false;
      setLoggingOut(false);
    }
  };

  const handleDelete = async (id: string) => {
  if (!confirm(dashboardMessages.deleteConfirm)) {
    return;
  }

  try {
    await deleteTravelPlan(id);

    setPlans((prev) =>
      prev.filter((plan) => plan.id !== id)
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("削除エラー:", error);
    } else {
      console.error("Travel plan deletion failed.");
    }

    alert(dashboardMessages.alerts.deleteFailed);
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
    if (process.env.NODE_ENV === "development") {
      console.error("お気に入り更新エラー:", error);
    } else {
      console.error("Favorite update failed.");
    }

    alert(dashboardMessages.alerts.favoriteFailed);
  }
};

async function handleShare(plan: SavedTravelPlan) {
  const shareText = createTravelPlanShareText(plan, locale);

  try {
    if (navigator.share) {
      await navigator.share({
        title: plan.title,
        text: shareText,
      });
    } else {
      await navigator.clipboard.writeText(shareText);
      alert(dashboardMessages.alerts.copySuccess);
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return;
    }

    if (process.env.NODE_ENV === "development") {
      console.error("共有エラー:", error);
    } else {
      console.error("Sharing failed.");
    }

    alert(dashboardMessages.alerts.shareFailed);
  }
}

  return (
  <main className="min-h-screen bg-gray-100">
    <div className="mx-auto max-w-6xl p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold sm:text-4xl">
          {dashboardMessages.title}
        </h1>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="rounded-lg bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
        >
          {loggingOut ? dashboardMessages.loggingOut : dashboardMessages.logout}
        </button>
      </div>

      <p className="mt-4 text-gray-600">
        {messages.appName}{dashboardMessages.welcomeSuffix}
      </p>

      <div className="mt-8 rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-2xl font-semibold">
          {dashboardMessages.savedPlansTitle}
        </h2>

        <button
  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
  className="mb-4 rounded-lg bg-gray-700 px-4 py-2 text-white hover:bg-gray-800"
>
  {showFavoritesOnly
    ? dashboardMessages.showAll
    : dashboardMessages.favoritesOnly}
</button>

<input
  type="text"
  placeholder={dashboardMessages.searchPlaceholder}
  value={searchText}
  onChange={(e) => setSearchText(e.target.value)}
  className="mb-4 w-full rounded-lg border p-3"
/>

        {plans.length === 0 ? (
          <p className="text-gray-500">
            {dashboardMessages.emptyMessage}
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
    {dashboardMessages.createdAtLabel}
    {plan.createdAt.toDate().toLocaleDateString(intlLocale)}
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
  aria-label={
    plan.favorite
      ? dashboardMessages.removeFavoriteAriaLabel
      : dashboardMessages.addFavoriteAriaLabel
  }
  aria-pressed={plan.favorite ?? false}
  className={`w-full rounded-lg border px-4 py-2 font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto sm:min-w-[130px] ${
    plan.favorite
      ? "border-slate-900 bg-blue-900 text-amber-300 hover:bg-blue-800 focus:ring-slate-500"
      : "border-amber-400 bg-white text-amber-600 hover:bg-amber-50 focus:ring-amber-400"
  }`}
>
  {plan.favorite ? "⭐" : "☆"}
</button>

  <button
    onClick={() => handleDelete(plan.id)}
    className="w-full sm:min-w-[130px] sm:w-auto rounded-lg bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
  >
    {dashboardMessages.deleteLabel}
  </button>

  <button
  onClick={() => router.push(`/history/${plan.id}/edit`)}
  className="w-full sm:min-w-[130px] sm:w-auto rounded-lg bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
>
  {dashboardMessages.editLabel}
</button>

<button
  onClick={() => handleShare(plan)}
  className="w-full sm:min-w-[130px] sm:w-auto rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
>
  {dashboardMessages.shareLabel}
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
