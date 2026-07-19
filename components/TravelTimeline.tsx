import { TravelPlan } from "@/types/travel";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import PlaceLink from "./PlaceLink";
import SpotCard from "@/components/SpotCard";
import { getSpotByName } from "@/lib/spotService";

type Props = {
  plan: TravelPlan;
};

function getGoogleMapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function TravelTimeline({ plan }: Props) {
  return (
    <div className="space-y-8">
      {plan.days.map((day) => (
        <section key={day.day}>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
              {day.day}
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Day {day.day}
              </h2>

              <div className="mt-1">
                <Badge color="green">Travel Schedule</Badge>
              </div>
            </div>
          </div>

          <div className="relative ml-5 border-l-2 border-blue-200">
            {day.items.map((item, index) => {
  const spot = getSpotByName(item.spot);

  return (
    <div
  key={`${day.day}-${item.time}-${item.spot}`}
  className="relative mb-6 ml-6"
>
      <div className="absolute -left-[34px] top-2 h-4 w-4 rounded-full border-4 border-white bg-blue-600 shadow" />

      <Card className="transition hover:shadow-md">
        <Badge>🕒 {item.time}</Badge>

        <h3 className="mt-3 flex items-center gap-2 text-lg font-bold text-gray-900">
          <span>📍</span>
          <PlaceLink name={item.spot} />
        </h3>

        <p className="mt-2 leading-7 text-gray-600">
          {item.description}
        </p>

        <div className="mt-4">
          <a
            href={getGoogleMapsUrl(item.spot)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            🗺 Google Mapsで開く
          </a>
        </div>

        {spot && (
          <div className="mt-6">
            <SpotCard spot={spot} />
          </div>
        )}
      </Card>
    </div>
  );
})}
          </div>
        </section>
      ))}
    </div>
  );
}