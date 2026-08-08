// data/types.ts

export type TransportType =
  | "徒歩"
  | "バス"
  | "電車"
  | "地下鉄"
  | "JR"
  | "タクシー";

export type Spot = {
  id: string;
  name: string;
  area: string;
  category: string;
  description: string;
  image: string;

  latitude: number;
  longitude: number;

  address?: string;
  hours?: string;
  price?: string;
  rating?: number;
  website?: string;

  nearby?: string[];

  // AI旅行プラン生成用
  recommendedStay?: string;
  bestVisitTime?: "朝" | "昼" | "夕方";

  // Version 1.8
  openingHours?: string;
  closedDays?: string[];
  recommendedTransport?: TransportType[];
  mealRecommended?: boolean;
};