"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type Props = {
  text: string;
};

export default function CopyButton({
  text,
}: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const trimmedText = text.trim();

    if (!trimmedText) return;

    try {
      await navigator.clipboard.writeText(trimmedText);

      setCopied(true);

      window.setTimeout(() => {
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
      aria-label={
        copied
          ? "旅行プランをコピーしました"
          : "旅行プランをコピー"
      }
      title={
        copied
          ? "コピーしました"
          : "コピー"
      }
      className="
        group
        relative
        flex
        h-12
        w-12
        shrink-0
        items-center
        justify-center
        rounded-full
        border
        border-white/25
        bg-white/15
        text-white
        shadow-sm
        backdrop-blur-md
        transition-all
        duration-300
        hover:-translate-y-0.5
        hover:border-white/40
        hover:bg-white/25
        hover:shadow-lg
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-white/70
        active:translate-y-0
      "
    >
      {copied ? (
        <Check
          size={20}
          strokeWidth={2.4}
          aria-hidden="true"
        />
      ) : (
        <Copy
          size={20}
          strokeWidth={2.2}
          aria-hidden="true"
          className="transition-transform duration-300 group-hover:scale-110"
        />
      )}

      <span className="sr-only">
        {copied
          ? "コピーしました"
          : "旅行プランをコピー"}
      </span>
    </button>
  );
}