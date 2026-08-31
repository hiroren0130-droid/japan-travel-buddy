"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { clearAdminSession } from "@/lib/auth/client-logout";

export default function LogoutIncompletePage() {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);

  async function handleRetry() {
    if (retrying) return;

    setRetrying(true);
    setRetryFailed(false);

    const cleared = await clearAdminSession();

    if (cleared) {
      router.replace("/login");
      return;
    }

    setRetryFailed(true);
    setRetrying(false);
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-12 sm:px-6">
      <section className="w-full rounded-2xl border border-red-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-bold tracking-wide text-red-600">
          LOGOUT INCOMPLETE
        </p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
          管理者セッションを削除できませんでした
        </h1>
        <p className="mt-4 leading-7 text-slate-700">
          Firebaseアカウントからはログアウトしましたが、管理者セッションの削除を確認できませんでした。この端末を離れず、通信状態を確認して再試行してください。
        </p>
        {retryFailed ? (
          <p role="alert" className="mt-4 text-sm font-semibold text-red-700">
            再試行に失敗しました。通信状態を確認して、もう一度お試しください。
          </p>
        ) : null}
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {retrying ? "再試行中…" : "管理者セッションの削除を再試行"}
        </button>
      </section>
    </main>
  );
}
