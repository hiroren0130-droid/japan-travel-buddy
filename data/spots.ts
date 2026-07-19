export type Spot = {
  id: string;
  name: string;
  area: string;
  category: string;
  description: string;
  image: string;
  latitude: number;
  longitude: number;
};

export const spots: Spot[] = [
  {
    id: "kiyomizudera",
    name: "清水寺",
    area: "京都",
    category: "寺院",
    description: "京都を代表する世界遺産の寺院。清水の舞台から京都市内を一望できます。",
    image: "/spots/kiyomizudera.jpg",
    latitude: 34.9949,
    longitude: 135.7850,
  },
  {
    id: "fushimi-inari",
    name: "伏見稲荷大社",
    area: "京都",
    category: "神社",
    description: "千本鳥居で世界的に有名な神社。",
    image: "/spots/fushimi-inari.jpg",
    latitude: 34.9671,
    longitude: 135.7727,
  },
  {
    id: "kinkakuji",
    name: "金閣寺",
    area: "京都",
    category: "寺院",
    description: "黄金に輝く舎利殿で有名な世界遺産。",
    image: "/spots/kinkakuji.jpg",
    latitude: 35.0394,
    longitude: 135.7292,
  },
];