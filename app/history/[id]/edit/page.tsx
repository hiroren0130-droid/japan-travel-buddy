"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getTravelPlan, updateTravelPlan } from "@/lib/firestore";
import { useLocale } from "@/components/LocaleProvider";

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

function isOwnedEditablePlan(
  value: unknown,
  uid: string
): value is {
  uid: string;
  title: string;
  summary: string;
} {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const plan = value as Record<string, unknown>;

  return (
    typeof plan.uid === "string" &&
    plan.uid === uid &&
    typeof plan.title === "string" &&
    typeof plan.summary === "string"
  );
}

export default function EditTravelPlanPage() {
  const historyEditMessages =
    useLocale().messages.historyEdit;

const params = useParams();
const router = useRouter();

const validatedId = validatePlanId(params.id);

const [title, setTitle] = useState("");
const [summary, setSummary] = useState("");
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [loadedUid, setLoadedUid] = useState<string | null>(null);
const [loadedId, setLoadedId] = useState<string | null>(null);

useEffect(() => {
  let active = true;
  let requestGeneration = 0;

  if (!validatedId) {
    alert(historyEditMessages.invalidIdAlert);
    router.replace("/history");

    return () => {
      active = false;
      requestGeneration++;
    };
  }

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!active) return;

    const generation = ++requestGeneration;
    setTitle("");
    setSummary("");
    setLoadedUid(null);
    setLoadedId(null);
    setLoading(true);

    if (!user) {
      setLoading(false);
      router.replace("/login");
      return;
    }

    const uid = user.uid;
    const requestedId = validatedId;

    try {
      const plan = await getTravelPlan(requestedId);

      if (
        !active ||
        generation !== requestGeneration ||
        auth.currentUser?.uid !== uid ||
        validatedId !== requestedId
      ) {
        return;
      }

      if (!isOwnedEditablePlan(plan, uid)) {
        alert(historyEditMessages.loadFailedAlert);
        router.replace("/history");
        return;
      }

      setTitle(plan.title);
      setSummary(plan.summary);
      setLoadedUid(uid);
      setLoadedId(requestedId);
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

      alert(historyEditMessages.loadFailedAlert);
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
    setTitle("");
    setSummary("");
    setLoadedUid(null);
    setLoadedId(null);
    setLoading(false);

    if (process.env.NODE_ENV === "development") {
      console.error("認証状態確認エラー:", error);
    } else {
      console.error("Authentication state check failed.");
    }

    alert(historyEditMessages.authFailedAlert);
  });

  return () => {
    active = false;
    requestGeneration++;
    unsubscribe();
  };
}, [
  historyEditMessages.authFailedAlert,
  historyEditMessages.invalidIdAlert,
  historyEditMessages.loadFailedAlert,
  router,
  validatedId,
]);

async function handleSave() {
  if (saving) return;

  const user = auth.currentUser;

  if (
    !user ||
    user.uid !== loadedUid ||
    !validatedId ||
    validatedId !== loadedId
  ) {
    alert(historyEditMessages.authChangedAlert);
    router.replace("/login");
    return;
  }

  const trimmedTitle = title.trim();
  const trimmedSummary = summary.trim();

  if (!trimmedTitle || !trimmedSummary) {
    alert(historyEditMessages.requiredAlert);
    return;
  }

  if (Array.from(trimmedTitle).length > 120) {
    alert(historyEditMessages.titleTooLongAlert);
    return;
  }

  if (Array.from(trimmedSummary).length > 2000) {
    alert(historyEditMessages.summaryTooLongAlert);
    return;
  }

  setSaving(true);

  try {
    await updateTravelPlan(validatedId, {
      title: trimmedTitle,
      summary: trimmedSummary,
    });

    alert(historyEditMessages.saveSuccessAlert);
    router.push(`/history/${encodeURIComponent(validatedId)}`);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("旅行プラン保存エラー:", error);
    } else {
      console.error("Travel plan saving failed.");
    }

    alert(historyEditMessages.saveFailedAlert);
  } finally {
    setSaving(false);
  }
}

  return (
  <main className="mx-auto max-w-3xl p-8">
    <h1 className="mb-6 text-3xl font-bold">
      {historyEditMessages.title}
    </h1>

    {loading ? (
      <p>{historyEditMessages.loading}</p>
    ) : (
      <div className="space-y-6">

        <div>
          <label className="mb-2 block font-semibold">
            {historyEditMessages.titleLabel}
          </label>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-semibold">
            {historyEditMessages.summaryLabel}
          </label>

          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="h-40 w-full rounded-lg border p-3"
          />
        </div>
          <button
  onClick={handleSave}
  disabled={saving}
  className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
>
  {saving ? historyEditMessages.savingLabel : historyEditMessages.saveLabel}
</button>
      </div>
    )}
  </main>
);
}
