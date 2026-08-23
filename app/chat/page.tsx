"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  MapPin,
  Sparkles,
} from "lucide-react";

import ChatMessages from "@/components/ChatMessages";
import Header from "@/components/Header";
import { useLocale } from "@/components/LocaleProvider";
import TravelForm from "@/components/TravelForm";
import TravelPlanSkeleton from "@/components/TravelPlanSkeleton";
import { allSpots } from "@/data";
import { getPrefectureDisplayName } from "@/data/regions";
import { getSpotById } from "@/lib/spotService";

import type { TravelPlan } from "@/types/travel";

type Message = {
  role: "user" | "assistant";
  content?: string;
  travelPlan?: TravelPlan;
};

type CurrentLocation = {
  latitude: number;
  longitude: number;
};

const availableSpotIds = new Set(
  allSpots.map((spot) => spot.id)
);

export default function ChatPage() {
  const {
    locale,
    messages: defaultMessages,
  } = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const loadingSectionRef = useRef<HTMLElement | null>(null);

  const [destination, setDestination] = useState("");
  const [days, setDays] = useState("");
  const [travelers, setTravelers] = useState("");
  const [budget, setBudget] = useState("");
  const [interests, setInterests] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");

  const [startLocation, setStartLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [endTime, setEndTime] = useState("");

  const [selectedSpotIds, setSelectedSpotIds] = useState<string[]>([]);

  const [currentLocation, setCurrentLocation] =
    useState<CurrentLocation | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const receivedSpotIds = new URLSearchParams(
        window.location.search
      ).getAll("spotId");
      const validatedSpotIds = [...new Set(receivedSpotIds)].filter(
        (spotId) => availableSpotIds.has(spotId)
      );

      setSelectedSpotIds(validatedSpotIds);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

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

  useEffect(() => {
    if (!loading) {
      return;
    }

    const animationFrameId = requestAnimationFrame(() => {
      loadingSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [loading]);

  async function sendMessage() {
    if (loading) {
      return;
    }

    setLoading(true);

try {
  const selectedDays = Number(days || "2");

  const selectedPrefectureNames = [
    ...new Set(
      selectedSpotIds.flatMap((spotId) => {
        const spot = getSpotById(spotId);

        return spot
          ? [
              getPrefectureDisplayName(
                spot.prefectureId,
                locale
              ),
            ]
          : [];
      })
    ),
  ];
  const resolvedDestination =
    destination.trim() ||
    selectedPrefectureNames.join(
      locale === "en" ? " / " : "・"
    ) ||
    (locale === "en" ? "Not specified" : "指定なし");

  const shouldUseCurrentLocation =
    /現在地|今いる場所|ここから/.test(
      specialRequest
    );

  const prompt = `
行き先: ${resolvedDestination}
日数: ${selectedDays}日
人数: ${travelers || "2"}人
予算: ${budget || "指定なし"}
興味: ${interests || "人気スポット・グルメ"}

その他の希望:
${specialRequest || "なし"}
`;

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: prompt,
      days: selectedDays,
      locale,
      specialRequest,
      ...(startLocation.trim()
        ? { startLocation: startLocation.trim() }
        : {}),
      ...(startTime
        ? { startTime }
        : {}),
      ...(endLocation.trim()
        ? { endLocation: endLocation.trim() }
        : {}),
      ...(endTime
        ? { endTime }
        : {}),
      currentLocation:
        shouldUseCurrentLocation
          ? currentLocation
          : null,
      ...(selectedSpotIds.length > 0
        ? { requiredSpotIds: selectedSpotIds }
        : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(
      "旅行プランの生成に失敗しました。"
    );
  }

  const data = await response.json();

  const travelPlan: TravelPlan | undefined =
    data.plan;

  if (!travelPlan) {
    throw new Error(
      "旅行プランを取得できませんでした。"
    );
  }

  setMessages([
    {
      role: "assistant",
      travelPlan,
    },
  ]);
} catch (error) {
  console.error(
    "旅行プラン生成エラー:",
    error
  );

  setMessages([
    {
      role: "assistant",
      content: defaultMessages.chatPage.errorMessage,
    },
  ]);
} finally {
  setLoading(false);
}
}

return (
    <>
      <Header />

      <main className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-100">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -left-36 -top-40 h-[480px] w-[480px] rounded-full bg-blue-200/30 blur-[130px]" />

          <div className="absolute -right-32 top-32 h-[400px] w-[400px] rounded-full bg-cyan-200/25 blur-[120px]" />

          <div className="absolute bottom-[-220px] left-1/2 h-[440px] w-[440px] -translate-x-1/2 rounded-full bg-indigo-200/20 blur-[140px]" />
        </div>

        <div className="relative mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <section className="rounded-[28px] border border-white/80 bg-white/75 px-5 py-5 shadow-lg shadow-slate-200/50 backdrop-blur-xl sm:px-7 sm:py-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3.5 py-1.5 text-xs font-bold text-blue-700 sm:text-sm">
                  <Sparkles
                    size={15}
                    aria-hidden="true"
                  />

                  <span>{defaultMessages.chatPage.badge}</span>
                </div>

                <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  {defaultMessages.chatPage.title}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  {defaultMessages.chatPage.description}
                </p>

                {selectedSpotIds.length > 0 && (
                  <p className="mt-3 inline-flex rounded-full bg-blue-100 px-3 py-1.5 text-sm font-bold text-blue-700">
                    {locale === "en"
                      ? `Selected spots: ${selectedSpotIds.length}`
                      : `選択したスポット：${selectedSpotIds.length}件`}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Bot
                      size={19}
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {defaultMessages.chatPage.plannerLabel}
                    </p>

                    <p className="text-sm font-bold text-slate-800">
                      {defaultMessages.chatPage.plannerStatus}
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-sm">
                  <div
                    className={`
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-xl
                      ${
                        currentLocation
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-amber-50 text-amber-600"
                      }
                    `}
                  >
                    {currentLocation ? (
                      <CheckCircle2
                        size={19}
                        aria-hidden="true"
                      />
                    ) : (
                      <MapPin
                        size={19}
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {defaultMessages.chatPage.locationLabel}
                    </p>

                    <p className="text-sm font-bold text-slate-800">
                      {currentLocation
                        ? defaultMessages.chatPage.locationReady
                        : defaultMessages.chatPage.locationLoading}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-[30px] border border-white/80 bg-white/88 p-4 shadow-xl shadow-slate-200/60 backdrop-blur-xl sm:p-6 lg:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
                <Sparkles
                  size={21}
                  aria-hidden="true"
                />
              </div>

              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                  {defaultMessages.chatPage.formTitle}
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {defaultMessages.chatPage.formDescription}
                </p>
              </div>
            </div>

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
              startLocation={startLocation}
              setStartLocation={setStartLocation}
              startTime={startTime}
              setStartTime={setStartTime}
              endLocation={endLocation}
              setEndLocation={setEndLocation}
              endTime={endTime}
              setEndTime={setEndTime}
              onSubmit={sendMessage}
              loading={loading}
            />
          </section>

          <section
            ref={loadingSectionRef}
            aria-live="polite"
            aria-busy={loading}
            className="mt-8 scroll-mt-24 [overflow-anchor:none]"
          >
            {loading ? (
              <TravelPlanSkeleton />
            ) : (
              <ChatMessages messages={messages} />
            )}
          </section>
        </div>
      </main>
    </>
  );
}
