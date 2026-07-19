export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-6xl p-8">
        <h1 className="text-4xl font-bold">
          Dashboard
        </h1>

        <p className="mt-4 text-gray-600">
          ようこそ Japan Travel Buddy へ！
        </p>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="text-2xl font-semibold">
            AI旅行プランナー
          </h2>

          <p className="mt-2 text-gray-500">
            ここにAIチャット画面を作っていきます。
          </p>
        </div>
      </div>
    </main>
  );
}