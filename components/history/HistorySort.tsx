"use client";

import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const historySortMessages = getMessages(DEFAULT_LOCALE).historySort;

type Props = {
  value: "newest" | "oldest";
  onChange: (value: "newest" | "oldest") => void;
};

export default function HistorySort({
  value,
  onChange,
}: Props) {
  return (
    <div className="mb-6 flex justify-end">
      <select
  aria-label={historySortMessages.ariaLabel}
  value={value}
  onChange={(e) =>
    onChange(
      e.target.value === "oldest"
        ? "oldest"
        : "newest"
    )
  }
  className="rounded-lg border px-3 py-2"
>
        <option value="newest">{historySortMessages.newest}</option>
        <option value="oldest">{historySortMessages.oldest}</option>
      </select>
    </div>
  );
}
