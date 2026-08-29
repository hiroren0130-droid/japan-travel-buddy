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
  {
    spotId: "ginkakuji",
    spotNameJa: "銀閣寺",
    spotNameEn: "Ginkaku-ji",
    localFilename: "/spots/ginkakuji.jpg",
    sourceTitle: "Silver pavilion @ Ginkaku-ji @ Kyoto (13310426555).jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Silver_pavilion_@_Ginkaku-ji_@_Kyoto_(13310426555).jpg",
    photographerName: "Guilhem Vellut",
    licenseName: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    attributionRequired: true,
    modifications:
      "Cropped vertically to a 3:2 aspect ratio, resized, and JPEG-compressed to 1200 × 800 pixels.",
    notes: "The full width was retained to keep the Silver Pavilion left of center.",
  },
  {
    spotId: "bamboo-grove",
    spotNameJa: "嵯峨野竹林",
    spotNameEn: "Arashiyama Bamboo Grove",
    localFilename: "/spots/bamboo-grove.jpg",
    sourceTitle: "Bamboo grove, Arashiyama (3811218708).jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Bamboo_grove,_Arashiyama_(3811218708).jpg",
    photographerName: "Andrea Schaffer",
    licenseName: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    attributionRequired: true,
    modifications:
      "Left-cropped to a 3:2 aspect ratio to remove the prominent person at right, resized, and JPEG-compressed to 1200 × 800 pixels.",
    notes: "Distant visitors were retained while keeping the bamboo grove as the subject.",
  },
  {
    spotId: "togetsukyo",
    spotNameJa: "渡月橋",
    spotNameEn: "Togetsukyo Bridge",
    localFilename: "/spots/togetsukyo.jpg",
    sourceTitle:
      "Togetsukyo bridge in Arashiyama- I did not walk to the other side (48743686522).jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Togetsukyo_bridge_in_Arashiyama-_I_did_not_walk_to_the_other_side_(48743686522).jpg",
    photographerName: "shankar s.",
    licenseName: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    attributionRequired: true,
    modifications:
      "Cropped to a 3:2 aspect ratio to exclude the large foreground pipe, resized, and JPEG-compressed to 1200 × 800 pixels.",
    notes: "The bridge, river, and mountains were retained.",
  },
  {
    spotId: "tenryuji",
    spotNameJa: "天龍寺",
    spotNameEn: "Tenryu-ji",
    localFilename: "/spots/tenryuji.jpg",
    sourceTitle:
      "Beautiful landscaping at Tenryu-ji for a true sense of zen! (48743691057).jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Beautiful_landscaping_at_Tenryu-ji_for_a_true_sense_of_zen!_(48743691057).jpg",
    photographerName: "shankar s.",
    licenseName: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    attributionRequired: true,
    modifications:
      "Minimally cropped to a 3:2 aspect ratio, resized, and JPEG-compressed to 1200 × 800 pixels.",
    notes: "The original garden composition was retained.",
  },
  {
    spotId: "yasaka-shrine",
    spotNameJa: "八坂神社",
    spotNameEn: "Yasaka Shrine",
    localFilename: "/spots/yasaka-shrine.jpg",
    sourceTitle: "Yasaka Shrine @ Kyoto (13406249543).jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Yasaka_Shrine_@_Kyoto_(13406249543).jpg",
    photographerName: "Guilhem Vellut",
    licenseName: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    attributionRequired: true,
    modifications:
      "Bottom-cropped to a 3:2 aspect ratio to reduce the road area, resized, and JPEG-compressed to 1200 × 800 pixels.",
    notes: "The Nishi-romon gate remains the main subject.",
  },
  {
    spotId: "gion",
    spotNameJa: "祇園",
    spotNameEn: "Gion",
    localFilename: "/spots/gion.jpg",
    sourceTitle: "Gion street.jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Gion_street.jpg",
    photographerName: "RachelH_",
    licenseName: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    attributionRequired: true,
    modifications:
      "Cropped vertically to a 3:2 aspect ratio, resized, and JPEG-compressed to 1200 × 800 pixels.",
    notes: "The machiya facades, willow trees, and historic streetscape were retained.",
  },
  {
    spotId: "nijo-castle",
    spotNameJa: "二条城",
    spotNameEn: "Nijo Castle",
    localFilename: "/spots/nijo-castle.jpg",
    sourceTitle: "Tonan Sumi-Yagura, Nijo Castle (53648037727).jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Tonan_Sumi-Yagura,_Nijo_Castle_(53648037727).jpg",
    photographerName: "Mustang Joe (Joe deSousa)",
    licenseName: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    attributionRequired: false,
    modifications:
      "Left-cropped to a 3:2 aspect ratio to reduce the trees at right, resized, and JPEG-compressed to 1200 × 800 pixels.",
    notes: "The Tonan Sumi-Yagura turret was retained in full.",
  },
  {
    spotId: "nishiki-market",
    spotNameJa: "錦市場",
    spotNameEn: "Nishiki Market",
    localFilename: "/spots/nishiki-market.jpg",
    sourceTitle: "20260428 Nishiki Markt 05 Kyoto, Japan anagoria.jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:20260428_Nishiki_Markt_05_Kyoto,_Japan_anagoria.jpg",
    photographerName: "Anagoria",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    attributionRequired: true,
    modifications:
      "Top-cropped from x=1500, y=0 at 9000 × 6000 pixels, resized, and JPEG-compressed to 1200 × 800 pixels.",
    notes:
      "This adapted image is licensed under CC BY-SA 4.0. The arcade, Nishiki Market signage, and shops on both sides were retained while reducing the prominence of foreground visitors.",
  },
] as const;

export function getSpotImageCredit(
  spotId: string
): SpotImageCredit | undefined {
  return SPOT_IMAGE_CREDITS.find(
    (credit) => credit.spotId === spotId
  );
}
