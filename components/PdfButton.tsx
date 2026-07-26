"use client";

import { useState } from "react";
import jsPDF from "jspdf";

type Props = {
  text: string;
};

export default function PdfButton({ text }: Props) {
  const [creating, setCreating] = useState(false);

  const downloadPdf = async () => {
    const trimmedText = text.trim();

    if (!trimmedText || creating) return;

    setCreating(true);

    try {
      const pdf = new jsPDF();

      pdf.setFontSize(16);
      pdf.text("Japan Travel Buddy", 10, 15);

      pdf.setFontSize(10);

      const lines = pdf.splitTextToSize(trimmedText, 180);

      pdf.text(lines, 10, 30);

      pdf.save("travel-plan.pdf");
    } catch (error) {
      console.error("PDFの作成に失敗しました。", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={downloadPdf}
      disabled={creating}
      aria-label="旅行プランをPDFで保存"
      className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-300"
    >
      {creating ? "📄 作成中..." : "📄 PDF保存"}
    </button>
  );
}