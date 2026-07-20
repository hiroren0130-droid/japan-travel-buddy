import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="max-w-lg text-center">
        <div className="mb-6 text-7xl">🗾</div>

        <h1 className="text-4xl font-bold text-gray-900">
          404
        </h1>

        <h2 className="mt-3 text-2xl font-semibold text-gray-800">
          Page Not Found
        </h2>

        <p className="mt-5 text-gray-600 leading-7">
          Sorry, we couldn't find the page you're looking for.
          <br />
          Let's help you get back to planning your trip.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex rounded-xl bg-red-600 px-6 py-3 font-medium text-white transition hover:bg-red-700"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}