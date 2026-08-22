import type { SpotTranslation } from "@/data/types";

import { kyotoSpotTranslationsEn } from "./kyoto";
import { osakaSpotTranslationsEn } from "./osaka";

export const spotTranslationsEn: Readonly<
  Record<string, SpotTranslation>
> = {
  ...kyotoSpotTranslationsEn,
  ...osakaSpotTranslationsEn,
};
