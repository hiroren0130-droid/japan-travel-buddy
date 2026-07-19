"use client";

import jsPDF from "jspdf";

type Props = {
  text: string;
};

export default function PdfButton({ text }: Props) {
  const downloadPdf = () => {
    const pdf = new jsPDF();

    pdf.setFontSize(16);
    pdf.text("Japan Travel Buddy", 10, 15);

    pdf.setFontSize(10);

    const lines = pdf.splitTextToSize(text, 180);
    pdf.text(lines, 10, 30);

    pdf.save("travel-plan.pdf");
  };

  return (
    <button
      onClick={downloadPdf}
      className="rounded-lg bg-red-500 px-4 py-2 text-white font-semibold hover:bg-red-600"
    >
      📄 PDF保存
    </button>
  );
}