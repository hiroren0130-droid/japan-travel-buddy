"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

import TravelPlanCard from "@/components/TravelPlanCard";
import type { TravelPlan } from "@/types/travel";
import { auth } from "@/lib/firebase";
import { getTravelPlan } from "@/lib/firestore";

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

export default function TravelPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const validatedId = validatePlanId(params.id);

  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let requestGeneration = 0;

    if (!validatedId) {
      alert("旅行プランのIDが不正です。");
      router.replace("/mypage");

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
        const data = await getTravelPlan(requestedId);

        if (
          !active ||
          generation !== requestGeneration ||
          auth.currentUser?.uid !== uid ||
          validatedId !== requestedId
        ) {
          return;
        }

        if (!isOwnedTravelPlan(data, uid)) {
          alert("旅行プランを読み込めませんでした。");
          router.replace("/mypage");
          return;
        }

        setPlan(data);
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

        alert("旅行プランを読み込めませんでした。");
        router.replace("/mypage");
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

      alert("認証状態を確認できませんでした。ページを再読み込みしてください。");
    });

    return () => {
      active = false;
      requestGeneration++;
      unsubscribe();
    };
  }, [router, validatedId]);

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
