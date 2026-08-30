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
  {
    spotId: "heian-shrine",
    spotNameJa: "平安神宮",
    spotNameEn: "Heian Shrine",
    localFilename: "/spots/heian-shrine.jpg",
    sourceTitle: "Heian Shrine @ Kyoto (13310604013).jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Heian_Shrine_@_Kyoto_(13310604013).jpg",
    photographerName: "Guilhem Vellut",
    licenseName: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    attributionRequired: true,
    modifications:
      "Cropped from x=1, y=100 at 3966 × 2644 pixels within the audited bounds, resized, and JPEG-compressed to 1200 × 800 pixels at quality 84.",
    notes:
      "The crop retains the large vermilion torii while reducing excess sky and road.",
  },
  {
    spotId: "nanzenji",
    spotNameJa: "南禅寺",
    spotNameEn: "Nanzen-ji",
    localFilename: "/spots/nanzenji.jpg",
    sourceTitle: "Nanzenji aqueduct 20211123.jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Nanzenji_aqueduct_20211123.jpg",
    photographerName: "Suicasmo",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    attributionRequired: true,
    modifications:
      "Cropped from x=1404, y=0 at 3780 × 2520 pixels, resized, and JPEG-compressed to 1200 × 800 pixels at quality 84.",
    notes:
      "This adapted image is licensed under CC BY-SA 4.0. The aqueduct arches were retained while excluding the large foreground trunk and reducing the prominence of visitors.",
  },
  {
    spotId: "eikando",
    spotNameJa: "永観堂",
    spotNameEn: "Eikando",
    localFilename: "/spots/eikando.jpg",
    sourceTitle: "Eikando, Kyoto - Eikando7376.jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Eikando,_Kyoto_-_Eikando7376.jpg",
    photographerName: "lumoplank",
    licenseName: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    attributionRequired: false,
    modifications:
      "Cropped from x=684, y=0 at 4200 × 2800 pixels, resized, and JPEG-compressed to 1200 × 800 pixels at quality 84.",
    notes:
      "The pagoda, temple buildings, autumn foliage, and Hojo pond were retained while excluding the lower image band.",
  },
  {
    spotId: "kodaiji",
    spotNameJa: "高台寺",
    spotNameEn: "Kodai-ji",
    localFilename: "/spots/kodaiji.jpg",
    sourceTitle: "Kōdai-ji 20211123-1.jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:K%C5%8Ddai-ji_20211123-1.jpg",
    photographerName: "Suicasmo",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    attributionRequired: true,
    modifications:
      "Resized and JPEG-compressed to 1200 × 800 pixels at quality 84; the original 3:2 composition was retained.",
    notes:
      "This adapted image is licensed under CC BY-SA 4.0. The Kaisan-do, Kangetsu-dai, covered corridor, garden, and pond were retained.",
  },
  {
    spotId: "kenninji",
    spotNameJa: "建仁寺",
    spotNameEn: "Kennin-ji",
    localFilename: "/spots/kenninji.jpg",
    sourceTitle: "150124 Kenninji Kyoto Japan05s3.jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:150124_Kenninji_Kyoto_Japan05s3.jpg",
    photographerName: "663highland",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    attributionRequired: true,
    modifications:
      "Cropped from x=1800, y=200 at 3600 × 2400 pixels, resized, and JPEG-compressed to 1200 × 800 pixels at quality 84.",
    notes:
      "This adapted image is licensed under CC BY-SA 4.0. The Sanmon gate was centered while retaining its characteristic structure.",
  },
  {
    spotId: "sanjusangendo",
    spotNameJa: "三十三間堂",
    spotNameEn: "Sanjusangen-do",
    localFilename: "/spots/sanjusangendo.jpg",
    sourceTitle: "Kyoto Sanjusangen-do Haupthalle 02.jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Kyoto_Sanjusangen-do_Haupthalle_02.jpg",
    photographerName: "Zairon",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    attributionRequired: true,
    modifications:
      "Cropped from x=350, y=0 at 3348 × 2232 pixels, resized, and JPEG-compressed to 1200 × 800 pixels at quality 84.",
    notes:
      "This adapted image is licensed under CC BY-SA 4.0. The long main hall, continuous columns, and eaves were retained while reducing the prominence of distant visitors at right.",
  },
  {
    spotId: "toji",
    spotNameJa: "東寺",
    spotNameEn: "To-ji",
    localFilename: "/spots/toji.jpg",
    sourceTitle: "Tō-ji, Kyōto (Yozakura).jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:T%C5%8D-ji,_Ky%C5%8Dto_(Yozakura).jpg",
    photographerName: "Jean-Michel Lapointe",
    licenseName: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    attributionRequired: true,
    modifications:
      "Cropped from x=500, y=0 at 3300 × 2200 pixels, resized, and JPEG-compressed to 1200 × 800 pixels at quality 84.",
    notes:
      "The five-story pagoda and illuminated cherry blossoms were retained while excluding the lower group of visitors.",
  },
  {
    spotId: "kyoto-station",
    spotNameJa: "京都駅",
    spotNameEn: "Kyoto Station",
    localFilename: "/spots/kyoto-station.jpg",
    sourceTitle: "Kyoto Station (50910224293).jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Kyoto_Station_(50910224293).jpg",
    photographerName: "Dick Thomas Johnson",
    licenseName: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    attributionRequired: true,
    modifications:
      "Cropped from x=0, y=0 at 4896 × 3264 pixels, resized, and JPEG-compressed to 1200 × 800 pixels at quality 84.",
    notes:
      "The station atrium, grand staircase, and escalators were retained.",
  },
  {
    spotId: "tofukuji",
    spotNameJa: "東福寺",
    spotNameEn: "Tofuku-ji",
    localFilename: "/spots/tofukuji.jpg",
    sourceTitle: "Tofuku-ji, Kyoto - Tofukuji6597.jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Tofuku-ji,_Kyoto_-_Tofukuji6597.jpg",
    photographerName: "lumoplank",
    licenseName: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    attributionRequired: false,
    modifications:
      "Cropped from x=0, y=0 at 5184 × 3456 pixels, resized, and JPEG-compressed to 1200 × 800 pixels at quality 84.",
    notes:
      "The principal temple architecture and autumn foliage were retained.",
  },
  {
    spotId: "shimogamo-shrine",
    spotNameJa: "下鴨神社",
    spotNameEn: "Shimogamo Shrine",
    localFilename: "/spots/shimogamo-shrine.jpg",
    sourceTitle: "Kyoto Shimogamo-jinja Romon 2.jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Kyoto_Shimogamo-jinja_Romon_2.jpg",
    photographerName: "Zairon",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    attributionRequired: true,
    modifications:
      "Cropped from x=272, y=0 at 4038 × 2692 pixels, resized, and JPEG-compressed to 1200 × 800 pixels at quality 84.",
    notes:
      "This adapted image is licensed under CC BY-SA 4.0. The full vermilion Romon gate and its characteristic structure were retained.",
  },
  {
    spotId: "kamigamo-shrine",
    spotNameJa: "上賀茂神社",
    spotNameEn: "Kamigamo Shrine",
    localFilename: "/spots/kamigamo-shrine.jpg",
    sourceTitle: "Kamigamo Shrine-16.jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Kamigamo_Shrine-16.jpg",
    photographerName: "Immanuelle",
    licenseName: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    attributionRequired: true,
    modifications:
      "Cropped from x=0, y=0 at 4032 × 2688 pixels, resized, and JPEG-compressed to 1200 × 800 pixels at quality 84.",
    notes:
      "The shrine buildings and recognizable grounds were retained in the audited composition.",
  },
  {
    spotId: "kyoto-gyoen",
    spotNameJa: "京都御苑",
    spotNameEn: "Kyoto Gyoen National Garden",
    localFilename: "/spots/kyoto-gyoen.jpg",
    sourceTitle: "KyotoGyoen (15233412330).jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:KyotoGyoen_(15233412330).jpg",
    photographerName: "nobu3withfoxy",
    licenseName: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    attributionRequired: true,
    modifications:
      "Resized and JPEG-compressed to 1200 × 800 pixels at quality 84; the original 3:2 composition was retained.",
    notes:
      "The broad gravel avenue, trees, wall, gate, and distant mountain were retained.",
  },
] as const;

export function getSpotImageCredit(
  spotId: string
): SpotImageCredit | undefined {
  return SPOT_IMAGE_CREDITS.find(
    (credit) => credit.spotId === spotId
  );
}
