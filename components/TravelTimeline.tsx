import { TravelPlan } from "@/types/travel";
import Badge from "@/components/ui/Badge";
import TimelineItem from "./TimelineItem";
import { CalendarDays } from "lucide-react";
import { getSpotById } from "@/lib/spotService";

type Props = {
  plan: TravelPlan;
};

export default function TravelTimeline({ plan }: Props) {
  return (
    <div className="space-y-12">
      {plan.days.map((day) => (
        <section
  key={day.day}
  aria-labelledby={`day-${day.day}`}
>
          {/* Day Header */}
          <div className="mb-8 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                <CalendarDays size={28} />
              </div>

              <div>
                <p className="text-sm font-semibold tracking-widest text-blue-100">
                  JAPAN TRAVEL BUDDY
                </p>

                <h2
                 id={`day-${day.day}`}
                 className="text-3xl font-bold"
                 >
                  📅 Day {day.day}
                </h2>

                <div className="mt-2">
                  <Badge color="green">
                    📍 {day.items.length}スポット
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div
  className="relative ml-6 border-l-4 border-blue-400 pl-4"
  role="list"
>
            {day.items.length === 0 ? (
              <p className="py-4 text-gray-500">
                この日の旅行プランはありません。
              </p>
            ) : (
              day.items.map((item) => {
                const spot = getSpotById(item.spotId);

                return (
                  <TimelineItem
                    key={`${day.day}-${item.time}-${item.spotId}`}
                    time={item.time}
                    spot={spot?.name ?? "不明なスポット"}
                    description={item.description}
                    transport={item.transport}
                    duration={item.duration}
                  />
                );
              })
            )}
          </div>
        </section>
      ))}
    </div>
  );
}