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
        className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-gray-500 shadow-sm"
        role="status"
      >
        地図を表示できません。
      </div>
    );
  }

  const src = `https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
      <iframe
        title={`${name}の地図`}
        src={src}
        width="100%"
        height="360"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        className="h-[360px] w-full border-0"
      />
    </div>
  );
}