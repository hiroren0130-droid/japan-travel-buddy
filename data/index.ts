// data/index.ts

import { spots as kyotoSpots } from "./kyoto";
import { spots as osakaSpots } from "./osaka";

export type { Spot } from "./types";

export { kyotoSpots, osakaSpots };

export const spotRegistry = {
  kyoto: kyotoSpots,
  osaka: osakaSpots,
} as const;

export const allSpots =
  Object.values(spotRegistry).flat();
