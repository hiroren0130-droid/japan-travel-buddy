"use client";

import { LayoutGrid, List } from "lucide-react";

import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const historyViewToggleMessages = getMessages(DEFAULT_LOCALE).historyViewToggle;

type Props = {
  view: "grid" | "list";
  onChange: (view: "grid" | "list") => void;
};

export default function HistoryViewToggle({
  view,
  onChange,
}: Props) {
  return (
    <div className="mb-6 flex justify-end gap-2">
      <button
  type="button"
  aria-label={historyViewToggleMessages.gridAriaLabel}
  aria-pressed={view === "grid"}
  onClick={() => onChange("grid")}
  className={`rounded-lg border p-2 ${
    view === "grid"
      ? "bg-blue-600 text-white"
      : "bg-white"
  }`}
>
  <LayoutGrid size={18} />
</button>

      <button
  type="button"
  aria-label={historyViewToggleMessages.listAriaLabel}
  aria-pressed={view === "list"}
  onClick={() => onChange("list")}
  className={`rounded-lg border p-2 ${
    view === "list"
      ? "bg-blue-600 text-white"
      : "bg-white"
  }`}
>
  <List size={18} />
</button>
    </div>
  );
}
