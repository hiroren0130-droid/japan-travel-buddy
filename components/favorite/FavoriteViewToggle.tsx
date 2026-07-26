"use client";

import { LayoutGrid, List } from "lucide-react";

export type FavoriteViewType = "grid" | "list";

interface FavoriteViewToggleProps {
  value: FavoriteViewType;
  onChange: (value: FavoriteViewType) => void;
}

export default function FavoriteViewToggle({
  value,
  onChange,
}: FavoriteViewToggleProps) {
  return (
    <div className="mb-6 flex justify-end gap-2">
      <button
        type="button"
        aria-label="グリッド表示"
        aria-pressed={value === "grid"}
        onClick={() => onChange("grid")}
        className={`rounded-lg p-2 transition ${
          value === "grid"
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        <LayoutGrid size={20} />
      </button>

      <button
        type="button"
        aria-label="リスト表示"
        aria-pressed={value === "list"}
        onClick={() => onChange("list")}
        className={`rounded-lg p-2 transition ${
          value === "list"
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        <List size={20} />
      </button>
    </div>
  );
}