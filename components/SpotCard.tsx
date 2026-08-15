import {
  Clock3,
  ExternalLink,
  Globe,
  Info,
  MapPin,
  Star,
  Tag,
  Wallet,
} from "lucide-react";

import Card from "@/components/ui/Card";
import SpotImage from "@/components/SpotImage";
import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";
import TravelMap from "./TravelMap";

const spotCardMessages = getMessages(DEFAULT_LOCALE).spotCard;

type Spot = {
  name: string;
  category?: string;
  area?: string;
  description?: string;
  image?: string;
  address?: string;
  hours?: string;
  price?: string;
  rating?: number;
  website?: string;
  latitude: number;
  longitude: number;
};

type Props = {
  spot: Spot;
};

type InformationItemProps = {
  icon: React.ComponentType<{
    size?: number;
    className?: string;
    strokeWidth?: number;
    "aria-hidden"?: boolean;
  }>;
  label: string;
  value: string;
};

function InformationItem({
  icon: Icon,
  label,
  value,
}: InformationItemProps) {
  return (
    <div
      className="
        group/info
        rounded-2xl
        border
        border-slate-200/80
        bg-white
        p-4
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-0.5
        hover:border-blue-200
        hover:shadow-md
      "
    >
      <div className="flex items-start gap-3">
        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-blue-50
            text-blue-600
            transition-colors
            duration-300
            group-hover/info:bg-blue-100
          "
        >
          <Icon
            size={19}
            strokeWidth={2}
            aria-hidden={true}
          />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-700">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SpotCard({ spot }: Props) {
  const hasInformation =
    Boolean(spot.area) ||
    Boolean(spot.address) ||
    Boolean(spot.hours) ||
    Boolean(spot.price);

  return (
    <Card
      className="
        group
        mt-6
        overflow-hidden
        rounded-[32px]
        border
        border-white/80
        bg-white/90
        p-0
        shadow-xl
        shadow-slate-900/5
        backdrop-blur-xl
        transition-all
        duration-500
        hover:-translate-y-1
        hover:border-blue-100
        hover:shadow-2xl
        hover:shadow-blue-900/10
      "
    >
      {/* Image */}
      {spot.image && (
        <div className="relative h-72 w-full overflow-hidden sm:h-80 lg:h-[380px]">
          <SpotImage
            src={spot.image}
            alt={spot.name}
            className="
              transition-transform
              duration-700
              ease-out
              group-hover:scale-105
            "
          />

          <div
            aria-hidden="true"
            className="
              absolute
              inset-0
              bg-gradient-to-t
              from-slate-950/85
              via-slate-950/20
              to-transparent
            "
          />

          <div
            aria-hidden="true"
            className="
              absolute
              inset-0
              bg-gradient-to-r
              from-blue-950/20
              via-transparent
              to-transparent
            "
          />

          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                {spot.category && (
                  <div
                    className="
                      mb-3
                      inline-flex
                      items-center
                      gap-2
                      rounded-full
                      border
                      border-white/20
                      bg-white/15
                      px-3.5
                      py-2
                      text-xs
                      font-bold
                      text-white
                      shadow-lg
                      backdrop-blur-md
                    "
                  >
                    <Tag
                      size={14}
                      aria-hidden="true"
                    />

                    <span>{spot.category}</span>
                  </div>
                )}

                <h3
                  className="
                    break-words
                    text-3xl
                    font-black
                    leading-tight
                    tracking-tight
                    text-white
                    drop-shadow-lg
                    sm:text-4xl
                  "
                >
                  {spot.name}
                </h3>

                {spot.area && (
                  <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-white/90 sm:text-base">
                    <MapPin
                      size={17}
                      aria-hidden="true"
                    />

                    <span>{spot.area}</span>
                  </div>
                )}
              </div>

              {spot.rating != null && (
                <div
                  className="
                    inline-flex
                    w-fit
                    shrink-0
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-white/25
                    bg-white/90
                    px-4
                    py-2.5
                    shadow-xl
                    backdrop-blur-xl
                  "
                >
                  <Star
                    size={17}
                    className="fill-amber-400 text-amber-400"
                    aria-hidden="true"
                  />

                  <span className="font-extrabold text-slate-900">
                    {spot.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-7 p-5 sm:p-7 lg:p-8">
        {/* Header when image is unavailable */}
        {!spot.image && (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div
                className="
                  flex
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-gradient-to-br
                  from-blue-600
                  to-cyan-500
                  text-white
                  shadow-lg
                  shadow-blue-500/20
                "
              >
                <MapPin
                  size={25}
                  strokeWidth={2.1}
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                {spot.category && (
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-600">
                    <Tag
                      size={15}
                      aria-hidden="true"
                    />

                    <span>{spot.category}</span>
                  </div>
                )}

                <h3 className="break-words text-3xl font-black tracking-tight text-slate-950">
                  {spot.name}
                </h3>

                {spot.area && (
                  <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <MapPin
                      size={16}
                      aria-hidden="true"
                    />

                    <span>{spot.area}</span>
                  </p>
                )}
              </div>
            </div>

            {spot.rating != null && (
              <div
                className="
                  inline-flex
                  w-fit
                  shrink-0
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-amber-200
                  bg-amber-50
                  px-4
                  py-2.5
                "
              >
                <Star
                  size={17}
                  className="fill-amber-400 text-amber-400"
                  aria-hidden="true"
                />

                <span className="font-extrabold text-amber-700">
                  {spot.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Information */}
        {hasInformation && (
          <section aria-labelledby={`spot-details-${spot.name}`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-6 w-1 rounded-full bg-gradient-to-b from-blue-600 to-cyan-400" />

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                  {spotCardMessages.travelDetails}
                </p>

                <h4
                  id={`spot-details-${spot.name}`}
                  className="mt-0.5 text-lg font-extrabold text-slate-900"
                >
                  {spotCardMessages.basicInformation}
                </h4>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {spot.address && (
                <InformationItem
                  icon={MapPin}
                  label={spotCardMessages.addressLabel}
                  value={spot.address}
                />
              )}

              {spot.hours && (
                <InformationItem
                  icon={Clock3}
                  label={spotCardMessages.hoursLabel}
                  value={spot.hours}
                />
              )}

              {spot.price && (
                <InformationItem
                  icon={Wallet}
                  label={spotCardMessages.priceLabel}
                  value={spot.price}
                />
              )}

              {spot.area && !spot.address && (
                <InformationItem
                  icon={MapPin}
                  label={spotCardMessages.areaLabel}
                  value={spot.area}
                />
              )}
            </div>
          </section>
        )}

        {/* Description */}
        {spot.description && (
          <section
            aria-labelledby={`spot-information-${spot.name}`}
            className="
              relative
              overflow-hidden
              rounded-3xl
              border
              border-slate-200/80
              bg-gradient-to-br
              from-white
              via-white
              to-blue-50/60
              p-5
              shadow-sm
              sm:p-6
            "
          >
            <div
              aria-hidden="true"
              className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-blue-600 to-cyan-400"
            />

            <div className="flex items-start gap-4">
              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-blue-50
                  text-blue-600
                "
              >
                <Info
                  size={20}
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                  {spotCardMessages.spotInformation}
                </p>

                <h4
                  id={`spot-information-${spot.name}`}
                  className="mt-1 text-lg font-extrabold text-slate-900"
                >
                  {spotCardMessages.aboutSpot}
                </h4>

                <p className="mt-3 break-words text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                  {spot.description}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Official Website */}
        {spot.website && (
          <a
            href={spot.website}
            aria-label={`${spot.name}${spotCardMessages.officialWebsiteAriaLabelSuffix}`}
            target="_blank"
            rel="noopener noreferrer"
            className="
              group/button
              flex
              min-h-14
              w-full
              items-center
              justify-center
              gap-2.5
              rounded-2xl
              bg-gradient-to-r
              from-blue-600
              to-cyan-500
              px-6
              py-3
              text-base
              font-extrabold
              text-white
              shadow-lg
              shadow-blue-500/20
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:shadow-xl
              hover:shadow-blue-500/30
              active:translate-y-0
              active:scale-[0.99]
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-blue-500
              focus-visible:ring-offset-2
            "
          >
            <Globe
              size={19}
              aria-hidden="true"
            />

            <span>{spotCardMessages.officialWebsiteLabel}</span>

            <ExternalLink
              size={17}
              className="transition-transform duration-300 group-hover/button:translate-x-0.5 group-hover/button:-translate-y-0.5"
              aria-hidden="true"
            />
          </a>
        )}

        {/* Map */}
        <section aria-labelledby={`map-preview-${spot.name}`}>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-2xl
                  bg-emerald-50
                  text-emerald-600
                "
              >
                <MapPin
                  size={20}
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
                  {spotCardMessages.mapPreview}
                </p>

                <h4
                  id={`map-preview-${spot.name}`}
                  className="mt-0.5 text-lg font-extrabold text-slate-900"
                >
                  {spotCardMessages.location}
                </h4>
              </div>
            </div>
          </div>

          <div
            className="
              overflow-hidden
              rounded-3xl
              border
              border-slate-200
              bg-slate-100
              shadow-inner
            "
          >
            <TravelMap
              latitude={spot.latitude}
              longitude={spot.longitude}
              name={spot.name}
            />
          </div>
        </section>
      </div>
    </Card>
  );
}
