// data/index.ts

import { spots as kyotoSpots } from "./kyoto";

export type { Spot } from "./types";

export { kyotoSpots };

export const spotRegistry = {
  kyoto: kyotoSpots,
} as const;

export const allSpots =
  Object.values(spotRegistry).flat();
