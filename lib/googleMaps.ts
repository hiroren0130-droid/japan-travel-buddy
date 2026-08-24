type GoogleMapsRouteOptions = {
  startLocation?: string;
  endLocation?: string;
};

export function createGoogleMapsRoute(
  spots: string[],
  options: GoogleMapsRouteOptions = {}
) {
  const startLocation =
    options.startLocation?.trim();
  const endLocation =
    options.endLocation?.trim();

  if (
    spots.length === 0 &&
    !startLocation &&
    !endLocation
  ) {
    return "https://www.google.com/maps";
  }

  if (
    spots.length === 1 &&
    !startLocation &&
    !endLocation
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      spots[0]
    )}`;
  }

  const origin =
    startLocation ?? spots[0] ?? endLocation ?? "";
  const destination =
    endLocation ??
    spots.at(-1) ??
    startLocation ??
    "";
  const waypointSpots = spots.slice(
    startLocation ? 0 : 1,
    endLocation ? spots.length : -1
  );
  const waypoints = waypointSpots.join("|");

  let url =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${encodeURIComponent(origin)}` +
    `&destination=${encodeURIComponent(destination)}`;

  if (waypoints.length > 0) {
    url += `&waypoints=${encodeURIComponent(waypoints)}`;
  }

  url += "&travelmode=walking";

  return url;
}
