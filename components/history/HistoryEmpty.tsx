"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";

import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const historyEmptyMessages = getMessages(DEFAULT_LOCALE).historyEmpty;

export default function HistoryEmpty() {
  return (
    <div className="rounded-xl border bg-white p-8 text-center">
      <BookOpen className="mx-auto h-14 w-14 fill-gray-300 text-gray-300" />

      <p className="mt-4 text-gray-500">
        {historyEmptyMessages.description}
      </p>

      <Link
        href="/chat"
        className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        {historyEmptyMessages.cta}
      </Link>
    </div>
  );
}
