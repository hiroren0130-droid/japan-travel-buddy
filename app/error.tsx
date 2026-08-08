"use client";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({
  error,
  reset,
}: Props) {
  console.error(error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-100 px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl">
        
        <div className="mb-6 text-6xl">
          ⚠️
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-900">
          Something went wrong
        </h1>

        <p className="mt-4 leading-7 text-slate-600">
          An unexpected error occurred.
          Please try again.
        </p>

        <button
          onClick={reset}
          className="mt-8 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}