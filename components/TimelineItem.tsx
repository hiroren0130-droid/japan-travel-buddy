import Card from "@/components/ui/Card";
import PlaceLink from "./PlaceLink";
import SpotImage from "./SpotImage";
import TimelineMapButton from "./TimelineMapButton";

import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";
import { getSpotByName } from "@/lib/spotService";

import {
  Bus,
  CarTaxiFront,
  Clock3,
  Footprints,
  MapPin,
  Train,
} from "lucide-react";

const defaultMessages = getMessages(DEFAULT_LOCALE);

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
      return (
        <Footprints
          size={17}
          aria-hidden="true"
        />
      );

    case "JR":
    case "電車":
    case "地下鉄":
      return (
        <Train
          size={17}
          aria-hidden="true"
        />
      );

    case "バス":
      return (
        <Bus
          size={17}
          aria-hidden="true"
        />
      );

    case "タクシー":
      return (
        <CarTaxiFront
          size={17}
          aria-hidden="true"
        />
      );

    default:
      return (
        <Clock3
          size={17}
          aria-hidden="true"
        />
      );
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
    <div
      role="listitem"
      className="
        relative
        grid
        grid-cols-[64px_24px_minmax(0,1fr)]
        items-stretch
        gap-3
        sm:grid-cols-[76px_28px_minmax(0,1fr)]
        sm:gap-4
      "
    >
      {/* 時刻 */}
      <div className="pt-6 text-right sm:pt-7">
        <time className="whitespace-nowrap text-sm font-bold text-blue-600 sm:text-base">
          {time}
        </time>
      </div>

      {/* タイムライン */}
      <div className="relative flex min-h-full justify-center">
        <div className="absolute inset-y-0 w-[2px] bg-blue-500" />

        <div className="relative z-10 mt-7 flex h-5 w-5 items-center justify-center rounded-full bg-white sm:h-6 sm:w-6">
          <div className="h-3 w-3 rounded-full bg-blue-600 shadow-[0_0_0_4px_white] sm:h-4 sm:w-4" />
        </div>
      </div>

      {/* スポットカード */}
      <Card
        className="
          mb-4
          min-w-0
          overflow-hidden
          rounded-2xl
          border
          border-slate-100
          bg-white
          shadow-[0_4px_16px_rgba(15,23,42,0.06)]
          transition-shadow
          duration-300
          hover:shadow-[0_8px_24px_rgba(15,23,42,0.10)]
        "
      >
        <div className="flex flex-col sm:min-h-[180px] sm:flex-row">
          {/* スポット画像 */}
          {spotData && (
            <div
              className="
                h-48
                w-full
                shrink-0
                overflow-hidden
                bg-slate-100
                sm:h-[180px]
                sm:w-[210px]
                lg:w-[230px]
              "
            >
              <SpotImage
                src={spotData.image}
                alt={spotData.name}
                spotId={spotData.id}
                latitude={spotData.latitude}
                longitude={spotData.longitude}
                className="block h-full w-full object-cover"
              />
            </div>
          )}

          {/* スポット情報 */}
          <div className="flex min-w-0 flex-1 flex-col lg:flex-row">
            <div className="flex min-w-0 flex-1 flex-col justify-center px-5 py-5 sm:px-6">
              {/* スポット名・エリア */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <h3 className="text-xl font-bold leading-tight tracking-tight text-blue-600 sm:text-2xl">
                  <PlaceLink name={spot} />
                </h3>

                {spotData?.area && (
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                    <MapPin
                      size={16}
                      className="shrink-0 text-blue-600"
                      aria-hidden="true"
                    />

                    <span>{spotData.area}</span>
                  </div>
                )}
              </div>

              {/* 説明 */}
              <p className="mt-3 text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">
                {description ||
                  defaultMessages.timelineItem.descriptionFallback}
              </p>

              {/* 移動情報 */}
              {(transport || duration) && (
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
                  {transport && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">
                        <TransportIcon
                          transport={transport}
                        />
                      </span>

                      <span className="font-medium">
                        {transport}
                      </span>
                    </div>
                  )}

                  {duration && (
                    <div className="flex items-center gap-2">
                      <Clock3
                        size={17}
                        className="text-slate-600"
                        aria-hidden="true"
                      />

                      <span className="font-medium">
                        {duration}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PC用地図ボタン */}
            <div className="hidden shrink-0 items-center border-l border-slate-100 px-5 lg:flex">
              <TimelineMapButton spot={spot} />
            </div>

            {/* スマホ・タブレット用地図ボタン */}
            <div className="flex justify-end border-t border-slate-100 px-5 py-3 lg:hidden">
              <TimelineMapButton spot={spot} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
