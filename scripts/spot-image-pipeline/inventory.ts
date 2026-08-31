import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { spots as kyotoSpots } from "../../data/kyoto";
import { kyotoSpotTranslationsEn } from "../../data/locales/en/kyoto";
import type { Spot } from "../../data/types";
import type { InventoryResult, PipelineSpot } from "./types";

const LOCAL_IMAGE_PATTERN = /^\/spots\/([a-z0-9-]+)\.jpg$/;

export function toPipelineSpot(spot: Spot): PipelineSpot {
  return {
    id: spot.id,
    nameJa: spot.name,
    nameEn: kyotoSpotTranslationsEn[spot.id]?.name ?? spot.name,
    image: spot.image,
  };
}

export function isMissingLocalImage(
  spot: Pick<Spot, "id" | "image">,
  publicDirectory = path.join(process.cwd(), "public"),
  fileExists: (filePath: string) => boolean = existsSync
): boolean {
  const match = LOCAL_IMAGE_PATTERN.exec(spot.image);

  if (!match || match[1] !== spot.id || spot.image === "/spots/placeholder.jpg") {
    return false;
  }

  return !fileExists(path.join(publicDirectory, "spots", `${spot.id}.jpg`));
}

export function buildInventory(
  spots: readonly Spot[] = kyotoSpots,
  publicDirectory = path.join(process.cwd(), "public"),
  fileExists: (filePath: string) => boolean = existsSync
): InventoryResult {
  const missingSpotIds = spots
    .filter((spot) => isMissingLocalImage(spot, publicDirectory, fileExists))
    .map((spot) => spot.id);

  return {
    total: spots.length,
    ready: spots.length - missingSpotIds.length,
    missing: missingSpotIds.length,
    missingSpotIds,
  };
}

export function getKyotoPipelineSpot(spotId: string): PipelineSpot | undefined {
  const spot = kyotoSpots.find((candidate) => candidate.id === spotId);
  return spot ? toPipelineSpot(spot) : undefined;
}

export function getKyotoSpotRecord(spotId: string): Spot | undefined {
  return kyotoSpots.find((spot) => spot.id === spotId);
}

export function getSpotDbFingerprint(
  sourcePath = path.join(process.cwd(), "data", "kyoto.ts")
): string {
  return createHash("sha256").update(readFileSync(sourcePath)).digest("hex");
}
