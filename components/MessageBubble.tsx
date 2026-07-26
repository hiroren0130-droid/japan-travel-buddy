"use client";

import { TravelPlan } from "@/types/travel";
import TravelPlanCard from "./TravelPlanCard";

type Props = {
  role: "user" | "assistant";
  content?: string;
  plan?: TravelPlan;
};

export default function MessageBubble({
  role,
  content,
  plan,
}: Props) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[80%] break-words rounded-2xl bg-blue-600 px-4 py-3 text-white shadow-sm"
          aria-label="ユーザーのメッセージ"
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="w-full max-w-5xl">
        {plan ? (
          <TravelPlanCard plan={plan} />
        ) : (
          <div
            className="break-words rounded-2xl bg-gray-100 px-4 py-3 text-gray-800 shadow-sm"
            aria-label="AIのメッセージ"
          >
            {content}
          </div>
        )}
      </div>
    </div>
  );
}