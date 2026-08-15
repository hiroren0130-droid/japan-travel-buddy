"use client";

import { Share2 } from "lucide-react";
import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const shareButtonMessages = getMessages(DEFAULT_LOCALE).shareButton;

type Props = {
  title: string;
};

export default function ShareButton({ title }: Props) {
  const handleShare = async () => {
    const shareData = {
      title,
      text: `${title}

Japan Travel Buddyで作成した旅行プランです🇯🇵`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert(shareButtonMessages.copiedAlert);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-700"
    >
      <Share2 size={18} />
      {shareButtonMessages.label}
    </button>
  );
}
