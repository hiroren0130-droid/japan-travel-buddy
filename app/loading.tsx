export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="text-4xl">🇯🇵</span>
          <h1 className="text-2xl font-bold text-gray-900">
            Japan Travel Buddy
          </h1>
        </div>

        {/* Spinner */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-red-500" />

        {/* Message */}
        <div className="text-center">
          <p className="text-lg font-medium text-gray-800">
            Preparing your trip...
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Please wait a moment.
          </p>
        </div>
      </div>
    </main>
  );
}