"use client";

import { Share2 } from "lucide-react";

import { useLocale } from "@/components/LocaleProvider";
import { createTravelPlanShareText } from "@/lib/travelPlanExport";

type Props = {
  title: string;
};

export default function ShareButton({ title }: Props) {
  const { locale, messages } = useLocale();
  const shareButtonMessages = messages.shareButton;

  const handleShare = async () => {
    const shareData = {
      title,
      text: createTravelPlanShareText(
        { title, summary: "" },
        locale
      ),
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert(shareButtonMessages.copiedAlert);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      console.error("Sharing failed.", error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-700"
    >
      <Share2 size={18} aria-hidden="true" />
      {shareButtonMessages.label}
    </button>
  );
}
