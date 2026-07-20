import Image from "next/image";

type Props = {
  src?: string;
  alt: string;
};

export default function SpotImage({
  src,
  alt,
}: Props) {
  if (!src) {
    return (
      <div className="mb-4 flex h-48 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
        No Image
      </div>
    );
  }

  return (
    <div className="relative mb-4 h-48 overflow-hidden rounded-xl">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-300 hover:scale-105"
      />
    </div>
  );
}