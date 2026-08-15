"use client";

import SpotImage from "@/components/SpotImage";

import { useLocale } from "@/components/LocaleProvider";
import { getLocalizedSpotName } from "@/lib/localizedSpot";
import { getSpotByName } from "@/lib/spotService";

type Props = {
  name: string;
};

const FALLBACK_IMAGE =
  "/spots/placeholder.jpg";

export default function PlaceImage({
  name,
}: Props) {
  const { locale, messages } = useLocale();
  const placeImageMessages = messages.placeImage;
  const spot =
    getSpotByName(name);
  const localizedName = spot
    ? getLocalizedSpotName(spot, locale)
    : name;

  const imageSrc =
    spot?.image?.trim() ||
    FALLBACK_IMAGE;

  return (
    <div
      className="
        overflow-hidden
        rounded-xl
        border
        border-gray-200
        bg-white
        shadow-sm
        transition
        hover:shadow-md
      "
    >
      <div className="relative h-40 w-full">
        <SpotImage
          src={imageSrc}
          alt={`${localizedName}${placeImageMessages.photoAltSuffix}`}
          spotName={spot?.name ?? name}
          spotId={spot?.id}
          latitude={spot?.latitude}
          longitude={spot?.longitude}
          className="
            transition-transform
            duration-300
            hover:scale-105
          "
        />
      </div>

      <div className="p-3">
        <p
          className="
            break-words
            font-semibold
            text-gray-900
          "
        >
          {localizedName}
        </p>
      </div>
    </div>
  );
}
