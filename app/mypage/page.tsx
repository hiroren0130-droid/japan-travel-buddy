"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

import { SavedTravelPlan } from "@/types/travel";

const myPageMessages = getMessages(DEFAULT_LOCALE).myPage;

type SavedPlan = SavedTravelPlan & {
  createdAt?: Timestamp;
};

const CONTROL_CHARACTER_PATTERN =
  /[\u0000-\u001f\u007f-\u009f]/;

function isValidPlanId(id: unknown): id is string {
  return (
    typeof id === "string" &&
    id.length > 0 &&
    id.length <= 200 &&
    !id.includes("/") &&
    !CONTROL_CHARACTER_PATTERN.test(id) &&
    id !== "." &&
    id !== ".."
  );
}

export default function MyPage() {
  const router = useRouter();

  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const deletingIdsRef = useRef(new Set<string>());

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
          setPlans(result as SavedPlan[]);
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
          console.error("保存済み旅行プラン取得エラー:", error);
        } else {
          console.error("Saved travel plan loading failed.");
        }

        alert(myPageMessages.loadFailedAlert);
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

      alert(myPageMessages.authFailedAlert);
    });

    return () => {
      active = false;
      requestGeneration++;
      unsubscribe();
    };
  }, [router]);

  async function handleDelete(id: string) {
    if (deletingIdsRef.current.has(id)) return;

    const ok = confirm(myPageMessages.deleteConfirm);

    if (!ok) return;

    if (!isValidPlanId(id)) {
      alert(myPageMessages.deleteFailedAlert);
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      setPlans([]);
      router.replace("/login");
      return;
    }

    const uid = user.uid;
    deletingIdsRef.current.add(id);

    try {
      await deleteTravelPlan(id);

      if (auth.currentUser?.uid !== uid) {
        setPlans([]);
        router.replace("/login");
        return;
      }

      setPlans((prev) => prev.filter((plan) => plan.id !== id));

      alert(myPageMessages.deleteSuccessAlert);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("旅行プラン削除エラー:", error);
      } else {
        console.error("Travel plan deletion failed.");
      }

      alert(myPageMessages.deleteFailedAlert);
    } finally {
      deletingIdsRef.current.delete(id);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <p>{myPageMessages.loading}</p>
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
