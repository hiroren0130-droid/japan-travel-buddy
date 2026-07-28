"use client";

import { useEffect, useState } from "react";

import ChatMessages from "@/components/ChatMessages";
import TravelForm from "@/components/TravelForm";
import TravelPlanSkeleton from "@/components/TravelPlanSkeleton";
import type { TravelPlan } from "@/types/travel";

type Message = {
  role: "user" | "assistant";
  content?: string;
  travelPlan?: TravelPlan;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const [destination, setDestination] = useState("");
const [days, setDays] = useState("");
const [travelers, setTravelers] = useState("");
const [budget, setBudget] = useState("");
const [interests, setInterests] = useState("");
const [specialRequest, setSpecialRequest] = useState("");

const [currentLocation, setCurrentLocation] = useState<{
  latitude: number;
  longitude: number;
} | null>(null);
useEffect(() => {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      setCurrentLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    (error) => {
      console.error("位置情報取得エラー:", error);
    }
  );
}, []);
  async function sendMessage() {
  console.log("sendMessage called");

  if (loading) return;

  setLoading(true);

  try {
    const prompt = `
行き先: ${destination || "京都"}
日数: ${days || "2日"}
人数: ${travelers || "2人"}
予算: ${budget || "指定なし"}
興味: ${interests || "人気スポット・グルメ"}

その他の希望:
${specialRequest || "なし"}
`;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
  message: prompt,
  specialRequest,
  currentLocation,
}),
    });

    const data = await res.json();

    const travelPlan: TravelPlan = data.plan;

    setMessages([
      {
        role: "assistant",
        travelPlan,
      },
    ]);
  } catch {
    setMessages([
      {
        role: "assistant",
        content: "エラーが発生しました。",
      },
    ]);
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-6xl p-4">

        <header className="mb-4 rounded-xl bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-bold text-blue-600">
            ✈️ AI旅行プランナー
          </h1>

          <p className="mt-1 text-gray-500">
            AIがあなた専用の旅行プランを作成します。
          </p>
        </header>

        <TravelForm
  destination={destination}
  setDestination={setDestination}
  days={days}
  setDays={setDays}
  travelers={travelers}
  setTravelers={setTravelers}
  budget={budget}
  setBudget={setBudget}
  interests={interests}
  setInterests={setInterests}

  specialRequest={specialRequest}
  setSpecialRequest={setSpecialRequest}

  onSubmit={sendMessage}
  loading={loading}
/>

        <div className="mt-6">
          <>
  {loading ? (
    <TravelPlanSkeleton />
  ) : (
    <ChatMessages messages={messages} />
  )}
</>
        </div>

      </div>
    </main>
  );
}