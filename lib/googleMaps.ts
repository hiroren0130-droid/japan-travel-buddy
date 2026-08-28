import { resolveLocationSpot } from "@/lib/locationResolver";

type GoogleMapsRouteOptions = {
  startLocation?: string;
  endLocation?: string;
};

export type GoogleMapsRoutePoint = {
  name: string;
  displayName?: string;
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

export type GoogleMapsRouteSegment = {
  origin: string;
  destination: string;
  travelMode?: GoogleMapsTravelMode;
  url: string;
};

function resolveLocationCityId(
  location: string | undefined
): string | undefined {
  return resolveLocationSpot(location)?.cityId;
}

function createLocationRoutePoint(
  location: string
): GoogleMapsRoutePoint {
  const spot = resolveLocationSpot(location);

  return {
    name: spot?.name ?? location,
    ...(spot
      ? { displayName: location }
      : {}),
    ...(spot?.address
      ? { address: spot.address }
      : {}),
    ...(spot
      ? {
          latitude: spot.latitude,
          longitude: spot.longitude,
          cityId: spot.cityId,
        }
      : {}),
  };
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

function createGoogleMapsDirectionsUrl({
  origin,
  destination,
  travelMode,
}: {
  origin: string;
  destination: string;
  travelMode?: GoogleMapsTravelMode;
}): string {
  let url =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${encodeURIComponent(origin)}` +
    `&destination=${encodeURIComponent(destination)}`;

  if (travelMode) {
    url += `&travelmode=${travelMode}`;
  }

  return url;
}

export function createGoogleMapsRouteSegments(
  spots: GoogleMapsRoutePoint[],
  options: GoogleMapsRouteOptions = {}
): GoogleMapsRouteSegment[] {
  const routePoints: GoogleMapsRoutePoint[] = [
    ...(options.startLocation?.trim()
      ? [
          createLocationRoutePoint(
            options.startLocation.trim()
          ),
        ]
      : []),
    ...spots,
    ...(options.endLocation?.trim()
      ? [
          createLocationRoutePoint(
            options.endLocation.trim()
          ),
        ]
      : []),
  ];

  return routePoints.slice(0, -1).map(
    (originPoint, index) => {
      const destinationPoint =
        routePoints[index + 1];
      const originCityId =
        originPoint.cityId?.trim();
      const destinationCityId =
        destinationPoint.cityId?.trim();
      const travelMode =
        originCityId && destinationCityId
          ? originCityId === destinationCityId
            ? "walking"
            : "transit"
          : undefined;
      const origin =
        toGoogleMapsPlace(originPoint);
      const destination =
        toGoogleMapsPlace(destinationPoint);

      return {
        origin:
          originPoint.displayName ??
          originPoint.name,
        destination:
          destinationPoint.displayName ??
          destinationPoint.name,
        ...(travelMode
          ? { travelMode }
          : {}),
        url: createGoogleMapsDirectionsUrl({
          origin,
          destination,
          travelMode,
        }),
      };
    }
  );
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
  const startPlace = startLocation
    ? toGoogleMapsPlace(
        createLocationRoutePoint(startLocation)
      )
    : undefined;
  const endPlace = endLocation
    ? toGoogleMapsPlace(
        createLocationRoutePoint(endLocation)
      )
    : undefined;

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
    startPlace ?? places[0] ?? endPlace ?? "";
  const destination =
    endPlace ??
    places.at(-1) ??
    startPlace ??
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
