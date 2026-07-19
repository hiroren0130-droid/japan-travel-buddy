type Props = {
  name: string;
};

const imageMap: Record<string, string> = {
  "清水寺":
    "https://images.unsplash.com/photo-1545569341-9eb8b30979d9",
  "伏見稲荷大社":
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e",
  "金閣寺":
    "https://images.unsplash.com/photo-1528360983277-13d401cdc186",
  "嵐山":
    "https://images.unsplash.com/photo-1578469645742-46cae010e5d4",
  "錦市場":
    "https://images.unsplash.com/photo-1554797589-7241bb691973",
  "祇園":
    "https://images.unsplash.com/photo-1526481280695-3c4691f241ac",
  "二条城":
    "https://images.unsplash.com/photo-1565623833408-d77e39b88af6",
  "銀閣寺":
    "https://images.unsplash.com/photo-1558862107-d49ef2a04d72",
  "京都駅":
    "https://images.unsplash.com/photo-1549693578-d683be217e58",
  "八坂神社":
    "https://images.unsplash.com/photo-1513407030348-c983a97b98d8",
};

export default function PlaceImage({ name }: Props) {
  const image = imageMap[name];

  if (!image) return null;

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow">
      <img
        src={image}
        alt={name}
        className="h-40 w-full object-cover"
      />

      <div className="p-3">
        <p className="font-semibold">{name}</p>
      </div>
    </div>
  );
}