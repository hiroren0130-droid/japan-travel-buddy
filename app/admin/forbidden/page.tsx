import Link from "next/link";

export const metadata = {
  title: "アクセス権限がありません | Japan Travel Buddy",
};

export default function AdminForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-12 sm:px-6">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <p className="text-sm font-bold tracking-wide text-red-600">
          ACCESS DENIED
        </p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
          管理者権限がありません
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
          このページはJapan Travel Buddyの管理者専用です。
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          マイページへ戻る
        </Link>
      </section>
    </main>
  );
}
