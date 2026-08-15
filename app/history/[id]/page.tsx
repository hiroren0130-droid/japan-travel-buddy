"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

import TravelPlanCard from "@/components/TravelPlanCard";
import { auth } from "@/lib/firebase";
import { getTravelPlan } from "@/lib/firestore";
import { useLocale } from "@/components/LocaleProvider";
import { TravelPlan } from "@/types/travel";

const CONTROL_CHARACTER_PATTERN =
  /[\u0000-\u001f\u007f-\u009f]/;

function validatePlanId(value: string | string[] | undefined) {
  if (
    typeof value !== "string" ||
    !value ||
    value !== value.trim() ||
    value.length > 200 ||
    value.includes("/") ||
    CONTROL_CHARACTER_PATTERN.test(value) ||
    value === "." ||
    value === ".."
  ) {
    return null;
  }

  return value;
}

function isOwnedTravelPlan(
  value: unknown,
  uid: string
): value is TravelPlan & { uid: string } {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const plan = value as Record<string, unknown>;

  return (
    typeof plan.uid === "string" &&
    plan.uid === uid &&
    typeof plan.title === "string" &&
    typeof plan.summary === "string" &&
    Array.isArray(plan.days)
  );
}

export default function HistoryDetailPage() {
  const historyDetailMessages =
    useLocale().messages.historyDetail;
  const params = useParams();
  const router = useRouter();
  const validatedId = validatePlanId(params.id);

  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let requestGeneration = 0;

    if (!validatedId) {
      alert(historyDetailMessages.invalidIdAlert);
      router.replace("/history");

      return () => {
        active = false;
        requestGeneration++;
      };
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;

      const generation = ++requestGeneration;
      setPlan(null);
      setLoading(true);

      if (!user) {
        setLoading(false);
        router.replace("/login");
        return;
      }

      const uid = user.uid;
      const requestedId = validatedId;

      try {
        const result = await getTravelPlan(requestedId);

        if (
          !active ||
          generation !== requestGeneration ||
          auth.currentUser?.uid !== uid ||
          validatedId !== requestedId
        ) {
          return;
        }

        if (!isOwnedTravelPlan(result, uid)) {
          alert(historyDetailMessages.loadFailedAlert);
          router.replace("/history");
          return;
        }

        setPlan(result);
      } catch (error) {
        if (
          !active ||
          generation !== requestGeneration ||
          auth.currentUser?.uid !== uid ||
          validatedId !== requestedId
        ) {
          return;
        }

        if (process.env.NODE_ENV === "development") {
          console.error("旅行プラン取得エラー:", error);
        } else {
          console.error("Travel plan loading failed.");
        }

        alert(historyDetailMessages.loadFailedAlert);
        router.replace("/history");
      } finally {
        if (
          active &&
          generation === requestGeneration &&
          auth.currentUser?.uid === uid &&
          validatedId === requestedId
        ) {
          setLoading(false);
        }
      }
    }, (error) => {
      if (!active) return;

      requestGeneration++;
      setPlan(null);
      setLoading(false);

      if (process.env.NODE_ENV === "development") {
        console.error("認証状態確認エラー:", error);
      } else {
        console.error("Authentication state check failed.");
      }

      alert(historyDetailMessages.authFailedAlert);
    });

    return () => {
      active = false;
      requestGeneration++;
      unsubscribe();
    };
  }, [
    historyDetailMessages.authFailedAlert,
    historyDetailMessages.invalidIdAlert,
    historyDetailMessages.loadFailedAlert,
    router,
    validatedId,
  ]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl p-8">
        <p>{historyDetailMessages.loading}</p>
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="mx-auto max-w-6xl p-8">
        <h1 className="text-2xl font-bold">{historyDetailMessages.notFoundTitle}</h1>
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
    {historyDetailMessages.backToDashboard}
  </Link>

  <TravelPlanCard plan={plan} />
</div>
    </main>
  );
}
