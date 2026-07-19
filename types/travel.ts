export interface TravelPlan {
  title: string;
  summary: string;
  days: TravelDay[];
}

export interface TravelDay {
  day: number;
  items: TravelItem[];
}

export interface TravelItem {
  time: string;
  spot: string;
  description: string;
}

export interface SavedTravelPlan extends TravelPlan {
  id: string;
}