"use client";

import Link from "next/link";

import { useLocale } from "@/components/LocaleProvider";
import { SPOT_IMAGE_CREDITS } from "@/lib/spotImageCredits";

export default function ImageCreditsPage() {
  const { locale } = useLocale();
  const isEnglish = locale === "en";

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:px-8">
      <Link
        href="/"
        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
      >
        {isEnglish ? "Back to Home" : "ホームへ戻る"}
      </Link>

      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">
        {isEnglish ? "Image Credits" : "画像クレジット"}
      </h1>
      <p className="mt-3 leading-7 text-gray-600">
        {isEnglish
          ? "Credits and license information for locally provided Spot images."
          : "アプリ内で使用しているローカルSpot画像の出典・ライセンス情報です。"}
      </p>

      <div className="mt-10 grid gap-6">
        {SPOT_IMAGE_CREDITS.map((credit) => (
          <article
            key={credit.spotId}
            id={credit.spotId}
            className="scroll-mt-6 rounded-2xl border bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold">
              {isEnglish ? credit.spotNameEn : credit.spotNameJa}
            </h2>

            <dl className="mt-4 grid gap-3 text-sm leading-6 sm:grid-cols-[9rem_1fr]">
              <dt className="font-semibold text-gray-700">
                {isEnglish ? "Work" : "作品名"}
              </dt>
              <dd>{credit.sourceTitle}</dd>

              <dt className="font-semibold text-gray-700">
                {isEnglish ? "Photographer" : "作者"}
              </dt>
              <dd>{credit.photographerName}</dd>

              <dt className="font-semibold text-gray-700">
                {isEnglish ? "Source" : "出典"}
              </dt>
              <dd>
                <a
                  href={credit.sourcePageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-blue-600 hover:underline"
                >
                  {credit.sourcePageUrl}
                </a>
              </dd>

              <dt className="font-semibold text-gray-700">
                {isEnglish ? "License" : "ライセンス"}
              </dt>
              <dd>
                <a
                  href={credit.licenseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {credit.licenseName}
                </a>
              </dd>

              <dt className="font-semibold text-gray-700">
                {isEnglish ? "Modifications" : "加工内容"}
              </dt>
              <dd>{credit.modifications}</dd>
            </dl>
          </article>
        ))}
      </div>
    </main>
  );
}
