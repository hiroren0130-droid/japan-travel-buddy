"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
};

type ImageSource =
  | "places"
  | "local"
  | "fallback";

const FALLBACK_IMAGE =
  "/spots/placeholder.jpg";

function createPlacesPhotoUrl(
  spotName: string
): string {
  const query = `${spotName.trim()} 京都`;

  return `/api/places/photo?query=${encodeURIComponent(
    query
  )}`;
}

export default function SpotImage({
  src,
  alt,
  className = "",
}: Props) {
  const localImage =
    src.trim() || FALLBACK_IMAGE;

  const placesPhotoUrl = useMemo(
    () => createPlacesPhotoUrl(alt),
    [alt]
  );

  const [failedPlacesUrl, setFailedPlacesUrl] =
    useState<string | null>(null);

  const [failedLocalImage, setFailedLocalImage] =
    useState<string | null>(null);

  const imageSource: ImageSource =
    failedPlacesUrl !== placesPhotoUrl
      ? "places"
      : failedLocalImage !== localImage &&
          localImage !== FALLBACK_IMAGE
        ? "local"
        : "fallback";

  const currentImage =
    imageSource === "places"
      ? placesPhotoUrl
      : imageSource === "local"
        ? localImage
        : FALLBACK_IMAGE;

  function handleImageError(): void {
    if (imageSource === "places") {
      setFailedPlacesUrl(
        placesPhotoUrl
      );

      return;
    }

    if (imageSource === "local") {
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