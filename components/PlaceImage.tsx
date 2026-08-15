import SpotImage from "@/components/SpotImage";

import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";
import { getSpotByName } from "@/lib/spotService";

const placeImageMessages = getMessages(DEFAULT_LOCALE).placeImage;

type Props = {
  name: string;
};

const FALLBACK_IMAGE =
  "/spots/placeholder.jpg";

export default function PlaceImage({
  name,
}: Props) {
  const spot =
    getSpotByName(name);

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
          alt={`${name}${placeImageMessages.photoAltSuffix}`}
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
          {name}
        </p>
      </div>
    </div>
  );
}
