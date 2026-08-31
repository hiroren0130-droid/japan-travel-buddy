import { requireAdminSession } from "@/lib/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminAuthTestPage() {
  await requireAdminSession("/admin/auth-test");

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">
        管理者認証済み
      </h1>
    </main>
  );
}
