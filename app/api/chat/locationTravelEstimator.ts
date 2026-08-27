import type { Spot } from "@/data/types";
import {
  getAllSpots,
  getSpotById,
  getSpotByName,
} from "@/lib/spotService";
import { getLocalizedSpotName } from "@/lib/localizedSpot";
import {
  getCityTravelProfile,
  getIntercityTravelProfile,
} from "@/data/intercityTravel";

export type TravelEstimate = {
  transport: string;
  durationMinutes: number;
};

const EARTH_RADIUS_KM = 6371;

function normalizeLocationName(
  value: string
): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

function hasValidCoordinates(
  spot: Spot
): boolean {
  return (
    Number.isFinite(spot.latitude) &&
    spot.latitude >= -90 &&
    spot.latitude <= 90 &&
    Number.isFinite(spot.longitude) &&
    spot.longitude >= -180 &&
    spot.longitude <= 180
  );
}

export function resolveLocationSpot(
  location: string | undefined
): Spot | null {
  if (!location?.trim()) {
    return null;
  }

  const normalizedLocation =
    normalizeLocationName(location);

  return (
    getAllSpots().find(
      (spot) =>
        hasValidCoordinates(spot) &&
        [
          spot.name,
          getLocalizedSpotName(spot, "en"),
        ].some(
          (name) =>
            normalizeLocationName(name) ===
            normalizedLocation
        )
    ) ?? null
  );
}

function degreesToRadians(
  degrees: number
): number {
  return degrees * (Math.PI / 180);
}

export function calculateDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
): number {
  const latitudeDifference =
    degreesToRadians(
      latitudeB - latitudeA
    );
  const longitudeDifference =
    degreesToRadians(
      longitudeB - longitudeA
    );
  const startLatitude =
    degreesToRadians(latitudeA);
  const endLatitude =
    degreesToRadians(latitudeB);

  const haversine =
    Math.sin(
      latitudeDifference / 2
    ) ** 2 +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(
        longitudeDifference / 2
      ) ** 2;
  const centralAngle =
    2 *
    Math.atan2(
      Math.sqrt(haversine),
      Math.sqrt(1 - haversine)
    );

  return EARTH_RADIUS_KM * centralAngle;
}

export function estimateTravel(
  distanceKm: number
): TravelEstimate {
  if (!Number.isFinite(distanceKm)) {
    return {
      transport: "電車",
      durationMinutes: 30,
    };
  }

  if (distanceKm <= 1.2) {
    return {
      transport: "徒歩",
      durationMinutes:
        Math.max(
          Math.round(
            distanceKm * 15
          ),
          5
        ),
    };
  }

  if (distanceKm <= 4) {
    return {
      transport: "バス",
      durationMinutes:
        Math.max(
          Math.round(
            distanceKm * 6 + 10
          ),
          15
        ),
    };
  }

  return {
    transport: "電車",
    durationMinutes:
      Math.max(
        Math.round(
          distanceKm * 4 + 15
        ),
        25
      ),
  };
}

function estimateTravelBetweenLocalSpots(
  fromSpot: Spot,
  toSpot: Spot
): TravelEstimate {
  return estimateTravel(
    calculateDistanceKm(
      fromSpot.latitude,
      fromSpot.longitude,
      toSpot.latitude,
      toSpot.longitude
    )
  );
}

export function estimateTravelBetweenSpots(
  fromSpot: Spot,
  toSpot: Spot,
  resolveHubSpot: (
    spotId: string
  ) => Spot | undefined = getSpotById
): TravelEstimate {
  const fallbackEstimate =
    estimateTravelBetweenLocalSpots(
      fromSpot,
      toSpot
    );

  const fromCityId =
    fromSpot.cityId?.trim();
  const toCityId =
    toSpot.cityId?.trim();

  if (
    !fromCityId ||
    !toCityId ||
    fromCityId === toCityId
  ) {
    return fallbackEstimate;
  }

  const intercityProfile =
    getIntercityTravelProfile(
      fromCityId,
      toCityId
    );
  const fromCityProfile =
    getCityTravelProfile(fromCityId);
  const toCityProfile =
    getCityTravelProfile(toCityId);

  if (
    !intercityProfile ||
    !fromCityProfile ||
    !toCityProfile
  ) {
    return fallbackEstimate;
  }

  const fromHub = resolveHubSpot(
    fromCityProfile.hubSpotId
  );
  const toHub = resolveHubSpot(
    toCityProfile.hubSpotId
  );

  if (
    !fromHub ||
    !toHub ||
    fromHub.cityId !== fromSpot.cityId ||
    toHub.cityId !== toSpot.cityId ||
    !hasValidCoordinates(fromHub) ||
    !hasValidCoordinates(toHub)
  ) {
    return fallbackEstimate;
  }

  const fromHubAccessMinutes =
    fromSpot.id === fromHub.id
      ? 0
      : estimateTravelBetweenLocalSpots(
          fromSpot,
          fromHub
        ).durationMinutes;
  const toHubAccessMinutes =
    toSpot.id === toHub.id
      ? 0
      : estimateTravelBetweenLocalSpots(
          toHub,
          toSpot
        ).durationMinutes;

  return {
    transport:
      intercityProfile.transport,
    durationMinutes:
      fromHubAccessMinutes +
      intercityProfile.hubToHubMinutes +
      toHubAccessMinutes,
  };
}

export function estimateLocationTravel({
  location,
  spotName,
}: {
  location: string | undefined;
  spotName: string;
}): TravelEstimate | null {
  const locationSpot =
    resolveLocationSpot(location);
  const itinerarySpot =
    getSpotByName(spotName);

  if (
    !locationSpot ||
    !itinerarySpot ||
    !hasValidCoordinates(itinerarySpot)
  ) {
    return null;
  }

  return estimateTravelBetweenSpots(
    locationSpot,
    itinerarySpot
  );
}
