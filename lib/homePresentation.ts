import {
  PREFECTURE_IDS,
  type PrefectureId,
} from "@/data/regions";

export const HOME_PREFECTURE_IDS = [
  PREFECTURE_IDS.KYOTO,
  PREFECTURE_IDS.OSAKA,
] as const satisfies readonly PrefectureId[];

export const featuredSpotIdsByPrefecture = {
  [PREFECTURE_IDS.KYOTO]: [
    "kiyomizudera",
    "fushimi-inari",
    "arashiyama",
  ],
  [PREFECTURE_IDS.OSAKA]: [
    "osaka-castle",
    "dotonbori",
    "tsutenkaku",
  ],
} as const satisfies Readonly<
  Record<PrefectureId, readonly string[]>
>;
