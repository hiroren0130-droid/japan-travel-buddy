import type {
  SpotTranslation,
} from "@/data/types";

export const kyotoSpotTranslationsEn: Readonly<
  Record<string, SpotTranslation>
> = {
  kiyomizudera: {
    name: "Kiyomizu-dera Temple",
    description:
      "A UNESCO World Heritage temple renowned for its wooden stage and panoramic views over Kyoto.",
    area: "Higashiyama",
    category: "Temple",
    address:
      "1-294 Kiyomizu, Higashiyama Ward, Kyoto",
  },
  "fushimi-inari": {
    name: "Fushimi Inari Taisha",
    description:
      "A celebrated Shinto shrine known worldwide for the thousands of vermilion torii gates lining its trails.",
    area: "Fushimi",
    category: "Shrine",
    address:
      "68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto",
  },
  kinkakuji: {
    name: "Kinkaku-ji Temple",
    description:
      "A UNESCO World Heritage temple famous for its gold-covered pavilion reflected in Kyokochi Pond.",
    area: "Kinugasa and Kitano",
    category: "Temple",
    address:
      "1 Kinkakujicho, Kita Ward, Kyoto",
  },
  "yasaka-shrine": {
    name: "Yasaka Shrine",
    description:
      "A historic shrine cherished as the guardian of Gion and a central stop for sightseeing in Higashiyama.",
    area: "Higashiyama",
    category: "Shrine",
    address:
      "625 Gionmachi Kitagawa, Higashiyama Ward, Kyoto",
  },
  gion: {
    name: "Gion",
    description:
      "Kyoto's historic entertainment district, known for stone-paved streets, traditional townhouses, and refined atmosphere.",
    area: "Higashiyama",
    category: "Historic District",
    address:
      "Gionmachi area, Higashiyama Ward, Kyoto",
  },
};
