import Header from "@/components/Header";

export default function HomePage() {
  return (
    <>
      <Header />

      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-white px-6">
        <section className="max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
            Japan Travel Buddy
          </p>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
            Your AI Travel Concierge in Japan
          </h1>

          <p className="mt-6 text-lg leading-8 text-gray-600">
            Plan your trip, discover hidden places, and enjoy Japan with your
            personal AI travel companion.
          </p>

          <button className="mt-10 rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition hover:bg-blue-700">
            Start Planning
          </button>
        </section>
      </main>
    </>
  );
}