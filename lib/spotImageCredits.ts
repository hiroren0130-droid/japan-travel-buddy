export type SpotImageCredit = {
  spotId: string;
  spotNameJa: string;
  spotNameEn: string;
  localFilename: string;
  sourceTitle: string;
  sourcePageUrl: string;
  photographerName: string;
  photographerUrl?: string;
  licenseName: string;
  licenseUrl: string | null;
  attributionRequired: boolean;
  modifications: string;
  notes: string;
};

export const SPOT_IMAGE_CREDITS: readonly SpotImageCredit[] = [
  {
    spotId: "kinkakuji",
    spotNameJa: "金閣寺",
    spotNameEn: "Kinkaku-ji Temple",
    localFilename: "/spots/kinkakuji.jpg",
    sourceTitle: "Kinkaku-ji temple in Kyoto.jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Kinkaku-ji_temple_in_Kyoto.jpg",
    photographerName: "Geertchaos",
    photographerUrl: "https://commons.wikimedia.org/wiki/User:Geertchaos",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    attributionRequired: true,
    modifications:
      "Resized from 5644 × 3763 to 1200 × 800 pixels and JPEG-compressed at quality 84; no cropping or color adjustments.",
    notes:
      "Copyright Geert Catteeuw. This adapted image is licensed under Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0). The composition of the Commons original was retained.",
  },
  {
    spotId: "fushimi-inari",
    spotNameJa: "伏見稲荷大社",
    spotNameEn: "Fushimi Inari Taisha",
    localFilename: "/spots/fushimi-inari.jpg",
    sourceTitle: "Torii and Romon of Fushimi Inari Grand Shrine.jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Torii_and_Romon_of_Fushimi_Inari_Grand_Shrine.jpg",
    photographerName: "そらみみ",
    licenseName: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    attributionRequired: true,
    modifications:
      "Resized from 2429 × 3239 to 1200 × 1600 pixels and JPEG-compressed at quality 84; no additional cropping or color adjustments.",
    notes:
      "This adapted image is licensed under Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0). The portrait composition of the current Commons original was retained; its file history records prior rotation by the author.",
  },
  {
    spotId: "kiyomizudera",
    spotNameJa: "清水寺",
    spotNameEn: "Kiyomizu-dera",
    localFilename: "/spots/kiyomizudera.jpg",
    sourceTitle: "Kiyomizu-dera, Kyoto, November 2016 -01.jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Kiyomizu-dera,_Kyoto,_November_2016_-01.jpg",
    photographerName: "Martin Falbisoner",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    attributionRequired: true,
    modifications:
      "Resized from 5852 × 3601 to 1200 × 738 pixels and JPEG-compressed at quality 84; no additional cropping or color adjustments.",
    notes:
      "This adapted image is licensed under CC BY-SA 4.0. The composition of the current Commons original was retained; its file history records prior cropping and color adjustments by the author.",
  },
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
  {
    spotId: "kitano-tenmangu",
    spotNameJa: "北野天満宮",
    spotNameEn: "Kitano Tenmangu Shrine",
    localFilename: "/spots/kitano-tenmangu.jpg",
    sourceTitle: "Kitano-tenmangu Kyoto Japan29s3s4200.jpg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Kitano-tenmangu_Kyoto_Japan29s3s4200.jpg",
    photographerName: "663highland",
    photographerUrl: "https://ja.wikipedia.org/wiki/User:663highland",
    licenseName: "CC BY 2.5",
    licenseUrl: "https://creativecommons.org/licenses/by/2.5/",
    attributionRequired: true,
    modifications:
      "Resized from 4200 × 2800 to 1200 × 800 pixels and JPEG-compressed at quality 84; no cropping or color adjustments.",
    notes:
      "Used under Creative Commons Attribution 2.5 Generic (CC BY 2.5). The original 3:2 composition was retained.",
  },
  {
    "spotId": "ninnaji",
    "spotNameJa": "仁和寺",
    "spotNameEn": "Ninna-ji Temple",
    "localFilename": "/spots/ninnaji.jpg",
    "sourceTitle": "Ninnaji Kyoto07n4500.jpg",
    "sourcePageUrl": "https://commons.wikimedia.org/wiki/File:Ninnaji_Kyoto07n4500.jpg",
    "photographerName": "663highland",
    "photographerUrl": "https://ja.wikipedia.org/wiki/user:663highland",
    "licenseName": "CC BY 2.5",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.5",
    "attributionRequired": true,
    "modifications": "Resized from 4500 × 3000 to 1200 × 800 pixels and JPEG-compressed at quality 84; no cropping or color adjustments.",
    "notes": "The original composition was retained."
  },
  {
    "spotId": "shorenin",
    "spotNameJa": "青蓮院",
    "spotNameEn": "Shoren-in Temple",
    "localFilename": "/spots/shorenin.jpg",
    "sourceTitle": "Shōren-in overview.jpg",
    "sourcePageUrl": "https://commons.wikimedia.org/wiki/File:Sh%C5%8Dren-in_overview.jpg",
    "photographerName": "Christophe95",
    "photographerUrl": "https://commons.wikimedia.org/wiki/User:Christophe95",
    "licenseName": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "attributionRequired": true,
    "modifications": "Resized from 4032 × 3024 to 1200 × 900 pixels and JPEG-compressed at quality 84; no cropping or color adjustments.",
    "notes": "This adapted image is licensed under CC BY-SA 4.0. The original composition was retained."
  },
  {
    "spotId": "philosophers-path",
    "spotNameJa": "哲学の道",
    "spotNameEn": "Philosopher's Path",
    "localFilename": "/spots/philosophers-path.jpg",
    "sourceTitle": "Cherry blossoms at \"Tetsugaku no Michi\".jpg",
    "sourcePageUrl": "https://commons.wikimedia.org/wiki/File:Cherry_blossoms_at_%22Tetsugaku_no_Michi%22.jpg",
    "photographerName": "Kirin7739",
    "photographerUrl": "https://commons.wikimedia.org/wiki/User:Kirin7739",
    "licenseName": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "attributionRequired": true,
    "modifications": "Resized from 1948 × 1297 to 1200 × 799 pixels and JPEG-compressed at quality 84; no cropping or color adjustments.",
    "notes": "This adapted image is licensed under CC BY-SA 4.0. The original composition was retained."
  },
  {
    "spotId": "higashi-honganji",
    "spotNameJa": "東本願寺",
    "spotNameEn": "Higashi Hongan-ji Temple",
    "localFilename": "/spots/higashi-honganji.jpg",
    "sourceTitle": "Founder's Hall gate of Higashi-Honganji Temple, with water reflection, Kyoto, Japan.jpg",
    "sourcePageUrl": "https://commons.wikimedia.org/wiki/File:Founder%27s_Hall_gate_of_Higashi-Honganji_Temple,_with_water_reflection,_Kyoto,_Japan.jpg",
    "photographerName": "Basile Morin",
    "photographerUrl": "https://commons.wikimedia.org/wiki/User:Basile_Morin",
    "licenseName": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "attributionRequired": true,
    "modifications": "Resized from 6291 × 4194 to 1200 × 800 pixels and JPEG-compressed at quality 84; no cropping or color adjustments.",
    "notes": "This adapted image is licensed under CC BY-SA 4.0. The original composition was retained."
  },
  {
    "spotId": "nishi-hongwanji",
    "spotNameJa": "西本願寺",
    "spotNameEn": "Nishi Hongwan-ji Temple",
    "localFilename": "/spots/nishi-hongwanji.jpg",
    "sourceTitle": "Amida Hall, Nishi Hongwanji - interior 01.jpg",
    "sourcePageUrl": "https://commons.wikimedia.org/wiki/File:Amida_Hall,_Nishi_Hongwanji_-_interior_01.jpg",
    "photographerName": "Davide Mauro",
    "photographerUrl": "https://commons.wikimedia.org/wiki/User:Codas",
    "licenseName": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "attributionRequired": true,
    "modifications": "Resized from 6000 × 4000 to 1200 × 800 pixels and JPEG-compressed at quality 84; no cropping or color adjustments.",
    "notes": "This adapted image is licensed under CC BY-SA 4.0. The original composition was retained."
  },
  {
    "spotId": "kyoto-imperial-palace",
    "spotNameJa": "京都御所",
    "spotNameEn": "Kyoto Imperial Palace",
    "localFilename": "/spots/kyoto-imperial-palace.jpg",
    "sourceTitle": "Kyoto Imperial palace garden.jpg",
    "sourcePageUrl": "https://commons.wikimedia.org/wiki/File:Kyoto_Imperial_palace_garden.jpg",
    "photographerName": "Nacaru",
    "photographerUrl": "https://commons.wikimedia.org/wiki/User:Nacaru",
    "licenseName": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "attributionRequired": true,
    "modifications": "Resized from 6000 × 3796 to 1200 × 759 pixels and JPEG-compressed at quality 84; no cropping or color adjustments.",
    "notes": "This adapted image is licensed under CC BY-SA 4.0. The original composition was retained."
  },
  {
    "spotId": "daitokuji",
    "spotNameJa": "大徳寺",
    "spotNameEn": "Daitoku-ji Temple",
    "localFilename": "/spots/daitokuji.jpg",
    "sourceTitle": "Daitoku-ji Temple , 大徳寺 勅使門 - panoramio.jpg",
    "sourcePageUrl": "https://commons.wikimedia.org/wiki/File:Daitoku-ji_Temple_,_%E5%A4%A7%E5%BE%B3%E5%AF%BA_%E5%8B%85%E4%BD%BF%E9%96%80_-_panoramio.jpg",
    "photographerName": "z tanuki",
    "photographerUrl": "https://web.archive.org/web/20161014012229/http://www.panoramio.com/user/238971?with_photo_id=28883627",
    "licenseName": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0",
    "attributionRequired": true,
    "modifications": "Resized from 1196 × 700 to 1196 × 700 pixels and JPEG-compressed at quality 84; no cropping or color adjustments.",
    "notes": "The original composition was retained."
  },
  {
    "spotId": "imamiya-shrine",
    "spotNameJa": "今宮神社",
    "spotNameEn": "Imamiya Shrine",
    "localFilename": "/spots/imamiya-shrine.jpg",
    "sourceTitle": "Imamiya Shrine gate.JPG",
    "sourcePageUrl": "https://commons.wikimedia.org/wiki/File:Imamiya_Shrine_gate.JPG",
    "photographerName": "Torsodog",
    "photographerUrl": "https://commons.wikimedia.org/wiki/User:Torsodog",
    "licenseName": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0",
    "attributionRequired": true,
    "modifications": "Resized from 2592 × 1944 to 1200 × 900 pixels and JPEG-compressed at quality 84; no cropping or color adjustments.",
    "notes": "The original composition was retained."
  },
  {
    "spotId": "genkoan",
    "spotNameJa": "源光庵",
    "spotNameEn": "Genko-an Temple",
    "localFilename": "/spots/genkoan.jpg",
    "sourceTitle": "Genkō-an, Main Hall 01.jpg",
    "sourcePageUrl": "https://commons.wikimedia.org/wiki/File:Genk%C5%8D-an,_Main_Hall_01.jpg",
    "photographerName": "Naokijp",
    "photographerUrl": "https://commons.wikimedia.org/wiki/User:Naokijp",
    "licenseName": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "attributionRequired": true,
    "modifications": "Resized from 3159 × 2369 to 1200 × 900 pixels and JPEG-compressed at quality 84; no cropping or color adjustments.",
    "notes": "This adapted image is licensed under CC BY-SA 4.0. The original composition was retained."
  },
  {
    spotId: "seimei-shrine",
    spotNameJa: "晴明神社",
    spotNameEn: "Seimei Shrine",
    localFilename: "/spots/seimei-shrine.jpg",
    sourceTitle: "Seimei Shrine-3504.jpg",
    sourcePageUrl: "https://commons.wikimedia.org/wiki/File:Seimei_Shrine-3504.jpg",
    photographerName: "Fg2",
    licenseName: "Public Domain",
    licenseUrl: null,
    attributionRequired: false,
    modifications:
      "Resized from 1500 × 1125 to 1200 × 900 pixels and JPEG-compressed at quality 84; no cropping or color adjustments.",
    notes:
      'The photographer Fg2 released their own photograph into the public domain. Wikimedia Commons records: "Own work, all rights released (Public domain)". See the source page for the rights statement; no separate license URL is provided.',
  },
] as const;

export function getSpotImageCredit(
  spotId: string
): SpotImageCredit | undefined {
  return SPOT_IMAGE_CREDITS.find(
    (credit) => credit.spotId === spotId
  );
}
