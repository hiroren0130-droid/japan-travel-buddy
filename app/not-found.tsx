"use client";

import Link from "next/link";

import { useLocale } from "@/components/LocaleProvider";

export default function NotFound() {
  const messages = useLocale().messages.notFound;

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-5xl font-bold">404</h1>

        <h2 className="mt-4 text-2xl font-semibold">
          {messages.title}
        </h2>

        <p className="mt-4 text-gray-600">
          {messages.description}
        </p>

        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700"
        >
          {messages.backToHome}
        </Link>
      </div>
    </main>
  );
}
