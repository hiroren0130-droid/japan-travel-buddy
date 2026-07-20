"use client";

import { useEffect } from "react";

type ErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function Error({
  error,
  reset,
}: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 text-5xl">⚠️</div>

        <h1 className="mb-3 text-2xl font-bold text-gray-900">
          Something went wrong
        </h1>

        <p className="mb-8 text-sm leading-6 text-gray-600">
          An unexpected error occurred.
          <br />
          Please try again.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => reset()}
            className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition hover:bg-red-700"
          >
            Try Again
          </button>

          <button
            onClick={() => window.location.href = "/"}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium transition hover:bg-gray-100"
          >
            Home
          </button>
        </div>

        {process.env.NODE_ENV === "development" && (
          <details className="mt-8 rounded-lg bg-gray-100 p-4 text-left text-xs">
            <summary className="cursor-pointer font-semibold">
              Error Details
            </summary>

            <pre className="mt-3 whitespace-pre-wrap break-words">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </main>
  );
}