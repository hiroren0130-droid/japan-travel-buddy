"use client";

import { FolderOpen } from "lucide-react";
import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const myPageHeaderMessages = getMessages(DEFAULT_LOCALE).myPageHeader;

type Props = {
  count: number;
};

export default function MyPageHeader({
  count,
}: Props) {
  return (
    <>
      <h1 className="flex items-center gap-2 text-3xl font-bold">
        <FolderOpen className="h-8 w-8 text-blue-600" />
        {myPageHeaderMessages.title}
      </h1>

      <p className="mb-8 mt-2 text-gray-500">
        {count === 0
          ? myPageHeaderMessages.emptyMessage
          : `${myPageHeaderMessages.countPrefix}${count}${myPageHeaderMessages.countSuffix}`}
      </p>
    </>
  );
}
