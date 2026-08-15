"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Props = {
  src: string;
  alt: string;
  spotName?: string;
  spotId?: string;
  latitude?: number;
  longitude?: number;
  className?: string;
};

type ImageSource =
  | "places"
  | "local"
  | "fallback";

const FALLBACK_IMAGE =
  "/spots/placeholder.jpg";

const KNOWN_PLACEHOLDER_IMAGES =
  new Set([
    "/spots/yasaka-shrine.jpg",
  ]);

function createPlacesPhotoUrl(
  spotName: string,
  spotId?: string,
  latitude?: number,
  longitude?: number
): string {
  const query = `${spotName.trim()} 京都`;
  const searchParams = new URLSearchParams({
    query,
  });

  if (spotId) {
    searchParams.set("spotId", spotId);
  }

  if (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  ) {
    searchParams.set(
      "latitude",
      String(latitude)
    );
    searchParams.set(
      "longitude",
      String(longitude)
    );
  }

  return `/api/places/photo?${searchParams.toString()}`;
}

export default function SpotImage({
  src,
  alt,
  spotName,
  spotId,
  latitude,
  longitude,
  className = "",
}: Props) {
  const requestedLocalImage = src.trim();
  const localImage =
    requestedLocalImage &&
    !KNOWN_PLACEHOLDER_IMAGES.has(
      requestedLocalImage
    )
      ? requestedLocalImage
      : FALLBACK_IMAGE;

  const placesPhotoUrl = useMemo(
    () =>
      createPlacesPhotoUrl(
        spotName ?? alt,
        spotId,
        latitude,
        longitude
      ),
    [alt, latitude, longitude, spotId, spotName]
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
