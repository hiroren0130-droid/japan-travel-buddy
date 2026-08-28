import {
  locationAliases,
  type LocationAliasEntry,
} from "@/data/locationAliases";
import type { Spot } from "@/data/types";
import { getLocalizedSpotName } from "@/lib/localizedSpot";
import {
  getAllSpots,
  getSpotById,
} from "@/lib/spotService";

export function normalizeLocationName(
  value: string
): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

export function hasValidLocationCoordinates(
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
  const spots = getAllSpots();
  const canonicalSpot = spots.find(
    (spot) =>
      hasValidLocationCoordinates(spot) &&
      normalizeLocationName(spot.name) ===
        normalizedLocation
  );

  if (canonicalSpot) {
    return canonicalSpot;
  }

  const localizedSpot = spots.find(
    (spot) =>
      hasValidLocationCoordinates(spot) &&
      normalizeLocationName(
        getLocalizedSpotName(spot, "en")
      ) === normalizedLocation
  );

  if (localizedSpot) {
    return localizedSpot;
  }

  const aliasEntry = locationAliases.find(
    (entry) =>
      entry.aliases.some(
        (alias) =>
          normalizeLocationName(alias) ===
          normalizedLocation
      )
  );
  const aliasSpot = aliasEntry
    ? getSpotById(aliasEntry.spotId)
    : undefined;

  return aliasSpot &&
    hasValidLocationCoordinates(aliasSpot)
    ? aliasSpot
    : null;
}

export function validateLocationAliases(
  entries: readonly LocationAliasEntry[] =
    locationAliases,
  spots: readonly Spot[] = getAllSpots()
): string[] {
  const errors: string[] = [];
  const spotsById = new Map(
    spots.map((spot) => [spot.id, spot])
  );
  const canonicalOwners = new Map<
    string,
    string
  >();
  const aliasOwners = new Map<string, string>();

  for (const spot of spots) {
    for (const name of [
      spot.name,
      getLocalizedSpotName(spot, "en"),
    ]) {
      canonicalOwners.set(
        normalizeLocationName(name),
        spot.id
      );
    }
  }

  for (const entry of entries) {
    const targetSpot = spotsById.get(
      entry.spotId
    );

    if (!targetSpot) {
      errors.push(
        `Location alias target Spot does not exist: ${entry.spotId}`
      );
    } else if (
      !hasValidLocationCoordinates(targetSpot)
    ) {
      errors.push(
        `Location alias target Spot has invalid coordinates: ${entry.spotId}`
      );
    }

    for (const alias of entry.aliases) {
      const normalizedAlias =
        normalizeLocationName(alias);
      const canonicalOwner =
        canonicalOwners.get(normalizedAlias);
      const aliasOwner =
        aliasOwners.get(normalizedAlias);

      if (
        canonicalOwner &&
        canonicalOwner !== entry.spotId
      ) {
        errors.push(
          `Location alias conflicts with canonical name: ${alias} (${entry.spotId} -> ${canonicalOwner})`
        );
      }

      if (aliasOwner) {
        errors.push(
          `Duplicate normalized location alias: ${alias} (${entry.spotId}, ${aliasOwner})`
        );
      } else {
        aliasOwners.set(
          normalizedAlias,
          entry.spotId
        );
      }
    }
  }

  return errors;
}
