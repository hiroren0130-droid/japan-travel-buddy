import Link from "next/link";
import Header from "@/components/Header";

export default function HomePage() {
  return (
    <>
      <Header />

      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gradient-to-b from-white to-blue-50 px-6">
        <section className="max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
            Japan Travel Buddy
          </p>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
            Your AI Travel Concierge in Japan
          </h1>

          <p className="mt-6 text-lg leading-8 text-gray-600">
            Plan your trip, discover hidden gems, and explore Japan with your
            personal AI travel assistant.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/chat"
              className="rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition hover:bg-blue-700"
            >
              ✨ Start Planning
            </Link>

            <Link
              href="/mypage"
              className="rounded-xl border border-gray-300 bg-white px-8 py-4 text-lg font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              📁 My Travel Plans
            </Link>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow">
              <div className="text-3xl">🤖</div>
              <h3 className="mt-3 font-bold">AI Planning</h3>
              <p className="mt-2 text-sm text-gray-600">
                Create personalized travel itineraries in seconds.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow">
              <div className="text-3xl">🗺️</div>
              <h3 className="mt-3 font-bold">Interactive Maps</h3>
              <p className="mt-2 text-sm text-gray-600">
                View destinations and routes on Google Maps.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow">
              <div className="text-3xl">💾</div>
              <h3 className="mt-3 font-bold">Save Trips</h3>
              <p className="mt-2 text-sm text-gray-600">
                Save your favorite plans and access them anytime.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}