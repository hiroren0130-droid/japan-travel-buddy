import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const messages = getMessages(DEFAULT_LOCALE).travelRouteMap;

type Props = {
  spots: {
    name: string;
    latitude: number;
    longitude: number;
  }[];
};

export default function TravelRouteMap({
  spots,
}: Props) {
  if (spots.length === 0) return null;

  const center = spots[0];

  

  const src = `https://www.google.com/maps?q=${center.latitude},${center.longitude}&z=13&output=embed`;

  return (
    <div className="mt-8 overflow-hidden rounded-3xl border bg-white shadow-md">
      <div className="border-b bg-blue-600 px-6 py-4 text-lg font-bold text-white">
        {messages.title}
      </div>

      <iframe
        src={src}
        className="h-[500px] w-full"
        loading="lazy"
      />
    </div>
  );
}
