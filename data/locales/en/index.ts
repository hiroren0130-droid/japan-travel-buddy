import type { SpotTranslation } from "@/data/types";

import { kyotoSpotTranslationsEn } from "./kyoto";

export const spotTranslationsEn: Readonly<
  Record<string, SpotTranslation>
> = {
  ...kyotoSpotTranslationsEn,
};
