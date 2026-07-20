export function createGoogleMapsRoute(spots: string[]) {
  if (spots.length === 0) {
    return "https://www.google.com/maps";
  }

  if (spots.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      spots[0]
    )}`;
  }

  const origin = spots[0];
  const destination = spots[spots.length - 1];
  const waypoints = spots.slice(1, -1).join("|");

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