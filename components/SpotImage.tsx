"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  spotName?: string;
  spotId?: string;
  latitude?: number;
  longitude?: number;
  className?: string;
};

const FALLBACK_IMAGE =
  "/spots/placeholder.jpg";

export default function SpotImage({
  src,
  alt,
  className = "",
}: Props) {
  const requestedLocalImage = src.trim();
  const localImage =
    requestedLocalImage
      ? requestedLocalImage
      : FALLBACK_IMAGE;

  const [failedLocalImage, setFailedLocalImage] =
    useState<string | null>(null);

  const currentImage =
    failedLocalImage !== localImage
      ? localImage
      : FALLBACK_IMAGE;

  function handleImageError(): void {
    if (currentImage !== FALLBACK_IMAGE) {
      setFailedLocalImage(
        localImage
      );
    }
  }

  return (
    <Image
      key={currentImage}
      src={currentImage}
      alt={alt}
      width={1200}
      height={800}
      className={`h-full w-full object-cover ${className}`}
      sizes="(max-width: 768px) 100vw, 400px"
      unoptimized
      onError={handleImageError}
    />
  );
}
