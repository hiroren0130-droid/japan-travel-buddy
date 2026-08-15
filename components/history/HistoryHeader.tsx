"use client";

import { BookOpen } from "lucide-react";

import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const historyHeaderMessages = getMessages(DEFAULT_LOCALE).historyHeader;

type Props = {
  count: number;
};

export default function HistoryHeader({ count }: Props) {
  return (
    <div className="mb-8">
      <h1 className="flex items-center gap-2 text-3xl font-bold">
        <BookOpen className="h-8 w-8 text-blue-600" />
        {historyHeaderMessages.title}
      </h1>

      <p className="mt-2 text-gray-500">
  {count === 0
    ? historyHeaderMessages.emptyMessage
    : `${historyHeaderMessages.countPrefix}${count}${historyHeaderMessages.countSuffix}`}
</p>
    </div>
  );
}
