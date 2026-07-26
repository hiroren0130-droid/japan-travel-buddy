"use client";

import { useState } from "react";

type Props = {
  text: string;
};

export default function CopyButton({ text }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const trimmedText = text.trim();

    if (!trimmedText) return;

    try {
      await navigator.clipboard.writeText(trimmedText);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("コピーに失敗しました。", error);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="旅行プランをコピー"
      className="rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
    >
      {copied ? "✅ コピーしました" : "📋 プランをコピー"}
    </button>
  );
}