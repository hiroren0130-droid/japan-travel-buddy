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
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold">
          Something went wrong
        </h1>

        <p className="mt-4 text-gray-600">
          An unexpected error occurred.
          Please try again.
        </p>

        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}