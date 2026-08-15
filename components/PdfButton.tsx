"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import { Check, FileDown, LoaderCircle } from "lucide-react";

import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const defaultMessages = getMessages(DEFAULT_LOCALE);

type Props = {
  text: string;
};

export default function PdfButton({
  text,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [completed, setCompleted] = useState(false);

  const downloadPdf = async () => {
    const trimmedText = text.trim();

    if (!trimmedText || creating) return;

    setCreating(true);
    setCompleted(false);

    try {
      const pdf = new jsPDF();

      pdf.setFontSize(16);
      pdf.text("Japan Travel Buddy", 10, 15);

      pdf.setFontSize(10);

      const lines = pdf.splitTextToSize(
        trimmedText,
        180
      );

      pdf.text(lines, 10, 30);
      pdf.save("travel-plan.pdf");

      setCompleted(true);

      window.setTimeout(() => {
        setCompleted(false);
      }, 2000);
    } catch (error) {
      console.error(
        "PDFの作成に失敗しました。",
        error
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={downloadPdf}
      disabled={creating}
      aria-label={
        creating
          ? defaultMessages.pdfButton.creatingAriaLabel
          : completed
            ? defaultMessages.pdfButton.completedAriaLabel
            : defaultMessages.pdfButton.saveAriaLabel
      }
      title={
        creating
          ? defaultMessages.pdfButton.creatingLabel
          : completed
            ? defaultMessages.pdfButton.savedLabel
            : defaultMessages.pdfButton.saveLabel
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
        disabled:cursor-not-allowed
        disabled:opacity-60
        disabled:hover:translate-y-0
      "
    >
      {creating ? (
        <LoaderCircle
          size={20}
          strokeWidth={2.2}
          className="animate-spin"
          aria-hidden="true"
        />
      ) : completed ? (
        <Check
          size={20}
          strokeWidth={2.4}
          aria-hidden="true"
        />
      ) : (
        <FileDown
          size={20}
          strokeWidth={2.2}
          className="transition-transform duration-300 group-hover:scale-110"
          aria-hidden="true"
        />
      )}

      <span className="sr-only">
        {creating
          ? defaultMessages.pdfButton.creatingLabel
          : completed
            ? defaultMessages.pdfButton.completedStatus
            : defaultMessages.pdfButton.saveAriaLabel}
      </span>
    </button>
  );
}
