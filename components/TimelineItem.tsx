import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import PlaceLink from "./PlaceLink";
import TimelineMapButton from "./TimelineMapButton";
import SpotCard from "./SpotCard";
import { getSpotByName } from "@/lib/spotService";
import {
  Footprints,
  Train,
  Bus,
  CarTaxiFront,
  Clock3,
  MapPin,
} from "lucide-react";

type Props = {
  time: string;
  spot: string;
  description: string;
  transport?: string;
  duration?: string;
};

function TransportIcon({
  transport,
}: {
  transport?: string;
}) {
  switch (transport) {
    case "徒歩":
      return <Footprints size={18} />;
    case "JR":
    case "電車":
    case "地下鉄":
      return <Train size={18} />;
    case "バス":
      return <Bus size={18} />;
    case "タクシー":
      return <CarTaxiFront size={18} />;
    default:
      return <Clock3 size={18} />;
  }
}

export default function TimelineItem({
  time,
  spot,
  description,
  transport,
  duration,
}: Props) {
  const spotData = getSpotByName(spot);

  return (
    <div className="relative mb-10 ml-6">
      <div className="absolute -left-[38px] top-8 h-5 w-5 rounded-full border-4 border-white bg-blue-600 shadow-lg" />

      <Card className="rounded-3xl border border-gray-200 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        {/* 時間 */}
        <div className="mb-4">
          <Badge>🕒 {time}</Badge>
        </div>

        {/* タイトル */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <MapPin size={22} />
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900">
              <PlaceLink name={spot} />
            </h3>

            <p className="text-sm text-gray-500">
              Travel Destination
            </p>
          </div>
        </div>

        {/* 説明 */}
        <p className="leading-8 text-gray-700">
          {description}
        </p>

        {/* 移動情報 */}
        {(transport || duration) && (
          <div className="mt-6 rounded-2xl bg-blue-50 p-4">
            <div className="flex flex-wrap gap-6">
              {transport && (
                <div className="flex items-center gap-2">
                  <TransportIcon transport={transport} />
                  <span className="font-medium">
                    {transport}
                  </span>
                </div>
              )}

              {duration && (
                <div className="flex items-center gap-2">
                  <Clock3 size={18} />
                  <span>{duration}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ボタン */}
        <div className="mt-6">
          <TimelineMapButton spot={spot} />
        </div>

        {/* Spot情報 */}
        {spotData && <SpotCard spot={spotData} />}
      </Card>
    </div>
  );
}