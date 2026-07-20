// data/index.ts

export type { Spot } from "./types";

export { spots as kyotoSpots } from "./kyoto";

import { spots as kyotoSpots } from "./kyoto";

export const allSpots = [...kyotoSpots];