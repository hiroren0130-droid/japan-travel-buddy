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
  const src = `https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200">
      <iframe
        title={name}
        src={src}
        width="100%"
        height="300"
        loading="lazy"
        className="border-0"
      />
    </div>
  );
}