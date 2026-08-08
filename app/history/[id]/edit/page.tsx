"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTravelPlan, updateTravelPlan } from "@/lib/firestore";

export default function EditTravelPlanPage() {

const params = useParams();
const router = useRouter();

const id = params.id as string;

const [title, setTitle] = useState("");
const [summary, setSummary] = useState("");
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function loadPlan() {
    const plan = await getTravelPlan(id);

    if (!plan) {
      return;
    }

    setTitle(plan.title);
    setSummary(plan.summary);
    setLoading(false);
  }

  if (id) {
    loadPlan();
  }
}, [id]);

  return (
  <main className="mx-auto max-w-3xl p-8">
    <h1 className="mb-6 text-3xl font-bold">
      ✏️ 旅行プラン編集
    </h1>

    {loading ? (
      <p>読み込み中...</p>
    ) : (
      <div className="space-y-6">

        <div>
          <label className="mb-2 block font-semibold">
            タイトル
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
            概要
          </label>

          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="h-40 w-full rounded-lg border p-3"
          />
        </div>
          <button
  onClick={async () => {
    await updateTravelPlan(id, {
      title,
      summary,
    });

    alert("保存しました");

    router.push(`/history/${id}`);
  }}
  className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
>
  💾 保存
</button>
      </div>
    )}
  </main>
);
}