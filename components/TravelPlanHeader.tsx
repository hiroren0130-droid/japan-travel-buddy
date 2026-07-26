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
    <header
      className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 p-6 text-white"
      aria-labelledby="travel-plan-title"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1
            id="travel-plan-title"
            className="break-words text-3xl font-bold"
          >
            🧳 {title}
          </h1>

          <p className="mt-2 text-blue-100">
            AIがあなた専用に作成した旅行プランです
          </p>
        </div>

        <div
          className="flex flex-wrap gap-2"
          aria-label="旅行プラン操作"
        >
          <FavoriteButton text={text} />
          <CopyButton text={text} />
          <PdfButton text={text} />
        </div>
      </div>
    </header>
  );
}