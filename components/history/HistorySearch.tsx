"use client";

import { Search } from "lucide-react";

import { useLocale } from "@/components/LocaleProvider";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function HistorySearch({
  value,
  onChange,
}: Props) {
  const historySearchMessages =
    useLocale().messages.historySearch;
  return (
    <div className="relative mb-6">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        size={18}
      />

      <input
  type="text"
  value={value}
  onChange={(e) => onChange(e.target.value)}
  placeholder={historySearchMessages.placeholder}
  autoComplete="off"
  className="w-full rounded-lg border py-3 pl-10 pr-4 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
/>
    </div>
  );
}
