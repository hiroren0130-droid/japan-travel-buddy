"use client";

type Props = {
  latitude: number;
  longitude: number;
  name: string;
};

export default function TravelMap({
  latitude,
  longitude,
  name,
}: Props) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return (
      <div
        className="mt-5 rounded-2xl border border-gray-200 p-6 text-center text-gray-500"
        role="status"
      >
        地図を表示できません。
      </div>
    );
  }

  const src = `https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200">
      <iframe
        title={`${name}の地図`}
        src={src}
        width="100%"
        height="300"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        className="h-[300px] w-full border-0"
      />
    </div>
  );
}