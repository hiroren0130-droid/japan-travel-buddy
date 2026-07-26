// data/index.ts

import { spots as kyotoSpots } from "./kyoto";

export type { Spot } from "./types";

export { kyotoSpots };

export const allSpots = [...kyotoSpots];