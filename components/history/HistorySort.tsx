"use client";

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
  aria-label="並び順"
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
        <option value="newest">新しい順</option>
        <option value="oldest">古い順</option>
      </select>
    </div>
  );
}