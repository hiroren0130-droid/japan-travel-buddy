import { getLocalizedSpotName } from "@/lib/localizedSpot";
import { getAllSpots } from "@/lib/spotService";

type GoogleMapsRouteOptions = {
  startLocation?: string;
  endLocation?: string;
};

export type GoogleMapsRoutePoint = {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  cityId?: string;
};

type GoogleMapsRouteInput =
  | string
  | GoogleMapsRoutePoint;

type GoogleMapsTravelMode =
  | "walking"
  | "transit";

function normalizeLocationName(
  value: string
): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

function resolveLocationCityId(
  location: string | undefined
): string | undefined {
  if (!location?.trim()) {
    return undefined;
  }

  const normalizedLocation =
    normalizeLocationName(location);
  const spot = getAllSpots().find(
    (candidate) =>
      [
        candidate.name,
        getLocalizedSpotName(candidate, "en"),
      ].some(
        (name) =>
          normalizeLocationName(name) ===
          normalizedLocation
      )
  );

  return spot?.cityId;
}

export function determineGoogleMapsTravelMode(
  routePoints: GoogleMapsRouteInput[],
  options: GoogleMapsRouteOptions = {}
): GoogleMapsTravelMode {
  const cityIds = new Set<string>();

  for (const routePoint of routePoints) {
    if (
      typeof routePoint !== "string" &&
      routePoint.cityId?.trim()
    ) {
      cityIds.add(routePoint.cityId.trim());
    }
  }

  for (const location of [
    options.startLocation,
    options.endLocation,
  ]) {
    const cityId =
      resolveLocationCityId(location);

    if (cityId) {
      cityIds.add(cityId);
    }
  }

  return cityIds.size >= 2
    ? "transit"
    : "walking";
}

function toGoogleMapsPlace(
  spot: GoogleMapsRouteInput
): string {
  if (typeof spot === "string") {
    return spot;
  }

  const address = spot.address?.trim();

  if (address) {
    return `${spot.name}, ${address}`;
  }

  const { latitude, longitude } = spot;
  const hasValidCoordinates =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  return hasValidCoordinates
    ? `${latitude},${longitude}`
    : spot.name;
}

export function createGoogleMapsRoute(
  spots: GoogleMapsRouteInput[],
  options: GoogleMapsRouteOptions = {}
) {
  const places = spots.map(toGoogleMapsPlace);
  const startLocation =
    options.startLocation?.trim();
  const endLocation =
    options.endLocation?.trim();

  if (
    places.length === 0 &&
    !startLocation &&
    !endLocation
  ) {
    return "https://www.google.com/maps";
  }

  if (
    places.length === 1 &&
    !startLocation &&
    !endLocation
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      places[0]
    )}`;
  }

  const origin =
    startLocation ?? places[0] ?? endLocation ?? "";
  const destination =
    endLocation ??
    places.at(-1) ??
    startLocation ??
    "";
  const waypointSpots = places.slice(
    startLocation ? 0 : 1,
    endLocation ? places.length : -1
  );
  const waypoints = waypointSpots.join("|");

  let url =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${encodeURIComponent(origin)}` +
    `&destination=${encodeURIComponent(destination)}`;

  if (waypoints.length > 0) {
    url += `&waypoints=${encodeURIComponent(waypoints)}`;
  }

  url += `&travelmode=${determineGoogleMapsTravelMode(
    spots,
    options
  )}`;

  return url;
}
