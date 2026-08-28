export type SpotImageCredit = {
  spotId: string;
  spotNameJa: string;
  spotNameEn: string;
  localFilename: string;
  sourceTitle: string;
  sourcePageUrl: string;
  photographerName: string;
  licenseName: string;
  licenseUrl: string;
  attributionRequired: boolean;
  modifications: string;
  notes: string;
};

export const SPOT_IMAGE_CREDITS: readonly SpotImageCredit[] = [
  {
    spotId: "osaka-castle",
    spotNameJa: "大阪城",
    spotNameEn: "Osaka Castle",
    localFilename: "/spots/osaka-castle.jpg",
    sourceTitle: "Osaka Castle 2022-04-23.jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Osaka_Castle_2022-04-23.jpg",
    photographerName: "Dick Thomas Johnson",
    licenseName: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    attributionRequired: true,
    modifications: "Resized and JPEG-compressed to 1200 × 800 pixels.",
    notes: "The original 3:2 composition was retained.",
  },
  {
    spotId: "arashiyama",
    spotNameJa: "嵐山",
    spotNameEn: "Arashiyama",
    localFilename: "/spots/arashiyama.jpg",
    sourceTitle: "Aerial panorama of Arashiyama (嵐山).jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Aerial_panorama_of_Arashiyama_(%E5%B5%90%E5%B1%B1).jpg",
    photographerName: "Bob Tan",
    licenseName: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    attributionRequired: true,
    modifications:
      "Center-cropped to a 3:2 aspect ratio, resized, and JPEG-compressed to 1200 × 800 pixels.",
    notes: "The crop keeps Togetsukyo Bridge near the center.",
  },
  {
    spotId: "dotonbori",
    spotNameJa: "道頓堀",
    spotNameEn: "Dotonbori",
    localFilename: "/spots/dotonbori.jpg",
    sourceTitle: "2021-12-11 Dōtonbori at Night.jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:2021-12-11_D%C5%8Dtonbori_at_Night.jpg",
    photographerName: "Dick Thomas Johnson",
    licenseName: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    attributionRequired: true,
    modifications: "Resized and JPEG-compressed to 1200 × 800 pixels.",
    notes: "The original 3:2 composition was retained.",
  },
  {
    spotId: "tsutenkaku",
    spotNameJa: "通天閣",
    spotNameEn: "Tsutenkaku",
    localFilename: "/spots/tsutenkaku.jpg",
    sourceTitle: "Shinsekai Tsutenkaku at night 2022-04-23.jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Shinsekai_Tsutenkaku_at_night_2022-04-23.jpg",
    photographerName: "Dick Thomas Johnson",
    licenseName: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    attributionRequired: true,
    modifications: "Resized and JPEG-compressed to 1200 × 800 pixels.",
    notes: "The original 3:2 composition was retained.",
  },
] as const;

export function getSpotImageCredit(
  spotId: string
): SpotImageCredit | undefined {
  return SPOT_IMAGE_CREDITS.find(
    (credit) => credit.spotId === spotId
  );
}
