"use client";

import { Search } from "lucide-react";
import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const favoriteSearchMessages = getMessages(DEFAULT_LOCALE).favoriteSearch;

export interface FavoriteSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function FavoriteSearch({
  value,
  onChange,
}: FavoriteSearchProps) {
  return (
    <div className="mb-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

        <input
  type="text"
  value={value}
  onChange={(e) => onChange(e.target.value)}
  placeholder={favoriteSearchMessages.placeholder}
  autoComplete="off"
  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
/>
      </div>
    </div>
  );
}
