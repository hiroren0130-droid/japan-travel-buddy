export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-100 px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="text-5xl">🇯🇵</span>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Japan Travel Buddy
          </h1>
        </div>

        {/* Spinner */}
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

        {/* Message */}
<div className="text-center">
  <p className="text-lg font-medium text-gray-800">
    Creating your perfect Japan journey...
  </p>

  <p className="mt-2 text-sm text-gray-500">
    Our AI is planning the best route for you.
  </p>

  <div className="mt-4 space-y-2 text-sm text-slate-500">
  <p>🤖 おすすめスポットを検索中...</p>
  <p>🗺️ 最適なルートを作成中...</p>
  <p>✨ 旅行プランを仕上げています...</p>
</div>
</div>
      </div>
    </main>
  );
}