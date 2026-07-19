"use client";

import FavoriteButton from "./FavoriteButton";
import CopyButton from "./CopyButton";
import PdfButton from "./PdfButton";

type Props = {
  title: string;
  text: string;
};

export default function TravelPlanHeader({
  title,
  text,
}: Props) {
  return (
    <div className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 p-6 text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h2 className="text-3xl font-bold">
            🧳 {title}
          </h2>

          <p className="mt-2 text-blue-100">
            AIがあなた専用に作成した旅行プランです
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <FavoriteButton text={text} />
          <CopyButton text={text} />
          <PdfButton text={text} />
        </div>

      </div>
    </div>
  );
}