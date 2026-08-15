"use client";

import { BookOpen } from "lucide-react";

import { useLocale } from "@/components/LocaleProvider";

type Props = {
  count: number;
};

export default function HistoryHeader({ count }: Props) {
  const historyHeaderMessages =
    useLocale().messages.historyHeader;
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
