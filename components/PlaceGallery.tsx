import PlaceImage from "./PlaceImage";
import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const placeGalleryMessages = getMessages(DEFAULT_LOCALE).placeGallery;

type Props = {
  content: string;
};

const places = [
  "清水寺",
  "伏見稲荷大社",
  "金閣寺",
  "嵐山",
  "錦市場",
  "祇園",
  "二条城",
  "銀閣寺",
  "京都駅",
  "八坂神社",
];

export default function PlaceGallery({ content }: Props) {
  if (!content) return null;
  
  const detectedPlaces = places.filter((place) =>
  content.includes(place)
);

  if (detectedPlaces.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="mb-4 text-lg font-bold">
        {placeGalleryMessages.title}
      </h3>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {detectedPlaces.map((place) => (
          <PlaceImage
            key={place}
            name={place}
          />
        ))}
      </div>
    </div>
  );
}
