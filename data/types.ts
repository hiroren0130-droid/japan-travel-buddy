// data/types.ts

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
  recommendedStay?: string;
  bestVisitTime?: "朝" | "昼" | "夕方";
};